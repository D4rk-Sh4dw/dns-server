import { NextRequest, NextResponse } from 'next/server';
import { getDHCPScope, createDhcpScope, deleteDhcpScope, DHCPScope } from '@/lib/technitium';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const name = searchParams.get('name');

    if (!name) {
        return NextResponse.json({ error: 'Scope name is required' }, { status: 400 });
    }

    try {
        const scope = await getDHCPScope(name);
        return NextResponse.json(scope);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch scope details' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { action, ...scopeData } = body;

        if (action === 'delete') {
            if (!scopeData.name) return NextResponse.json({ error: 'Name required for deletion' }, { status: 400 });
            await deleteDhcpScope(scopeData.name);
            return NextResponse.json({ success: true });
        }

        // Create or Update
        // Note: We might need separate handling for update based on API behavior, 
        // but for now we try the create endpoint logic with potentially existing data.
        const result = await createDhcpScope(scopeData as Partial<DHCPScope>);

        if (result.status === 'error') {
            throw new Error(result.errorMessage || 'Unknown API error');
        }

        return NextResponse.json({ success: true, result });
    } catch (error) {
        console.error('Technitium Scope API Error:', error);
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
