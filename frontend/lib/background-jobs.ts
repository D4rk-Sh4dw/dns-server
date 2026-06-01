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
let isInitialized = false;

export function initBackgroundJobs() {
    // Prevent multiple instances
    if (isInitialized) {
        return;
    }

    isInitialized = true;
    console.log('[Background Jobs] Starting protection timer job (checks every 30 seconds)');

    // Check immediately on startup
    checkAndReenableProtection();

    // Then check periodically
    timerJobInterval = setInterval(checkAndReenableProtection, 30 * 1000);
}

export function stopBackgroundJobs() {
    if (timerJobInterval) {
        clearInterval(timerJobInterval);
        timerJobInterval = null;
    }
    isInitialized = false;
    console.log('[Background Jobs] Stopped');
}

// Auto-initialize on module load in Node.js environment
if (typeof window === 'undefined') {
    // Small delay to ensure all modules are loaded
    setTimeout(() => {
        initBackgroundJobs();
    }, 1000);
}
