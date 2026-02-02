import { NextRequest, NextResponse } from 'next/server';
import { fetchAndParseCSV } from '@/lib/csv-parser';
import { getBlocklistUrl, getWhitelistUrl } from '@/config/csv-config';

// Cache for CSV data (1 hour TTL)
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const type = searchParams.get('type') as 'blocklist' | 'whitelist';

        if (!type || (type !== 'blocklist' && type !== 'whitelist')) {
            return NextResponse.json(
                { error: 'Invalid type parameter. Must be "blocklist" or "whitelist"' },
                { status: 400 }
            );
        }

        // Get the appropriate CSV URL
        const csvUrl = type === 'blocklist' ? getBlocklistUrl() : getWhitelistUrl();

        if (!csvUrl) {
            return NextResponse.json(
                { error: `No CSV URL configured for ${type}` },
                { status: 404 }
            );
        }

        // Check cache
        const cacheKey = `${type}:${csvUrl}`;
        const cached = cache.get(cacheKey);
        const now = Date.now();

        if (cached && (now - cached.timestamp) < CACHE_TTL) {
            console.log(`Returning cached data for ${type}`);
            return NextResponse.json({
                success: true,
                lists: cached.data,
                source: csvUrl,
                cached: true
            });
        }

        // Fetch and parse CSV
        console.log(`Fetching ${type} from ${csvUrl}`);
        const result = await fetchAndParseCSV(csvUrl);

        if (!result.success) {
            console.error(`Failed to parse ${type} CSV:`, result.errors);
            return NextResponse.json(
                {
                    error: `Failed to parse CSV`,
                    details: result.errors,
                    source: csvUrl
                },
                { status: 500 }
            );
        }

        // Update cache
        cache.set(cacheKey, { data: result.data, timestamp: now });

        return NextResponse.json({
            success: true,
            lists: result.data,
            source: csvUrl,
            cached: false,
            count: result.data.length
        });

    } catch (error) {
        console.error('Error fetching predefined lists:', error);
        return NextResponse.json(
            {
                error: 'Failed to fetch predefined lists',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

// Clear cache endpoint (optional, for debugging)
export async function DELETE() {
    cache.clear();
    return NextResponse.json({ success: true, message: 'Cache cleared' });
}
