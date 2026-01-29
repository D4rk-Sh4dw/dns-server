import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import util from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = util.promisify(exec);

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('backup') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const tempPath = '/tmp/restore.tar.gz';
        await fs.writeFile(tempPath, buffer);

        // Extract the tarball to /app, overwriting config_mount and data_mount
        // Note: This relies on the tarball structure matching the mount points.
        // The backup created 'config_mount' and 'data_mount' folders at root of tar.
        // So extracting to /app should place them correctly.

        await execAsync(`tar -xzf ${tempPath} -C /app`);

        // Cleanup
        await fs.unlink(tempPath);

        return NextResponse.json({ success: true, message: 'Restore completed. Please restart containers.' });

    } catch (error) {
        console.error('Restore failed:', error);
        return NextResponse.json({ error: 'Restore failed' }, { status: 500 });
    }
}
