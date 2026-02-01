import { NextResponse } from 'next/server';
import * as adguard from '@/lib/adguard';

export async function GET() {
    try {
        const schedule = await adguard.getBlockedServicesSchedule();
        return NextResponse.json(schedule || {});
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch schedule' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        // body should be the schedule object: { ids: [...], schedule: { time_zone: "Europe/Berlin", ... } }
        // AdGuard usually updates everything together at /control/blocked_services/update
        // Or specific schedule endpoint if available.
        // Assuming adguard.setBlockedServicesSchedule handles this appropriately.

        await adguard.setBlockedServicesSchedule(body);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update schedule' }, { status: 500 });
    }
}
