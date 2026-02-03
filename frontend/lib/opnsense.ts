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
    // Both Kea and Dnsmasq search endpoints require POST
    if (config.backend === 'kea') {
        const data = await opnsenseFetch(config, '/api/kea/leases4/search', {
            method: 'POST',
            body: JSON.stringify({ rowCount: 1000, current: 1, searchPhrase: "" }),
            headers: { 'Content-Type': 'application/json' }
        });

        if (!data || !Array.isArray(data.rows)) return [];

        return data.rows.map((row: any) => ({
            address: row.address,
            mac: row.hwaddr,
            hostname: row.hostname || 'Unknown',
            type: row.type === 'static' ? 'static' : 'dynamic',
            state: row.state,
            start: row.cltt,
            end: row.expire
        }));
    } else {
        // dnsmasq leases search
        const data = await opnsenseFetch(config, '/api/dnsmasq/service/search', {
            method: 'POST',
            body: JSON.stringify({ rowCount: 1000, current: 1, searchPhrase: "" }),
            headers: { 'Content-Type': 'application/json' }
        });

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
