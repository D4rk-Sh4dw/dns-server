// Background jobs that run on the server
import fs from 'fs/promises';
import { setProtectionEnabled, setPauseState } from './adguard';

const PAUSE_FILE = '/tmp/pause_state.json';

async function getPauseState(): Promise<number | null> {
    try {
        const data = await fs.readFile(PAUSE_FILE, 'utf-8');
        const { pauseUntil } = JSON.parse(data);
        return pauseUntil;
    } catch {
        return null;
    }
}

async function checkAndReenableProtection() {
    try {
        const pauseUntil = await getPauseState();

        if (pauseUntil && Date.now() >= pauseUntil) {
            console.log('[Background Job] Pause timer expired, re-enabling DNS protection...');
            await setProtectionEnabled(true);
            await setPauseState(null);
            console.log('[Background Job] DNS protection re-enabled successfully');
        }
    } catch (error) {
        console.error('[Background Job] Error checking pause state:', error);
    }
}

let timerJobInterval: NodeJS.Timeout | null = null;

export function initBackgroundJobs() {
    // Prevent multiple instances
    if (timerJobInterval) {
        console.log('[Background Jobs] Already running, skipping initialization');
        return;
    }

    console.log('[Background Jobs] Starting protection timer job (checks every 30 seconds)');

    // Check immediately on startup
    checkAndReenableProtection();

    // Then check every 30 seconds
    timerJobInterval = setInterval(checkAndReenableProtection, 30 * 1000);
}

export function stopBackgroundJobs() {
    if (timerJobInterval) {
        clearInterval(timerJobInterval);
        timerJobInterval = null;
        console.log('[Background Jobs] Stopped');
    }
}
