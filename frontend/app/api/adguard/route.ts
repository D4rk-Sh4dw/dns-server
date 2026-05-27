import { NextResponse } from 'next/server';
import * as adguard from '@/lib/adguard';

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

        // Debug: Log the stats structure to verify upstream data
        console.log('AdGuard stats keys:', Object.keys(stats || {}));
        console.log('top_upstrems_avg_time:', JSON.stringify(stats?.top_upstrems_avg_time)?.substring(0, 200));
        console.log('top_upstreams_avg_time:', JSON.stringify(stats?.top_upstreams_avg_time)?.substring(0, 200));

        return NextResponse.json({
            status,
            stats: {
                ...(stats.stats || {}),
                ...stats,
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
