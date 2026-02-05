import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import util from 'util';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import os from 'os';

const execAsync = util.promisify(exec);

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('backup') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        // Use OS-specific temp directory
        const tempPath = path.join(os.tmpdir(), 'restore.tar.gz');
        await fs.writeFile(tempPath, buffer);

        // Determine target directory
        let targetDir = '/app';
        if (!existsSync(targetDir)) {
            // Fallback for local development (assuming running from frontend dir)
            targetDir = path.resolve(process.cwd(), '..');
        }

        console.log(`Restoring backup to: ${targetDir}`);

        // Extract the tarball
        // Note: The backup contains 'config_mount' and 'data_mount' (or 'config'/'data' locally) at the root level.
        // We rely on the tarball structure matching what's expected in the targetDir.

        // Use quotes to handle paths with spaces
        const command = `tar -xzf "${tempPath}" -C "${targetDir}"`;
        await execAsync(command);

        // Cleanup
        await fs.unlink(tempPath);

        return NextResponse.json({ success: true, message: 'Restore completed. Please restart containers.' });

    } catch (error) {
        console.error('Restore failed:', error);
        return NextResponse.json({ error: 'Restore failed' }, { status: 500 });
    }
}
