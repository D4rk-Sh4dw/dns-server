import { NextResponse } from 'next/server';
import * as adguard from '@/lib/adguard';

// AdGuard API returns top_* arrays as [{key: value}] objects.
// Normalize them to [{name, count}] format for the frontend.
function normalizeTopStats(arr: any[]): { name: string; count: number }[] {
    if (!Array.isArray(arr)) return [];
    return arr
        .filter(item => item && typeof item === 'object')
        .map(item => {
            const keys = Object.keys(item);
            if (keys.length === 0) return null;
            const name = keys[0];
            const count = Number(item[name]);
            return { name, count };
        })
        .filter((item): item is { name: string; count: number } => item !== null);
}

export async function GET() {
    try {
        const [status, stats, safeSearch, blockedServices, clients] = await Promise.all([
            adguard.getStatus(),
            adguard.getStats(),
            adguard.getSafeSearchStatus(),
            adguard.getBlockedServices(),
            adguard.getClients().catch(() => null),
        ]);

        // Build IP → hostname map from AdGuard clients (persistent + runtime/auto)
        const clientNames: Record<string, string> = {};
        if (clients) {
            // Persistent clients: have explicit names and IDs (IPs/MACs)
            for (const client of (clients.clients || [])) {
                if (client.name && client.ids) {
                    for (const id of client.ids) {
                        clientNames[id] = client.name;
                    }
                }
            }
            // Runtime/auto clients: have IP and rDNS name
            for (const rc of (clients.auto_clients || [])) {
                if (rc.ip && rc.name) {
                    clientNames[rc.ip] = rc.name;
                }
            }
        }

        // Normalize upstream data from AdGuard's {key: value} format to {name, count} format
        // AdGuard API may use either "top_upstreams_avg_time" or the typo "top_upstrems_avg_time"
        const upstreamAvgTime = stats.top_upstreams_avg_time || stats.top_upstrems_avg_time;
        const upstreamResponses = stats.top_upstreams_responses || stats.top_upstrems_responses;

        return NextResponse.json({
            status,
            stats: {
                ...(stats.stats || {}),
                ...stats,
                // Override with normalized upstream data
                top_upstreams_avg_time: normalizeTopStats(upstreamAvgTime),
                top_upstreams_responses: normalizeTopStats(upstreamResponses),
            },
            safeSearch,
            blockedServices,
            clientNames,
        });
    } catch (error) {
        console.error('AdGuard API error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch AdGuard status' },
            { status: 500 }
        );
    }
}
