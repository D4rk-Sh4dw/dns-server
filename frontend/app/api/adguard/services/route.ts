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
            available = availableRes.map(s => {
                if (typeof s === 'string') {
                    return {
                        id: s,
                        name: s.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
                    };
                }
                return s;
            });
        } else if (availableRes && typeof availableRes === 'object') {
            const res = availableRes as any;
            const raw = res.blocked_services || res.blocking_services || res.services || res.available_services || [];
            if (Array.isArray(raw)) {
                available = raw.map(s => {
                    if (typeof s === 'string') {
                        return {
                            id: s,
                            name: s.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
                        };
                    }
                    return s;
                });
            }
        }

        // Normalize blocked services
        let blocked: string[] = [];
        if (blockedRes && typeof blockedRes === 'object') {
            blocked = blockedRes.ids || (Array.isArray(blockedRes) ? blockedRes : []);
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
