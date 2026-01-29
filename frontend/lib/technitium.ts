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

async function technitiumFetch(endpoint: string, params: Record<string, string> = {}) {
    try {
        const token = await getToken();
        const queryParams = new URLSearchParams({ token, ...params });
        const url = `${TECHNITIUM_URL}${endpoint}?${queryParams}`;

        const response = await fetch(url);
        const data = await response.json();

        // Check for session expiry or invalid token
        if (data.status === 'error' && (
            data.errorMessage?.includes('session expired') ||
            data.errorMessage?.includes('invalid token')
        )) {
            console.log('Technitium token expired, retrying with fresh token...');

            // Clear cache and get new token
            cachedToken = null;
            const newToken = await getToken(true);

            // Retry the request
            const retryParams = new URLSearchParams({ token: newToken, ...params });
            const retryUrl = `${TECHNITIUM_URL}${endpoint}?${retryParams}`;

            const retryResponse = await fetch(retryUrl);
            const retryData = await retryResponse.json();

            if (retryData.status !== 'ok') {
                throw new Error(`Technitium API error after retry: ${retryData.errorMessage}`);
            }
            return retryData.response;
        }

        if (data.status !== 'ok') {
            throw new Error(`Technitium API error: ${data.errorMessage}`);
        }

        return data.response;
    } catch (error) {
        console.error(`Technitium API call failed for ${endpoint}:`, error);
        throw error;
    }
}

// Zone Management
export async function listZones() {
    return technitiumFetch('/api/zones/list');
}

export async function createZone(zone: string, type: string = 'Primary') {
    return technitiumFetch('/api/zones/create', { zone, type });
}

export async function deleteZone(zone: string) {
    return technitiumFetch('/api/zones/delete', { zone });
}

// Record Management
export async function listRecords(zone: string) {
    return technitiumFetch('/api/zones/records/get', { domain: zone });
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
    value: string
) {
    const params: Record<string, string> = { domain, type };

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
            params.preference = '0'; // Delete requires finding exact record, assuming 0/omitted might work or just value Match
            break;
        case 'TXT':
            params.text = value;
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
