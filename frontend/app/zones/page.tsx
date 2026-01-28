'use client';

import { useEffect, useState } from 'react';
import { Plus, RefreshCw, ChevronRight, Trash2, Check, AlertCircle, Server } from 'lucide-react';
import Link from 'next/link';

interface Zone {
    name: string;
    type: string;
    disabled: boolean;
    internal: boolean;
    forwardingEnabled: boolean;
}

export default function ZonesPage() {
    const [zones, setZones] = useState<Zone[]>([]);
    const [forwardedDomains, setForwardedDomains] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newZone, setNewZone] = useState({
        name: '',
        type: 'Primary',
        isActiveDirectory: false,
        dcName: 'dc1',
        dcIp: '',
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
            setForwardedDomains(data.forwardedDomains || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch zones');
            console.error('Failed to fetch zones:', err);
        }
        setLoading(false);
    };

    useEffect(() => { fetchZones(); }, []);

    const handleCreateZone = async () => {
        if (!newZone.name) return;
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
                }),
            });

            const data = await res.json();
            if (data.error) throw new Error(data.error);

            setNewZone({ name: '', type: 'Primary', isActiveDirectory: false, dcName: 'dc1', dcIp: '' });
            setShowCreateModal(false);
            await fetchZones();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create zone');
        }
        setCreating(false);
    };

    const handleDeleteZone = async (zone: string) => {
        if (!confirm(`Are you sure you want to delete zone "${zone}"?\n\nThis will:\n• Delete the zone from Technitium\n• Remove the forwarding rule from AdGuard\n\nThis cannot be undone.`)) return;

        setError(null);
        try {
            const res = await fetch('/api/zones', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'delete', zone }),
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
                        Create zones here – they'll be automatically configured in both AdGuard and Technitium.
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
                        Create Zone
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

            {/* Info Box */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <h4 className="text-blue-400 font-medium mb-2">How it works</h4>
                <p className="text-blue-400/80 text-sm">
                    When you create a zone (e.g., <code className="bg-blue-500/20 px-1 rounded">vmhaus.de</code>):
                </p>
                <ul className="text-blue-400/80 text-sm mt-2 space-y-1 list-disc list-inside">
                    <li>AdGuard will forward all <code className="bg-blue-500/20 px-1 rounded">*.vmhaus.de</code> queries to Technitium</li>
                    <li>Technitium will serve your custom DNS records for that zone</li>
                    <li>External DNS (Cloudflare/Google) handles everything else</li>
                </ul>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-950/50">
                        <tr>
                            <th className="px-6 py-4">Zone Name</th>
                            <th className="px-6 py-4">Type</th>
                            <th className="px-6 py-4">Forwarding</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {zones.map(zone => (
                            <tr key={zone.name} className="group hover:bg-gray-800/50 transition-colors">
                                <td className="px-6 py-4">
                                    <Link
                                        href={`/zones/${encodeURIComponent(zone.name)}`}
                                        className="text-white font-medium hover:text-blue-400 flex items-center gap-2"
                                    >
                                        {zone.name}
                                        <ChevronRight size={16} className="text-gray-600 group-hover:text-blue-400" />
                                    </Link>
                                </td>
                                <td className="px-6 py-4 text-gray-400 text-sm">{zone.type}</td>
                                <td className="px-6 py-4">
                                    <span className={`flex items-center gap-2 text-xs font-medium ${zone.forwardingEnabled ? 'text-green-400' : 'text-yellow-400'
                                        }`}>
                                        {zone.forwardingEnabled ? (
                                            <>
                                                <Check size={14} />
                                                AdGuard → Technitium
                                            </>
                                        ) : (
                                            <>
                                                <AlertCircle size={14} />
                                                Not forwarded
                                            </>
                                        )}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`text-xs font-medium px-2 py-1 rounded ${zone.disabled ? 'text-gray-400 bg-gray-400/10' : 'text-green-400 bg-green-400/10'
                                        }`}>
                                        {zone.disabled ? 'Disabled' : 'Active'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => handleDeleteZone(zone.name)}
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
                                    No zones configured. Click "Create Zone" to get started.
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
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-md">
                        <h3 className="text-lg font-medium text-white mb-4">Create DNS Zone</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Zone Name</label>
                                <input
                                    type="text"
                                    value={newZone.name}
                                    onChange={(e) => setNewZone(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                                    placeholder="e.g. vmhaus.de or corp.local"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Zone Type</label>
                                <select
                                    value={newZone.type}
                                    onChange={(e) => setNewZone(prev => ({ ...prev, type: e.target.value }))}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                                >
                                    <option value="Primary">Primary (Authoritative)</option>
                                    <option value="Secondary">Secondary (Replica)</option>
                                    <option value="Forwarder">Forwarder</option>
                                </select>
                            </div>

                            <div className="border-t border-gray-800 pt-4">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={newZone.isActiveDirectory}
                                        onChange={(e) => setNewZone(prev => ({ ...prev, isActiveDirectory: e.target.checked }))}
                                        className="w-4 h-4 rounded bg-gray-800 border-gray-600"
                                    />
                                    <div>
                                        <span className="text-white font-medium flex items-center gap-2">
                                            <Server size={16} className="text-blue-400" />
                                            Active Directory Domain
                                        </span>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            Automatically create LDAP, Kerberos, and GC SRV records
                                        </p>
                                    </div>
                                </label>
                            </div>

                            {newZone.isActiveDirectory && (
                                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                                    <p className="text-xs text-blue-400">
                                        Standard AD DNS records will be created. You can edit DC names and IPs afterwards in the zone details.
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="px-4 py-2 text-gray-400 hover:text-white"
                                disabled={creating}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateZone}
                                disabled={creating || !newZone.name}
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white px-4 py-2 rounded-lg text-sm font-medium"
                            >
                                {creating ? (
                                    <>
                                        <RefreshCw size={18} className="animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <Check size={18} />
                                        Create Zone
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
