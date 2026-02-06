/**
 * OPNsense API Client for DHCP Leases
 */

export interface DHCPLease {
    address: string;
    mac: string;
    hostname: string;
    type: 'static' | 'dynamic';
    state?: string;
    descr?: string;
    start?: string;
    end?: string;
}

export interface OPNsenseConfig {
    url: string;
    key: string;
    secret: string;
    backend: 'kea' | 'dnsmasq';
    skip_ssl_verify?: boolean;
}

async function opnsenseFetch(config: OPNsenseConfig, endpoint: string, options: RequestInit = {}) {
    const auth = Buffer.from(`${config.key}:${config.secret}`).toString('base64');
    const url = `${config.url.replace(/\/$/, '')}${endpoint}`;

    // OPNsense often uses self-signed certificates. 
    // Instead of globally disabling SSL verification, we use a custom agent per-request.
    let fetchOptions: RequestInit = {
        ...options,
        headers: {
            'Authorization': `Basic ${auth}`,
            'Accept': 'application/json',
            ...(options.headers || {}),
        },
    };

    // For HTTPS URLs with skip_ssl_verify enabled, use a custom agent
    if (config.skip_ssl_verify && url.startsWith('https://')) {
        // Dynamic import to avoid issues in edge runtime
        const https = await import('https');
        fetchOptions.agent = new https.Agent({
            rejectUnauthorized: false
        });
    }

    const res = await fetch(url, fetchOptions);

    if (!res.ok) {
        const text = await res.text();
        let errorHint = '';
        if (text.includes('tp-link')) {
            errorHint = ' (Warning: Request seems to be hitting a TP-Link device instead of OPNsense!)';
        }
        throw new Error(`OPNsense API error: ${res.status} at ${url}${errorHint} - ${text.substring(0, 200)}`);
    }

    return res.json();
}

/**
 * Fetch DHCPv4 leases based on the configured backend
 */
export async function getDHCPLeases(config: OPNsenseConfig): Promise<DHCPLease[]> {
    // Standard OPNsense MVC search body for grids
    const searchBody = { rowCount: 1000, current: 1, searchPhrase: "" };
    const leases: DHCPLease[] = [];

    if (config.backend === 'kea') {
        const [dynamicRes, staticRes, legacyRes] = await Promise.allSettled([
            opnsenseFetch(config, '/api/kea/leases4/search', {
                method: 'POST',
                body: JSON.stringify(searchBody),
                headers: { 'Content-Type': 'application/json' }
            }),
            opnsenseFetch(config, '/api/kea/dhcpv4/searchSubnetReservations', {
                method: 'POST',
                body: JSON.stringify(searchBody),
                headers: { 'Content-Type': 'application/json' }
            }),
            opnsenseFetch(config, '/api/dhcpv4/static_mappings/search', {
                method: 'POST',
                body: JSON.stringify(searchBody),
                headers: { 'Content-Type': 'application/json' }
            })
        ]);

        if (dynamicRes.status === 'fulfilled' && Array.isArray(dynamicRes.value.rows)) {
            leases.push(...dynamicRes.value.rows.map((row: any) => ({
                address: row.address,
                mac: row.hwaddr,
                hostname: row.hostname || 'Unknown',
                type: 'dynamic' as const,
                state: row.state,
                start: row.cltt,
                end: row.expire
            })));
        }

        if (staticRes.status === 'fulfilled' && Array.isArray(staticRes.value.rows)) {
            leases.push(...staticRes.value.rows.map((row: any) => ({
                address: row.ip_address || row.address,
                mac: row.hwaddr || row.mac,
                hostname: row.hostname || 'Unknown',
                type: 'static' as const,
                descr: row.description || row.descr
            })));
        }

        if (legacyRes.status === 'fulfilled' && Array.isArray(legacyRes.value.rows)) {
            leases.push(...legacyRes.value.rows.map((row: any) => ({
                address: row.ipaddr || row.address,
                mac: row.mac,
                hostname: row.hostname || 'Unknown',
                type: 'static' as const,
                descr: row.descr || row.description
            })));
        }

    } else {
        // Dnsmasq Backend
        const [dynamicRes, staticRes, legacyRes] = await Promise.allSettled([
            opnsenseFetch(config, '/api/dnsmasq/service/search', {
                method: 'POST',
                body: JSON.stringify(searchBody),
                headers: { 'Content-Type': 'application/json' }
            }),
            opnsenseFetch(config, '/api/dnsmasq/service/searchStatic', {
                method: 'POST',
                body: JSON.stringify(searchBody),
                headers: { 'Content-Type': 'application/json' }
            }),
            opnsenseFetch(config, '/api/dhcpv4/static_mappings/search', {
                method: 'POST',
                body: JSON.stringify(searchBody),
                headers: { 'Content-Type': 'application/json' }
            })
        ]);

        if (dynamicRes.status === 'fulfilled' && Array.isArray(dynamicRes.value.rows)) {
            leases.push(...dynamicRes.value.rows.map((row: any) => ({
                address: row.address,
                mac: row.hwaddr,
                hostname: row.hostname || 'Unknown',
                type: 'dynamic' as const,
                descr: row.description
            })));
        }

        if (staticRes.status === 'fulfilled' && Array.isArray(staticRes.value.rows)) {
            leases.push(...staticRes.value.rows.map((row: any) => ({
                address: row.address || row.ip,
                mac: row.hwaddr || row.mac,
                hostname: row.hostname || 'Unknown',
                type: 'static' as const,
                descr: row.description || row.descr
            })));
        }

        if (legacyRes.status === 'fulfilled' && Array.isArray(legacyRes.value.rows)) {
            leases.push(...legacyRes.value.rows.map((row: any) => ({
                address: row.ipaddr || row.address,
                mac: row.mac,
                hostname: row.hostname || 'Unknown',
                type: 'static' as const,
                descr: row.descr || row.description
            })));
        }
    }

    // Deduplicate by IP (prefer dynamic if both exist? actually static is more "correct" for hostnames)
    const uniqueLeases = new Map();
    leases.forEach(l => {
        if (!uniqueLeases.has(l.address) || l.type === 'static') {
            uniqueLeases.set(l.address, l);
        }
    });

    return Array.from(uniqueLeases.values());
}
