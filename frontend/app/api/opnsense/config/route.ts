import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

// Force dynamic to prevent caching
export const dynamic = 'force-dynamic';

// Define the path to the config file
// We use the volume mount text path or a fallback
const CONFIG_DIR = '/app/config_mount';
const CONFIG_FILE = path.join(CONFIG_DIR, 'opnsense.json');

// Helper to ensure config directory exists
async function ensureConfigDir() {
    try {
        await fs.access(CONFIG_DIR);
    } catch {
        // If we can't access it, try to create it (though in Docker it should be mounted)
        try {
            console.log(`[API] Creating config directory at ${CONFIG_DIR}`);
            await fs.mkdir(CONFIG_DIR, { recursive: true });
        } catch (e) {
            console.error('[API] Failed to create config directory:', e);
        }
    }
}

export async function GET() {
    try {
        await ensureConfigDir();
        try {
            const data = await fs.readFile(CONFIG_FILE, 'utf-8');
            const config = JSON.parse(data);
            return NextResponse.json(config);
        } catch (error: any) {
            // Return default/empty config if file doesn't exist
            if (error.code === 'ENOENT') {
                console.log('[API] Config file not found, returning defaults');
                return NextResponse.json({
                    url: '',
                    key: '',
                    secret: '',
                    backend: 'kea',
                    skip_ssl_verify: false
                });
            }
            throw error;
        }
    } catch (error) {
        console.error('[API] Failed to read OPNsense config:', error);
        return NextResponse.json({ error: 'Failed to fetch config' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        await ensureConfigDir();
        const body = await request.json();

        console.log('[API] Saving OPNsense config...');

        // Validate minimal structure if needed, or just save
        // We might want to filter allowed keys to avoid garbage
        const configToSave = {
            url: body.url || '',
            key: body.key || '',
            secret: body.secret || '',
            backend: body.backend || 'kea',
            skip_ssl_verify: !!body.skip_ssl_verify
        };

        await fs.writeFile(CONFIG_FILE, JSON.stringify(configToSave, null, 2));
        console.log('[API] Config saved successfully to', CONFIG_FILE);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[API] Failed to save OPNsense config:', error);
        return NextResponse.json({ error: 'Failed to save config' }, { status: 500 });
    }
}
