import { NextResponse } from 'next/server';
import * as technitium from '@/lib/technitium';
import * as adguard from '@/lib/adguard';

// Unified Zone Management - orchestrates both AdGuard and Technitium

export async function GET() {
    try {
        // Get zones from Technitium and forwarding rules from AdGuard
        const [techZones, dnsConfig] = await Promise.all([
            technitium.listZones().catch(() => ({ zones: [] })),
            adguard.getDnsConfig().catch(() => ({ upstream_dns: [] })),
        ]);

        // Parse forwarding rules to extract domains and their targets
        const forwardingRules: { domain: string; target: string; isAD: boolean }[] = [];
        const upstreams: string[] = dnsConfig.upstream_dns || [];

        for (const upstream of upstreams) {
            const match = upstream.match(/\[\/([^/]+)\/\](.+)/);
            if (match) {
                const domains = match[1].split('/').filter(Boolean);
                const target = match[2];
                const isAD = !target.includes('10.10.10.3'); // If not pointing to Technitium, it's AD/external

                for (const domain of domains) {
                    forwardingRules.push({ domain, target, isAD });
                }
            }
        }

        // Merge zones with forwarding info
        const technitiumZones = (techZones.zones || []).map((zone: any) => ({
            ...zone,
            source: 'technitium',
            forwardingEnabled: forwardingRules.some(r => r.domain === zone.name),
        }));

        // Add AD-only zones (forwarding rules not backed by Technitium zones)
        const adZones = forwardingRules
            .filter(r => r.isAD && !technitiumZones.some((z: any) => z.name === r.domain))
            .map(r => ({
                name: r.domain,
                type: 'Forwarder',
                source: 'active-directory',
                forwardingEnabled: true,
                dcServers: r.target,
            }));

        return NextResponse.json({
            zones: [...technitiumZones, ...adZones],
            forwardingRules,
        });
    } catch (error) {
        console.error('Unified zones error:', error);
        return NextResponse.json({ error: 'Failed to fetch zones' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { action, zone, type, isActiveDirectory, dcServers } = body;

        switch (action) {
            case 'create':
                if (isActiveDirectory && dcServers) {
                    // AD Domain: Just add forwarding rule to DC's DNS - no Technitium zone needed
                    const servers = dcServers.split(',').map((s: string) => s.trim()).filter(Boolean);
                    if (servers.length === 0) {
                        return NextResponse.json({ error: 'At least one DC IP is required' }, { status: 400 });
                    }

                    // Add forwarding rule for each DC (AdGuard will load-balance)
                    await adguard.addZoneForwarding(zone, servers[0], servers.slice(1));

                    return NextResponse.json({
                        success: true,
                        message: `AD domain ${zone} forwarding to ${servers.join(', ')}`
                    });
                } else {
                    // Regular zone: Create in Technitium + add forwarding in AdGuard
                    await technitium.createZone(zone, type || 'Primary');
                    await adguard.addZoneForwarding(zone);

                    return NextResponse.json({
                        success: true,
                        message: `Zone ${zone} created and forwarding configured`
                    });
                }

            case 'delete':
                // Remove forwarding rule from AdGuard
                await adguard.removeZoneForwarding(zone);

                // Try to delete zone from Technitium (might not exist for AD-only zones)
                try {
                    await technitium.deleteZone(zone);
                } catch (err) {
                    // Ignore if zone doesn't exist in Technitium
                    console.log(`Zone ${zone} not found in Technitium (probably AD-only)`);
                }

                return NextResponse.json({
                    success: true,
                    message: `Zone ${zone} deleted`
                });

            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }
    } catch (error) {
        console.error('Unified zone action error:', error);
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Action failed'
        }, { status: 500 });
    }
}
