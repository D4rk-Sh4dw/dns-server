import { NextResponse } from 'next/server';
import * as cloudflare from '@/lib/cloudflare';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { action, zoneId, recordId, type, name, content, ttl, email, apiToken, apiKey } = body;

        // Set runtime config if provided in request
        if (email || apiToken || apiKey) {
            cloudflare.setCloudflareConfig({ email, apiToken, apiKey });
        }

        switch (action) {
            case 'create': {
                if (!zoneId || !type || !name || !content) {
                    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
                }
                const result = await cloudflare.createRecord(zoneId, type, name, content, ttl);
                return NextResponse.json(result);
            }
            case 'delete': {
                if (!zoneId || !recordId) {
                    return NextResponse.json({ error: 'Missing zoneId or recordId' }, { status: 400 });
                }
                await cloudflare.deleteRecord(zoneId, recordId);
                return NextResponse.json({ success: true });
            }
            case 'update': {
                if (!zoneId || !recordId || !type || !name || !content) {
                    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
                }
                const result = await cloudflare.updateRecord(zoneId, recordId, type, name, content, ttl);
                return NextResponse.json(result);
            }
            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }
    } catch (error) {
        console.error('Cloudflare record action error:', error);
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Action failed' }, { status: 500 });
    }
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const zoneId = searchParams.get('zoneId');
        const email = searchParams.get('email');
        const apiToken = searchParams.get('apiToken');
        const apiKey = searchParams.get('apiKey');

        // Set runtime config if provided
        if (email || apiToken || apiKey) {
            cloudflare.setCloudflareConfig({ email, apiToken, apiKey });
        }

        if (!zoneId) {
            return NextResponse.json({ error: 'zoneId is required' }, { status: 400 });
        }

        const records = await cloudflare.listRecords(zoneId);
        return NextResponse.json(records);
    } catch (error) {
        console.error('Cloudflare records fetch error:', error);
        return NextResponse.json({ error: 'Failed to fetch records' }, { status: 500 });
    }
}