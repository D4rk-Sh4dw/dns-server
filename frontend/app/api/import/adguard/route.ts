'use server';

import { NextRequest, NextResponse } from 'next/server';
import YAML from 'yaml';

interface AdGuardRewrite {
    domain: string;
    answer: string;
}

interface AdGuardFilter {
    enabled: boolean;
    url: string;
    name: string;
}

interface AdGuardClient {
    name: string;
    ids: string[];
    use_global_settings?: boolean;
    filtering_enabled?: boolean;
    safebrowsing_enabled?: boolean;
    parental_enabled?: boolean;
}

interface ParsedConfig {
    rewrites: AdGuardRewrite[];
    blocklists: AdGuardFilter[];
    whitelists: AdGuardFilter[];
    userRules: string[];
    clients: AdGuardClient[];
}

interface ZoneRecord {
    zone: string;
    subdomain: string;
    type: 'A' | 'AAAA' | 'CNAME';
    value: string;
}

function extractZoneAndSubdomain(domain: string): { zone: string; subdomain: string } {
    const parts = domain.split('.');
    if (parts.length <= 2) {
        return { zone: domain, subdomain: '@' };
    }
    const zone = parts.slice(-2).join('.');
    const subdomain = parts.slice(0, -2).join('.');
    return { zone, subdomain: subdomain || '@' };
}

function determineRecordType(answer: string): 'A' | 'AAAA' | 'CNAME' {
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::$|^([0-9a-fA-F]{1,4}:)*:([0-9a-fA-F]{1,4}:)*[0-9a-fA-F]{1,4}$/;

    if (ipv4Regex.test(answer)) return 'A';
    if (ipv6Regex.test(answer)) return 'AAAA';
    return 'CNAME';
}

function parseConfig(yamlContent: string): ParsedConfig {
    const config = YAML.parse(yamlContent);

    return {
        rewrites: config?.dns?.rewrites || [],
        blocklists: config?.filtering?.filters || [],
        whitelists: config?.filtering?.whitelist_filters || [],
        userRules: config?.filtering?.user_rules || [],
        clients: config?.clients?.persistent || [],
    };
}

function groupRewritesByZone(rewrites: AdGuardRewrite[]): Map<string, ZoneRecord[]> {
    const zones = new Map<string, ZoneRecord[]>();

    for (const rewrite of rewrites) {
        const { zone, subdomain } = extractZoneAndSubdomain(rewrite.domain);
        const type = determineRecordType(rewrite.answer);

        if (!zones.has(zone)) {
            zones.set(zone, []);
        }

        zones.get(zone)!.push({
            zone,
            subdomain,
            type,
            value: rewrite.answer,
        });
    }

    return zones;
}

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const action = formData.get('action') as string;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        const yamlContent = await file.text();
        const parsed = parseConfig(yamlContent);

        // If just parsing (preview mode), return the parsed data
        if (action === 'preview') {
            const zoneMap = groupRewritesByZone(parsed.rewrites);
            const zones: { name: string; records: ZoneRecord[] }[] = [];
            zoneMap.forEach((records, zoneName) => {
                zones.push({ name: zoneName, records });
            });

            return NextResponse.json({
                zones,
                blocklists: parsed.blocklists,
                whitelists: parsed.whitelists,
                userRules: parsed.userRules,
                clients: parsed.clients,
            });
        }

        // Import action - actually create zones/records and push to AdGuard
        const results = {
            zonesCreated: 0,
            recordsCreated: 0,
            blocklistsAdded: 0,
            whitelistsAdded: 0,
            clientsAdded: 0,
            errors: [] as string[],
        };

        // 1. Create Technitium zones and records
        const zoneMap = groupRewritesByZone(parsed.rewrites);

        for (const [zoneName, records] of zoneMap) {
            try {
                // Create zone
                const zoneRes = await fetch(`${process.env.TECHNITIUM_URL || 'http://technitium:5380'}/api/zones/create?token=${process.env.TECHNITIUM_TOKEN}&zone=${zoneName}&type=Primary`, {
                    method: 'GET',
                });
                if (zoneRes.ok) results.zonesCreated++;

                // Create records
                for (const record of records) {
                    const domain = record.subdomain === '@' ? zoneName : `${record.subdomain}.${zoneName}`;
                    const recordRes = await fetch(`${process.env.TECHNITIUM_URL || 'http://technitium:5380'}/api/zones/records/add?token=${process.env.TECHNITIUM_TOKEN}&domain=${domain}&zone=${zoneName}&type=${record.type}&${record.type === 'A' || record.type === 'AAAA' ? 'ipAddress' : 'cname'}=${record.value}`, {
                        method: 'GET',
                    });
                    if (recordRes.ok) results.recordsCreated++;
                }
            } catch (err) {
                results.errors.push(`Failed to create zone ${zoneName}: ${err}`);
            }
        }

        // 2. Add blocklists to AdGuard
        const adguardUrl = process.env.ADGUARD_URL || 'http://adguard:3000';
        const adguardAuth = Buffer.from(`${process.env.ADGUARD_USER || 'admin'}:${process.env.ADGUARD_PASS || 'admin'}`).toString('base64');

        for (const blocklist of parsed.blocklists) {
            try {
                const res = await fetch(`${adguardUrl}/control/filtering/add_url`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Basic ${adguardAuth}`,
                    },
                    body: JSON.stringify({
                        name: blocklist.name,
                        url: blocklist.url,
                        whitelist: false,
                    }),
                });
                if (res.ok) results.blocklistsAdded++;
            } catch (err) {
                results.errors.push(`Failed to add blocklist ${blocklist.name}: ${err}`);
            }
        }

        // 3. Add whitelists to AdGuard
        for (const whitelist of parsed.whitelists) {
            try {
                const res = await fetch(`${adguardUrl}/control/filtering/add_url`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Basic ${adguardAuth}`,
                    },
                    body: JSON.stringify({
                        name: whitelist.name,
                        url: whitelist.url,
                        whitelist: true,
                    }),
                });
                if (res.ok) results.whitelistsAdded++;
            } catch (err) {
                results.errors.push(`Failed to add whitelist ${whitelist.name}: ${err}`);
            }
        }

        // 4. Add user rules to AdGuard
        if (parsed.userRules.length > 0) {
            try {
                await fetch(`${adguardUrl}/control/filtering/set_rules`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Basic ${adguardAuth}`,
                    },
                    body: JSON.stringify({ rules: parsed.userRules }),
                });
            } catch (err) {
                results.errors.push(`Failed to add user rules: ${err}`);
            }
        }

        // 5. Add clients to AdGuard
        for (const client of parsed.clients) {
            try {
                const res = await fetch(`${adguardUrl}/control/clients/add`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Basic ${adguardAuth}`,
                    },
                    body: JSON.stringify({
                        name: client.name,
                        ids: client.ids,
                        use_global_settings: client.use_global_settings ?? true,
                        filtering_enabled: client.filtering_enabled ?? true,
                        safebrowsing_enabled: client.safebrowsing_enabled ?? false,
                        parental_enabled: client.parental_enabled ?? false,
                    }),
                });
                if (res.ok) results.clientsAdded++;
            } catch (err) {
                results.errors.push(`Failed to add client ${client.name}: ${err}`);
            }
        }

        return NextResponse.json(results);

    } catch (error) {
        console.error('Import error:', error);
        return NextResponse.json({ error: 'Failed to parse config' }, { status: 500 });
    }
}
