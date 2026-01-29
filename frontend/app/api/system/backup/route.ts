import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import util from 'util';
import fs from 'fs';

const execAsync = util.promisify(exec);

export async function GET() {
    try {
        // Create a tarball of the config and data directories
        // We exclude the dashboard's own data if needed, but mainly we want AdGuard/Technitium configs
        // Using 'tar' command which should be present in the node image (usually based on debian/alpine)

        // This command creates a tar.gz stream to stdout
        const tarCommand = 'tar -czf - -C /app config_mount data_mount';

        // Next.js (Node) streaming response is a bit tricky with child_process stdout
        // We'll use a ReadableStream

        const { stdout, stderr } = await execAsync(tarCommand, { encoding: 'buffer', maxBuffer: 50 * 1024 * 1024 }); // 50MB buffer limit for simplicity

        // Ideally we would stream it, but for simplicity/reliability in this context, buffering is safer unless backup is huge.
        // Given text configs, it should be small.

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
