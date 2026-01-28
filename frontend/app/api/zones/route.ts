import { NextResponse } from 'next/server';
import * as technitium from '@/lib/technitium';
import * as adguard from '@/lib/adguard';

// Unified Zone Management - orchestrates both AdGuard and Technitium

export async function GET() {
    try {
        // Get zones from Technitium and forwarding rules from AdGuard
        const [techZones, forwardedDomains] = await Promise.all([
            technitium.listZones().catch(() => ({ zones: [] })),
            adguard.getForwardedDomains().catch(() => []),
        ]);

        // Merge the data - mark which zones are properly configured
        const zones = (techZones.zones || []).map((zone: any) => ({
            ...zone,
            forwardingEnabled: forwardedDomains.some(d =>
                d === zone.name || zone.name.endsWith(`.${d}`)
            ),
        }));

        return NextResponse.json({ zones, forwardedDomains });
    } catch (error) {
        console.error('Unified zones error:', error);
        return NextResponse.json({ error: 'Failed to fetch zones' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { action, zone, type, isActiveDirectory } = body;

        switch (action) {
            case 'create':
                // 1. Create zone in Technitium
                await technitium.createZone(zone, type || 'Primary');

                // 2. Add forwarding rule in AdGuard
                await adguard.addZoneForwarding(zone);

                // 3. If Active Directory, add standard AD records
                if (isActiveDirectory) {
                    await createADRecords(zone);
                }

                return NextResponse.json({
                    success: true,
                    message: `Zone ${zone} created and forwarding configured`
                });

            case 'delete':
                // 1. Remove forwarding rule from AdGuard
                await adguard.removeZoneForwarding(zone);

                // 2. Delete zone from Technitium
                await technitium.deleteZone(zone);

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

// Create standard Active Directory DNS records for a domain
async function createADRecords(domain: string) {
    const dcName = 'dc1'; // Default DC name
    const dcIp = '10.0.0.1'; // Placeholder - should be configurable

    // These are the essential AD DNS records
    const adRecords = [
        // Domain Controller A record
        { name: dcName, type: 'A', value: dcIp },

        // LDAP SRV record
        {
            name: `_ldap._tcp.${domain}`,
            type: 'SRV',
            value: `${dcName}.${domain}`,
            options: { priority: '0', weight: '100', port: '389' }
        },

        // Kerberos SRV record
        {
            name: `_kerberos._tcp.${domain}`,
            type: 'SRV',
            value: `${dcName}.${domain}`,
            options: { priority: '0', weight: '100', port: '88' }
        },

        // Kerberos UDP SRV record
        {
            name: `_kerberos._udp.${domain}`,
            type: 'SRV',
            value: `${dcName}.${domain}`,
            options: { priority: '0', weight: '100', port: '88' }
        },

        // GC (Global Catalog) SRV record
        {
            name: `_gc._tcp.${domain}`,
            type: 'SRV',
            value: `${dcName}.${domain}`,
            options: { priority: '0', weight: '100', port: '3268' }
        },

        // LDAP DC SRV record
        {
            name: `_ldap._tcp.dc._msdcs.${domain}`,
            type: 'SRV',
            value: `${dcName}.${domain}`,
            options: { priority: '0', weight: '100', port: '389' }
        },
    ];

    console.log(`Creating AD records for ${domain}...`);

    for (const record of adRecords) {
        try {
            await technitium.addRecord(
                record.name.includes(domain) ? record.name : `${record.name}.${domain}`,
                record.type,
                record.value,
                3600,
                record.options || {}
            );
            console.log(`Created ${record.type} record: ${record.name}`);
        } catch (err) {
            console.error(`Failed to create ${record.type} record ${record.name}:`, err);
        }
    }
}
