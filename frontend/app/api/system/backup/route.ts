import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import util from 'util';
import fs from 'fs';

const execAsync = util.promisify(exec);

export async function GET() {
    try {
        // Check if the mounted directories exist
        const configExists = fs.existsSync('/app/config_mount');
        const dataExists = fs.existsSync('/app/data_mount');

        if (!configExists && !dataExists) {
            return NextResponse.json({
                error: 'Backup not available - config and data volumes not mounted'
            }, { status: 503 });
        }

        // Build tar command only for existing directories
        const dirs: string[] = [];
        if (configExists) dirs.push('config_mount');
        if (dataExists) dirs.push('data_mount');

        const tarCommand = `tar -czf - -C /app ${dirs.join(' ')}`;

        const { stdout } = await execAsync(tarCommand, {
            encoding: 'buffer',
            maxBuffer: 50 * 1024 * 1024
        });

        return new NextResponse(stdout, {
            headers: {
                'Content-Type': 'application/gzip',
                'Content-Disposition': `attachment; filename="dns-server-backup-${new Date().toISOString().split('T')[0]}.tar.gz"`,
            },
        });

    } catch (error) {
        console.error('Backup generation failed:', error);
        return NextResponse.json({ error: 'Backup generation failed' }, { status: 500 });
    }
}
