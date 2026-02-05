import { NextResponse } from 'next/server';
import * as adguard from '@/lib/adguard';

export async function POST() {
    try {
        await adguard.clearCache();
        return NextResponse.json({ success: true, message: 'Cache cleared successfully' });
    } catch (error) {
        console.error('Failed to clear cache:', error);
        return NextResponse.json(
            { error: 'Failed to clear cache' },
            { status: 500 }
        );
    }
}
