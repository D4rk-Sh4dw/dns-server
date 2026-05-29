import { NextResponse } from 'next/server';
import * as adguard from '@/lib/adguard';
import * as technitium from '@/lib/technitium';
import { getDHCPLeases, OPNsenseConfig } from '@/lib/opnsense';
import fs from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

const OPNsense_CONFIG_FILE = '/app/config_mount/opnsense.json';

async function getOPNsenseConfig(): Promise<OPNsenseConfig | null> {
    try {
        const data = await fs.readFile(OPNsense_CONFIG_FILE, 'utf-8');
        const config = JSON.parse(data);
        if (config.url && config.key && config.secret && config.backend) {
            return config as OPNsenseConfig;
        }
        return null;
    } catch {
        return null;
    }
}

// GET /api/topology
// Aggregates DHCP leases and client data from all backends including OPNsense
export async function GET() {
    try {
        // Fetch data from both backends in parallel
        const [adguardDhcp, technitiumLeases, adguardClients, techStats] = await Promise.all([
            adguard.getDhcpStatus().catch(() => null),
            technitium.listDHCPLeases().catch(() => []),
            adguard.getClients().catch(() => null),
            technitium.getStats().catch(() => null),
        ]);

        // Merge devices from all sources
        const devices: Record<string, any> = {};

        // AdGuard DHCP leases
        const adguardLeases = adguardDhcp?.leases || [];
        for (const lease of adguardLeases) {
            const key = lease.mac || lease.ip;
            if (!key) continue;
            devices[key] = {
                id: key,
                name: lease.hostname || lease.clientId || lease.ip,
                ip: lease.ip,
                mac: lease.mac,
                hostname: lease.hostname,
                source: 'adguard-dhcp',
                status: 'online',
                expires: lease.expires,
                type: 'dynamic',
            };
        }

        // AdGuard static leases
        const staticLeases = adguardDhcp?.static_leases || [];
        for (const lease of staticLeases) {
            const key = lease.mac || lease.ip;
            if (!key) continue;
            devices[key] = {
                id: key,
                name: lease.hostname || lease.ip,
                ip: lease.ip,
                mac: lease.mac,
                hostname: lease.hostname,
                source: 'adguard-static',
                status: 'online',
                type: 'static',
            };
        }

        // Technitium DHCP leases
        for (const lease of technitiumLeases) {
            const key = lease.hardwareAddress || lease.ipAddress;
            if (!key) continue;
            const existing = devices[key];
            if (existing) {
                existing.source = 'both';
                existing.name = lease.hostname || existing.name;
                existing.scope = lease.scope;
            } else {
                devices[key] = {
                    id: key,
                    name: lease.hostname || lease.ipAddress,
                    ip: lease.ipAddress,
                    mac: lease.hardwareAddress,
                    hostname: lease.hostname,
                    source: 'technitium-dhcp',
                    status: 'online',
                    scope: lease.scope,
                    type: lease.isReserved ? 'reserved' : 'dynamic',
                };
            }
        }

        // AdGuard configured clients (manual)
        const manualClients = adguardClients?.clients || [];
        for (const client of manualClients) {
            for (const id of client.ids || []) {
                const key = id; // Can be IP or MAC
                const existing = devices[key];
                if (existing) {
                    existing.name = client.name || existing.name;
                    existing.tags = client.tags || [];
                    existing.source = existing.source === 'adguard-dhcp' ? 'adguard-both' : 'adguard-manual';
                    existing.blockedServices = client.blocked_services;
                    existing.filteringEnabled = client.filtering_enabled;
                } else {
                    devices[key] = {
                        id: key,
                        name: client.name || id,
                        ip: id.includes('.') ? id : undefined,
                        mac: id.includes(':') ? id : undefined,
                        source: 'adguard-manual',
                        status: 'unknown',
                        tags: client.tags || [],
                        type: 'manual',
                        blockedServices: client.blocked_services,
                        filteringEnabled: client.filtering_enabled,
                    };
                }
            }
        }

        // AdGuard auto clients (discovered)
        const autoClients = adguardClients?.auto_clients || [];
        for (const client of autoClients) {
            const key = client.ip;
            if (!key) continue;
            const existing = devices[key];
            if (existing) {
                existing.name = client.name || existing.name;
                existing.status = 'online';
            } else {
                devices[key] = {
                    id: key,
                    name: client.name || client.ip,
                    ip: client.ip,
                    source: 'adguard-auto',
                    status: 'online',
                    type: 'discovered',
                };
            }
        }

        // OPNsense DHCP leases (if configured)
        const opnsenseConfig = await getOPNsenseConfig();
        if (opnsenseConfig) {
            try {
                const opnsenseLeases = await getDHCPLeases(opnsenseConfig);
                for (const lease of opnsenseLeases) {
                    const key = lease.mac || lease.address;
                    if (!key) continue;
                    const existing = devices[key];
                    if (existing) {
                        existing.source = existing.source?.startsWith('adguard') || existing.source?.startsWith('technitium')
                            ? 'both'
                            : 'opnsense';
                        existing.name = lease.hostname || existing.name;
                        existing.ip = lease.address || existing.ip;
                        existing.mac = lease.mac || existing.mac;
                        existing.hostname = lease.hostname || existing.hostname;
                        existing.status = 'online';
                        existing.type = lease.type || existing.type;
                        existing.descr = lease.descr;
                    } else {
                        devices[key] = {
                            id: key,
                            name: lease.hostname || lease.address,
                            ip: lease.address,
                            mac: lease.mac,
                            hostname: lease.hostname,
                            source: 'opnsense',
                            status: 'online',
                            type: lease.type || 'dynamic',
                            descr: lease.descr,
                        };
                    }
                }
            } catch (e) {
                console.warn('OPNsense topology fetch failed:', e);
            }
        }

        // Convert to array
        const deviceList = Object.values(devices);

        // Calculate simple stats
        const stats = {
            totalDevices: deviceList.length,
            onlineDevices: deviceList.filter((d: any) => d.status === 'online').length,
            dhcpDevices: deviceList.filter((d: any) => d.source?.includes('dhcp')).length,
            manualDevices: deviceList.filter((d: any) => d.source?.includes('manual')).length,
            totalQueries: techStats?.totalQueries || 0,
            totalBlocked: techStats?.totalBlocked || 0,
        };

        return NextResponse.json({
            devices: deviceList,
            stats,
        });
    } catch (error) {
        console.error('Topology API error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to fetch topology' },
            { status: 500 }
        );
    }
}
