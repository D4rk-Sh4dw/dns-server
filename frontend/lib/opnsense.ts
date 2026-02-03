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
    if (typeof process !== 'undefined') {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = config.skip_ssl_verify ? '0' : '1';
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
        throw new Error(`OPNsense API error: ${res.status} - ${text}`);
    }

    return res.json();
}

/**
 * Fetch DHCPv4 leases based on the configured backend
 */
export async function getDHCPLeases(config: OPNsenseConfig): Promise<DHCPLease[]> {
    if (config.backend === 'kea') {
        const data = await opnsenseFetch(config, '/api/kea/leases4/searchLeases');
        // Kea returns an array of lease objects
        if (!data || !Array.isArray(data.rows)) return [];

        return data.rows.map((row: any) => ({
            address: row.address,
            mac: row.hwaddr,
            hostname: row.hostname || 'Unknown',
            type: row.type === 'static' ? 'static' : 'dynamic',
            state: row.state,
            start: row.cltt, // Client Last Transmission Time
            end: row.expire
        }));
    } else {
        // dnsmasq leases
        const data = await opnsenseFetch(config, '/api/dnsmasq/service/searchLeases');
        if (!data || !Array.isArray(data.rows)) return [];

        return data.rows.map((row: any) => ({
            address: row.address,
            mac: row.hwaddr,
            hostname: row.hostname || 'Unknown',
            type: row.type === 'static' ? 'static' : 'dynamic',
            descr: row.description
        }));
    }
}
