import { NextResponse } from 'next/server';
import * as adguard from '@/lib/adguard';
import '@/lib/background-jobs'; // Initialize background jobs

export async function GET() {
    try {
        const [protection, safeSearch] = await Promise.all([
            adguard.getAllProtectionStatus(),
            adguard.getSafeSearchStatus()
        ]);
        return NextResponse.json({
            ...protection,
            safeSearchConfig: safeSearch
        });
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

        console.log(`Protection toggle: ${setting} = ${enabled}`);

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
            case 'safeSearchConfig':
                await adguard.setSafeSearchConfig(body.config);
                break;
            case 'protection':
                await adguard.setProtectionEnabled(enabled);
                if (!enabled && body.duration) {
                    const pauseUntil = Date.now() + body.duration * 60 * 1000;
                    await adguard.setPauseState(pauseUntil);
                } else if (enabled) {
                    await adguard.setPauseState(null);
                }
                break;
            default:
                return NextResponse.json(
                    { error: `Unknown setting: ${setting}` },
                    { status: 400 }
                );
        }

        // Wait a moment for AdGuard to persist the change
        await new Promise(resolve => setTimeout(resolve, 100));

        // Return updated status
        const [protection, safeSearch] = await Promise.all([
            adguard.getAllProtectionStatus(),
            adguard.getSafeSearchStatus()
        ]);
        return NextResponse.json({
            ...protection,
            safeSearchConfig: safeSearch
        });
    } catch (error) {
        console.error('Protection update error:', error);
        const message = error instanceof Error ? error.message : 'Failed to update protection setting';
        return NextResponse.json(
            { error: message },
            { status: 500 }
        );
    }
}
