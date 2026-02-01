import { NextResponse } from 'next/server';
import * as adguard from '@/lib/adguard';

export async function GET() {
    try {
        const filtering = await adguard.getFiltering();
        return NextResponse.json(filtering);
    } catch (error) {
        console.error('AdGuard filtering error:', error);
        return NextResponse.json({ error: 'Failed to fetch filtering status' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { action, name, url, newUrl, rule, whitelist, enabled } = body;

        switch (action) {
            case 'add':
                await adguard.addFilterList(name, url, whitelist);
                break;
            case 'remove':
                await adguard.removeFilterList(url, whitelist);
                break;
            case 'update':
                await adguard.updateFilterList(url, name, newUrl, whitelist);
                break;
            case 'toggle':
                await adguard.toggleFilterList(url, enabled, whitelist);
                break;
            case 'refresh':
                await adguard.refreshFilters(whitelist);
                break;
            case 'addRule':
                await adguard.addCustomRule(rule);
                break;
            case 'removeRule':
                await adguard.removeCustomRule(rule);
                break;
            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('AdGuard filtering action error:', error);
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Action failed' }, { status: 500 });
    }
}
