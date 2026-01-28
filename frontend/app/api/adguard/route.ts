import { NextResponse } from 'next/server';
import * as adguard from '@/lib/adguard';

export async function GET() {
    try {
        const [status, stats, safeSearch, blockedServices] = await Promise.all([
            adguard.getStatus(),
            adguard.getStats(),
            adguard.getSafeSearchStatus(),
            adguard.getBlockedServices(),
        ]);

        return NextResponse.json({
            status,
            stats,
            safeSearch,
            blockedServices,
        });
    } catch (error) {
        console.error('AdGuard API error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch AdGuard status' },
            { status: 500 }
        );
    }
}
