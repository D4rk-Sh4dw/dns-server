import { NextResponse } from 'next/server';
import * as adguard from '@/lib/adguard';

export async function GET() {
    try {
        const [availableRes, blockedRes] = await Promise.all([
            adguard.getAllBlockedServices(),
            adguard.getBlockedServices()
        ]);

        // Normalize available services
        let available = [];
        if (Array.isArray(availableRes)) {
            available = availableRes;
        } else if (availableRes && typeof availableRes === 'object') {
            // @ts-ignore
            available = availableRes.blocking_services || availableRes.services || availableRes.available_services || [];
            if (!Array.isArray(available)) available = [];
        }

        // Normalize blocked services
        let blocked: string[] = [];
        if (Array.isArray(blockedRes)) {
            blocked = blockedRes;
        } else if (blockedRes && (blockedRes.ids || blockedRes.blocked_services)) {
            // @ts-ignore
            blocked = blockedRes.ids || blockedRes.blocked_services || [];
        }

        return NextResponse.json({
            available,
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
