'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, Plus, Trash2, Check, Server, Globe, AlertCircle } from 'lucide-react';

interface Zone {
    name: string;
    type: string;
    disabled?: boolean;
    internal?: boolean;
    forwardingEnabled: boolean;
    source: 'technitium' | 'active-directory';
    dcServers?: string;
    forwarder?: string;
}

const PROVIDERS: Record<string, { name: string; protocols: Record<string, string> }> = {
    'Cloudflare': {
        name: 'Cloudflare',
        protocols: {
            'Udp': '1.1.1.1',
            'Tcp': '1.1.1.1',
            'Tls': '1.1.1.1:853',
            'Https': 'https://cloudflare-dns.com/dns-query',
            'Quic': 'quic://dns.cloudflare.com:853'
        }
    },
    'Google': {
        name: 'Google',
        protocols: {
            'Udp': '8.8.8.8',
            'Tcp': '8.8.8.8',
            'Tls': '8.8.8.8:853',
            'Https': 'https://dns.google/dns-query',
            'Quic': 'quic://dns.google:853'
        }
    },
    'Quad9': {
        name: 'Quad9',
        protocols: {
            'Udp': '9.9.9.9',
            'Tcp': '9.9.9.9',
            'Tls': '9.9.9.9:853',
            'Https': 'https://dns.quad9.net/dns-query',
            'Quic': 'quic://dns.quad9.net:853'
        }
    },
    'OpenDNS': {
        name: 'OpenDNS',
        protocols: {
            'Udp': '208.67.222.222',
            'Tcp': '208.67.222.222',
            'Tls': '208.67.222.222:853',
            'Https': 'https://doh.opendns.com/dns-query',
            'Quic': ''
        }
    }
};

export default function ForwardingPage() {
    const [zones, setZones] = useState<Zone[]>([]);
    const [loading, setLoading] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // State for creating zone
    const [newZone, setNewZone] = useState({
        name: '',
        type: 'ConditionalForwarder',
        isActiveDirectory: false,
        dcServers: '',
        forwarder: '',
        protocol: 'Udp'
    });

    const [selectedProvider, setSelectedProvider] = useState('');
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/zones');
            const data = await res.json();
            if (data.zones) {
                setZones(data.zones);
            }
        } catch (e) {
            console.error('Failed to fetch zones:', e);
            setError('Failed to fetch zones');
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreateZone = async () => {
        if (!newZone.name) return;
        if (newZone.type === 'ConditionalForwarder' && !newZone.forwarder) {
            setError('Please enter a forwarder IP');
            return;
        }

        setCreating(true);
        setError(null);
        try {
            await fetch('/api/zones', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'create',
                    zone: newZone.name,
                    type: newZone.type,
                    isActiveDirectory: newZone.isActiveDirectory,
                    dcServers: newZone.dcServers,
                    forwarder: newZone.forwarder,
                    protocol: newZone.protocol
                }),
            });
            setShowCreateModal(false);
            setNewZone({
                name: '',
                type: 'ConditionalForwarder',
                isActiveDirectory: false,
                dcServers: '',
                forwarder: '',
                protocol: 'Udp'
            });
            setSelectedProvider('');
            fetchData();
        } catch (e) {
            console.error(e);
            setError('Failed to create zone');
        }
        setCreating(false);
    };

    const handleDeleteZone = async (zone: Zone) => {
        if (zone.source === 'technitium') {
            if (!confirm(`Warning: This is a Technitium-managed zone.\nDeleting it may affect local DNS resolution or internal services.\n\nAre you sure you want to delete ${zone.name}?`)) return;
        } else {
            if (!confirm(`Delete zone ${zone.name}?`)) return;
        }

        try {
            await fetch('/api/zones', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'delete', zone: zone.name }),
            });
            fetchData();
        } catch (e) { console.error(e); }
    };

    return (
        <div className="p-4 md:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-2">Forwarding Management</h1>
                    <p className="text-gray-400 text-sm md:text-base">Manage DNS forwarding zones and upstream servers.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={fetchData}
                        className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                    >
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button onClick={() => setShowCreateModal(true)} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                        <Plus size={18} /> Add Forwarding Zone
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="text-red-400 flex-shrink-0 mt-0.5" size={20} />
                    <div>
                        <p className="text-red-400 font-medium">Error</p>
                        <p className="text-red-400/80 text-sm">{error}</p>
                    </div>
                </div>
            )}

            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-950/50">
                        <tr>
                            <th className="px-6 py-4">Domain / Zone</th>
                            <th className="px-6 py-4">Type</th>
                            <th className="px-6 py-4">Target Forwarder</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {zones.map((zone: Zone) => (
                            <tr key={zone.name} className="group hover:bg-gray-800/50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        {zone.source === 'active-directory' ? <Server size={16} className="text-purple-400" /> : <Globe size={16} className="text-blue-400" />}
                                        <span className="text-white font-medium">{zone.name}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`text-xs px-2 py-1 rounded border ${zone.source === 'technitium'
                                        ? 'bg-blue-900/20 text-blue-400 border-blue-800'
                                        : (zone.source === 'active-directory' ? 'bg-purple-900/20 text-purple-400 border-purple-800' : 'bg-gray-800 text-gray-400 border-gray-700')
                                        }`}>
                                        {zone.source === 'active-directory' ? 'AD Domain' : (zone.source === 'technitium' ? 'Technitium Zone' : zone.type)}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-gray-400 font-mono text-sm">{zone.source === 'active-directory' ? zone.dcServers : (zone.forwarder || 'Local')}</td>
                                <td className="px-6 py-4 text-green-400 text-xs flex items-center gap-1"><Check size={12} /> Active</td>
                                <td className="px-6 py-4 text-right">
                                    <button onClick={() => handleDeleteZone(zone)} className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16} /></button>
                                </td>
                            </tr>
                        ))}
                        {zones.length === 0 && !loading && <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No forwarding zones configured.</td></tr>}
                        {loading && zones.length === 0 && <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">Loading zones...</td></tr>}
                    </tbody>
                </table>
            </div>

            {showCreateModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-lg">
                        <h3 className="text-lg font-medium text-white mb-4">Add Forwarding Zone</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Domain Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. internal.corp"
                                    value={newZone.name}
                                    onChange={e => setNewZone({ ...newZone, name: e.target.value })}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Zone Type</label>
                                <select
                                    value={newZone.type}
                                    onChange={e => setNewZone({ ...newZone, type: e.target.value })}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                                >
                                    <option value="ConditionalForwarder">Conditional Forwarder</option>
                                    <option value="Primary">Primary (Authoritative)</option>
                                </select>
                            </div>

                            {newZone.type === 'ConditionalForwarder' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-1">Upstream Provider (Optional)</label>
                                        <select onChange={(e) => {
                                            const p = e.target.value; setSelectedProvider(p);
                                            if (p && PROVIDERS[p]) setNewZone({ ...newZone, forwarder: PROVIDERS[p].protocols[newZone.protocol] });
                                        }} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500">
                                            <option value="">Select Provider...</option>
                                            {Object.keys(PROVIDERS).map(k => <option key={k} value={k}>{PROVIDERS[k].name}</option>)}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-1">Forwarder IP</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. 1.1.1.1"
                                            value={newZone.forwarder}
                                            onChange={e => setNewZone({ ...newZone, forwarder: e.target.value })}
                                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-1">Protocol</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {['Udp', 'Tcp', 'Tls', 'Https', 'Quic'].map(p => (
                                                <button
                                                    key={p}
                                                    onClick={() => setNewZone(prev => ({ ...prev, protocol: p }))}
                                                    className={`px-2 py-1.5 rounded-lg text-xs font-medium border transition-colors ${newZone.protocol === p
                                                        ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                                                        : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                                                        }`}
                                                >
                                                    DNS-over-{p.toUpperCase()}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-white px-4 py-2">Cancel</button>
                            <button onClick={handleCreateZone} disabled={creating} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50">
                                {creating ? 'Creating...' : 'Create Zone'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
