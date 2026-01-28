// AdGuard Home API Client
// Docs: https://github.com/AdguardTeam/AdGuardHome/tree/master/openapi

const ADGUARD_URL = process.env.ADGUARD_URL || 'http://dns-adguard:80';
const ADGUARD_USER = process.env.ADGUARD_USER || 'admin';
const ADGUARD_PASS = process.env.ADGUARD_PASS || 'admin123';

function getAuthHeader() {
    const credentials = Buffer.from(`${ADGUARD_USER}:${ADGUARD_PASS}`).toString('base64');
    return `Basic ${credentials}`;
}

async function adguardFetch(endpoint: string, options: RequestInit = {}) {
    const url = `${ADGUARD_URL}${endpoint}`;
    const headers = {
        'Authorization': getAuthHeader(),
        'Content-Type': 'application/json',
        ...options.headers,
    };

    const response = await fetch(url, { ...options, headers });

    if (!response.ok) {
        throw new Error(`AdGuard API error: ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
        return response.json();
    }
    return response.text();
}

export async function getStatus() {
    return adguardFetch('/control/status');
}

export async function getStats() {
    return adguardFetch('/control/stats');
}

export async function getQueryLog(limit = 100) {
    return adguardFetch(`/control/querylog?limit=${limit}`);
}

export async function getFiltering() {
    return adguardFetch('/control/filtering/status');
}

export async function toggleSafeSearch(enabled: boolean) {
    return adguardFetch('/control/safesearch/settings', {
        method: 'PUT',
        body: JSON.stringify({ enabled }),
    });
}

export async function getSafeSearchStatus() {
    return adguardFetch('/control/safesearch/status');
}

export async function getBlockedServices() {
    return adguardFetch('/control/blocked_services/list');
}

export async function setBlockedServices(ids: string[]) {
    return adguardFetch('/control/blocked_services/update', {
        method: 'PUT',
        body: JSON.stringify({ ids }),
    });
}

export async function addFilterList(name: string, url: string) {
    return adguardFetch('/control/filtering/add_url', {
        method: 'POST',
        body: JSON.stringify({ name, url, whitelist: false }),
    });
}

export async function removeFilterList(url: string) {
    return adguardFetch('/control/filtering/remove_url', {
        method: 'POST',
        body: JSON.stringify({ url, whitelist: false }),
    });
}

export async function refreshFilters() {
    return adguardFetch('/control/filtering/refresh', {
        method: 'POST',
        body: JSON.stringify({ whitelist: false }),
    });
}

export async function addCustomRule(rule: string) {
    // Get current rules first
    const status = await getFiltering();
    const currentRules = status.user_rules || [];

    return adguardFetch('/control/filtering/set_rules', {
        method: 'POST',
        body: JSON.stringify({ rules: [...currentRules, rule] }),
    });
}
