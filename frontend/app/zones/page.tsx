'use client';

import { useEffect, useState } from 'react';
import { Plus, RefreshCw, ChevronRight, Trash2, Check, AlertCircle, Server, Globe } from 'lucide-react';
import Link from 'next/link';

interface Zone {
    name: string;
    type: string;
    disabled?: boolean;
    internal?: boolean;
    forwardingEnabled: boolean;
    source: 'technitium' | 'active-directory';
    dcServers?: string;
}

export default function ZonesPage() {
    const [zones, setZones] = useState<Zone[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newZone, setNewZone] = useState({
        name: '',
        type: 'Primary',
        isActiveDirectory: false,
        dcServers: '',
    });
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchZones = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/zones');
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setZones(data.zones || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch zones');
        }
        setLoading(false);
    };

    useEffect(() => { fetchZones(); }, []);

    const handleCreateZone = async () => {
        if (!newZone.name) return;
        if (newZone.isActiveDirectory && !newZone.dcServers) {
            setError('Please enter at least one Domain Controller IP');
            return;
        }

        setCreating(true);
        setError(null);

        try {
            const res = await fetch('/api/zones', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'create',
                    zone: newZone.name,
                    type: newZone.type,
                    isActiveDirectory: newZone.isActiveDirectory,
                    dcServers: newZone.dcServers,
                }),
            });

            const data = await res.json();
            if (data.error) throw new Error(data.error);

            setNewZone({ name: '', type: 'Primary', isActiveDirectory: false, dcServers: '' });
            setShowCreateModal(false);
            await fetchZones();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create zone');
        }
        setCreating(false);
    };

    const handleDeleteZone = async (zone: Zone) => {
        const isAD = zone.source === 'active-directory';
        const message = isAD
            ? `Delete AD forwarding for "${zone.name}"?\n\nThis will remove the forwarding rule from AdGuard.`
            : `Delete zone "${zone.name}"?\n\nThis will:\n• Delete the zone from Technitium\n• Remove the forwarding rule from AdGuard`;

        if (!confirm(message)) return;

        setError(null);
        try {
            const res = await fetch('/api/zones', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'delete', zone: zone.name }),
            });

            const data = await res.json();
            if (data.error) throw new Error(data.error);

            await fetchZones();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete zone');
        }
    };

    return (
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-2">DNS Zones</h1>
                    <p className="text-gray-400">
                        Manage DNS zones and Active Directory domain forwarding.
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={fetchZones}
                        className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                    >
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium"
                    >
                        <Plus size={18} />
                        Add Zone
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

            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-950/50">
                        <tr>
                            <th className="px-6 py-4">Zone / Domain</th>
                            <th className="px-6 py-4">Type</th>
                            <th className="px-6 py-4">Target</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {zones.map(zone => (
                            <tr key={zone.name} className="group hover:bg-gray-800/50 transition-colors">
                                <td className="px-6 py-4">
                                    {zone.source === 'active-directory' ? (
                                        <div className="flex items-center gap-2">
                                            <Server size={16} className="text-purple-400" />
                                            <span className="text-white font-medium">{zone.name}</span>
                                        </div>
                                    ) : (
                                        <Link
                                            href={`/zones/${encodeURIComponent(zone.name)}`}
                                            className="text-white font-medium hover:text-blue-400 flex items-center gap-2"
                                        >
                                            <Globe size={16} className="text-blue-400" />
                                            {zone.name}
                                            <ChevronRight size={16} className="text-gray-600 group-hover:text-blue-400" />
                                        </Link>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`text-xs font-medium px-2 py-1 rounded ${zone.source === 'active-directory'
                                        ? 'text-purple-400 bg-purple-400/10'
                                        : 'text-blue-400 bg-blue-400/10'
                                        }`}>
                                        {zone.source === 'active-directory' ? 'Active Directory' : zone.type || 'Primary'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-gray-400 text-sm font-mono">
                                    {zone.source === 'active-directory'
                                        ? zone.dcServers
                                        : 'Technitium (docker)'}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`flex items-center gap-2 text-xs font-medium ${zone.forwardingEnabled ? 'text-green-400' : 'text-yellow-400'
                                        }`}>
                                        <Check size={14} />
                                        {zone.forwardingEnabled ? 'Forwarding Active' : 'Pending'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => handleDeleteZone(zone)}
                                        className="text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {!zones.length && !loading && (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                    No zones configured. Click "Add Zone" to get started.
                                </td>
                            </tr>
                        )}
                        {loading && (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                    Loading zones...
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Create Zone Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-lg">
                        <h3 className="text-lg font-medium text-white mb-4">Add DNS Zone</h3>

                        {/* Zone Type Toggle */}
                        <div className="flex gap-2 mb-6">
                            <button
                                onClick={() => setNewZone(prev => ({ ...prev, isActiveDirectory: false }))}
                                className={`flex-1 p-4 rounded-lg border-2 transition-all ${!newZone.isActiveDirectory
                                    ? 'border-blue-500 bg-blue-500/10'
                                    : 'border-gray-700 hover:border-gray-600'
                                    }`}
                            >
                                <Globe size={24} className={!newZone.isActiveDirectory ? 'text-blue-400' : 'text-gray-500'} />
                                <div className="mt-2 text-left">
                                    <div className={`font-medium ${!newZone.isActiveDirectory ? 'text-white' : 'text-gray-400'}`}>
                                        Custom Zone
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        Create zone in Technitium with custom records
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => setNewZone(prev => ({ ...prev, isActiveDirectory: true }))}
                                className={`flex-1 p-4 rounded-lg border-2 transition-all ${newZone.isActiveDirectory
                                    ? 'border-purple-500 bg-purple-500/10'
                                    : 'border-gray-700 hover:border-gray-600'
                                    }`}
                            >
                                <Server size={24} className={newZone.isActiveDirectory ? 'text-purple-400' : 'text-gray-500'} />
                                <div className="mt-2 text-left">
                                    <div className={`font-medium ${newZone.isActiveDirectory ? 'text-white' : 'text-gray-400'}`}>
                                        Active Directory
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        Forward to existing DC DNS servers
                                    </div>
                                </div>
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">
                                    {newZone.isActiveDirectory ? 'AD Domain Name' : 'Zone Name'}
                                </label>
                                <input
                                    type="text"
                                    value={newZone.name}
                                    onChange={(e) => setNewZone(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                                    placeholder={newZone.isActiveDirectory ? 'e.g. corp.vmhaus.de' : 'e.g. vmhaus.de'}
                                />
                            </div>

                            {newZone.isActiveDirectory ? (
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">
                                        Domain Controller IPs
                                    </label>
                                    <input
                                        type="text"
                                        value={newZone.dcServers}
                                        onChange={(e) => setNewZone(prev => ({ ...prev, dcServers: e.target.value }))}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                                        placeholder="e.g. 10.0.0.10, 10.0.0.11"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Comma-separated list of DC IP addresses with DNS role
                                    </p>
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Zone Type</label>
                                    <select
                                        value={newZone.type}
                                        onChange={(e) => setNewZone(prev => ({ ...prev, type: e.target.value }))}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                                    >
                                        <option value="Primary">Primary (Authoritative)</option>
                                        <option value="Secondary">Secondary (Replica)</option>
                                    </select>
                                </div>
                            )}
                        </div>

                        <div className="bg-gray-800 rounded-lg p-3 mt-4">
                            <p className="text-xs text-gray-400">
                                {newZone.isActiveDirectory ? (
                                    <>
                                        <strong className="text-purple-400">Active Directory Mode:</strong> AdGuard will forward all
                                        <code className="bg-gray-700 px-1 mx-1 rounded">*.{newZone.name || 'domain'}</code>
                                        queries directly to your Domain Controllers.
                                    </>
                                ) : (
                                    <>
                                        <strong className="text-blue-400">Custom Zone Mode:</strong> Zone will be created in Technitium
                                        where you can add A, CNAME, TXT, SRV records. AdGuard forwards
                                        <code className="bg-gray-700 px-1 mx-1 rounded">*.{newZone.name || 'domain'}</code> to Technitium.
                                    </>
                                )}
                            </p>
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => {
                                    setShowCreateModal(false);
                                    setError(null);
                                }}
                                className="px-4 py-2 text-gray-400 hover:text-white"
                                disabled={creating}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateZone}
                                disabled={creating || !newZone.name || (newZone.isActiveDirectory && !newZone.dcServers)}
                                className={`flex items-center gap-2 text-white px-4 py-2 rounded-lg text-sm font-medium ${newZone.isActiveDirectory
                                    ? 'bg-purple-600 hover:bg-purple-500 disabled:bg-purple-600/50'
                                    : 'bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50'
                                    }`}
                            >
                                {creating ? (
                                    <>
                                        <RefreshCw size={18} className="animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <Check size={18} />
                                        {newZone.isActiveDirectory ? 'Add AD Domain' : 'Create Zone'}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
