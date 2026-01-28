import { NextResponse } from 'next/server';
import * as technitium from '@/lib/technitium';

export async function GET() {
    try {
        const zones = await technitium.listZones();
        return NextResponse.json(zones);
    } catch (error) {
        console.error('Technitium zones error:', error);
        return NextResponse.json({ error: 'Failed to fetch zones' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { action, zone, type } = body;

        switch (action) {
            case 'create':
                await technitium.createZone(zone, type || 'Primary');
                break;
            case 'delete':
                await technitium.deleteZone(zone);
                break;
            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Technitium zone action error:', error);
        return NextResponse.json({ error: 'Action failed' }, { status: 500 });
    }
}
