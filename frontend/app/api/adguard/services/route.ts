import { NextResponse } from 'next/server';
import * as adguard from '@/lib/adguard';

export async function GET() {
    try {
        const blockedRes = await adguard.getBlockedServices();

        // Normalize blocked services (usually a list of strings)
        // AdGuard might return object with `ids` property or array
        let blocked: string[] = [];
        if (Array.isArray(blockedRes)) {
            blocked = blockedRes;
        } else if (blockedRes && (blockedRes.ids || blockedRes.blocked_services)) {
            // @ts-ignore
            blocked = blockedRes.ids || blockedRes.blocked_services || [];
        }

        return NextResponse.json({
            // available is now handled statically on frontend
            available: [],
            blocked
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
