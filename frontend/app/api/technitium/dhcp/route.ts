import { NextResponse } from 'next/server';
import { listDHCPScopes, listDHCPLeases } from '@/lib/technitium';

export async function GET() {
    try {
        const [scopes, leases] = await Promise.all([
            listDHCPScopes(),
            listDHCPLeases()
        ]);

        return NextResponse.json({
            enabled: scopes.some(s => s.enabled),
            scopes,
            leases: leases.filter(l => !l.isReserved).map(l => ({
                mac: l.hardwareAddress,
                ip: l.ipAddress,
                hostname: l.hostname,
                expires: l.expiresAt
            })),
            static_leases: leases.filter(l => l.isReserved).map(l => ({
                mac: l.hardwareAddress,
                ip: l.ipAddress,
                hostname: l.hostname
            }))
        });
    } catch (error) {
        console.error('Technitium DHCP API error:', error);
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
