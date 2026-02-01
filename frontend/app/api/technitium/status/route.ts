import { NextResponse } from 'next/server';
import * as technitium from '@/lib/technitium';

export async function GET() {
    try {
        // Try to get full status and summary
        const [statusResult, summaryResult] = await Promise.allSettled([
            technitium.getServerStatus(),
            technitium.getSummary()
        ]);

        const status = statusResult.status === 'fulfilled' ? statusResult.value : null;
        const summary = summaryResult.status === 'fulfilled' ? summaryResult.value : null;

        // If both failed, try fallback: list zones to verify Technitium is operational
        if (!status && !summary) {
            console.log('Status and summary endpoints failed, trying fallback...');
            try {
                const zones = await technitium.listZones();
                // If we can list zones, Technitium is operational
                return NextResponse.json({
                    status: { operational: true },
                    summary: {
                        version: 'Unknown',
                        zones: zones.zones?.length || 0,
                        fallback: true
                    }
                });
            } catch (fallbackError) {
                console.error('Technitium fallback check failed:', fallbackError);
                return NextResponse.json(
                    { error: 'Failed to connect to Technitium DNS' },
                    { status: 500 }
                );
            }
        }

        // Return whatever data we have
        return NextResponse.json({
            status: status || { operational: true },
            summary: summary || { version: 'Unknown', fallback: true }
        });
    } catch (error) {
        console.error('Technitium API error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch Technitium status' },
            { status: 500 }
        );
    }
}
