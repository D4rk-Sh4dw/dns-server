import { NextResponse } from 'next/server';
import * as technitium from '@/lib/technitium';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const zone = searchParams.get('zone');

        if (!zone) {
            return NextResponse.json({ error: 'Zone parameter required' }, { status: 400 });
        }

        const records = await technitium.listRecords(zone);
        return NextResponse.json(records);
    } catch (error) {
        console.error('Technitium records error:', error);
        return NextResponse.json({ error: 'Failed to fetch records' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { action, domain, type, value, ttl, options } = body;

        switch (action) {
            case 'add':
                await technitium.addRecord(domain, type, value, ttl || 3600, options || {});
                break;
            case 'delete':
                await technitium.deleteRecord(domain, type, value);
                break;
            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Technitium record action error:', error);
        return NextResponse.json({ error: 'Action failed' }, { status: 500 });
    }
}
