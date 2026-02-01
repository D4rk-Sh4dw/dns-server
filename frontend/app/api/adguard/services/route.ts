import { NextResponse } from 'next/server';
import * as adguard from '@/lib/adguard';

export async function GET() {
    try {
        const [availableRes, blockedRes] = await Promise.all([
            adguard.getAllBlockedServices(),
            adguard.getBlockedServices()
        ]);

        // Normalize available services (AdGuard might return array or object with key)
        let available = [];
        if (Array.isArray(availableRes)) {
            available = availableRes;
        } else if (availableRes && typeof availableRes === 'object') {
            // Check common keys like 'services', 'blocking_services', 'available_services'
            // @ts-ignore
            available = availableRes.services || availableRes.blocking_services || availableRes.available_services || [];
            // If still empty just trying to cast it or return empty
            if (!Array.isArray(available)) available = [];
        }

        // Normalize blocked services (usually a list of strings)
        let blocked = [];
        if (Array.isArray(blockedRes)) {
            blocked = blockedRes;
        } else if (blockedRes && (blockedRes.ids || blockedRes.blocked_services)) {
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
