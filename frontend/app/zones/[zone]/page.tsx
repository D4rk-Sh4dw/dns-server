'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Plus, RefreshCw, Trash2, Check, AlertCircle } from 'lucide-react';
import Link from 'next/link';

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
    });

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
        const domain = newRecord.name ? `${newRecord.name}.${zone}` : zone;
        setError(null); // Clear previous errors

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

            setNewRecord({ name: '', type: 'A', value: '', ttl: 3600, priority: 10, weight: 0, port: 0 });
            setShowAddModal(false);
            await fetchRecords();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        }
    };

    const handleDeleteRecord = async (record: DnsRecord) => {
        if (!confirm(`Delete ${record.type} record for ${record.name}?`)) return;

        let value = '';
        const rd = record.rData;
        if (rd.ipAddress) value = rd.ipAddress;
        else if (rd.cname) value = rd.cname;
        else if (rd.text) value = rd.text;
        else if (rd.exchange) value = rd.exchange;
        else if (rd.target) value = rd.target;

        await fetch('/api/technitium/records', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'delete',
                domain: record.name,
                type: record.type,
                value,
            }),
        });

        await fetchRecords();
    };

    const getRecordValue = (record: DnsRecord) => {
        const rd = record.rData;
        if (rd.ipAddress) return rd.ipAddress;
        if (rd.cname) return rd.cname;
        if (rd.text) return `"${rd.text}"`;
        if (rd.exchange) return `${rd.preference} ${rd.exchange}`;
        if (rd.target) return `${rd.priority} ${rd.weight} ${rd.port} ${rd.target}`;
        return JSON.stringify(rd);
    };

    return (
        <div className="p-8 space-y-8">
            <div className="flex items-center gap-4 mb-6">
                <Link href="/zones" className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white">
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white">{zone}</h1>
                    <p className="text-gray-400">Manage DNS records for this zone</p>
                </div>
            </div>

            <div className="flex justify-between items-center">
                <div className="text-sm text-gray-400">
                    {records.length} record{records.length !== 1 ? 's' : ''}
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={fetchRecords}
                        className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                    >
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium"
                    >
                        <Plus size={18} />
                        Add Record
                    </button>
                </div>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-950/50">
                        <tr>
                            <th className="px-6 py-4">Name</th>
                            <th className="px-6 py-4">Type</th>
                            <th className="px-6 py-4">Value</th>
                            <th className="px-6 py-4">TTL</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {records.map((record, idx) => (
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
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => handleDeleteRecord(record)}
                                        className="text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {!records.length && !loading && (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                    No records in this zone. Click "Add Record" to get started.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Add Record Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-lg">
                        <h3 className="text-lg font-medium text-white mb-4">Add DNS Record</h3>

                        {error && (
                            <div className="mb-4 bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-start gap-2">
                                <AlertCircle className="text-red-400 flex-shrink-0 mt-0.5" size={16} />
                                <p className="text-red-400 text-sm">{error}</p>
                            </div>
                        )}

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Name (subdomain)</label>
                                    <input
                                        type="text"
                                        value={newRecord.name}
                                        onChange={(e) => setNewRecord(prev => ({ ...prev, name: e.target.value }))}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                                        placeholder="@ for root, or subdomain"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Type</label>
                                    <select
                                        value={newRecord.type}
                                        onChange={(e) => setNewRecord(prev => ({ ...prev, type: e.target.value }))}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
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
                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="px-4 py-2 text-gray-400 hover:text-white"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddRecord}
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium"
                            >
                                <Check size={18} />
                                Add Record
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
