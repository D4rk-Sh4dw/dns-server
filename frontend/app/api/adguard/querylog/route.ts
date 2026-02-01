import { NextResponse } from 'next/server';
import * as adguard from '@/lib/adguard';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const olderThan = searchParams.get('older_than') || undefined;
    const search = searchParams.get('search') || undefined;

    try {
        const data = await adguard.getQueryLog(limit, olderThan, search);
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        if (body.action === 'clear') {
            await adguard.clearQueryLog();
            return NextResponse.json({ success: true });
        }
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to perform action' }, { status: 500 });
    }
}
