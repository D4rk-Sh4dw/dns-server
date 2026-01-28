'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, Plus, Trash2, Check, X } from 'lucide-react';

interface FilterList {
    id: number;
    name: string;
    url: string;
    enabled: boolean;
    rules_count: number;
    last_updated: string;
}

interface FilteringStatus {
    enabled: boolean;
    filters: FilterList[];
    user_rules: string[];
}

export default function FilteringPage() {
    const [filtering, setFiltering] = useState<FilteringStatus | null>(null);
    const [safeSearch, setSafeSearch] = useState(true);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newList, setNewList] = useState({ name: '', url: '' });

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/adguard/filtering');
            const data = await res.json();
            setFiltering(data);

            const adguardRes = await fetch('/api/adguard');
            const adguard = await adguardRes.json();
            setSafeSearch(adguard.safeSearch?.enabled ?? true);
        } catch (err) {
            console.error('Failed to fetch filtering data:', err);
        }
        setLoading(false);
    };

    useEffect(() => { fetchData(); }, []);

    const handleRefresh = async () => {
        setLoading(true);
        await fetch('/api/adguard/filtering', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'refresh' }),
        });
        await fetchData();
    };

    const handleAddList = async () => {
        if (!newList.name || !newList.url) return;

        await fetch('/api/adguard/filtering', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'add', name: newList.name, url: newList.url }),
        });

        setNewList({ name: '', url: '' });
        setShowAddModal(false);
        await fetchData();
    };

    const handleRemoveList = async (url: string) => {
        await fetch('/api/adguard/filtering', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'remove', url }),
        });
        await fetchData();
    };

    return (
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Filtering & Blocklists</h1>
                    <p className="text-gray-400">Manage global blocking rules and AdGuard blocklists.</p>
                </div>
                <button
                    onClick={handleRefresh}
                    className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                >
                    <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-medium text-white mb-4">Global Switches</h3>
                <div className="flex items-center justify-between py-4 border-b border-gray-800">
                    <div>
                        <div className="text-white font-medium">Safe Search</div>
                        <div className="text-sm text-gray-500">Enforce safe search on Google, Bing, and YouTube</div>
                    </div>
                    <Switch checked={safeSearch} onChange={async (v) => {
                        setSafeSearch(v);
                        // TODO: Call API to toggle safe search
                    }} />
                </div>
                <div className="flex items-center justify-between py-4">
                    <div>
                        <div className="text-white font-medium">Protection Enabled</div>
                        <div className="text-sm text-gray-500">Block domains from all enabled filter lists</div>
                    </div>
                    <Switch checked={filtering?.enabled ?? false} onChange={() => { }} />
                </div>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-medium text-white">Blocklists</h3>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium"
                    >
                        <Plus size={18} />
                        Add Blocklist
                    </button>
                </div>

                <table className="w-full text-left">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-950/50">
                        <tr>
                            <th className="px-4 py-3 rounded-l-lg">Name</th>
                            <th className="px-4 py-3">URL</th>
                            <th className="px-4 py-3">Rules</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3 rounded-r-lg text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {filtering?.filters?.map((filter) => (
                            <tr key={filter.id} className="text-sm group hover:bg-gray-800/50">
                                <td className="px-4 py-4 text-white font-medium">{filter.name}</td>
                                <td className="px-4 py-4 text-gray-500 truncate max-w-xs">{filter.url}</td>
                                <td className="px-4 py-4 text-gray-400">{filter.rules_count?.toLocaleString()}</td>
                                <td className="px-4 py-4">
                                    <span className={`text-xs font-medium px-2 py-1 rounded ${filter.enabled ? 'text-green-400 bg-green-400/10' : 'text-gray-400 bg-gray-400/10'
                                        }`}>
                                        {filter.enabled ? 'Enabled' : 'Disabled'}
                                    </span>
                                </td>
                                <td className="px-4 py-4 text-right">
                                    <button
                                        onClick={() => handleRemoveList(filter.url)}
                                        className="text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {!filtering?.filters?.length && (
                            <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                                    No blocklists configured. Click "Add Blocklist" to get started.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Add Blocklist Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-md">
                        <h3 className="text-lg font-medium text-white mb-4">Add Blocklist</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Name</label>
                                <input
                                    type="text"
                                    value={newList.name}
                                    onChange={(e) => setNewList(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                                    placeholder="e.g. Steven Black Hosts"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">URL</label>
                                <input
                                    type="text"
                                    value={newList.url}
                                    onChange={(e) => setNewList(prev => ({ ...prev, url: e.target.value }))}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                                    placeholder="https://example.com/hosts.txt"
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
                                onClick={handleAddList}
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium"
                            >
                                <Check size={18} />
                                Add
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function Switch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
    return (
        <button
            onClick={() => onChange(!checked)}
            className={`w-11 h-6 rounded-full relative transition-colors ${checked ? 'bg-blue-600' : 'bg-gray-700'}`}
        >
            <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${checked ? 'translate-x-5' : ''}`} />
        </button>
    );
}
