import { NextResponse } from 'next/server';
import * as adguard from '@/lib/adguard';
import * as technitium from '@/lib/technitium';

export const dynamic = 'force-dynamic';

// GET /api/cache
// Aggregates cache data from AdGuard and Technitium
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const limit = parseInt(searchParams.get('limit') || '100');

    try {
        // Fetch data from both backends in parallel
        const [dnsInfo, techStats] = await Promise.all([
            adguard.getDnsConfig().catch(() => null),
            technitium.getStats().catch(() => null),
        ]);

        // AdGuard cache config
        const adguardCache = dnsInfo ? {
            enabled: dnsInfo.cache_enabled ?? true,
            size: dnsInfo.cache_size || 0,
            ttlMin: dnsInfo.cache_ttl_min || 0,
            ttlMax: dnsInfo.cache_ttl_max || 0,
            optimistic: dnsInfo.cache_optimistic || false,
        } : null;

        // Technitium stats
        const technitiumCache = techStats ? {
            totalCached: techStats.totalCached || 0,
            cachedEntries: techStats.cachedEntries || 0,
            totalQueries: techStats.totalQueries || 0,
            totalBlocked: techStats.totalBlocked || 0,
        } : null;

        // Calculate cache hit rate (estimated)
        const cacheHitRate = technitiumCache && technitiumCache.totalQueries > 0
            ? Math.round((technitiumCache.totalCached / technitiumCache.totalQueries) * 100)
            : 0;

        // Try to fetch Technitium cache list if available
        let cacheEntries: any[] = [];
        try {
            // Technitium has /api/cache/list but it's not in our wrapper yet
            // We'll try to call it directly
            const token = await (technitium as any).getToken?.();
            if (token) {
                const config = (technitium as any).getTechnitiumConfig?.() || { url: process.env.TECHNITIUM_URL };
                const cacheRes = await fetch(`${config.url}/api/cache/list?token=${token}&limit=${limit}`);
                if (cacheRes.ok) {
                    const cacheData = await cacheRes.json();
                    cacheEntries = cacheData.response?.entries || cacheData.entries || [];
                }
            }
        } catch {
            // Cache list not available, that's ok
        }

        // Filter entries if search provided
        if (search && cacheEntries.length > 0) {
            cacheEntries = cacheEntries.filter((e: any) =>
                JSON.stringify(e).toLowerCase().includes(search.toLowerCase())
            );
        }

        // Analyze TTL distribution from cache entries
        const ttlDistribution = analyzeTtlDistribution(cacheEntries);

        // Group by zone/domain for top zones
        const zoneStats = analyzeZoneStats(cacheEntries);

        // Generate recommendations
        const recommendations = generateRecommendations(adguardCache, ttlDistribution, zoneStats);

        return NextResponse.json({
            adguard: adguardCache,
            technitium: technitiumCache,
            cacheHitRate,
            ttlDistribution,
            zoneStats,
            cacheEntries: cacheEntries.slice(0, 50), // Limit for UI
            recommendations,
        });
    } catch (error) {
        console.error('Cache API error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to fetch cache data' },
            { status: 500 }
        );
    }
}

function analyzeTtlDistribution(entries: any[]) {
    const buckets = {
        'lt60s': 0,      // < 1 minute
        '1to5min': 0,    // 1-5 minutes
        '5to30min': 0,   // 5-30 minutes
        '30to1h': 0,     // 30 min - 1 hour
        '1to6h': 0,      // 1-6 hours
        '6to24h': 0,     // 6-24 hours
        'gt24h': 0,      // > 24 hours
    };

    for (const entry of entries) {
        const ttl = extractTtlSeconds(entry.ttl);
        if (ttl < 60) buckets.lt60s++;
        else if (ttl < 300) buckets['1to5min']++;
        else if (ttl < 1800) buckets['5to30min']++;
        else if (ttl < 3600) buckets['30to1h']++;
        else if (ttl < 21600) buckets['1to6h']++;
        else if (ttl < 86400) buckets['6to24h']++;
        else buckets.gt24h++;
    }

    return buckets;
}

function extractTtlSeconds(ttl: any): number {
    if (typeof ttl === 'number') return ttl;
    if (typeof ttl === 'string') {
        // Parse "283 (4 mins 43 sec)" format
        const match = ttl.match(/(\d+)\s*\(/);
        if (match) return parseInt(match[1]);
        // Try direct number
        const num = parseInt(ttl);
        if (!isNaN(num)) return num;
    }
    return 0;
}

function analyzeZoneStats(entries: any[]) {
    const zones: Record<string, { count: number; avgTtl: number; totalTtl: number }> = {};

    for (const entry of entries) {
        const domain = entry.name || entry.domain || '';
        const zone = extractZone(domain);
        const ttl = extractTtlSeconds(entry.ttl);

        if (!zones[zone]) {
            zones[zone] = { count: 0, avgTtl: 0, totalTtl: 0 };
        }
        zones[zone].count++;
        zones[zone].totalTtl += ttl;
        zones[zone].avgTtl = Math.round(zones[zone].totalTtl / zones[zone].count);
    }

    // Convert to array and sort by count
    return Object.entries(zones)
        .map(([zone, stats]) => ({ zone, ...stats }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20);
}

function extractZone(domain: string): string {
    const parts = domain.split('.');
    if (parts.length >= 2) {
        return parts.slice(-2).join('.');
    }
    return domain;
}

function generateRecommendations(
    adguardCache: any,
    ttlDistribution: any,
    zoneStats: any[]
): string[] {
    const recs: string[] = [];

    if (!adguardCache) {
        recs.push('Unable to read AdGuard cache configuration. Check API connectivity.');
        return recs;
    }

    // Check cache size
    if (adguardCache.size < 1000000) {
        recs.push(`Cache size is ${(adguardCache.size / 1000000).toFixed(1)}MB. Consider increasing to 4MB+ for better performance.`);
    }

    // Check optimistic caching
    if (!adguardCache.optimistic) {
        recs.push('Optimistic caching is disabled. Enabling it can improve response times for stale entries.');
    }

    // Check TTL bounds
    if (adguardCache.ttlMin < 60) {
        recs.push(`Minimum TTL is ${adguardCache.ttlMin}s. Values below 60s may cause excessive upstream queries.`);
    }

    // Analyze TTL distribution
    const total = Object.values(ttlDistribution).reduce((a, b) => (a as number) + (b as number), 0);
    if (total > 0) {
        const shortTtl = ttlDistribution.lt60s + ttlDistribution['1to5min'];
        const shortPct = Math.round((shortTtl / total) * 100);
        if (shortPct > 30) {
            recs.push(`${shortPct}% of cached entries have TTL < 5 minutes. Consider increasing cache_ttl_min to 300s.`);
        }
    }

    // Zone-specific recommendations
    for (const zone of zoneStats.slice(0, 3)) {
        if (zone.avgTtl < 300) {
            recs.push(`Zone "${zone.zone}" has average TTL of ${zone.avgTtl}s. Consider using a longer TTL or checking upstream configuration.`);
        }
    }

    if (recs.length === 0) {
        recs.push('Cache configuration looks good! No immediate optimizations needed.');
    }

    return recs;
}
