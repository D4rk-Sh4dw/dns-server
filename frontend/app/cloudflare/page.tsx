'use client';

import { useEffect, useState, useMemo } from 'react';
import { Cloud, RefreshCw, Trash2, Plus, Edit2, AlertCircle, Check, Search, ArrowLeft, ExternalLink } from 'lucide-react';

interface CloudflareConfig {
    email?: string;
    apiToken?: string;
    apiKey?: string;
    authType?: 'token' | 'key';
}

interface CloudflareZone {
    id: string;
    name: string;
    status: string;
    name_servers?: string[];
    plan?: { name?: string };
    created_on?: string;
    modified_on?: string;
}

interface CloudflareRecord {
    id: string;
    zone_id: string;
    zone_name: string;
    name: string;
    type: string;
    content: string;
    ttl: number;
    proxied?: boolean;
    priority?: number;
    created_on?: string;
    modified_on?: string;
}

const RECORD_TYPES = ['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'SRV', 'CAA', 'PTR'];

export default function CloudflarePage() {
    const [config, setConfig] = useState<CloudflareConfig | null>(null);
    const [zones, setZones] = useState<CloudflareZone[]>([]);
    const [selectedZone, setSelectedZone] = useState<CloudflareZone | null>(null);
    const [records, setRecords] = useState<CloudflareRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [search, setSearch] = useState('');

    const [showRecordModal, setShowRecordModal] = useState(false);
    const [editingRecord, setEditingRecord] = useState<CloudflareRecord | null>(null);
    const [recordForm, setRecordForm] = useState({
        type: 'A',
        name: '@',
        content: '',
        ttl: 3600,
        priority: 10,
    });

    // Load CF config from server (with localStorage fallback)
    useEffect(() => {
        fetch('/api/system/cloudflare-config')
            .then(r => r.json())
            .then(data => {
                if (data && !data.error && (data.apiToken || data.apiKey)) {
                    setConfig(data);
                    localStorage.setItem('cloudflare_config', JSON.stringify(data));
                } else {
                    const raw = localStorage.getItem('cloudflare_config');
                    if (raw) try { setConfig(JSON.parse(raw)); } catch (e) { }
                }
            })
            .catch(() => {
                const raw = localStorage.getItem('cloudflare_config');
                if (raw) try { setConfig(JSON.parse(raw)); } catch (e) { }
            });
    }, []);

    const credPayload = useMemo(() => {
        if (!config) return {};
        return {
            email: config.email,
            apiToken: config.authType === 'token' ? config.apiToken : undefined,
            apiKey: config.authType === 'key' ? config.apiKey : undefined,
        };
    }, [config]);

    const buildCredQuery = () => {
        const q = new URLSearchParams();
        if (credPayload.email) q.set('email', credPayload.email);
        if (credPayload.apiToken) q.set('apiToken', credPayload.apiToken);
        if (credPayload.apiKey) q.set('apiKey', credPayload.apiKey);
        return q.toString();
    };

    const fetchZones = async () => {
        if (!config) return;
        setLoading(true);
        setError(null);
        try {
            const qs = buildCredQuery();
            const res = await fetch(`/api/cloudflare/zones?${qs}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to fetch zones');
            setZones(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch zones');
        } finally {
            setLoading(false);
        }
    };

    const fetchRecords = async (zone: CloudflareZone) => {
        if (!config) return;
        setLoading(true);
        setError(null);
        try {
            const qs = buildCredQuery();
            const res = await fetch(`/api/cloudflare/records?zoneId=${zone.id}&${qs}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to fetch records');
            setRecords(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch records');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (config) fetchZones();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [config]);

    useEffect(() => {
        if (selectedZone) fetchRecords(selectedZone);
        else setRecords([]);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedZone]);

    const handleDeleteZone = async (zone: CloudflareZone) => {
        if (!confirm(`Delete zone "${zone.name}" from Cloudflare? This cannot be undone.`)) return;
        setError(null);
        setSuccess(null);
        try {
            const res = await fetch('/api/cloudflare/zones', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'delete', zone: zone.name, ...credPayload }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to delete zone');
            setSuccess(`Zone "${zone.name}" deleted`);
            if (selectedZone?.id === zone.id) setSelectedZone(null);
            await fetchZones();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete zone');
        }
    };

    const openAddRecord = () => {
        setEditingRecord(null);
        setRecordForm({ type: 'A', name: '@', content: '', ttl: 3600, priority: 10 });
        setShowRecordModal(true);
    };

    const openEditRecord = (rec: CloudflareRecord) => {
        setEditingRecord(rec);
        const short = selectedZone
            ? rec.name === selectedZone.name
                ? '@'
                : rec.name.replace(`.${selectedZone.name}`, '')
            : rec.name;
        setRecordForm({
            type: rec.type,
            name: short,
            content: rec.content,
            ttl: rec.ttl,
            priority: rec.priority || 10,
        });
        setShowRecordModal(true);
    };

    const saveRecord = async () => {
        if (!selectedZone) return;
        setError(null);
        setSuccess(null);
        try {
            // Cloudflare expects the full name OR '@' for root
            const fullName =
                recordForm.name === '@' || recordForm.name === ''
                    ? selectedZone.name
                    : recordForm.name.endsWith(selectedZone.name)
                        ? recordForm.name
                        : `${recordForm.name}.${selectedZone.name}`;

            // For MX, prefix priority into content if needed - CF API uses separate field
            // We use the standard create/update endpoints that already accept the basic shape

            const body: any = {
                action: editingRecord ? 'update' : 'create',
                zoneId: selectedZone.id,
                type: recordForm.type,
                name: fullName,
                content: recordForm.content,
                ttl: recordForm.ttl,
                ...credPayload,
            };
            if (editingRecord) body.recordId = editingRecord.id;

            const res = await fetch('/api/cloudflare/records', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to save record');
            setSuccess(editingRecord ? 'Record updated' : 'Record created');
            setShowRecordModal(false);
            await fetchRecords(selectedZone);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save record');
        }
    };

    const deleteRecord = async (rec: CloudflareRecord) => {
        if (!selectedZone) return;
        if (!confirm(`Delete ${rec.type} record "${rec.name}"?`)) return;
        setError(null);
        setSuccess(null);
        try {
            const res = await fetch('/api/cloudflare/records', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'delete',
                    zoneId: selectedZone.id,
                    recordId: rec.id,
                    ...credPayload,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to delete record');
            setSuccess('Record deleted');
            await fetchRecords(selectedZone);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete record');
        }
    };

    const filteredZones = useMemo(() => {
        if (!search.trim()) return zones;
        const q = search.toLowerCase();
        return zones.filter(z => z.name.toLowerCase().includes(q));
    }, [zones, search]);

    const filteredRecords = useMemo(() => {
        if (!search.trim()) return records;
        const q = search.toLowerCase();
        return records.filter(
            r =>
                r.name.toLowerCase().includes(q) ||
                r.type.toLowerCase().includes(q) ||
                r.content.toLowerCase().includes(q)
        );
    }, [records, search]);

    if (!config || (!config.apiToken && !config.apiKey)) {
        return (
            <div className="p-8 max-w-3xl mx-auto">
                <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-6 text-yellow-200 flex items-start gap-3">
                    <AlertCircle className="flex-shrink-0 mt-1" />
                    <div>
                        <h3 className="font-semibold text-lg mb-2">Cloudflare not configured</h3>
                        <p>
                            Please configure your Cloudflare API credentials in{' '}
                            <a href="/settings" className="underline text-yellow-100">Settings</a> first.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 lg:p-8 max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
                <div className="flex items-center gap-3">
                    <Cloud className="text-orange-400" size={28} />
                    <h1 className="text-2xl font-bold text-white">Cloudflare DNS</h1>
                </div>
                <button
                    onClick={() => (selectedZone ? fetchRecords(selectedZone) : fetchZones())}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white text-sm"
                >
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    Refresh
                </button>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-900/40 border border-red-700 rounded-lg text-red-200 flex items-center gap-2">
                    <AlertCircle size={18} /> {error}
                </div>
            )}
            {success && (
                <div className="mb-4 p-3 bg-green-900/40 border border-green-700 rounded-lg text-green-200 flex items-center gap-2">
                    <Check size={18} /> {success}
                </div>
            )}

            <div className="mb-4 relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder={selectedZone ? 'Search records...' : 'Search zones...'}
                    className="w-full pl-9 pr-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-white placeholder-gray-500"
                />
            </div>

            {!selectedZone ? (
                /* ZONE LIST */
                <div className="bg-gray-950 border border-gray-900 rounded-lg overflow-hidden">
                    {filteredZones.length === 0 && !loading ? (
                        <div className="p-8 text-center text-gray-500">No zones found in your Cloudflare account.</div>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-gray-900 text-xs uppercase text-gray-400">
                                <tr>
                                    <th className="text-left px-4 py-3">Zone</th>
                                    <th className="text-left px-4 py-3">Status</th>
                                    <th className="text-left px-4 py-3 hidden md:table-cell">Plan</th>
                                    <th className="text-left px-4 py-3 hidden lg:table-cell">Nameservers</th>
                                    <th className="text-right px-4 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredZones.map(z => (
                                    <tr key={z.id} className="border-t border-gray-900 hover:bg-gray-900/50">
                                        <td className="px-4 py-3 text-white font-medium">
                                            <button onClick={() => setSelectedZone(z)} className="hover:text-orange-400">
                                                {z.name}
                                            </button>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`text-xs px-2 py-0.5 rounded-full ${
                                                    z.status === 'active'
                                                        ? 'bg-green-900/50 text-green-300'
                                                        : 'bg-yellow-900/50 text-yellow-300'
                                                }`}
                                            >
                                                {z.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-400 hidden md:table-cell">{z.plan?.name || '-'}</td>
                                        <td className="px-4 py-3 text-gray-400 text-xs hidden lg:table-cell">
                                            {z.name_servers?.join(', ') || '-'}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button
                                                onClick={() => setSelectedZone(z)}
                                                className="inline-flex items-center gap-1 px-2 py-1 text-xs text-blue-300 hover:bg-blue-900/30 rounded mr-1"
                                            >
                                                <ExternalLink size={12} /> Manage
                                            </button>
                                            <button
                                                onClick={() => handleDeleteZone(z)}
                                                className="inline-flex items-center gap-1 px-2 py-1 text-xs text-red-300 hover:bg-red-900/30 rounded"
                                            >
                                                <Trash2 size={12} /> Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            ) : (
                /* RECORDS VIEW */
                <div>
                    <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                        <button
                            onClick={() => setSelectedZone(null)}
                            className="flex items-center gap-2 text-gray-400 hover:text-white text-sm"
                        >
                            <ArrowLeft size={16} /> Back to zones
                        </button>
                        <div className="flex items-center gap-2">
                            <span className="text-gray-300 font-mono text-sm">{selectedZone.name}</span>
                            <button
                                onClick={openAddRecord}
                                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-sm"
                            >
                                <Plus size={16} /> Add Record
                            </button>
                        </div>
                    </div>

                    <div className="bg-gray-950 border border-gray-900 rounded-lg overflow-hidden">
                        {filteredRecords.length === 0 && !loading ? (
                            <div className="p-8 text-center text-gray-500">No records found.</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-900 text-xs uppercase text-gray-400">
                                        <tr>
                                            <th className="text-left px-4 py-3">Name</th>
                                            <th className="text-left px-4 py-3">Type</th>
                                            <th className="text-left px-4 py-3">Content</th>
                                            <th className="text-left px-4 py-3 hidden md:table-cell">TTL</th>
                                            <th className="text-right px-4 py-3">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredRecords.map(r => (
                                            <tr key={r.id} className="border-t border-gray-900 hover:bg-gray-900/50">
                                                <td className="px-4 py-3 text-white font-mono text-sm break-all">{r.name}</td>
                                                <td className="px-4 py-3">
                                                    <span className="text-xs px-2 py-0.5 rounded bg-gray-800 text-gray-200">{r.type}</span>
                                                </td>
                                                <td className="px-4 py-3 text-gray-300 font-mono text-sm break-all">{r.content}</td>
                                                <td className="px-4 py-3 text-gray-400 hidden md:table-cell">
                                                    {r.ttl === 1 ? 'Auto' : r.ttl}
                                                </td>
                                                <td className="px-4 py-3 text-right whitespace-nowrap">
                                                    <button
                                                        onClick={() => openEditRecord(r)}
                                                        className="inline-flex items-center gap-1 px-2 py-1 text-xs text-blue-300 hover:bg-blue-900/30 rounded mr-1"
                                                    >
                                                        <Edit2 size={12} /> Edit
                                                    </button>
                                                    <button
                                                        onClick={() => deleteRecord(r)}
                                                        className="inline-flex items-center gap-1 px-2 py-1 text-xs text-red-300 hover:bg-red-900/30 rounded"
                                                    >
                                                        <Trash2 size={12} /> Delete
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Record Modal */}
            {showRecordModal && selectedZone && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-gray-950 border border-gray-800 rounded-xl max-w-lg w-full p-6">
                        <h3 className="text-lg font-bold text-white mb-4">
                            {editingRecord ? 'Edit' : 'Add'} Cloudflare Record
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Type</label>
                                <select
                                    value={recordForm.type}
                                    onChange={e => setRecordForm({ ...recordForm, type: e.target.value })}
                                    disabled={!!editingRecord}
                                    className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-white disabled:opacity-60"
                                >
                                    {RECORD_TYPES.map(t => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-1">
                                    Name <span className="text-gray-600">(use @ for root)</span>
                                </label>
                                <input
                                    type="text"
                                    value={recordForm.name}
                                    onChange={e => setRecordForm({ ...recordForm, name: e.target.value })}
                                    placeholder="@ or subdomain"
                                    className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-white"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Full name: <span className="font-mono">
                                        {recordForm.name === '@' || !recordForm.name
                                            ? selectedZone.name
                                            : recordForm.name.endsWith(selectedZone.name)
                                                ? recordForm.name
                                                : `${recordForm.name}.${selectedZone.name}`}
                                    </span>
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-1">
                                    Content {recordForm.type === 'A' && '(IPv4)'}
                                    {recordForm.type === 'AAAA' && '(IPv6)'}
                                    {recordForm.type === 'CNAME' && '(target hostname)'}
                                    {recordForm.type === 'TXT' && '(text)'}
                                    {recordForm.type === 'MX' && '(mail server hostname)'}
                                </label>
                                <input
                                    type="text"
                                    value={recordForm.content}
                                    onChange={e => setRecordForm({ ...recordForm, content: e.target.value })}
                                    className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-white font-mono text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-1">TTL (seconds, 1 = Auto)</label>
                                <input
                                    type="number"
                                    value={recordForm.ttl}
                                    onChange={e => setRecordForm({ ...recordForm, ttl: Number(e.target.value) || 1 })}
                                    className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-white"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 mt-6">
                            <button
                                onClick={() => setShowRecordModal(false)}
                                className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={saveRecord}
                                className="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-sm"
                            >
                                {editingRecord ? 'Update' : 'Create'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
