'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, Plus, Trash2, Check, X, Shield, ShieldCheck, Baby, Search } from 'lucide-react';

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

interface ProtectionStatus {
    protectionEnabled: boolean;
    parentalEnabled: boolean;
    safeBrowsingEnabled: boolean;
    safeSearchEnabled: boolean;
}

export default function FilteringPage() {
    const [filtering, setFiltering] = useState<FilteringStatus | null>(null);
    const [protection, setProtection] = useState<ProtectionStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newList, setNewList] = useState({ name: '', url: '' });

    const [showRuleModal, setShowRuleModal] = useState(false);
    const [newRule, setNewRule] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            const [filterRes, protectionRes] = await Promise.all([
                fetch('/api/adguard/filtering'),
                fetch('/api/adguard/protection'),
            ]);
            const filterData = await filterRes.json();
            const protectionData = await protectionRes.json();
            setFiltering(filterData);
            setProtection(protectionData);
        } catch (err) {
            console.error('Failed to fetch data:', err);
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

    const toggleProtection = async (setting: string, enabled: boolean) => {
        // Optimistically update UI
        setProtection(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                [`${setting}Enabled`]: enabled,
            };
        });

        try {
            const res = await fetch('/api/adguard/protection', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ setting, enabled }),
            });
            const data = await res.json();
            setProtection(data);
        } catch (err) {
            console.error('Failed to toggle protection:', err);
            // Revert on error
            fetchData();
        }
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

    const handleAddRule = async () => {
        if (!newRule) return;

        await fetch('/api/adguard/filtering', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'addRule', rule: newRule }),
        });

        setNewRule('');
        setShowRuleModal(false);
        await fetchData();
    };

    const handleRemoveRule = async (rule: string) => {
        await fetch('/api/adguard/filtering', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'removeRule', rule }),
        });
        await fetchData();
    };

    return (
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Filtering & Protection</h1>
                    <p className="text-gray-400">Manage global protection settings and AdGuard blocklists.</p>
                </div>
                <button
                    onClick={handleRefresh}
                    className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                >
                    <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            {/* Protection Switches */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-medium text-white mb-4">Protection Settings</h3>

                <div className="space-y-1">
                    {/* Overall Protection */}
                    <div className="flex items-center justify-between py-4 border-b border-gray-800">
                        <div className="flex items-center gap-3">
                            <Shield className="text-blue-400" size={20} />
                            <div>
                                <div className="text-white font-medium">DNS Protection</div>
                                <div className="text-sm text-gray-500">Enable DNS filtering and blocking</div>
                            </div>
                        </div>
                        <Switch
                            checked={protection?.protectionEnabled ?? false}
                            onChange={(v) => toggleProtection('protection', v)}
                        />
                    </div>

                    {/* Parental Control */}
                    <div className="flex items-center justify-between py-4 border-b border-gray-800">
                        <div className="flex items-center gap-3">
                            <Baby className="text-pink-400" size={20} />
                            <div>
                                <div className="text-white font-medium">Parental Control</div>
                                <div className="text-sm text-gray-500">Block adult content (pornography, etc.)</div>
                            </div>
                        </div>
                        <Switch
                            checked={protection?.parentalEnabled ?? false}
                            onChange={(v) => toggleProtection('parental', v)}
                        />
                    </div>

                    {/* Safe Browsing */}
                    <div className="flex items-center justify-between py-4 border-b border-gray-800">
                        <div className="flex items-center gap-3">
                            <ShieldCheck className="text-green-400" size={20} />
                            <div>
                                <div className="text-white font-medium">Safe Browsing</div>
                                <div className="text-sm text-gray-500">Block malware and phishing domains</div>
                            </div>
                        </div>
                        <Switch
                            checked={protection?.safeBrowsingEnabled ?? false}
                            onChange={(v) => toggleProtection('safeBrowsing', v)}
                        />
                    </div>

                    {/* Safe Search */}
                    <div className="flex items-center justify-between py-4">
                        <div className="flex items-center gap-3">
                            <Search className="text-yellow-400" size={20} />
                            <div>
                                <div className="text-white font-medium">Safe Search</div>
                                <div className="text-sm text-gray-500">Enforce safe search on Google, Bing, YouTube</div>
                            </div>
                        </div>
                        <Switch
                            checked={protection?.safeSearchEnabled ?? false}
                            onChange={(v) => toggleProtection('safeSearch', v)}
                        />
                    </div>
                </div>
            </div>

            {/* --- Custom Rules Section --- */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-lg font-medium text-white">Custom Rules</h3>
                        <p className="text-sm text-gray-500">
                            Manually block or allow domains.
                            <br />
                            <span className="text-xs text-blue-400">Example: ||example.com^ (Block) or @@||example.com^ (Allow)</span>
                        </p>
                    </div>
                    <button
                        onClick={() => setShowRuleModal(true)}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium"
                    >
                        <Plus size={18} />
                        Add Rule
                    </button>
                </div>

                <div className="space-y-2 font-mono text-sm max-h-96 overflow-y-auto bg-gray-950/30 p-4 rounded-lg border border-gray-800">
                    {filtering?.user_rules?.map((rule, idx) => (
                        <div key={idx} className="flex justify-between items-center p-2 hover:bg-gray-800 rounded group">
                            <span className={rule.startsWith('@@') ? 'text-green-400' : 'text-red-400'}>
                                {rule}
                            </span>
                            <button
                                onClick={() => handleRemoveRule(rule)}
                                className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-1"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    ))}
                    {!filtering?.user_rules?.length && (
                        <div className="text-gray-500 text-center py-4">No custom rules defined.</div>
                    )}
                </div>
            </div>

            {/* --- Blocklists Section --- */}
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

            {/* Add Rule Modal */}
            {showRuleModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-md">
                        <h3 className="text-lg font-medium text-white mb-4">Add Custom Rule</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Rule</label>
                                <input
                                    type="text"
                                    value={newRule}
                                    onChange={(e) => setNewRule(e.target.value)}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                                    placeholder="||example.com^"
                                />
                                <p className="text-xs text-gray-500 mt-2">
                                    Start with <code>@@</code> to allow (whitelist).
                                    <br />
                                    Use <code>||domain.com^</code> to block domain and subdomains.
                                </p>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => setShowRuleModal(false)}
                                className="px-4 py-2 text-gray-400 hover:text-white"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddRule}
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium"
                            >
                                <Check size={18} />
                                Add Rule
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
