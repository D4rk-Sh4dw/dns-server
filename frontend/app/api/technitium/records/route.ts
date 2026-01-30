import { NextResponse } from 'next/server';
import * as technitium from '@/lib/technitium';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const zone = searchParams.get('zone');

        if (!zone) {
            return NextResponse.json({ error: 'Zone parameter required' }, { status: 400 });
        }

        const response = await technitium.listRecords(zone);
        console.log('Technitium records response for zone', zone, ':', JSON.stringify(response, null, 2));
        return NextResponse.json(response);
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
        const message = error instanceof Error ? error.message : 'Action failed';
        // Extract meaningful error from Technitium API error message
        const match = message.match(/Technitium API error: (.+)/);
        const userMessage = match ? match[1] : message;
        return NextResponse.json({ error: userMessage }, { status: 500 });
    }
}
