import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import util from 'util';
import fs from 'fs';

const execAsync = util.promisify(exec);

export async function GET() {
    try {
        let baseDir = '/app';
        let includeDirs: string[] = [];

        // Check for Docker environment paths
        const dockerConfig = '/app/config_mount';
        const dockerData = '/app/data_mount';

        if (fs.existsSync(dockerConfig) || fs.existsSync(dockerData)) {
            if (fs.existsSync(dockerConfig)) includeDirs.push('config_mount');
            if (fs.existsSync(dockerData)) includeDirs.push('data_mount');
        } else {
            // Fallback: Local development paths
            // Assuming running in frontend directory, so config/data are in parent
            const path = require('path');
            const localBase = path.resolve(process.cwd(), '..');

            // intended structure: ../config and ../data
            if (fs.existsSync(path.join(localBase, 'config'))) includeDirs.push('config');
            if (fs.existsSync(path.join(localBase, 'data'))) includeDirs.push('data');

            if (includeDirs.length > 0) {
                baseDir = localBase;
            }
        }

        if (includeDirs.length === 0) {
            return NextResponse.json({
                error: 'Backup not available - config and data directories not found'
            }, { status: 503 });
        }

        // Use quotes for baseDir to handle paths with spaces if any (Windows local)
        const tarCommand = `tar -czf - -C "${baseDir}" ${includeDirs.join(' ')}`;
        console.log('Executing backup command:', tarCommand);

        const { stdout, stderr } = await execAsync(tarCommand, {
            encoding: 'buffer',
            maxBuffer: 50 * 1024 * 1024
        });

        if (stderr && stderr.length > 0) {
            console.warn('Tar command stderr:', stderr.toString());
        }

        return new NextResponse(stdout, {
            headers: {
                'Content-Type': 'application/gzip',
                'Content-Disposition': `attachment; filename="dns-server-backup-${new Date().toISOString().split('T')[0]}.tar.gz"`,
            },
        });

    } catch (error) {
        console.error('Backup generation failed:', error);
        return NextResponse.json({ error: 'Backup generation failed', details: String(error) }, { status: 500 });
    }
}
