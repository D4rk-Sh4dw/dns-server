'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Plus, RefreshCw, Trash2, Check, AlertCircle, Edit2, Search, Cloud, Globe } from 'lucide-react';
import Link from 'next/link';
import PageLayout, { PageHeader } from '../../components/PageLayout';

interface DnsRecord {
    name: string;
    type: string;
    ttl: number;
    rData: {
        ipAddress?: string;
        cname?: string;
        text?: string;
        exchange?: string;
        preference?: number;
        target?: string;
        priority?: number;
        weight?: number;
        port?: number;
        value?: string;
    };
    disabled: boolean;
}

const RECORD_TYPES = ['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'SRV', 'NS', 'CAA', 'PTR'];

export default function ZoneDetailPage() {
    const params = useParams();
    const router = useRouter();
    const zone = decodeURIComponent(params.zone as string);

    const [records, setRecords] = useState<DnsRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newRecord, setNewRecord] = useState({
        name: '',
        type: 'A',
        value: '',
        ttl: 3600,
        priority: 10,
        weight: 0,
        port: 0,
        // Cloudflare sync fields
        pushToCloudflare: false,
        cloudflareValue: '', // Separate value for Cloudflare (IP, hostname, TXT, etc.)
    });

    useEffect(() => {
        if (zone.endsWith('.in-addr.arpa')) {
            setNewRecord(prev => ({ ...prev, type: 'PTR' }));
        }
    }, [zone]);
    const [isEditing, setIsEditing] = useState(false);
    const [originalRecord, setOriginalRecord] = useState<DnsRecord | null>(null);

    const [searchQuery, setSearchQuery] = useState('');

    // Cloudflare state
    const [cfConfig, setCfConfig] = useState<{ email?: string; apiToken?: string; apiKey?: string; authType?: 'token' | 'key' } | null>(null);
    const [cfRecords, setCfRecords] = useState<any[]>([]);
    const [cfLoading, setCfLoading] = useState(false);

    // Load CF config from server (with localStorage fallback)
    useEffect(() => {
        fetch('/api/system/cloudflare-config')
            .then(r => r.json())
            .then(data => {
                if (data && !data.error && (data.apiToken || data.apiKey)) {
                    setCfConfig(data);
                    localStorage.setItem('cloudflare_config', JSON.stringify(data));
                } else {
                    const raw = localStorage.getItem('cloudflare_config');
                    if (raw) setCfConfig(JSON.parse(raw));
                }
            })
            .catch(() => {
                const raw = localStorage.getItem('cloudflare_config');
                if (raw) try { setCfConfig(JSON.parse(raw)); } catch (e) { }
            });
    }, []);

    // Fetch Cloudflare records for this zone
    const fetchCfRecords = async () => {
        if (!cfConfig || (!cfConfig.apiToken && !cfConfig.apiKey)) return;
        setCfLoading(true);
        try {
            const creds = {
                email: cfConfig.email,
                apiToken: cfConfig.authType === 'token' ? cfConfig.apiToken : undefined,
                apiKey: cfConfig.authType === 'key' ? cfConfig.apiKey : undefined,
            };
            const qs = new URLSearchParams();
            if (creds.email) qs.set('email', creds.email);
            if (creds.apiToken) qs.set('apiToken', creds.apiToken);
            if (creds.apiKey) qs.set('apiKey', creds.apiKey);

            // First get zone ID
            const zoneRes = await fetch(`/api/cloudflare/zones?${qs}`);
            const zoneData = await zoneRes.json();
            const cfZone = Array.isArray(zoneData) ? zoneData.find((z: any) => z.name === zone) : null;

            if (cfZone) {
                const recRes = await fetch(`/api/cloudflare/records?zoneId=${cfZone.id}&${qs}`);
                const recData = await recRes.json();
                setCfRecords(Array.isArray(recData) ? recData : []);
            } else {
                setCfRecords([]);
            }
        } catch (e) {
            console.error('Failed to fetch CF records:', e);
            setCfRecords([]);
        } finally {
            setCfLoading(false);
        }
    };

    useEffect(() => {
        if (cfConfig) fetchCfRecords();
    }, [cfConfig, zone]);

    // Check if a record is synced to Cloudflare
    const isRecordSynced = (record: DnsRecord): boolean => {
        const shortName = record.name === zone || record.name === `${zone}.` ? '@' : record.name.replace(`.${zone}`, '');
        return cfRecords.some(r => {
            const rShort = r.name === zone || r.name === `${zone}.` ? '@' : r.name.replace(`.${zone}`, '');
            return rShort === shortName && r.type === record.type;
        });
    };

    const getRecordValue = (record: DnsRecord): string => {
        const rd = record.rData;
        if (!rd) return '';
        if (rd.ipAddress) return rd.ipAddress;
        if (rd.cname) return rd.cname;
        if (rd.text) return `"${rd.text}"`;
        if (rd.exchange) return `${rd.preference} ${rd.exchange}`;
        if (rd.target) return `${rd.priority} ${rd.weight} ${rd.port} ${rd.target}`;
        return JSON.stringify(rd);
    };

    const filteredRecords = useMemo(() => {
        if (!searchQuery.trim()) return records;
        const lowerQuery = searchQuery.toLowerCase();
        return records.filter(record => {
            const val = getRecordValue(record);
            return (
                (record.name && record.name.toLowerCase().includes(lowerQuery)) ||
                (record.type && record.type.toLowerCase().includes(lowerQuery)) ||
                (val && String(val).toLowerCase().includes(lowerQuery))
            );
        });
    }, [records, searchQuery]);

    const fetchRecords = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/technitium/records?zone=${encodeURIComponent(zone)}`);
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to fetch records');
            }

            console.log('Fetched records:', data);
            setRecords(data.records || []);
        } catch (err) {
            console.error('Failed to fetch records:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch records');
        }
        setLoading(false);
    };

    useEffect(() => { fetchRecords(); }, [zone]);

    const [error, setError] = useState<string | null>(null); // New state for errors

    const handleAddRecord = async () => {
        const domain = (newRecord.name === '@' || !newRecord.name) ? zone : `${newRecord.name}.${zone}`;
        setError(null); // Clear previous errors

        // If editing, delete original record first
        if (isEditing && originalRecord) {
            try {
                await handleDeleteRecord(originalRecord, true); // Pass true to skip confirm and refetch
            } catch (err) {
                setError('Failed to update record: Could not delete original record');
                return;
            }
        }

        const options: Record<string, string> = {};
        if (newRecord.type === 'MX') options.preference = newRecord.priority.toString();
        if (newRecord.type === 'SRV') {
            options.priority = newRecord.priority.toString();
            options.weight = newRecord.weight.toString();
            options.port = newRecord.port.toString();
        }

        try {
            const res = await fetch('/api/technitium/records', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'add',
                    domain,
                    type: newRecord.type,
                    value: newRecord.value,
                    ttl: newRecord.ttl,
                    options,
                }),
            });

            const data = await res.json();

            if (!res.ok || data.error) {
                throw new Error(data.error || 'Failed to add record');
            }

            // Push to Cloudflare if enabled (for all record types)
            if (newRecord.pushToCloudflare && newRecord.cloudflareValue) {
                try {
                    const cfConfig = localStorage.getItem('cloudflare_config');
                    if (cfConfig) {
                        const cf = JSON.parse(cfConfig);
                        if (cf.apiToken || cf.apiKey) {
                            // Get zone ID from Cloudflare
                            const zoneRes = await fetch('/api/cloudflare/zones', {
                                method: 'GET',
                                headers: { 
                                    'Content-Type': 'application/json',
                                },
                            });
                            const cfZones = await zoneRes.json();
                            const cfZone = cfZones.find((z: any) => z.name === zone);
                            
                            if (cfZone) {
                                // Create the record in Cloudflare
                                await fetch('/api/cloudflare/records', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        action: 'create',
                                        zoneId: cfZone.id,
                                        type: newRecord.type,
                                        name: newRecord.name === '@' || !newRecord.name ? zone : `${newRecord.name}.${zone}`,
                                        content: newRecord.cloudflareValue,
                                        ttl: newRecord.ttl,
                                        email: cf.authType === 'key' ? cf.email : undefined,
                                        apiToken: cf.authType === 'token' ? cf.apiToken : undefined,
                                        apiKey: cf.authType === 'key' ? cf.apiKey : undefined,
                                    }),
                                });
                            }
                        }
                    }
                } catch (cfErr) {
                    console.error('Failed to push record to Cloudflare:', cfErr);
                }
            }

            setNewRecord({ name: '', type: 'A', value: '', ttl: 3600, priority: 10, weight: 0, port: 0, pushToCloudflare: false, cloudflareValue: '' });
            setShowAddModal(false);
            setIsEditing(false);
            setOriginalRecord(null);
            await fetchRecords();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        }
    };

    const handleEditRecord = (record: DnsRecord) => {
        setOriginalRecord(record);
        setIsEditing(true);

        // Parse values from record
        const rd = record.rData;
        let value = '';
        if (rd.ipAddress) value = rd.ipAddress;
        else if (rd.cname) value = rd.cname;
        else if (rd.text) value = rd.text;
        else if (rd.exchange) value = rd.exchange;
        else if (rd.target) value = rd.target;

        // Check if synced to Cloudflare and get CF value
        const shortName = record.name === zone || record.name === `${zone}.` ? '@' : record.name.replace(`.${zone}`, '');
        const cfRec = cfRecords.find(r => {
            const rShort = r.name === zone || r.name === `${zone}.` ? '@' : r.name.replace(`.${zone}`, '');
            return rShort === shortName && r.type === record.type;
        });

        setNewRecord({
            name: shortName,
            type: record.type,
            value,
            ttl: record.ttl,
            priority: rd.preference || rd.priority || 10,
            weight: rd.weight || 0,
            port: rd.port || 0,
            pushToCloudflare: !!cfRec,
            cloudflareValue: cfRec?.content || ''
        });

        setShowAddModal(true);
    };

    const handleDeleteRecord = async (record: DnsRecord, skipConfirm = false) => {
        if (!skipConfirm && !confirm(`Delete ${record.type} record for ${record.name}?`)) return;

        let value = '';
        const rd = record.rData;
        if (rd.ipAddress) value = rd.ipAddress;
        else if (rd.cname) value = rd.cname;
        else if (rd.text) value = rd.text;
        else if (rd.exchange) value = rd.exchange;
        else if (rd.target) value = rd.target;

        const options: Record<string, string> = {};
        if (record.type === 'MX') options.preference = (rd.preference || 0).toString();
        if (record.type === 'SRV') {
            options.priority = (rd.priority || 0).toString();
            options.weight = (rd.weight || 0).toString();
            options.port = (rd.port || 0).toString();
        }

        await fetch('/api/technitium/records', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'delete',
                domain: record.name,
                type: record.type,
                value,
                options,
            }),
        });

        if (!skipConfirm) await fetchRecords();
    };


    return (
        <PageLayout
            header={
                <PageHeader
                    icon={<Globe className="text-blue-400" size={22} />}
                    title={zone}
                    subtitle="Manage DNS records"
                    actions={
                        <>
                            <Link href="/zones" className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white" title="Back to zones">
                                <ArrowLeft size={20} />
                            </Link>
                            <div className="relative group hidden sm:block">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Search size={16} className="text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                                </div>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search records, IPs..."
                                    className="bg-gray-800 border border-gray-700 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5 transition-all sm:w-64"
                                />
                            </div>
                            <button
                                onClick={fetchRecords}
                                className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors flex justify-center items-center"
                            >
                                <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                            </button>
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap"
                            >
                                <Plus size={18} />
                                Add Record
                            </button>
                        </>
                    }
                />
            }
        >
            <div className="space-y-6 md:space-y-8">

            {/* Mobile search */}
            <div className="sm:hidden relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search records, IPs..."
                    className="w-full bg-gray-800 border border-gray-700 text-white text-sm rounded-lg pl-10 pr-4 p-2.5"
                />
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-950/50">
                        <tr>
                            <th className="px-6 py-4">Name</th>
                            <th className="px-6 py-4">Type</th>
                            <th className="px-6 py-4">Value</th>
                            <th className="px-6 py-4">TTL</th>
                            <th className="px-6 py-4 text-center">Cloudflare</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {filteredRecords.map((record, idx) => (
                            <tr key={idx} className="group hover:bg-gray-800/50 transition-colors">
                                <td className="px-6 py-4 text-white font-mono text-sm">{record.name}</td>
                                <td className="px-6 py-4">
                                    <span className={`text-xs font-medium px-2 py-1 rounded ${record.type === 'A' ? 'bg-blue-500/20 text-blue-400' :
                                        record.type === 'AAAA' ? 'bg-purple-500/20 text-purple-400' :
                                            record.type === 'CNAME' ? 'bg-green-500/20 text-green-400' :
                                                record.type === 'MX' ? 'bg-orange-500/20 text-orange-400' :
                                                    record.type === 'TXT' ? 'bg-yellow-500/20 text-yellow-400' :
                                                        'bg-gray-500/20 text-gray-400'
                                        }`}>
                                        {record.type}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-gray-400 font-mono text-sm truncate max-w-md">
                                    {getRecordValue(record)}
                                </td>
                                <td className="px-6 py-4 text-gray-500 text-sm">{record.ttl}s</td>
                                <td className="px-6 py-4 text-center">
                                    {isRecordSynced(record) ? (
                                        <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-orange-500/20 text-orange-400">
                                            <Cloud size={12} /> Synced
                                        </span>
                                    ) : (
                                        <span className="text-xs text-gray-600">Internal only</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right flex justify-end gap-2">
                                    <button
                                        onClick={() => handleEditRecord(record)}
                                        className="text-blue-400 hover:text-blue-300 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteRecord(record)}
                                        className="text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {!filteredRecords.length && !loading && (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                    {searchQuery ? 'No records match your search.' : 'No records in this zone. Click "Add Record" to get started.'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Add/Edit Record Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <h3 className="text-lg font-medium text-white mb-4">
                            {isEditing ? 'Edit DNS Record' : 'Add DNS Record'}
                        </h3>

                        {error && (
                            <div className="mb-4 bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-start gap-2">
                                <AlertCircle className="text-red-400 flex-shrink-0 mt-0.5" size={16} />
                                <p className="text-red-400 text-sm">{error}</p>
                            </div>
                        )}

                        {/* Technitium Section */}
                        <div className="bg-blue-900/10 border border-blue-800/50 rounded-lg p-4 mb-4">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                <h4 className="text-blue-400 font-medium">Technitium (Internal)</h4>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-1">
                                            {zone.endsWith('.in-addr.arpa') ? 'Last IP octet' : 'Name (subdomain)'}
                                        </label>
                                        <input
                                            type="text"
                                            value={newRecord.name}
                                            onChange={(e) => setNewRecord(prev => ({ ...prev, name: e.target.value }))}
                                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                                            placeholder={zone.endsWith('.in-addr.arpa') ? 'e.g. 50' : '@ for root, or subdomain'}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-1">Type</label>
                                        <select
                                            value={newRecord.type}
                                            onChange={(e) => setNewRecord(prev => ({ ...prev, type: e.target.value }))}
                                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                                            disabled={isEditing}
                                        >
                                            {RECORD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">
                                        {newRecord.type === 'A' || newRecord.type === 'AAAA' ? 'IP Address' :
                                            newRecord.type === 'CNAME' || newRecord.type === 'NS' ? 'Target' :
                                                newRecord.type === 'MX' ? 'Mail Server' :
                                                    newRecord.type === 'TXT' ? 'Text Value' :
                                                        newRecord.type === 'SRV' ? 'Target Host' : 'Value'}
                                    </label>
                                    <input
                                        type="text"
                                        value={newRecord.value}
                                        onChange={(e) => setNewRecord(prev => ({ ...prev, value: e.target.value }))}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                                        placeholder={
                                            newRecord.type === 'A' ? '192.168.1.100' :
                                                newRecord.type === 'AAAA' ? '2001:db8::1' :
                                                    newRecord.type === 'CNAME' ? 'target.example.com' :
                                                        newRecord.type === 'MX' ? 'mail.example.com' :
                                                            newRecord.type === 'TXT' ? 'v=spf1 include:...' : ''
                                        }
                                    />
                                </div>
                                {(newRecord.type === 'MX' || newRecord.type === 'SRV') && (
                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-400 mb-1">Priority</label>
                                            <input
                                                type="number"
                                                value={newRecord.priority}
                                                onChange={(e) => setNewRecord(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
                                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                                            />
                                        </div>
                                        {newRecord.type === 'SRV' && (
                                            <>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-400 mb-1">Weight</label>
                                                    <input
                                                        type="number"
                                                        value={newRecord.weight}
                                                        onChange={(e) => setNewRecord(prev => ({ ...prev, weight: parseInt(e.target.value) }))}
                                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-400 mb-1">Port</label>
                                                    <input
                                                        type="number"
                                                        value={newRecord.port}
                                                        onChange={(e) => setNewRecord(prev => ({ ...prev, port: parseInt(e.target.value) }))}
                                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                                                    />
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">TTL (seconds)</label>
                                    <input
                                        type="number"
                                        value={newRecord.ttl}
                                        onChange={(e) => setNewRecord(prev => ({ ...prev, ttl: parseInt(e.target.value) }))}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Cloudflare Section */}
                        <div className={`border rounded-lg p-4 ${newRecord.pushToCloudflare ? 'bg-orange-900/10 border-orange-800/50' : 'bg-gray-800/30 border-gray-700 border-dashed'}`}>
                            <label className="flex items-center gap-3 cursor-pointer mb-4">
                                <input
                                    type="checkbox"
                                    checked={newRecord.pushToCloudflare}
                                    onChange={(e) => setNewRecord(prev => ({ ...prev, pushToCloudflare: e.target.checked }))}
                                    className="w-5 h-5 rounded bg-gray-800 border-gray-700 text-orange-500 focus:ring-orange-500"
                                />
                                <div className="flex items-center gap-2">
                                    <Cloud size={18} className="text-orange-400" />
                                    <span className="text-white font-medium">Sync to Cloudflare</span>
                                </div>
                            </label>

                            {newRecord.pushToCloudflare && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-1">
                                            {newRecord.type === 'A' ? 'Public IPv4' : 
                                             newRecord.type === 'AAAA' ? 'Public IPv6' :
                                             newRecord.type === 'CNAME' || newRecord.type === 'NS' ? 'Target Hostname' :
                                             newRecord.type === 'MX' ? 'Mail Server' :
                                             newRecord.type === 'TXT' ? 'TXT Value' :
                                             newRecord.type === 'SRV' ? 'Target Hostname' :
                                             newRecord.type === 'CAA' ? 'CAA Value' :
                                             newRecord.type === 'PTR' ? 'PTR Target' : 'Value'} for Cloudflare
                                        </label>
                                        <input
                                            type="text"
                                            value={newRecord.cloudflareValue}
                                            onChange={(e) => setNewRecord(prev => ({ ...prev, cloudflareValue: e.target.value }))}
                                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-orange-500"
                                            placeholder={
                                                newRecord.type === 'A' ? 'e.g. 203.0.113.10' :
                                                newRecord.type === 'AAAA' ? 'e.g. 2001:db8::1' :
                                                newRecord.type === 'CNAME' ? 'e.g. target.example.com' :
                                                newRecord.type === 'MX' ? 'e.g. mail.example.com' :
                                                newRecord.type === 'TXT' ? 'e.g. v=spf1 include:_spf.google.com ~all' :
                                                newRecord.type === 'NS' ? 'e.g. ns1.cloudflare.com' :
                                                newRecord.type === 'SRV' ? 'e.g. target.example.com' :
                                                newRecord.type === 'CAA' ? 'e.g. 0 issue "letsencrypt.org"' :
                                                newRecord.type === 'PTR' ? 'e.g. hostname.example.com' : ''
                                            }
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            This value will be used for the record in Cloudflare (different from Technitium internal value).
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => {
                                    setShowAddModal(false);
                                    setIsEditing(false);
                                    setOriginalRecord(null);
                                    setNewRecord({ name: '', type: 'A', value: '', ttl: 3600, priority: 10, weight: 0, port: 0, pushToCloudflare: false, cloudflareValue: '' });
                                }}
                                className="px-4 py-2 text-gray-400 hover:text-white"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddRecord}
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium"
                            >
                                <Check size={18} />
                                {isEditing ? 'Save Changes' : 'Add Record'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            </div>
        </PageLayout>
    );
}
