import { NextResponse } from 'next/server';
import * as cloudflare from '@/lib/cloudflare';

export async function GET(request: Request) {
    try {
        // Get credentials from query params or headers
        const { searchParams } = new URL(request.url);
        const email = searchParams.get('email');
        const apiToken = searchParams.get('apiToken');
        const apiKey = searchParams.get('apiKey');

        // Set runtime config if provided
        if (email || apiToken || apiKey) {
            cloudflare.setCloudflareConfig({ email: email || undefined, apiToken: apiToken || undefined, apiKey: apiKey || undefined });
        }

        const zones = await cloudflare.listZones();
        return NextResponse.json(zones);
    } catch (error) {
        console.error('Cloudflare zones error:', error);
        return NextResponse.json({ error: 'Failed to fetch Cloudflare zones' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { action, zone, publicIpv4, publicIpv6, email, apiToken, apiKey } = body;

        // Set runtime config if provided in request
        if (email || apiToken || apiKey) {
            cloudflare.setCloudflareConfig({ email, apiToken, apiKey });
        }

        switch (action) {
            case 'create': {
                if (!zone) {
                    return NextResponse.json({ error: 'Zone name is required' }, { status: 400 });
                }
                const result = await cloudflare.createZoneWithRecords(zone, publicIpv4, publicIpv6);
                return NextResponse.json(result);
            }
            case 'delete': {
                if (!zone) {
                    return NextResponse.json({ error: 'Zone name is required' }, { status: 400 });
                }
                const zoneId = await cloudflare.getZoneId(zone);
                if (!zoneId) {
                    return NextResponse.json({ error: 'Zone not found in Cloudflare' }, { status: 404 });
                }
                await cloudflare.deleteZone(zoneId);
                return NextResponse.json({ success: true });
            }
            case 'test': {
                const connected = await cloudflare.testConnection();
                return NextResponse.json({ connected });
            }
            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }
    } catch (error) {
        console.error('Cloudflare zone action error:', error);
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Action failed' }, { status: 500 });
    }
}