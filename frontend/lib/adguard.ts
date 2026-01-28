// AdGuard Home API Client
// Docs: https://github.com/AdguardTeam/AdGuardHome/tree/master/openapi

const ADGUARD_URL = process.env.ADGUARD_URL || 'http://10.10.10.2:3000';
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
        const text = await response.text();
        throw new Error(`AdGuard API error: ${response.status} ${response.statusText} - ${text}`);
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
    const status = await getFiltering();
    const currentRules = status.user_rules || [];

    return adguardFetch('/control/filtering/set_rules', {
        method: 'POST',
        body: JSON.stringify({ rules: [...currentRules, rule] }),
    });
}

// DNS Configuration
export async function getDnsConfig() {
    return adguardFetch('/control/dns_info');
}

export async function setDnsConfig(config: any) {
    return adguardFetch('/control/dns_config', {
        method: 'POST',
        body: JSON.stringify(config),
    });
}

// Add a zone forwarding rule to AdGuard
// This tells AdGuard to forward all requests for this domain to Technitium
export async function addZoneForwarding(domain: string, technitiumIp: string = '10.10.10.3') {
    const dnsInfo = await getDnsConfig();
    const currentUpstreams: string[] = dnsInfo.upstream_dns || [];

    // Create the forwarding rule: [/domain.com/]ip:53
    const forwardRule = `[/${domain}/]${technitiumIp}:53`;

    // Check if rule already exists
    if (currentUpstreams.some(u => u.includes(`[/${domain}/]`))) {
        console.log(`Forwarding rule for ${domain} already exists`);
        return;
    }

    // Add the new rule at the beginning (before default upstreams)
    const newUpstreams = [forwardRule, ...currentUpstreams];

    await setDnsConfig({
        upstream_dns: newUpstreams,
    });

    console.log(`Added forwarding rule for ${domain} -> ${technitiumIp}`);
}

// Remove a zone forwarding rule from AdGuard
export async function removeZoneForwarding(domain: string) {
    const dnsInfo = await getDnsConfig();
    const currentUpstreams: string[] = dnsInfo.upstream_dns || [];

    // Filter out the rule for this domain
    const newUpstreams = currentUpstreams.filter(u => !u.includes(`[/${domain}/]`));

    if (newUpstreams.length === currentUpstreams.length) {
        console.log(`No forwarding rule found for ${domain}`);
        return;
    }

    await setDnsConfig({
        upstream_dns: newUpstreams,
    });

    console.log(`Removed forwarding rule for ${domain}`);
}

// Get list of domains currently forwarded to Technitium
export async function getForwardedDomains(): Promise<string[]> {
    const dnsInfo = await getDnsConfig();
    const upstreams: string[] = dnsInfo.upstream_dns || [];

    const domains: string[] = [];
    for (const upstream of upstreams) {
        const match = upstream.match(/\[\/([^/]+)\/\]/);
        if (match && match[1]) {
            // Split by / in case of multiple domains like [/local/lan/home/]
            const parts = match[1].split('/').filter(Boolean);
            domains.push(...parts);
        }
    }

    return domains;
}
