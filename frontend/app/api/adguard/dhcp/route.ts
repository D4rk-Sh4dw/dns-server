import { NextResponse } from 'next/server';
import * as adguard from '@/lib/adguard';

export async function GET() {
    try {
        const status = await adguard.getDhcpStatus();
        return NextResponse.json(status);
    } catch (error) {
        console.error('AdGuard DHCP API error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch DHCP status' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { action, ...data } = body;

        let result;
        switch (action) {
            case 'add_static':
                result = await adguard.addStaticLease(data);
                break;
            case 'remove_static':
                result = await adguard.removeStaticLease(data);
                break;
            case 'set_config':
                result = await adguard.setDhcpConfig(data);
                break;
            default:
                throw new Error('Invalid action');
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error('AdGuard DHCP API error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Operation failed' },
            { status: 500 }
        );
    }
}
