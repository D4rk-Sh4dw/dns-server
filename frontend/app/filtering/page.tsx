'use client';

import { useEffect, useState } from 'react';
import { PREDEFINED_BLOCKLISTS, PREDEFINED_WHITELISTS } from '@/constants/predefined-lists';
import {
    RefreshCw, Plus, Trash2, Check, X, Shield, ShieldCheck,
    Baby, Search, Edit2, Info, ExternalLink, ChevronDown, ChevronUp
} from 'lucide-react';

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
    whitelist_filters: FilterList[];
    user_rules: string[];
}

interface ProtectionStatus {
    protectionEnabled: boolean;
    parentalEnabled: boolean;
    safeBrowsingEnabled: boolean;
    safeSearchEnabled: boolean;
    safeSearchConfig?: {
        enabled: boolean;
        google: boolean;
        bing: boolean;
        duckduckgo: boolean;
        ecosia: boolean;
        pixabay: boolean;
        yandex: boolean;
        youtube: boolean;
    };
}

export default function FilteringPage() {
    const [filtering, setFiltering] = useState<FilteringStatus | null>(null);
    const [protection, setProtection] = useState<ProtectionStatus | null>(null);
    const [loading, setLoading] = useState(true);

    // List Modals
    const [showAddModal, setShowAddModal] = useState(false);
    const [newList, setNewList] = useState({ name: '', url: '', whitelist: false });
    const [showEditModal, setShowEditModal] = useState<FilterList | null>(null);
    const [editList, setEditList] = useState({ name: '', url: '', whitelist: false });
    const [showPredefined, setShowPredefined] = useState(false);

    // Rule Modals
    const [showRuleModal, setShowRuleModal] = useState(false);
    const [newRule, setNewRule] = useState('');
    const [showDocs, setShowDocs] = useState(false);

    // SafeSearch
    const [showSafeSearchDetails, setShowSafeSearchDetails] = useState(false);

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

    const handleRefresh = async (whitelist = false) => {
        setLoading(true);
        await fetch('/api/adguard/filtering', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'refresh', whitelist }),
        });
        await fetchData();
    };

    const toggleProtection = async (setting: string, enabled: boolean) => {
        const previousState = protection;
        setProtection(prev => {
            if (!prev) return prev;
            return { ...prev, [`${setting}Enabled`]: enabled };
        });

        try {
            const res = await fetch('/api/adguard/protection', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ setting, enabled }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setProtection(data);
        } catch (err) {
            alert(`Error: ${err instanceof Error ? err.message : 'Unknown'}`);
            setProtection(previousState);
        }
    };

    const toggleSafeSearchEngine = async (engine: string, enabled: boolean) => {
        if (!protection?.safeSearchConfig) return;

        const newConfig = {
            ...protection.safeSearchConfig,
            [engine]: enabled
        };

        try {
            const res = await fetch('/api/adguard/protection', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    setting: 'safeSearchConfig',
                    config: newConfig
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setProtection(data);
        } catch (err) {
            alert(`Error: ${err instanceof Error ? err.message : 'Unknown'}`);
        }
    };

    const handleAddList = async () => {
        if (!newList.name || !newList.url) return;
        await fetch('/api/adguard/filtering', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'add',
                name: newList.name,
                url: newList.url,
                whitelist: newList.whitelist
            }),
        });
        setNewList({ name: '', url: '', whitelist: false });
        setShowAddModal(false);
        await fetchData();
    };

    const handleUpdateList = async () => {
        if (!showEditModal || !editList.name || !editList.url) return;
        await fetch('/api/adguard/filtering', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'update',
                url: showEditModal.url,
                name: editList.name,
                newUrl: editList.url,
                whitelist: editList.whitelist
            }),
        });
        setShowEditModal(null);
        await fetchData();
    };

    const handleToggleList = async (url: string, enabled: boolean, whitelist = false) => {
        await fetch('/api/adguard/filtering', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'toggle', url, enabled, whitelist }),
        });
        await fetchData();
    };

    const handleRemoveList = async (url: string, whitelist = false) => {
        if (!confirm('Are you sure you want to remove this list?')) return;
        await fetch('/api/adguard/filtering', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'remove', url, whitelist }),
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
        <div className="p-4 md:p-8 space-y-6 md:space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-2">Filtering & Protection</h1>
                    <p className="text-gray-400 text-sm md:text-base">Manage global protection settings, blocklists, and whitelists.</p>
                </div>
                <button
                    onClick={() => handleRefresh(false)}
                    className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors self-end sm:self-auto"
                >
                    <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            {/* Protection Switches */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                    <h3 className="text-lg font-medium text-white mb-4">Protection Settings</h3>
                    <div className="space-y-1">
                        <ProtectionToggle
                            icon={Shield}
                            color="text-blue-400"
                            title="DNS Protection"
                            description="Enable DNS filtering and blocking"
                            checked={protection?.protectionEnabled ?? false}
                            onChange={(v: boolean) => toggleProtection('protection', v)}
                        />
                        <ProtectionToggle
                            icon={Baby}
                            color="text-pink-400"
                            title="Parental Control"
                            description="Block adult content (pornography, etc.)"
                            checked={protection?.parentalEnabled ?? false}
                            onChange={(v: boolean) => toggleProtection('parental', v)}
                        />
                        <ProtectionToggle
                            icon={ShieldCheck}
                            color="text-green-400"
                            title="Safe Browsing"
                            description="Block malware and phishing domains"
                            checked={protection?.safeBrowsingEnabled ?? false}
                            onChange={(v: boolean) => toggleProtection('safeBrowsing', v)}
                        />
                        <ProtectionToggle
                            icon={Search}
                            color="text-yellow-400"
                            title="Safe Search"
                            description="Enforce safe search on search engines"
                            checked={protection?.safeSearchEnabled ?? false}
                            onChange={(v: boolean) => toggleProtection('safeSearch', v)}
                            showDetails={true}
                            onDetailsToggle={() => setShowSafeSearchDetails(!showSafeSearchDetails)}
                            isOpen={showSafeSearchDetails}
                        />

                        {showSafeSearchDetails && protection?.safeSearchConfig && (
                            <div className="ml-11 mt-2 p-4 bg-gray-950/50 rounded-lg border border-gray-800 grid grid-cols-2 gap-4">
                                {Object.entries(protection.safeSearchConfig).map(([engine, enabled]) => (
                                    engine !== 'enabled' && (
                                        <div key={engine} className="flex items-center justify-between">
                                            <span className="text-sm text-gray-400 capitalize">{engine}</span>
                                            <Switch
                                                size="sm"
                                                checked={enabled as boolean}
                                                onChange={(v) => toggleSafeSearchEngine(engine, v)}
                                            />
                                        </div>
                                    )
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-lg font-medium text-white">Custom Rules</h3>
                            <p className="text-sm text-gray-500">Manually block or allow domains.</p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowDocs(!showDocs)}
                                className="p-2 text-gray-400 hover:text-white bg-gray-800 rounded-lg"
                                title="Documentation"
                            >
                                <Info size={18} />
                            </button>
                            <button
                                onClick={() => setShowRuleModal(true)}
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium"
                            >
                                <Plus size={18} />
                                Add Rule
                            </button>
                        </div>
                    </div>

                    {showDocs && (
                        <div className="mb-4 p-4 bg-blue-600/10 border border-blue-600/20 rounded-lg text-sm text-blue-100 space-y-2">
                            <p><strong>Syntax Examples:</strong></p>
                            <ul className="list-disc ml-5 space-y-1 text-blue-200/80">
                                <li><code>||example.com^</code> - Block domain and all subdomains</li>
                                <li><code>@@||example.com^</code> - Whitelist (unblock) domain</li>
                                <li><code>127.0.0.1 example.com</code> - Classic hosts-style</li>
                                <li><code>$client='My Laptop'</code> - Restrict rule to a specific client</li>
                            </ul>
                            <a href="https://github.com/AdguardTeam/AdguardHome/wiki/DNS-filtering-rules" target="_blank" className="inline-flex items-center gap-1 text-blue-400 hover:underline mt-1">
                                Full Syntax Docs <ExternalLink size={12} />
                            </a>
                        </div>
                    )}

                    <div className="space-y-1 font-mono text-xs max-h-48 overflow-y-auto bg-gray-950/30 p-3 rounded-lg border border-gray-800">
                        {filtering?.user_rules?.map((rule, idx) => (
                            <div key={idx} className="flex justify-between items-center p-1.5 hover:bg-gray-800 rounded group">
                                <span className={rule.startsWith('@@') ? 'text-green-400' : 'text-red-400'}>
                                    {rule}
                                </span>
                                <button
                                    onClick={() => handleRemoveRule(rule)}
                                    className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-1"
                                >
                                    <X size={12} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* List Management Tabs */}
            <div className="space-y-6">
                <ListSection
                    title="Filter Blocklists"
                    description="DNS requests matching these lists will be blocked."
                    lists={filtering?.filters || []}
                    onToggle={(url: string, e: boolean) => handleToggleList(url, e, false)}
                    onRemove={(url: string) => handleRemoveList(url, false)}
                    onEdit={(list: FilterList) => {
                        setEditList({ name: list.name, url: list.url, whitelist: false });
                        setShowEditModal(list);
                    }}
                    onAdd={() => {
                        setNewList({ name: '', url: '', whitelist: false });
                        setShowAddModal(true);
                    }}
                    onBrowse={() => {
                        setNewList({ name: '', url: '', whitelist: false });
                        setShowPredefined(true);
                    }}
                    onRefresh={() => handleRefresh(false)}
                />

                <ListSection
                    title="Allow Whitelists"
                    description="Domains matching these lists will always be allowed, bypassing blocklists."
                    lists={filtering?.whitelist_filters || []}
                    onToggle={(url: string, e: boolean) => handleToggleList(url, e, true)}
                    onRemove={(url: string) => handleRemoveList(url, true)}
                    onEdit={(list: FilterList) => {
                        setEditList({ name: list.name, url: list.url, whitelist: true });
                        setShowEditModal(list);
                    }}
                    onAdd={() => {
                        setNewList({ name: '', url: '', whitelist: true });
                        setShowAddModal(true);
                    }}
                    onBrowse={() => {
                        setNewList({ name: '', url: '', whitelist: true });
                        setShowPredefined(true);
                    }}
                    onRefresh={() => handleRefresh(true)}
                    variant="whitelist"
                />
            </div>

            {/* Modals */}
            <AddListModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                data={newList}
                setData={setNewList}
                onSubmit={handleAddList}
            />

            <EditListModal
                isOpen={!!showEditModal}
                onClose={() => setShowEditModal(null)}
                data={editList}
                setData={setEditList}
                onSubmit={handleUpdateList}
            />

            <AddRuleModal
                isOpen={showRuleModal}
                onClose={() => setShowRuleModal(false)}
                rule={newRule}
                setRule={setNewRule}
                onSubmit={handleAddRule}
            />

            <PredefinedListsModal
                isOpen={showPredefined}
                onClose={() => setShowPredefined(false)}
                whitelist={newList.whitelist}
                onSelect={(name: string, url: string) => {
                    setNewList({ ...newList, name, url });
                    setShowPredefined(false);
                    setShowAddModal(true);
                }}
            />
        </div>
    );
}

function ListSection({ title, description, lists, onToggle, onRemove, onEdit, onAdd, onBrowse, onRefresh, variant = 'blocklist' }: any) {
    return (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-gray-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h3 className="text-lg font-medium text-white">{title}</h3>
                    <p className="text-sm text-gray-500">{description}</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <button
                        onClick={onRefresh}
                        className="p-2 text-gray-400 hover:text-white bg-gray-800 rounded-lg"
                        title="Update all"
                    >
                        <RefreshCw size={18} />
                    </button>
                    <button
                        onClick={onBrowse}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium border border-gray-700"
                    >
                        Browse Predefined
                    </button>
                    <button
                        onClick={onAdd}
                        className={`flex-1 md:flex-none flex items-center justify-center gap-2 ${variant === 'whitelist' ? 'bg-green-600 hover:bg-green-500' : 'bg-blue-600 hover:bg-blue-500'} text-white px-4 py-2 rounded-lg text-sm font-medium`}
                    >
                        <Plus size={18} />
                        Add List
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-950/50">
                        <tr>
                            <th className="px-6 py-3">Name</th>
                            <th className="px-6 py-3">Rules</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {lists.map((filter: any) => (
                            <tr key={filter.id} className="text-sm group hover:bg-gray-850 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="text-white font-medium">{filter.name}</div>
                                    <div className="text-xs text-gray-500 truncate max-w-[200px] md:max-w-md">{filter.url}</div>
                                </td>
                                <td className="px-6 py-4 text-gray-400 tabular-nums">{filter.rules_count?.toLocaleString()}</td>
                                <td className="px-6 py-4">
                                    <Switch
                                        checked={filter.enabled}
                                        onChange={(v) => onToggle(filter.url, v)}
                                    />
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => onEdit(filter)}
                                            className="text-gray-400 hover:text-white p-1"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => onRemove(filter.url)}
                                            className="text-gray-400 hover:text-red-400 p-1"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {lists.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-gray-500 italic">
                                    No lists configured.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function ProtectionToggle({ icon: Icon, color, title, description, checked, onChange, showDetails, onDetailsToggle, isOpen }: any) {
    return (
        <div className="flex items-center justify-between py-4 border-b border-gray-800 last:border-0">
            <div className="flex items-center gap-3">
                <Icon className={color} size={20} />
                <div>
                    <div className="flex items-center gap-2">
                        <div className="text-white font-medium">{title}</div>
                        {showDetails && (
                            <button onClick={onDetailsToggle} className="text-gray-500 hover:text-white transition-colors">
                                {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                        )}
                    </div>
                    <div className="text-sm text-gray-500">{description}</div>
                </div>
            </div>
            <Switch checked={checked} onChange={onChange} />
        </div>
    );
}

// Modal Components
function AddListModal({ isOpen, onClose, data, setData, onSubmit }: any) {
    if (!isOpen) return null;
    return (
        <Modal title={data.whitelist ? "Add Whitelist" : "Add Blocklist"} onClose={onClose}>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Name</label>
                    <input
                        type="text"
                        value={data.name}
                        onChange={(e) => setData({ ...data, name: e.target.value })}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                        placeholder="e.g. My Custom List"
                        autoFocus
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">URL</label>
                    <input
                        type="text"
                        value={data.url}
                        onChange={(e) => setData({ ...data, url: e.target.value })}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                        placeholder="https://example.com/rules.txt"
                    />
                </div>
            </div>
            <div className="flex justify-end gap-3 mt-8">
                <button onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-white">Cancel</button>
                <button
                    onClick={onSubmit}
                    className={`flex items-center gap-2 ${data.whitelist ? 'bg-green-600 hover:bg-green-500' : 'bg-blue-600 hover:bg-blue-500'} text-white px-6 py-2 rounded-lg font-medium`}
                >
                    <Check size={18} />
                    Add List
                </button>
            </div>
        </Modal>
    );
}

function EditListModal({ isOpen, onClose, data, setData, onSubmit }: any) {
    if (!isOpen) return null;
    return (
        <Modal title="Edit List" onClose={onClose}>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Name</label>
                    <input
                        type="text"
                        value={data.name}
                        onChange={(e) => setData({ ...data, name: e.target.value })}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">URL</label>
                    <input
                        type="text"
                        value={data.url}
                        onChange={(e) => setData({ ...data, url: e.target.value })}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                    />
                </div>
            </div>
            <div className="flex justify-end gap-3 mt-8">
                <button onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-white">Cancel</button>
                <button
                    onClick={onSubmit}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-medium"
                >
                    <Check size={18} />
                    Save Changes
                </button>
            </div>
        </Modal>
    );
}

function AddRuleModal({ isOpen, onClose, rule, setRule, onSubmit }: any) {
    if (!isOpen) return null;
    return (
        <Modal title="Add Custom Rule" onClose={onClose}>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Rule Syntax</label>
                    <input
                        type="text"
                        value={rule}
                        onChange={(e) => setRule(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                        placeholder="||example.com^"
                        autoFocus
                    />
                    <p className="text-xs text-gray-500 mt-3 bg-gray-950 p-2 rounded">
                        <strong>Allow:</strong> <code>@@||domain.com^</code><br />
                        <strong>Block:</strong> <code>||domain.com^</code>
                    </p>
                </div>
            </div>
            <div className="flex justify-end gap-3 mt-8">
                <button onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-white">Cancel</button>
                <button
                    onClick={onSubmit}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-medium"
                >
                    <Check size={18} />
                    Add Rule
                </button>
            </div>
        </Modal>
    );
}

function PredefinedListsModal({ isOpen, onClose, whitelist, onSelect }: any) {
    if (!isOpen) return null;
    const lists = whitelist ? PREDEFINED_WHITELISTS : PREDEFINED_BLOCKLISTS;
    return (
        <Modal title={whitelist ? "Browse Whitelists" : "Browse Blocklists"} onClose={onClose} maxWidth="max-w-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {lists.map((list) => (
                    <div key={list.url} className="p-4 bg-gray-800 hover:bg-gray-750 border border-gray-700 rounded-xl transition-colors flex flex-col justify-between">
                        <div>
                            <h4 className="text-white font-medium mb-1">{list.name}</h4>
                            <p className="text-xs text-gray-500 mb-3 line-clamp-2">{list.description}</p>
                        </div>
                        <button
                            onClick={() => onSelect(list.name, list.url)}
                            className="w-full text-center py-2 bg-gray-900 hover:bg-black text-blue-400 text-sm font-medium rounded-lg transition-colors border border-gray-700"
                        >
                            Select This List
                        </button>
                    </div>
                ))}
            </div>
        </Modal>
    );
}

function Modal({ children, title, onClose, maxWidth = "max-w-md" }: any) {
    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className={`bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl w-full ${maxWidth} overflow-hidden`}>
                <div className="px-6 py-4 border-b border-gray-800 flex justify-between items-center bg-gray-900/50">
                    <h3 className="text-xl font-semibold text-white">{title}</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-6">
                    {children}
                </div>
            </div>
        </div>
    );
}

function Switch({ checked, onChange, size = 'md' }: { checked: boolean; onChange: (v: boolean) => void; size?: 'sm' | 'md' }) {
    const isSm = size === 'sm';
    return (
        <button
            onClick={() => onChange(!checked)}
            className={`${isSm ? 'w-8 h-4.5' : 'w-11 h-6'} rounded-full relative transition-colors ${checked ? 'bg-blue-600' : 'bg-gray-700'}`}
        >
            <div className={`absolute top-1 left-1 bg-white ${isSm ? 'w-2.5 h-2.5 translate-x-0' : 'w-4 h-4'} rounded-full transition-transform ${checked ? (isSm ? 'translate-x-3.5' : 'translate-x-5') : ''}`} />
        </button>
    );
}
