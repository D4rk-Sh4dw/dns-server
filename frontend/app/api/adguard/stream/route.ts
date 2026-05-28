import { NextResponse } from 'next/server';
import * as adguard from '@/lib/adguard';

export const dynamic = 'force-dynamic';

// GET /api/adguard/stream?since=<timestamp>&limit=<n>
// Returns only new queries since the given timestamp
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const since = searchParams.get('since');
    const limit = parseInt(searchParams.get('limit') || '100');

    try {
        // Fetch recent query log entries
        const data = await adguard.getQueryLog(limit);

        if (!data || !Array.isArray(data.data)) {
            return NextResponse.json({ queries: [], hasMore: false });
        }

        let queries = data.data;

        // If since is provided, filter to only newer entries
        if (since) {
            const sinceMs = parseInt(since);
            queries = queries.filter((q: any) => {
                const timeMs = new Date(q.time).getTime();
                return timeMs > sinceMs;
            });
        }

        // Normalize and enrich each query
        const normalized = queries.map((q: any) => ({
            time: q.time,
            client: q.client,
            client_info: q.client_info,
            question: q.question,
            status: q.status,
            reason: q.reason,
            upstream: q.upstream,
            answer: q.answer,
            elapsed: q.elapsed,
            client_proto: q.client_proto,
            rules: q.rules,
            // Computed fields for UI
            isBlocked: isBlocked(q),
            isSafeSearch: isSafeSearch(q),
            isRewrite: isRewrite(q),
            timestamp: new Date(q.time).getTime(),
        }));

        // Sort by time descending (newest first)
        normalized.sort((a: any, b: any) => b.timestamp - a.timestamp);

        return NextResponse.json({
            queries: normalized,
            hasMore: data.data.length >= limit,
            serverTime: Date.now(),
        });
    } catch (error) {
        console.error('Stream API error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch stream', queries: [] },
            { status: 500 }
        );
    }
}

function isBlocked(q: any): boolean {
    const s = (q.status || '').toLowerCase();
    const r = (q.reason || '').toLowerCase();
    // Only true block reasons - NOT "NotFilteredNotFound" etc.
    if (s.includes('blocked') || s.includes('parental')) return true;
    if (r.includes('blacklist') || r.includes('blockedservice')) return true;
    // "Filtered" alone is NOT blocked - only specific filtered reasons
    if (r === 'filteredblacklist' || r === 'filteredsafesearch' || r === 'filteredparental') return true;
    return false;
}

function isSafeSearch(q: any): boolean {
    const r = (q.reason || '').toLowerCase();
    return r.includes('safesearch');
}

function isRewrite(q: any): boolean {
    const s = (q.status || '').toLowerCase();
    return s.includes('rewrite');
}
