import { NextResponse } from 'next/server';
import * as adguard from '@/lib/adguard';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const getServices = searchParams.get('services') === 'true';

    try {
        if (getServices) {
            const services = await adguard.getAllBlockedServices();
            // Normalize to { available: [...] } format
            const normalized = Array.isArray(services)
                ? services.map((s: any) =>
                    typeof s === 'string' ? { id: s, name: s } : { id: s.id || s, name: s.name || s.id || s }
                )
                : [];
            return NextResponse.json({ available: normalized });
        }
        const data = await adguard.getClients();
        return NextResponse.json(data);
    } catch (error) {
        console.error('AdGuard API error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch data' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    const body = await request.json();
    const { action, name, client, oldName } = body;

    try {
        let result;
        switch (action) {
            case 'add':
                result = await adguard.addClient(client);
                break;
            case 'update':
                result = await adguard.updateClient(oldName, client);
                break;
            case 'delete':
                result = await adguard.deleteClient(name);
                break;
            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }
        return NextResponse.json({ success: true, result });
    } catch (error) {
        console.error('AdGuard API error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Operation failed' },
            { status: 500 }
        );
    }
}
