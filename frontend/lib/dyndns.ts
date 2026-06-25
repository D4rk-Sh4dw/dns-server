import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import * as cloudflare from './cloudflare';

const DYNDNS_FILE = '/app/data_mount/dyndns-records.json';
const LOCAL_DYNDNS_FILE = path.resolve(process.cwd(), '..', 'data', 'dyndns-records.json');

export interface DynDnsRecord {
    id: string;
    zone: string;
    name: string; // '@' or subdomain
    type: 'A' | 'AAAA';
    intervalMinutes: number;
    lastIp?: string;
    lastCheckedAt?: string;
    lastError?: string;
    enabled: boolean;
    // Cloudflare credentials snapshot (so updates work even if UI config changes)
    email?: string;
    apiToken?: string;
    apiKey?: string;
    authType?: 'token' | 'key';
}

function getDataPath(): string {
    if (typeof window !== 'undefined') {
        throw new Error('DynDNS storage can only be accessed server-side');
    }
    // Docker environment
    if (existsSync('/app/data_mount')) {
        return DYNDNS_FILE;
    }
    return LOCAL_DYNDNS_FILE;
}

async function ensureDataDir() {
    const filePath = getDataPath();
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
}

function extractFirstJsonValue(raw: string): string | null {
    const trimmed = raw.trimStart();
    if (!trimmed) return null;

    const firstChar = trimmed[0];
    if (firstChar !== '{' && firstChar !== '[') return null;

    const start = raw.length - trimmed.length;
    const expectedClosers: string[] = [];
    let inString = false;
    let escaping = false;

    for (let i = start; i < raw.length; i++) {
        const ch = raw[i];

        if (inString) {
            if (escaping) {
                escaping = false;
                continue;
            }
            if (ch === '\\') {
                escaping = true;
                continue;
            }
            if (ch === '"') {
                inString = false;
            }
            continue;
        }

        if (ch === '"') {
            inString = true;
            continue;
        }

        if (ch === '{') {
            expectedClosers.push('}');
            continue;
        }

        if (ch === '[') {
            expectedClosers.push(']');
            continue;
        }

        if (ch === '}' || ch === ']') {
            const expected = expectedClosers.pop();
            if (expected !== ch) {
                return null;
            }
            if (expectedClosers.length === 0) {
                return raw.slice(start, i + 1);
            }
        }
    }

    return null;
}

function parseDynDnsRecords(raw: string): DynDnsRecord[] | null {
    const parseRecords = (parsed: unknown): DynDnsRecord[] | null => {
        if (Array.isArray(parsed)) {
            return parsed as DynDnsRecord[];
        }
        if (parsed && typeof parsed === 'object' && Array.isArray((parsed as { records?: unknown }).records)) {
            return (parsed as { records: DynDnsRecord[] }).records;
        }
        return [];
    };

    try {
        return parseRecords(JSON.parse(raw));
    } catch {
        const recoveredJson = extractFirstJsonValue(raw);
        if (!recoveredJson) return null;
        try {
            return parseRecords(JSON.parse(recoveredJson));
        } catch {
            return null;
        }
    }
}

export async function loadDynDnsRecords(): Promise<DynDnsRecord[]> {
    const filePath = getDataPath();
    try {
        const raw = await fs.readFile(filePath, 'utf-8');
        const records = parseDynDnsRecords(raw);
        if (records === null) {
            throw new SyntaxError('Could not parse DynDNS records file');
        }

        // If trailing garbage existed, rewrite clean JSON once so future reads stay stable.
        if (records !== null && raw.trim().length > 0) {
            const recoveredJson = extractFirstJsonValue(raw);
            if (recoveredJson && recoveredJson.trim().length !== raw.trim().length) {
                console.warn('[DynDNS] Recovered malformed records file and rewriting sanitized JSON');
                await saveDynDnsRecords(records);
            }
        }

        return records;
    } catch (err: any) {
        if (err.code === 'ENOENT') return [];
        console.error('[DynDNS] Failed to load records:', err);
        return [];
    }
}

async function saveDynDnsRecords(records: DynDnsRecord[]) {
    await ensureDataDir();
    const filePath = getDataPath();
    await fs.writeFile(filePath, JSON.stringify({ records }, null, 2), 'utf-8');
}

export async function getDynDnsRecords(): Promise<DynDnsRecord[]> {
    return loadDynDnsRecords();
}

export async function addDynDnsRecord(record: Omit<DynDnsRecord, 'id'>): Promise<DynDnsRecord> {
    const records = await loadDynDnsRecords();
    const newRecord: DynDnsRecord = {
        ...record,
        id: generateId(),
    };
    records.push(newRecord);
    await saveDynDnsRecords(records);
    return newRecord;
}

export async function updateDynDnsRecord(id: string, updates: Partial<DynDnsRecord>): Promise<DynDnsRecord | null> {
    const records = await loadDynDnsRecords();
    const idx = records.findIndex(r => r.id === id);
    if (idx === -1) return null;
    records[idx] = { ...records[idx], ...updates };
    await saveDynDnsRecords(records);
    return records[idx];
}

export async function deleteDynDnsRecord(id: string): Promise<boolean> {
    const records = await loadDynDnsRecords();
    const filtered = records.filter(r => r.id !== id);
    if (filtered.length === records.length) return false;
    await saveDynDnsRecords(filtered);
    return true;
}

export async function deleteDynDnsRecordsForZone(zone: string): Promise<number> {
    const records = await loadDynDnsRecords();
    const filtered = records.filter(r => r.zone !== zone);
    const removed = records.length - filtered.length;
    if (removed > 0) {
        await saveDynDnsRecords(filtered);
    }
    return removed;
}

function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

// Public IP detection services (IPv4 and IPv6)
const IP_SERVICES: Record<'A' | 'AAAA', string[]> = {
    A: [
        'https://api4.ipify.org?format=json',
        'https://ipv4.icanhazip.com',
        'https://v4.ident.me/.json',
    ],
    AAAA: [
        'https://api6.ipify.org?format=json',
        'https://ipv6.icanhazip.com',
        'https://v6.ident.me/.json',
    ],
};

export async function getPublicIp(type: 'A' | 'AAAA', timeoutMs = 10000): Promise<string | null> {
    const services = IP_SERVICES[type];
    for (const service of services) {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), timeoutMs);
            const res = await fetch(service, { signal: controller.signal });
            clearTimeout(timeout);
            if (!res.ok) continue;
            const text = await res.text();
            // ipify returns {"ip":"x.x.x.x"}, others return plain text
            let ip = text.trim();
            try {
                const json = JSON.parse(text);
                if (json.ip) ip = json.ip;
            } catch {
                // plain text
            }
            if (isValidIp(ip, type)) return ip;
        } catch (err) {
            console.warn(`[DynDNS] IP service failed ${service}:`, err);
        }
    }
    return null;
}

function isValidIp(ip: string, type: 'A' | 'AAAA'): boolean {
    if (!ip || ip.includes('\n') || ip.includes('<')) return false;
    if (type === 'A') {
        return /^\d{1,3}(\.\d{1,3}){3}$/.test(ip) && ip.split('.').every(octet => {
            const n = parseInt(octet, 10);
            return n >= 0 && n <= 255;
        });
    }
    // IPv6: allow compressed forms, require at least one colon
    return /^[0-9a-fA-F:]+$/.test(ip) && ip.includes(':') && !ip.startsWith(':') && !ip.endsWith(':');
}

export async function updateDynDnsRecordIp(record: DynDnsRecord, force = false): Promise<{ updated: boolean; ip: string | null; error?: string }> {
    const ip = await getPublicIp(record.type);
    if (!ip) {
        const error = `Could not detect public ${record.type === 'A' ? 'IPv4' : 'IPv6'}`;
        await updateDynDnsRecord(record.id, { lastError: error, lastCheckedAt: new Date().toISOString() });
        return { updated: false, ip: null, error };
    }

    if (!force && record.lastIp === ip) {
        await updateDynDnsRecord(record.id, { lastCheckedAt: new Date().toISOString(), lastError: undefined });
        return { updated: false, ip };
    }

    try {
        // Set runtime credentials
        cloudflare.setCloudflareConfig({
            email: record.email,
            apiToken: record.authType === 'token' ? record.apiToken : undefined,
            apiKey: record.authType === 'key' ? record.apiKey : undefined,
        });

        const zoneId = await cloudflare.getZoneId(record.zone);
        if (!zoneId) {
            throw new Error(`Zone ${record.zone} not found in Cloudflare`);
        }

        const fullName = record.name === '@' ? record.zone : `${record.name}.${record.zone}`;
        const records = await cloudflare.listRecords(zoneId);
        const existing = records.find((r: any) => r.name === fullName && r.type === record.type);

        if (existing) {
            await cloudflare.updateRecord(zoneId, existing.id, record.type, fullName, ip, 300);
        } else {
            await cloudflare.createRecord(zoneId, record.type, fullName, ip, 300);
        }

        await updateDynDnsRecord(record.id, {
            lastIp: ip,
            lastCheckedAt: new Date().toISOString(),
            lastError: undefined,
        });

        console.log(`[DynDNS] Updated ${record.type} record ${fullName} -> ${ip}`);
        return { updated: true, ip };
    } catch (err) {
        const error = err instanceof Error ? err.message : String(err);
        console.error(`[DynDNS] Failed to update ${record.zone}/${record.name}:`, error);
        await updateDynDnsRecord(record.id, { lastCheckedAt: new Date().toISOString(), lastError: error });
        return { updated: false, ip, error };
    }
}

export async function runDynDnsChecks(force = false): Promise<{ checked: number; updated: number; errors: number }> {
    const records = await loadDynDnsRecords();
    const enabledRecords = records.filter(r => r.enabled);
    let updated = 0;
    let errors = 0;

    for (const record of enabledRecords) {
        try {
            const result = await updateDynDnsRecordIp(record, force);
            if (result.updated) updated++;
            if (result.error) errors++;
        } catch (err) {
            console.error('[DynDNS] Unexpected error during check:', err);
            errors++;
        }
    }

    return { checked: enabledRecords.length, updated, errors };
}
