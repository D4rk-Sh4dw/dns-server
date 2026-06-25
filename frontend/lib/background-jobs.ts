// Background jobs that run on the server
import fs from 'fs/promises';
import { setProtectionEnabled, setPauseState } from './adguard';
import { loadDynDnsRecords, updateDynDnsRecordIp } from './dyndns';

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

async function checkDynDnsRecords() {
    try {
        const records = await loadDynDnsRecords();
        const now = Date.now();
        const enabledRecords = records.filter(r => r.enabled);
        if (enabledRecords.length === 0) return;

        let checked = 0;
        let updated = 0;
        let errors = 0;

        for (const record of enabledRecords) {
            const lastChecked = record.lastCheckedAt ? new Date(record.lastCheckedAt).getTime() : 0;
            const intervalMs = record.intervalMinutes * 60 * 1000;
            if (now - lastChecked < intervalMs) continue;

            checked++;
            try {
                const result = await updateDynDnsRecordIp(record, false);
                if (result.updated) updated++;
                if (result.error) errors++;
            } catch (error) {
                console.error('[Background Job] DynDNS check failed for', record.zone, record.name, error);
                errors++;
            }
        }

        if (checked > 0) {
            console.log(`[Background Job] DynDNS checks: ${checked} checked, ${updated} updated, ${errors} errors`);
        }
    } catch (error) {
        console.error('[Background Job] Error checking DynDNS records:', error);
    }
}

type BackgroundJobsState = {
    timerJobInterval: NodeJS.Timeout | null;
    dyndnsJobInterval: NodeJS.Timeout | null;
    isInitialized: boolean;
};

function getBackgroundJobsState(): BackgroundJobsState {
    const scopedGlobal = globalThis as typeof globalThis & {
        __dnsBackgroundJobsState?: BackgroundJobsState;
    };

    if (!scopedGlobal.__dnsBackgroundJobsState) {
        scopedGlobal.__dnsBackgroundJobsState = {
            timerJobInterval: null,
            dyndnsJobInterval: null,
            isInitialized: false,
        };
    }

    return scopedGlobal.__dnsBackgroundJobsState;
}

export function initBackgroundJobs() {
    const state = getBackgroundJobsState();

    // Prevent multiple instances
    if (state.isInitialized) {
        return;
    }

    state.isInitialized = true;
    console.log('[Background Jobs] Starting protection timer job (checks every 30 seconds)');
    console.log('[Background Jobs] Starting DynDNS job (checks every 60 seconds)');

    // Check immediately on startup
    checkAndReenableProtection();
    checkDynDnsRecords();

    // Then check periodically
    state.timerJobInterval = setInterval(checkAndReenableProtection, 30 * 1000);
    state.dyndnsJobInterval = setInterval(checkDynDnsRecords, 60 * 1000);
}

export function stopBackgroundJobs() {
    const state = getBackgroundJobsState();

    if (state.timerJobInterval) {
        clearInterval(state.timerJobInterval);
        state.timerJobInterval = null;
    }
    if (state.dyndnsJobInterval) {
        clearInterval(state.dyndnsJobInterval);
        state.dyndnsJobInterval = null;
    }
    state.isInitialized = false;
    console.log('[Background Jobs] Stopped');
}

// Auto-initialize on module load in Node.js environment
if (typeof window === 'undefined') {
    // Small delay to ensure all modules are loaded
    setTimeout(() => {
        initBackgroundJobs();
    }, 1000);
}
