import { NextResponse } from 'next/server';
import { getDHCPLeases, OPNsenseConfig } from '@/lib/opnsense';

export async function POST(request: Request) {
    try {
        const config: OPNsenseConfig = await request.json();

        if (!config.url || !config.key || !config.secret || !config.backend) {
            return NextResponse.json({ error: 'Missing configuration' }, { status: 400 });
        }

        const leases = await getDHCPLeases(config);
        return NextResponse.json({ leases });
    } catch (error) {
        console.error('OPNsense API route error:', error);
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
