'use client';

import { useEffect, useState } from 'react';
import { Plus, RefreshCw, ChevronRight, Trash2 } from 'lucide-react';
import Link from 'next/link';

interface Zone {
    name: string;
    type: string;
    disabled: boolean;
    internal: boolean;
}

export default function ZonesPage() {
    const [zones, setZones] = useState<Zone[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newZone, setNewZone] = useState({ name: '', type: 'Primary' });

    const fetchZones = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/technitium/zones');
            const data = await res.json();
            setZones(data.zones || []);
        } catch (err) {
            console.error('Failed to fetch zones:', err);
        }
        setLoading(false);
    };

    useEffect(() => { fetchZones(); }, []);

    const handleCreateZone = async () => {
        if (!newZone.name) return;

        await fetch('/api/technitium/zones', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'create', zone: newZone.name, type: newZone.type }),
        });

        setNewZone({ name: '', type: 'Primary' });
        setShowCreateModal(false);
        await fetchZones();
    };

    const handleDeleteZone = async (zone: string) => {
        if (!confirm(`Are you sure you want to delete zone "${zone}"? This cannot be undone.`)) return;

        await fetch('/api/technitium/zones', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'delete', zone }),
        });

        await fetchZones();
    };

    return (
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Authoritative Zones</h1>
                    <p className="text-gray-400">Manage local DNS zones via Technitium.</p>
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

            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-950/50">
                        <tr>
                            <th className="px-6 py-4">Zone Name</th>
                            <th className="px-6 py-4">Type</th>
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
                                <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                    No zones configured. Click "Create Zone" to get started.
                                </td>
                            </tr>
                        )}
                        {loading && (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
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
                        <h3 className="text-lg font-medium text-white mb-4">Create Zone</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Zone Name</label>
                                <input
                                    type="text"
                                    value={newZone.name}
                                    onChange={(e) => setNewZone(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                                    placeholder="e.g. lan.local or example.com"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Zone Type</label>
                                <select
                                    value={newZone.type}
                                    onChange={(e) => setNewZone(prev => ({ ...prev, type: e.target.value }))}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                                >
                                    <option value="Primary">Primary</option>
                                    <option value="Secondary">Secondary</option>
                                    <option value="Stub">Stub</option>
                                    <option value="Forwarder">Forwarder</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="px-4 py-2 text-gray-400 hover:text-white"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateZone}
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium"
                            >
                                Create
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
