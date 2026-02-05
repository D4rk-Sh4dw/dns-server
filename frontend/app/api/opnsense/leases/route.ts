import { NextResponse } from 'next/server';
import { getDHCPLeases, OPNsenseConfig } from '@/lib/opnsense';
import fs from 'fs/promises';
import path from 'path';

const CONFIG_FILE = '/app/config_mount/opnsense.json';

export async function POST(request: Request) {
    try {
        let config: OPNsenseConfig;

        // Try to parse body, but handle empty body gracefully
        try {
            config = await request.json();
        } catch {
            config = {} as any;
        }

        // If body config is missing URL, try to load from server file
        if (!config.url || !config.key || !config.secret) {
            try {
                const data = await fs.readFile(CONFIG_FILE, 'utf-8');
                const serverConfig = JSON.parse(data);

                // If the user provided some overrides, merge them? 
                // For now, let's just prefer server config if body is incomplete.
                if (serverConfig.url) {
                    config = serverConfig;
                }
            } catch (e) {
                // Ignore file read errors, just proceed to check validation
            }
        }

        if (!config.url || !config.key || !config.secret || !config.backend) {
            return NextResponse.json({
                error: 'OPNsense not configured. Please go to Settings to configure it.'
            }, { status: 400 });
        }

        const leases = await getDHCPLeases(config);
        return NextResponse.json({ leases });
    } catch (error) {
        console.error('OPNsense API route error:', error);
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
