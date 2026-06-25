import { NextResponse } from 'next/server';
import * as dyndns from '@/lib/dyndns';

export async function GET() {
    try {
        const records = await dyndns.getDynDnsRecords();
        return NextResponse.json({ records });
    } catch (error) {
        console.error('[DynDNS API] GET error:', error);
        return NextResponse.json({ error: 'Failed to load DynDNS records' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { action } = body;

        switch (action) {
            case 'create': {
                const { zone, name, type, intervalMinutes, email, apiToken, apiKey, authType } = body;
                if (!zone || !name || !type || !intervalMinutes) {
                    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
                }
                if (type !== 'A' && type !== 'AAAA') {
                    return NextResponse.json({ error: 'Type must be A or AAAA' }, { status: 400 });
                }
                const record = await dyndns.addDynDnsRecord({
                    zone,
                    name,
                    type,
                    intervalMinutes: Math.max(1, Math.min(1440, parseInt(intervalMinutes, 10) || 5)),
                    enabled: true,
                    email,
                    apiToken,
                    apiKey,
                    authType,
                });
                // Trigger an immediate update so the record appears in Cloudflare right away
                try {
                    await dyndns.updateDynDnsRecordIp(record, true);
                } catch (immediateErr) {
                    console.warn('[DynDNS API] Immediate update failed:', immediateErr);
                }
                return NextResponse.json({ record });
            }

            case 'update': {
                const { id, updates } = body;
                if (!id) {
                    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
                }
                const record = await dyndns.updateDynDnsRecord(id, updates || {});
                if (!record) {
                    return NextResponse.json({ error: 'Record not found' }, { status: 404 });
                }
                return NextResponse.json({ record });
            }

            case 'delete': {
                const { id } = body;
                if (!id) {
                    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
                }
                const deleted = await dyndns.deleteDynDnsRecord(id);
                if (!deleted) {
                    return NextResponse.json({ error: 'Record not found' }, { status: 404 });
                }
                return NextResponse.json({ success: true });
            }

            case 'check': {
                const { id, force } = body;
                if (id) {
                    const records = await dyndns.getDynDnsRecords();
                    const record = records.find(r => r.id === id);
                    if (!record) {
                        return NextResponse.json({ error: 'Record not found' }, { status: 404 });
                    }
                    const result = await dyndns.updateDynDnsRecordIp(record, !!force);
                    return NextResponse.json(result);
                }
                const result = await dyndns.runDynDnsChecks(!!force);
                return NextResponse.json(result);
            }

            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }
    } catch (error) {
        console.error('[DynDNS API] POST error:', error);
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Action failed' }, { status: 500 });
    }
}
