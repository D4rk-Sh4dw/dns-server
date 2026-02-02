import { NextRequest, NextResponse } from 'next/server';
import { parseCSV } from '@/lib/csv-parser';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { csvContent, type } = body;

        if (!csvContent || typeof csvContent !== 'string') {
            return NextResponse.json(
                { error: 'Missing or invalid csvContent' },
                { status: 400 }
            );
        }

        if (!type || (type !== 'blocklist' && type !== 'whitelist')) {
            return NextResponse.json(
                { error: 'Invalid type parameter. Must be "blocklist" or "whitelist"' },
                { status: 400 }
            );
        }

        // Parse the CSV content
        const result = parseCSV(csvContent);

        if (!result.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Failed to parse CSV',
                    details: result.errors,
                    lists: result.data // Return partial data if any
                },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            lists: result.data,
            count: result.data.length,
            type
        });

    } catch (error) {
        console.error('Error importing CSV:', error);
        return NextResponse.json(
            {
                error: 'Failed to import CSV',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
