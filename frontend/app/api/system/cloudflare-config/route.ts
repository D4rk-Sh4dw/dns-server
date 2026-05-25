import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

function getConfigPath(): string {
    // Docker environment
    if (fs.existsSync('/app/data_mount')) {
        return '/app/data_mount/cloudflare-config.json';
    }
    // Local development: data dir is one level up from frontend/
    const localData = path.resolve(process.cwd(), '..', 'data');
    return path.join(localData, 'cloudflare-config.json');
}

export async function GET() {
    try {
        const configPath = getConfigPath();
        if (!fs.existsSync(configPath)) {
            return NextResponse.json({ email: '', apiToken: '', apiKey: '', authType: 'token' });
        }
        const raw = fs.readFileSync(configPath, 'utf-8');
        return NextResponse.json(JSON.parse(raw));
    } catch (err) {
        console.error('Failed to read Cloudflare config:', err);
        return NextResponse.json({ error: 'Failed to read config' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, apiToken, apiKey, authType } = body;

        const config = { email: email || '', apiToken: apiToken || '', apiKey: apiKey || '', authType: authType || 'token' };

        const configPath = getConfigPath();
        const dir = path.dirname(configPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Failed to save Cloudflare config:', err);
        return NextResponse.json({ error: 'Failed to save config' }, { status: 500 });
    }
}
