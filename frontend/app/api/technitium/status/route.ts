import { NextResponse } from 'next/server';
import * as technitium from '@/lib/technitium';

export async function GET() {
    try {
        const [status, summary] = await Promise.all([
            technitium.getServerStatus(),
            technitium.getSummary()
        ]);

        return NextResponse.json({
            status,
            summary
        });
    } catch (error) {
        console.error('Technitium API error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch Technitium status' },
            { status: 500 }
        );
    }
}
