// Cloudflare DNS API Client
// Docs: https://developers.cloudflare.com/api/

const CLOUDFLARE_API_URL = 'https://api.cloudflare.com/client/v4';

interface CloudflareConfig {
    email?: string;
    apiToken?: string;
    apiKey?: string;
}

// Runtime config only - credentials passed from API routes
let runtimeConfig: CloudflareConfig = {};

export function setCloudflareConfig(newConfig: Partial<CloudflareConfig>) {
    runtimeConfig = { ...runtimeConfig, ...newConfig };
}

export function getCloudflareConfig(): CloudflareConfig {
    return runtimeConfig;
}

function validateConfig() {
    if (!runtimeConfig.apiToken && !runtimeConfig.apiKey) {
        throw new Error('Cloudflare API Token or Global API Key is required');
    }
    if (runtimeConfig.apiKey && !runtimeConfig.email) {
        throw new Error('Cloudflare Email is required when using Global API Key');
    }
}

async function cloudflareFetch(endpoint: string, options: RequestInit = {}) {
    validateConfig();

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
    };

    if (runtimeConfig.apiToken) {
        headers['Authorization'] = `Bearer ${runtimeConfig.apiToken}`;
    } else if (runtimeConfig.apiKey && runtimeConfig.email) {
        headers['X-Auth-Email'] = runtimeConfig.email;
        headers['X-Auth-Key'] = runtimeConfig.apiKey;
    }

    const response = await fetch(`${CLOUDFLARE_API_URL}${endpoint}`, {
        ...options,
        headers,
    });

    const data = await response.json();

    if (!data.success) {
        const errorMsg = data.errors?.[0]?.message || 'Unknown Cloudflare error';
        throw new Error(`Cloudflare API error: ${errorMsg}`);
    }

    return data.result;
}

// Zone Management
export async function listZones(): Promise<any[]> {
    const response = await cloudflareFetch('/zones');
    return response;
}

export async function createZone(domain: string): Promise<any> {
    return cloudflareFetch('/zones', {
        method: 'POST',
        body: JSON.stringify({
            name: domain,
            type: 'full', // Full DNS zone
        }),
    });
}

export async function deleteZone(zoneId: string): Promise<any> {
    return cloudflareFetch(`/zones/${zoneId}`, {
        method: 'DELETE',
    });
}

export async function getZoneId(domain: string): Promise<string | null> {
    const zones = await listZones();
    const zone = zones.find((z: any) => z.name === domain);
    return zone?.id || null;
}

// DNS Records
export async function listRecords(zoneId: string): Promise<any[]> {
    const response = await cloudflareFetch(`/zones/${zoneId}/dns_records`);
    return response;
}

export async function createRecord(
    zoneId: string,
    type: string,
    name: string,
    content: string,
    ttl: number = 3600
): Promise<any> {
    return cloudflareFetch(`/zones/${zoneId}/dns_records`, {
        method: 'POST',
        body: JSON.stringify({
            type,
            name,
            content,
            ttl,
            proxied: false, // DNS records should not be proxied for this use case
        }),
    });
}

export async function deleteRecord(zoneId: string, recordId: string): Promise<any> {
    return cloudflareFetch(`/zones/${zoneId}/dns_records/${recordId}`, {
        method: 'DELETE',
    });
}

export async function updateRecord(
    zoneId: string,
    recordId: string,
    type: string,
    name: string,
    content: string,
    ttl: number = 3600
): Promise<any> {
    return cloudflareFetch(`/zones/${zoneId}/dns_records/${recordId}`, {
        method: 'PUT',
        body: JSON.stringify({
            type,
            name,
            content,
            ttl,
            proxied: false,
        }),
    });
}

// Convenience function: Create zone with A and AAAA records
export async function createZoneWithRecords(
    domain: string,
    publicIpv4?: string,
    publicIpv6?: string
): Promise<{ zone: any; records: any[] }> {
    // Create the zone
    const zone = await createZone(domain);
    const zoneId = zone.id;
    const records: any[] = [];

    // Create A record if IPv4 provided
    if (publicIpv4) {
        const aRecord = await createRecord(zoneId, 'A', '@', publicIpv4);
        records.push(aRecord);
    }

    // Create AAAA record if IPv6 provided
    if (publicIpv6) {
        const aaaaRecord = await createRecord(zoneId, 'AAAA', '@', publicIpv6);
        records.push(aaaaRecord);
    }

    return { zone, records };
}

// Test connection
export async function testConnection(): Promise<boolean> {
    try {
        await listZones();
        return true;
    } catch (error) {
        console.error('Cloudflare connection test failed:', error);
        return false;
    }
}