// Technitium DNS API Client
// Docs: https://github.com/TechnitiumSoftware/DnsServer/blob/master/APIDOCS.md

const TECHNITIUM_URL = process.env.TECHNITIUM_URL || 'http://dns-technitium:5380';
const TECHNITIUM_PASSWORD = process.env.TECHNITIUM_PASSWORD || 'admin123';

let cachedToken: string | null = null;

async function getToken(forceRefresh = false): Promise<string> {
    if (cachedToken && !forceRefresh) return cachedToken;

    console.log('Fetching new Technitium token...');
    const response = await fetch(`${TECHNITIUM_URL}/api/user/login?user=admin&pass=${TECHNITIUM_PASSWORD}`);
    const data = await response.json();

    if (data.status === 'ok') {
        cachedToken = data.token;
        return cachedToken!;
    }

    throw new Error(`Technitium login failed: ${data.errorMessage}`);
}

async function technitiumFetch(endpoint: string, params: Record<string, string> = {}, options: { method?: string; body?: any } = {}) {
    try {
        const token = await getToken();
        // For GET requests, params go in URL. For POST, they might be query params OR body, depending on API.
        // Usually Technitium takes 'token' in query even for POST.
        const queryParams = new URLSearchParams({ token, ...params });
        const url = `${TECHNITIUM_URL}${endpoint}?${queryParams}`;

        const fetchOptions: RequestInit = {
            method: options.method || 'GET',
            headers: options.body ? { 'Content-Type': 'application/json' } : undefined,
            body: options.body ? JSON.stringify(options.body) : undefined,
        };

        const response = await fetch(url, fetchOptions);
        const text = await response.text();

        let data;
        try {
            data = text ? JSON.parse(text) : {};
        } catch (e) {
            console.error('Failed to parse Technitium response:', text);
            throw new Error(`Invalid JSON response from Technitium: ${text.substring(0, 100)}...`);
        }

        // Check for session expiry or invalid token
        if (data.status === 'error') {
            const errorMsg = data.errorMessage?.toLowerCase() || '';
            const isAuthError = errorMsg.includes('session expired') ||
                errorMsg.includes('invalid token') ||
                errorMsg.includes('token expired');

            if (isAuthError) {
                console.log(`Technitium session issue detected: "${data.errorMessage}". Retrying with fresh token...`);

                // Clear cache and get new token
                cachedToken = null;
                const newToken = await getToken(true);

                // Retry the request
                const retryParams = new URLSearchParams({ token: newToken, ...params });
                const retryUrl = `${TECHNITIUM_URL}${endpoint}?${retryParams}`;

                const retryResponse = await fetch(retryUrl, fetchOptions);
                const retryText = await retryResponse.text();
                const retryData = retryText ? JSON.parse(retryText) : {};

                if (retryData.status === 'error') {
                    console.error(`Technitium retry failed: ${retryData.errorMessage}`);
                    throw new Error(`Technitium API error after retry: ${retryData.errorMessage}`);
                }
                return retryData.response !== undefined ? retryData.response : retryData;
            }

            // Regular error
            throw new Error(`Technitium API error: ${data.errorMessage}`);
        }

        return data.response !== undefined ? data.response : data;
    } catch (error) {
        console.error(`Technitium API call failed for ${endpoint}:`, error);
        throw error;
    }
}

// Zone Management
export async function listZones() {
    return technitiumFetch('/api/zones/list');
}

export async function createZone(zone: string, type: string = 'Primary', options: { forwarder?: string } = {}) {
    const params: Record<string, string> = { zone, type };
    if (options.forwarder) {
        params.forwarder = options.forwarder;
    }
    return technitiumFetch('/api/zones/create', params);
}

export async function deleteZone(zone: string) {
    return technitiumFetch('/api/zones/delete', { zone });
}

// Helper to normalize keys to camelCase
function normalizeRecord(record: any): any {
    const normalized: any = {};
    for (const key in record) {
        // Convert KeyName to keyName
        const camelKey = key.charAt(0).toLowerCase() + key.slice(1);

        // Handle RData specifically
        if (key === 'RData' || key === 'rData') { // Handle both cases just to be safe
            const rData: any = {};
            for (const rKey in record[key]) {
                const camelRKey = rKey.charAt(0).toLowerCase() + rKey.slice(1);
                rData[camelRKey] = record[key][rKey];
            }
            normalized.rData = rData;
        } else {
            normalized[camelKey] = record[key];
        }
    }
    return normalized;
}

// Record Management
export async function listRecords(zone: string) {
    const response = await technitiumFetch('/api/zones/records/get', { domain: zone, listZone: 'true' });

    // Normalize records to camelCase if needed
    if (response && response.records) {
        response.records = response.records.map(normalizeRecord);
    }

    return response;
}

export async function addRecord(
    domain: string,
    type: string,
    value: string,
    ttl: number = 3600,
    options: Record<string, string> = {}
) {
    const params: Record<string, string> = {
        domain,
        type,
        ttl: ttl.toString(),
        ...options,
    };

    // Different record types need different value fields
    switch (type.toUpperCase()) {
        case 'A':
        case 'AAAA':
            params.ipAddress = value;
            break;
        case 'CNAME':
            params.cname = value;
            break;
        case 'NS':
            params.nameServer = value; // Correct parameter name
            break;
        case 'PTR':
            params.ptrName = value; // Correct parameter name
            break;
        case 'MX':
            params.mailExchange = value; // Correct parameter name
            params.preference = options.preference || '10';
            break;
        case 'TXT':
            params.text = value;
            break;
        case 'SRV':
            params.target = value;
            params.priority = options.priority || '0';
            params.weight = options.weight || '0';
            params.port = options.port || '0';
            break;
        case 'CAA':
            params.flags = options.flags || '0';
            params.tag = options.tag || 'issue';
            params.value = value;
            break;
        default:
            params.rdata = value;
    }

    return technitiumFetch('/api/zones/records/add', params);
}

export async function deleteRecord(
    domain: string,
    type: string,
    value: string,
    options: Record<string, string> = {}
) {
    const params: Record<string, string> = { domain, type, ...options };

    switch (type.toUpperCase()) {
        case 'A':
        case 'AAAA':
            params.ipAddress = value;
            break;
        case 'CNAME':
            params.cname = value;
            break;
        case 'NS':
            params.nameServer = value;
            break;
        case 'PTR':
            params.ptrName = value;
            break;
        case 'MX':
            params.mailExchange = value;
            params.preference = options.preference || '0';
            break;
        case 'TXT':
            params.text = value;
            break;
        case 'SRV':
            params.target = value;
            params.priority = options.priority || '0';
            params.weight = options.weight || '0';
            params.port = options.port || '0';
            break;
        case 'CAA':
            params.flags = options.flags || '0';
            params.tag = options.tag || 'issue';
            params.value = value;
            break;
        default:
            params.rdata = value;
    }

    return technitiumFetch('/api/zones/records/delete', params);
}

// Stats
export async function getStats() {
    return technitiumFetch('/api/dashboard/stats/get');
}

export async function getTopClients() {
    return technitiumFetch('/api/dashboard/stats/getTopClients');
}

export async function getTopDomains() {
    return technitiumFetch('/api/dashboard/stats/getTopDomains');
}

export async function getServerStatus() {
    return technitiumFetch('/api/server/status');
}

export async function getSummary() {
    return technitiumFetch('/api/dashboard/summary');
}

// --- DHCP Management ---

export interface DHCPScope {
    name: string;
    description?: string;
    enabled: boolean;
    startAddress: string;
    endAddress: string;
    subnetMask: string;
    gateway: string;
    leaseTime: number; // in seconds
    offerDelay: number; // in milliseconds

    // Ping Check
    pingCheckEnabled: boolean;
    pingCheckTimeout: number;
    pingCheckRetries: number;

    // Domain & DNS
    domainName?: string;
    domainSearchList?: string[];
    dnsUpdatesEnabled: boolean;
    dnsOverwriteDynamicLeaseEnabled: boolean;
    dnsTtl: number;
    dnsServers?: string[]; // If empty, use server's own address as DNS? User UI says "Use This DNS Server"

    // Network Options
    winsServers?: string[];
    ntpServers?: string[];
    ntpServerDomainNames?: string[];
    staticRoutes?: string[]; // Format: Destination,SubnetMask,Router

    // Boot / TFTP
    bootstrapServerAddress?: string;
    bootstrapServerHostName?: string;
    bootFileName?: string;
    tftpServerAddresses?: string[];

    // Advanced / Other
    genericOptions?: { code: number; value: string }[];
    exclusions?: { startAddress: string; endAddress: string }[];

    // Advanced Booleans
    allowOnlyReservedLeaseAllocations: boolean;
    blockLocallyAdministeredMacAddresses: boolean;
    ignoreClientIdentifier: boolean;

    reservedLeases?: TechnitiumDHCPLease[];
}

export interface TechnitiumDHCPLease {
    scope: string;
    ipAddress: string;
    hardwareAddress: string;
    hostname: string;
    expiresAt: string;
    isReserved: boolean;
    comments?: string;
}

/**
 * List all DHCP scopes
 */
export async function listDHCPScopes(): Promise<DHCPScope[]> {
    const data = await technitiumFetch('/api/dhcp/scopes/list');
    return (data.scopes || []).map(normalizeScope);
}

/**
 * Get detailed configuration for a specific DHCP scope
 */
export async function getDHCPScope(name: string): Promise<DHCPScope> {
    const data = await technitiumFetch('/api/dhcp/scopes/get', { name });
    // The API might return the scope object directly or inside a wrapper, checking typical response
    // Based on docs for get: { response: { ...scope properties... }, status: "ok" }
    // our technitiumFetch returns data.response.
    return normalizeScope(data);
}

function normalizeScope(apiScope: any): DHCPScope {
    // Calculate total lease seconds
    const days = parseInt(apiScope.leaseTimeDays || '0') * 86400;
    const hours = parseInt(apiScope.leaseTimeHours || '0') * 3600;
    const minutes = parseInt(apiScope.leaseTimeMinutes || '0') * 60;
    const totalLease = days + hours + minutes;

    return {
        name: apiScope.name,
        description: apiScope.description,
        enabled: apiScope.isEnabled !== undefined ? apiScope.isEnabled : apiScope.enabled, // Check both just in case
        startAddress: apiScope.startingAddress || '',
        endAddress: apiScope.endingAddress || '',
        subnetMask: apiScope.subnetMask || '',
        gateway: apiScope.routerAddress || '',
        leaseTime: totalLease > 0 ? totalLease : 86400, // Default to 1 day if 0/missing
        offerDelay: parseInt(apiScope.offerDelayTime || '0'),

        pingCheckEnabled: apiScope.pingCheckEnabled === true || apiScope.pingCheckEnabled === 'true',
        pingCheckTimeout: parseInt(apiScope.pingCheckTimeout || '1000'),
        pingCheckRetries: parseInt(apiScope.pingCheckRetries || '2'),

        domainName: apiScope.domainName,
        dnsUpdatesEnabled: apiScope.dnsUpdates === true || apiScope.dnsUpdates === 'true',
        dnsOverwriteDynamicLeaseEnabled: apiScope.dnsOverwriteForDynamicLease === true || apiScope.dnsOverwriteForDynamicLease === 'true',
        dnsTtl: parseInt(apiScope.dnsTtl || '900'),
        dnsServers: Array.isArray(apiScope.dnsServers) ? apiScope.dnsServers : (apiScope.dnsServers || '').split(',').filter(Boolean),
        ntpServers: Array.isArray(apiScope.ntpServers) ? apiScope.ntpServers : (apiScope.ntpServers || '').split(',').filter(Boolean),

        bootFileName: apiScope.bootFileName,
        bootstrapServerAddress: apiScope.serverAddress,

        allowOnlyReservedLeaseAllocations: apiScope.allowOnlyReservedLeases === true || apiScope.allowOnlyReservedLeases === 'true',
        blockLocallyAdministeredMacAddresses: apiScope.blockLocallyAdministeredMacAddresses === true || apiScope.blockLocallyAdministeredMacAddresses === 'true',
        ignoreClientIdentifier: apiScope.ignoreClientIdentifierOption === true || apiScope.ignoreClientIdentifierOption === 'true',

        // Pass through original just in case we missed something needed elsewhere
        ...apiScope
    };
}

/**
 * Create or Update a DHCP scope
 * Note: The API likely uses 'add' for creation. For update, 'set' might be used or 'add' might overwrite?
 * Based on common patterns in this API, usually 'add' creates and 'set' updates, or they are separate.
 * Let's assume /api/dhcp/scopes/add creates, and we might need /set for updates.
 * Wait, usually for this API, creating a scope that exists might fail.
 */
// Helper to convert seconds to days/hours/minutes for API
function secondsToDhcpTime(seconds: number) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return {
        leaseTimeDays: days.toString(),
        leaseTimeHours: hours.toString(),
        leaseTimeMinutes: minutes.toString()
    };
}

// Docs: https://github.com/TechnitiumSoftware/DnsServer/blob/master/APIDOCS.md#set-dhcp-scope
// Endpoint is /api/dhcp/scopes/set (handles both create and update)
// Parameters must be passed in Query String (or Form Data), NOT JSON Body.
export async function createDhcpScope(scope: Partial<DHCPScope>) {
    const timeParams = secondsToDhcpTime(scope.leaseTime || 86400);

    // Map frontend DHCPScope interface to Technitium API parameters (Query Params)
    const apiParams: Record<string, string> = {
        name: scope.name || 'Scope',
        startingAddress: scope.startAddress || '',
        endingAddress: scope.endAddress || '',
        subnetMask: scope.subnetMask || '255.255.255.0',
        routerAddress: scope.gateway || '', // Default Gateway
        ...timeParams,
        offerDelayTime: (scope.offerDelay || 0).toString(),

        pingCheckEnabled: String(scope.pingCheckEnabled ?? true),
        pingCheckTimeout: (scope.pingCheckTimeout || 1000).toString(),
        pingCheckRetries: (scope.pingCheckRetries || 2).toString(),

        domainName: scope.domainName || '',
        dnsUpdates: String(scope.dnsUpdatesEnabled ?? true),
        dnsOverwriteForDynamicLease: String(scope.dnsOverwriteDynamicLeaseEnabled ?? false),
        dnsTtl: (scope.dnsTtl || 900).toString(),
        useThisDnsServer: 'false', // We allow custom DNS servers
        dnsServers: (scope.dnsServers || []).join(','), // Comma separated

        ntpServers: (scope.ntpServers || []).join(','),

        bootFileName: scope.bootFileName || '',
        serverAddress: scope.bootstrapServerAddress || '', // Next Server IP

        allowOnlyReservedLeases: String(scope.allowOnlyReservedLeaseAllocations ?? false),
        blockLocallyAdministeredMacAddresses: String(scope.blockLocallyAdministeredMacAddresses ?? false),
        ignoreClientIdentifierOption: String(scope.ignoreClientIdentifier ?? false)
    };

    // Remove empty optional fields if necessary, but Technitium usually handles empty strings fine or expects them.
    // Sending them as query params via technitiumFetch (2nd arg).
    return await technitiumFetch('/api/dhcp/scopes/set', apiParams, {
        method: 'POST'
        // No body, parameters via URL query string as per docs/convention for this API
    });
}

/**
 * Delete a DHCP scope
 */
export async function deleteDhcpScope(name: string) {
    // Delete typically takes 'name' as query param or body. 
    // Technitium usually prefers query for simple deletes/gets, but let's be safe or check docs.
    // Docs say for scopes/delete: "name" (string).
    // We can send as query param to be consistent with GET-like deletes, or body if it supports it.
    // Let's try query param first as it's simple string, if that failed we'd move to body.
    // However, since we just fixed POST support, let's use query param for the name as previous implementation used query params (via second arg).
    return await technitiumFetch('/api/dhcp/scopes/delete', { name }, { method: 'POST' });
}

/**
 * List all active and reserved DHCP leases
 */
export async function listDHCPLeases(): Promise<TechnitiumDHCPLease[]> {
    const data = await technitiumFetch('/api/dhcp/leases/list');
    return data.leases || [];
}

/**
 * Remove a DHCP lease (active or reserved)
 */
export async function removeDHCPLease(scope: string, ipAddress: string, hardwareAddress: string) {
    return await technitiumFetch('/api/dhcp/leases/remove', {
        name: scope,
        ipAddress,
        hardwareAddress
    });
}
