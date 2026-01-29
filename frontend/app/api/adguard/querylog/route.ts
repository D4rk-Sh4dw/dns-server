import { NextResponse } from 'next/server';
import * as adguard from '@/lib/adguard';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        // Default limit 100, max 1000
        const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 1000);

        const logs = await adguard.getQueryLog(limit);
        return NextResponse.json(logs);
    } catch (error) {
        console.error('AdGuard logs error:', error);
        return NextResponse.json({ error: 'Failed to fetch query logs' }, { status: 500 });
    }
}
