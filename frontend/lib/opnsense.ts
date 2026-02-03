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

    // OPNsense often uses self-signed certificates. We allow skipping verification if configured.
    if (typeof process !== 'undefined' && config.skip_ssl_verify) {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    } else if (typeof process !== 'undefined') {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '1';
    }

    const res = await fetch(url, {
        ...options,
        headers: {
            'Authorization': `Basic ${auth}`,
            'Accept': 'application/json',
            ...(options.headers || {}),
        },
    });

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

    if (config.backend === 'kea') {
        const [dynamicRes, staticRes] = await Promise.allSettled([
            opnsenseFetch(config, '/api/kea/leases4/search', {
                method: 'POST',
                body: JSON.stringify(searchBody),
                headers: { 'Content-Type': 'application/json' }
            }),
            opnsenseFetch(config, '/api/kea/dhcpv4/searchSubnetReservations', {
                method: 'POST',
                body: JSON.stringify(searchBody),
                headers: { 'Content-Type': 'application/json' }
            })
        ]);

        const leases: DHCPLease[] = [];

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

        return leases;
    } else {
        // dnsmasq leases search (Dynamic)
        const [dynamicRes, staticRes] = await Promise.allSettled([
            opnsenseFetch(config, '/api/dnsmasq/service/search', {
                method: 'POST',
                body: JSON.stringify(searchBody),
                headers: { 'Content-Type': 'application/json' }
            }),
            opnsenseFetch(config, '/api/dnsmasq/service/searchStatic', {
                method: 'POST',
                body: JSON.stringify(searchBody),
                headers: { 'Content-Type': 'application/json' }
            })
        ]);

        const leases: DHCPLease[] = [];

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

        return leases;
    }
}
