// AdGuard Home API Client
// Docs: https://github.com/AdguardTeam/AdGuardHome/tree/master/openapi

import fs from 'fs/promises';
import path from 'path';

const PAUSE_FILE = '/tmp/pause_state.json';
const ADGUARD_URL = process.env.ADGUARD_URL || 'http://10.10.10.2:3000';
const ADGUARD_USER = process.env.ADGUARD_USER || 'admin';
const ADGUARD_PASS = process.env.ADGUARD_PASS || 'admin123';

function getAuthHeader() {
    const credentials = Buffer.from(`${ADGUARD_USER}:${ADGUARD_PASS}`).toString('base64');
    return `Basic ${credentials}`;
}

async function adguardFetch(endpoint: string, options: RequestInit = {}) {
    const url = `${ADGUARD_URL}${endpoint}`;
    const headers: Record<string, string> = {
        'Authorization': getAuthHeader(),
    };

    // Only set Content-Type if there's a body
    if (options.body) {
        headers['Content-Type'] = 'application/json';
    }

    // Merge with any custom headers
    Object.assign(headers, options.headers);

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

export async function getQueryLog(limit = 100, olderThan?: string, search?: string, responseStatus?: string) {
    let url = `/control/querylog?limit=${limit}`;
    if (olderThan) url += `&older_than=${olderThan}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (responseStatus) url += `&response_status=${responseStatus}`;
    return adguardFetch(url);
}

export async function clearQueryLog() {
    return adguardFetch('/control/querylog_clear', { method: 'POST' });
}

export async function getFiltering() {
    return adguardFetch('/control/filtering/status');
}

// Toggles global SafeSearch or individual engines
// config example: { enabled: true, google: true, bing: false, ... }
export async function setSafeSearchConfig(config: any) {
    return adguardFetch('/control/safesearch/settings', {
        method: 'PUT',
        body: JSON.stringify(config),
    });
}

export async function toggleSafeSearch(enabled: boolean) {
    const current = await getSafeSearchStatus();
    const config = {
        ...current,
        enabled,
    };
    return setSafeSearchConfig(config);
}

export async function getSafeSearchStatus() {
    return adguardFetch('/control/safesearch/status');
}

// Common services list as fallback if API fails
const FALLBACK_SERVICES = [
    'youtube', 'facebook', 'twitter', 'instagram', 'tiktok', 'snapchat', 'whatsapp', 'telegram', 'viber', 'skype',
    'discord', 'twitch', 'steam', 'epic_games', 'origin', 'roblox', 'minecraft',
    'netflix', 'amazon', 'ebay', 'reddit', 'pinterest', 'linkedin', 'tumblr',
    '9gag', 'imgur', 'dailymotion', 'vimeo', 'wechat', 'qq', 'douyu', 'bilibili'
];

export async function getAllBlockedServices() {
    // Fetches all available services that can be blocked
    try {
        const services = await adguardFetch('/control/blocked_services/all');
        if (Array.isArray(services) && services.length > 0) return services;
        // Try alternative endpoint
        const services2 = await adguardFetch('/control/blocked_services/services');
        if (Array.isArray(services2) && services2.length > 0) return services2;
    } catch (e) {
        console.warn('Failed to fetch blocked services list from API, using fallback', e);
    }
    return FALLBACK_SERVICES;
}

export async function getBlockedServices() {
    // Fetches currently blocked services (enabled ones)
    // Returns { ids: string[], schedule: object }
    // As per docs: GET /control/blocked_services/get
    return adguardFetch('/control/blocked_services/get');
}

export async function setBlockedServices(ids: string[]) {
    // As per docs: PUT /control/blocked_services/update replaces /set
    // We must preserve existing schedule
    const current = await getBlockedServices();
    const payload = {
        ids,
        schedule: current.schedule || { time_zone: 'Local', days: [] }
    };

    return adguardFetch('/control/blocked_services/update', {
        method: 'PUT',
        body: JSON.stringify(payload),
    });
}

export async function getBlockedServicesSchedule() {
    return getBlockedServices(); // It returns the whole object
}

export async function setBlockedServicesSchedule(schedule: any) {
    // As per docs: PUT /control/blocked_services/update
    // We must preserve existing IDs
    const current = await getBlockedServices();

    const payload = {
        ids: current.ids || [],
        schedule: schedule
    };

    return adguardFetch('/control/blocked_services/update', {
        method: 'PUT',
        body: JSON.stringify(payload),
    });
}

export async function refreshFilters(whitelist = false) {
    return adguardFetch('/control/filtering/refresh', {
        method: 'POST',
        body: JSON.stringify({ whitelist }),
    });
}

export async function addFilterList(name: string, url: string, whitelist = false) {
    return adguardFetch('/control/filtering/add_url', {
        method: 'POST',
        body: JSON.stringify({ name, url, whitelist }),
    });
}

export async function removeFilterList(url: string, whitelist = false) {
    return adguardFetch('/control/filtering/remove_url', {
        method: 'POST',
        body: JSON.stringify({ url, whitelist }),
    });
}

export async function updateFilterList(url: string, name: string, newUrl: string, whitelist = false) {
    // AdGuard doesn't have a direct "update" for URL/Name, so we delete and re-add
    // To preserve state, we fetch the current status first
    const status = await getFiltering();
    const listKey = whitelist ? 'whitelist_filters' : 'filters';
    const currentList = status[listKey]?.find((f: any) => f.url === url);
    const wasEnabled = currentList ? currentList.enabled : true;

    await removeFilterList(url, whitelist);
    await addFilterList(name, newUrl, whitelist);

    // If it was disabled, we must explicitly disable it again as add_url defaults to enabled
    if (!wasEnabled) {
        await toggleFilterList(newUrl, false, whitelist);
    }
}

export async function toggleFilterList(url: string, enabled: boolean, whitelist = false) {
    // To use set_url, we need the filter's name. Fetch current status first.
    const status = await getFiltering();
    const listKey = whitelist ? 'whitelist_filters' : 'filters';
    const currentList = status[listKey]?.find((f: any) => f.url === url);

    // If list not found, we can't update. But usually we toggle existing ones.
    const name = currentList ? currentList.name : (url.split('/').pop() || 'Filter');

    // Modern AdGuard Home uses /control/filtering/set_url for toggling
    // It requires a "data" object with name, url, and enabled status
    return adguardFetch('/control/filtering/set_url', {
        method: 'POST',
        body: JSON.stringify({
            url, // The key to find the filter
            whitelist,
            data: {
                enabled,
                name,
                url
            }
        }),
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

// Helper to safely update DNS config by fetching current first
export async function updateDnsConfig(partialConfig: any) {
    const currentConfig = await getDnsConfig();

    // Only send fields that are actually part of the POST /control/dns_config schema
    // and avoid read-only or status fields that might cause errors if sent back
    const allowedFields = [
        'bootstrap_dns', 'upstream_dns', 'fallback_dns', 'all_servers',
        'fastest_addr', 'fastest_timeout', 'protection_enabled', 'ratelimit',
        'ratelimit_whitelist', 'blocking_mode', 'blocking_ipv4', 'blocking_ipv6',
        'edns_client_subnet', 'cache_size', 'cache_ttl_min', 'cache_ttl_max',
        'cache_optimistic', 'upstream_dns_file', 'use_private_ptr_resolvers',
        'local_ptr_upstreams', 'use_dns64', 'dns64_prefixes', 'serve_http3', 'use_http3_upstreams', 'resolve_clients'
    ];

    const filteredConfig: any = {};
    const merged = { ...currentConfig, ...partialConfig };

    for (const key of allowedFields) {
        if (merged[key] !== undefined) {
            filteredConfig[key] = merged[key];
        }
    }

    return setDnsConfig(filteredConfig);
}


// Add a zone forwarding rule to AdGuard
// For regular zones: forwards to Technitium (dns-technitium Docker hostname)
// For AD zones: forwards to DC DNS servers
export async function addZoneForwarding(
    domain: string,
    primaryServer: string = '172.25.0.101',
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

    await updateDnsConfig({
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

    await updateDnsConfig({
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
    return updateDnsConfig({
        protection_enabled: enabled
    });
}

// ==================== Client Management ====================

export interface AdGuardClient {
    name: string;
    ids: string[];
    use_global_settings: boolean;
    filtering_enabled: boolean;
    parental_enabled: boolean;
    safebrowsing_enabled: boolean;
    safesearch_enabled: boolean;
    use_global_blocked_services: boolean;
    blocked_services: string[];
    upstreams: string[];
    tags?: string[];
}

export async function getClients() {
    return adguardFetch('/control/clients');
}

export async function addClient(client: AdGuardClient) {
    return adguardFetch('/control/clients/add', {
        method: 'POST',
        body: JSON.stringify(client),
    });
}

export async function updateClient(oldName: string, client: AdGuardClient) {
    return adguardFetch('/control/clients/update', {
        method: 'POST',
        body: JSON.stringify({
            name: oldName,
            data: client
        }),
    });
}

export async function deleteClient(name: string) {
    return adguardFetch('/control/clients/delete', {
        method: 'POST',
        body: JSON.stringify({ name }),
    });
}


async function getPauseState(): Promise<number | null> {
    try {
        const data = await fs.readFile(PAUSE_FILE, 'utf-8');
        const { pauseUntil } = JSON.parse(data);
        return pauseUntil;
    } catch {
        return null;
    }
}

export async function setPauseState(pauseUntil: number | null) {
    if (pauseUntil === null) {
        try { await fs.unlink(PAUSE_FILE); } catch { }
    } else {
        await fs.writeFile(PAUSE_FILE, JSON.stringify({ pauseUntil }));
    }
}

// Get all protection settings in one call
export async function getAllProtectionStatus() {
    const [status, parental, safeBrowsing, safeSearch, pauseUntil] = await Promise.all([
        getStatus(),
        getParentalStatus(),
        getSafeBrowsingStatus(),
        getSafeSearchStatus(),
        getPauseState(),
    ]);

    let protectionEnabled = status.protection_enabled;

    // Check if we should re-enable protection
    if (pauseUntil && Date.now() >= pauseUntil && !protectionEnabled) {
        console.log('Pause timer expired, re-enabling DNS protection...');
        await setProtectionEnabled(true);
        await setPauseState(null);
        protectionEnabled = true;
    }

    return {
        protectionEnabled,
        parentalEnabled: parental.enabled,
        safeBrowsingEnabled: safeBrowsing.enabled,
        safeSearchEnabled: safeSearch.enabled,
        pauseUntil: pauseUntil && pauseUntil > Date.now() ? pauseUntil : null,
    };
}

// ==================== DHCP Management ====================
export async function getDhcpStatus() {
    return adguardFetch('/control/dhcp/status');
}

export async function getDhcpLeases() {
    // This returns both dynamic and static leases
    return adguardFetch('/control/dhcp/status'); // Includes leases in latest versions
}

export async function setDhcpConfig(config: any) {
    return adguardFetch('/control/dhcp/set_config', {
        method: 'POST',
        body: JSON.stringify(config),
    });
}

export async function addStaticLease(lease: { mac: string; ip: string; hostname: string }) {
    return adguardFetch('/control/dhcp/add_static_lease', {
        method: 'POST',
        body: JSON.stringify(lease),
    });
}

export async function removeStaticLease(lease: { mac: string; ip: string; hostname: string }) {
    return adguardFetch('/control/dhcp/remove_static_lease', {
        method: 'POST',
        body: JSON.stringify(lease),
    });
}
