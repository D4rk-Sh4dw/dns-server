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
    // AdGuard requires setting each search engine individually
    const config = {
        enabled,
        bing: enabled,
        duckduckgo: enabled,
        ecosia: enabled,
        google: enabled,
        pixabay: enabled,
        yandex: enabled,
        youtube: enabled,
    };
    return adguardFetch('/control/safesearch/settings', {
        method: 'PUT',
        body: JSON.stringify(config),
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

export async function getCustomRules() {
    const status = await getFiltering();
    return status.user_rules || [];
}

export async function addCustomRule(rule: string) {
    const currentRules = await getCustomRules();

    // Avoid duplicates
    if (currentRules.includes(rule)) return;

    return adguardFetch('/control/filtering/set_rules', {
        method: 'POST',
        body: JSON.stringify({ rules: [...currentRules, rule] }),
    });
}

export async function removeCustomRule(rule: string) {
    const currentRules = await getCustomRules();
    const newRules = currentRules.filter((r: string) => r !== rule);

    return adguardFetch('/control/filtering/set_rules', {
        method: 'POST',
        body: JSON.stringify({ rules: newRules }),
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
// For regular zones: forwards to Technitium (10.10.10.3)
// For AD zones: forwards to DC DNS servers
export async function addZoneForwarding(
    domain: string,
    primaryServer: string = '10.10.10.3',
    additionalServers: string[] = []
) {
    const dnsInfo = await getDnsConfig();
    const currentUpstreams: string[] = dnsInfo.upstream_dns || [];

    // Check if rule already exists
    if (currentUpstreams.some(u => u.includes(`[/${domain}/]`))) {
        console.log(`Forwarding rule for ${domain} already exists`);
        return;
    }

    // Create the forwarding rules
    // Format: [/domain.com/]ip:53 or [/domain.com/]ip1:53 ip2:53 (for load balancing)
    const servers = [primaryServer, ...additionalServers].map(s =>
        s.includes(':') ? s : `${s}:53`
    );

    const forwardRule = `[/${domain}/]${servers.join(' ')}`;

    // Add the new rule at the beginning (before default upstreams)
    const newUpstreams = [forwardRule, ...currentUpstreams];

    await setDnsConfig({
        upstream_dns: newUpstreams,
    });

    console.log(`Added forwarding rule for ${domain} -> ${servers.join(', ')}`);
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

// ==================== Protection Settings ====================

// Parental Control
export async function getParentalStatus() {
    return adguardFetch('/control/parental/status');
}

export async function setParentalEnabled(enabled: boolean) {
    const endpoint = enabled ? '/control/parental/enable' : '/control/parental/disable';
    return adguardFetch(endpoint, { method: 'POST' });
}

// Safe Browsing
export async function getSafeBrowsingStatus() {
    return adguardFetch('/control/safebrowsing/status');
}

export async function setSafeBrowsingEnabled(enabled: boolean) {
    const endpoint = enabled ? '/control/safebrowsing/enable' : '/control/safebrowsing/disable';
    return adguardFetch(endpoint, { method: 'POST' });
}

// Overall DNS Protection (enables/disables all filtering)
export async function setProtectionEnabled(enabled: boolean) {
    return adguardFetch('/control/dns_config', {
        method: 'POST',
        body: JSON.stringify({ protection_enabled: enabled }),
    });
}

// Get all protection settings in one call
export async function getAllProtectionStatus() {
    const [status, parental, safeBrowsing, safeSearch] = await Promise.all([
        getStatus(),
        getParentalStatus(),
        getSafeBrowsingStatus(),
        getSafeSearchStatus(),
    ]);

    return {
        protectionEnabled: status.protection_enabled,
        parentalEnabled: parental.enabled,
        safeBrowsingEnabled: safeBrowsing.enabled,
        safeSearchEnabled: safeSearch.enabled,
    };
}
