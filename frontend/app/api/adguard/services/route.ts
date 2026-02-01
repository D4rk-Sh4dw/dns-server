import { NextResponse } from 'next/server';
import * as adguard from '@/lib/adguard';

export async function GET() {
    try {
        const [available, blocked] = await Promise.all([
            adguard.getAllBlockedServices(),
            adguard.getBlockedServices()
        ]);
        return NextResponse.json({
            available: available || [],
            blocked: blocked || []
        });
    } catch (error) {
        console.error('AdGuard services error:', error);
        return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { ids } = body;

        await adguard.setBlockedServices(ids);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('AdGuard set services error:', error);
        return NextResponse.json({ error: 'Failed to update blocked services' }, { status: 500 });
    }
}
