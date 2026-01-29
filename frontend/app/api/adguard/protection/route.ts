import { NextResponse } from 'next/server';
import * as adguard from '@/lib/adguard';

export async function GET() {
    try {
        const protection = await adguard.getAllProtectionStatus();
        return NextResponse.json(protection);
    } catch (error) {
        console.error('Protection status error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch protection status' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { setting, enabled } = body;

        switch (setting) {
            case 'parental':
                await adguard.setParentalEnabled(enabled);
                break;
            case 'safeBrowsing':
                await adguard.setSafeBrowsingEnabled(enabled);
                break;
            case 'safeSearch':
                await adguard.toggleSafeSearch(enabled);
                break;
            case 'protection':
                await adguard.setProtectionEnabled(enabled);
                break;
            default:
                return NextResponse.json(
                    { error: `Unknown setting: ${setting}` },
                    { status: 400 }
                );
        }

        // Return updated status
        const protection = await adguard.getAllProtectionStatus();
        return NextResponse.json(protection);
    } catch (error) {
        console.error('Protection update error:', error);
        return NextResponse.json(
            { error: 'Failed to update protection setting' },
            { status: 500 }
        );
    }
}
