'use client';

import { useEffect, useState } from 'react';
import { PREDEFINED_BLOCKLISTS, PREDEFINED_WHITELISTS } from '@/constants/predefined-lists';
import {
    RefreshCw, Plus, Trash2, Check, X, Shield, ShieldCheck,
    Baby, Search, Edit2, Info, ExternalLink, ChevronDown, ChevronUp,
    Globe, Server, Laptop, Smartphone, Tablet, Tv, Cpu, Filter, Network, Users
} from 'lucide-react';
import Link from 'next/link';

// --- Interfaces ---

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

interface AdGuardClient {
    name: string;
    ids: string[];
    use_global_settings: boolean;
    filtering_enabled: boolean;
    parental_enabled: boolean;
    safebrowsing_enabled: boolean;
    safesearch_enabled: boolean;
    use_global_blocked_services: boolean;
    blocked_services: string[];
    upstreams: string[];
    tags?: string[];
}

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

export default function FilteringPage() {
    const [activeTab, setActiveTab] = useState<'global' | 'clients' | 'forwarding'>('global');
    const [loading, setLoading] = useState(false);

    // Global State
    const [filtering, setFiltering] = useState<FilteringStatus | null>(null);
    const [protection, setProtection] = useState<ProtectionStatus | null>(null);

    // Clients State
    const [clients, setClients] = useState<AdGuardClient[]>([]);
    const [selectedClient, setSelectedClient] = useState<string>(''); // Client name

    // Forwarding State
    const [zones, setZones] = useState<Zone[]>([]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Always fetch basics, optimize later
            const [filterRes, protectionRes, clientsRes, zonesRes] = await Promise.all([
                fetch('/api/adguard/filtering'),
                fetch('/api/adguard/protection'),
                fetch('/api/adguard/clients'),
                fetch('/api/zones'),
            ]);

            const filterData = await filterRes.json();
            const protectionData = await protectionRes.json();
            const clientsData = await clientsRes.json();
            const zonesData = await zonesRes.json();

            setFiltering(filterData);
            setProtection(protectionData);
            setClients(clientsData.clients || []);
            setZones(zonesData.zones || []);

        } catch (err) {
            console.error('Failed to fetch data:', err);
        }
        setLoading(false);
    };

    useEffect(() => { fetchData(); }, []);

    return (
        <div className="p-4 md:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-2">Filtering & Access Control</h1>
                    <p className="text-gray-400 text-sm md:text-base">Manage global lists, per-client rules, and DNS forwarding.</p>
                </div>
                <button
                    onClick={fetchData}
                    className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                >
                    <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 bg-gray-900/50 p-1 rounded-xl border border-gray-800 w-fit">
                <TabButton
                    active={activeTab === 'global'}
                    onClick={() => setActiveTab('global')}
                    icon={Shield}
                    label="Global Rules"
                />
                <TabButton
                    active={activeTab === 'clients'}
                    onClick={() => setActiveTab('clients')}
                    icon={Users}
                    label="Client Rules"
                />
                <TabButton
                    active={activeTab === 'forwarding'}
                    onClick={() => setActiveTab('forwarding')}
                    icon={Network}
                    label="Forwarding / Zones"
                />
            </div>

            {/* Tab Content */}
            <div className="min-h-[400px]">
                {activeTab === 'global' && filtering && protection && (
                    <GlobalFilteringTab
                        filtering={filtering}
                        protection={protection}
                        setFiltering={setFiltering}
                        setProtection={setProtection}
                        refresh={fetchData}
                    />
                )}
                {activeTab === 'clients' && (
                    <ClientFilteringTab
                        clients={clients}
                        selectedClient={selectedClient}
                        setSelectedClient={setSelectedClient}
                        userRules={filtering?.user_rules || []}
                        refresh={fetchData}
                    />
                )}
                {activeTab === 'forwarding' && (
                    <ForwardingTab
                        zones={zones}
                        refresh={fetchData}
                    />
                )}
            </div>
        </div>
    );
}

// --- Tab Components ---

function GlobalFilteringTab({ filtering, protection, setFiltering, setProtection, refresh }: any) {
    // ... Logic from original FilteringPage ...
    // State handled here or passed up? Locals are fine for modals.
    const [showAddModal, setShowAddModal] = useState(false);
    const [newList, setNewList] = useState({ name: '', url: '', whitelist: false });
    const [showEditModal, setShowEditModal] = useState<FilterList | null>(null);
    const [editList, setEditList] = useState({ name: '', url: '', whitelist: false });
    const [showPredefined, setShowPredefined] = useState(false);
    const [showRuleModal, setShowRuleModal] = useState(false);
    const [newRule, setNewRule] = useState('');
    const [showDocs, setShowDocs] = useState(false);
    const [showSafeSearchDetails, setShowSafeSearchDetails] = useState(false);

    // Handlers (moved from original)
    const toggleProtection = async (setting: string, enabled: boolean) => {
        // Optimistic update
        setProtection((prev: any) => ({ ...prev, [`${setting}Enabled`]: enabled }));
        try {
            await fetch('/api/adguard/protection', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ setting, enabled }),
            });
            refresh();
        } catch (e) {
            console.error(e);
            refresh(); // Revert on error
        }
    };

    const toggleSafeSearchEngine = async (engine: string, enabled: boolean) => {
        if (!protection?.safeSearchConfig) return;
        const newConfig = { ...protection.safeSearchConfig, [engine]: enabled };
        try {
            await fetch('/api/adguard/protection', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ setting: 'safeSearchConfig', config: newConfig }),
            });
            refresh();
        } catch (e) { console.error(e); }
    };

    // List Ops
    const handleListOp = async (action: string, body: any) => {
        await fetch('/api/adguard/filtering', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, ...body }),
        });
        refresh();
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            {/* Protection Switches */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                    <h3 className="text-lg font-medium text-white mb-4">Protection Settings</h3>
                    <div className="space-y-1">
                        <ProtectionToggle
                            icon={Shield} color="text-blue-400" title="DNS Protection"
                            description="Enable DNS filtering and blocking"
                            checked={protection?.protectionEnabled ?? false}
                            onChange={(v: boolean) => toggleProtection('protection', v)}
                        />
                        <ProtectionToggle
                            icon={Baby} color="text-pink-400" title="Parental Control"
                            description="Block adult content"
                            checked={protection?.parentalEnabled ?? false}
                            onChange={(v: boolean) => toggleProtection('parental', v)}
                        />
                        <ProtectionToggle
                            icon={ShieldCheck} color="text-green-400" title="Safe Browsing"
                            description="Block malware and phishing domains"
                            checked={protection?.safeBrowsingEnabled ?? false}
                            onChange={(v: boolean) => toggleProtection('safeBrowsing', v)}
                        />
                        <ProtectionToggle
                            icon={Search} color="text-yellow-400" title="Safe Search"
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
                                            <Switch size="sm" checked={enabled as boolean} onChange={(v) => toggleSafeSearchEngine(engine, v)} />
                                        </div>
                                    )
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Custom Rules (Global) */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-lg font-medium text-white">Global Custom Rules</h3>
                            <p className="text-sm text-gray-500">Manually block or allow domains for everyone.</p>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setShowDocs(!showDocs)} className="p-2 text-gray-400 hover:text-white bg-gray-800 rounded-lg"><Info size={18} /></button>
                            <button onClick={() => setShowRuleModal(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium"><Plus size={18} /> Add Rule</button>
                        </div>
                    </div>
                    {showDocs && (
                        <div className="mb-4 p-4 bg-blue-600/10 border border-blue-600/20 rounded-lg text-sm text-blue-100 space-y-2">
                            <p><strong>Syntax Examples:</strong></p>
                            <ul className="list-disc ml-5 space-y-1 text-blue-200/80">
                                <li><code>||example.com^</code> - Block domain</li>
                                <li><code>@@||example.com^</code> - Whitelist domain</li>
                            </ul>
                        </div>
                    )}
                    <div className="space-y-1 font-mono text-xs max-h-48 overflow-y-auto bg-gray-950/30 p-3 rounded-lg border border-gray-800">
                        {filtering?.user_rules?.filter((r: string) => !r.includes('$client=') && !r.includes('$ctag=')).map((rule: string, idx: number) => (
                            <div key={idx} className="flex justify-between items-center p-1.5 hover:bg-gray-800 rounded group">
                                <span className={rule.startsWith('@@') ? 'text-green-400' : 'text-red-400'}>{rule}</span>
                                <button onClick={() => handleListOp('removeRule', { rule })} className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-1"><X size={12} /></button>
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
                    onToggle={(url: string, e: boolean) => handleListOp('toggle', { url, enabled: e, whitelist: false })}
                    onRemove={(url: string) => handleListOp('remove', { url, whitelist: false })}
                    onEdit={(list: FilterList) => { setEditList({ name: list.name, url: list.url, whitelist: false }); setShowEditModal(list); }}
                    onAdd={() => { setNewList({ name: '', url: '', whitelist: false }); setShowAddModal(true); }}
                    onBrowse={() => { setNewList({ name: '', url: '', whitelist: false }); setShowPredefined(true); }}
                    onRefresh={() => handleListOp('refresh', { whitelist: false })}
                />

                <ListSection
                    title="Allow Whitelists"
                    description="Domains matching these lists will always be allowed."
                    lists={filtering?.whitelist_filters || []}
                    onToggle={(url: string, e: boolean) => handleListOp('toggle', { url, enabled: e, whitelist: true })}
                    onRemove={(url: string) => handleListOp('remove', { url, whitelist: true })}
                    onEdit={(list: FilterList) => { setEditList({ name: list.name, url: list.url, whitelist: true }); setShowEditModal(list); }}
                    onAdd={() => { setNewList({ name: '', url: '', whitelist: true }); setShowAddModal(true); }}
                    onBrowse={() => { setNewList({ name: '', url: '', whitelist: true }); setShowPredefined(true); }}
                    onRefresh={() => handleListOp('refresh', { whitelist: true })}
                    variant="whitelist"
                />
            </div>

            {/* Modals from Global */}
            <AddListModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} data={newList} setData={setNewList} onSubmit={() => { handleListOp('add', newList); setShowAddModal(false); }} />
            <EditListModal isOpen={!!showEditModal} onClose={() => setShowEditModal(null)} data={editList} setData={setEditList} onSubmit={() => { handleListOp('update', { url: showEditModal?.url, name: editList.name, newUrl: editList.url, whitelist: editList.whitelist }); setShowEditModal(null); }} />
            <AddRuleModal isOpen={showRuleModal} onClose={() => setShowRuleModal(false)} rule={newRule} setRule={setNewRule} onSubmit={() => { handleListOp('addRule', { rule: newRule }); setNewRule(''); setShowRuleModal(false); }} />
            <PredefinedListsModal isOpen={showPredefined} onClose={() => setShowPredefined(false)} whitelist={newList.whitelist} onSelect={(name: string, url: string) => { setNewList({ ...newList, name, url }); setShowPredefined(false); setShowAddModal(true); }} />

        </div>
    );
}

function ClientFilteringTab({ clients, selectedClient, setSelectedClient, userRules, refresh }: any) {
    const [whitelistInput, setWhitelistInput] = useState('');
    const [blocklistInput, setBlocklistInput] = useState('');

    const handleAddRule = async (domain: string, type: 'allow' | 'block') => {
        if (!selectedClient || !domain) return;
        const rule = type === 'allow'
            ? `@@||${domain}^$client='${selectedClient}'`
            : `||${domain}^$client='${selectedClient}'`;

        await fetch('/api/adguard/filtering', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'addRule', rule })
        });
        refresh();
    };

    const handleRemoveRule = async (rule: string) => {
        await fetch('/api/adguard/filtering', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'removeRule', rule })
        });
        refresh();
    };

    const clientRules = userRules.filter((r: string) => r.includes(`$client='${selectedClient}'`));
    const whitelisted = clientRules.filter((r: string) => r.startsWith('@@||'));
    const blocked = clientRules.filter((r: string) => r.startsWith('||'));

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Client Selector */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <label className="block text-sm font-medium text-gray-400 mb-2">Select Client to Manage</label>
                <div className="relative">
                    <select
                        value={selectedClient}
                        onChange={(e) => setSelectedClient(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white appearance-none focus:outline-none focus:border-blue-500"
                    >
                        <option value="">-- Choose a Client --</option>
                        {clients.map((c: any) => (
                            <option key={c.name} value={c.name}>{c.name} ({c.ids.join(', ')})</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={16} />
                </div>
            </div>

            {selectedClient ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Blocklist */}
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col h-[500px]">
                        <h3 className="text-lg font-medium text-white mb-1 flex items-center gap-2">
                            <Shield className="text-red-400" size={20} /> Blocked Domains
                        </h3>
                        <p className="text-xs text-gray-500 mb-4">Domains strictly blocked for <strong>{selectedClient}</strong>.</p>

                        <div className="flex gap-2 mb-4">
                            <input
                                type="text"
                                value={blocklistInput}
                                onChange={(e) => setBlocklistInput(e.target.value)}
                                placeholder="example.com"
                                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
                                onKeyDown={(e) => e.key === 'Enter' && (handleAddRule(blocklistInput, 'block'), setBlocklistInput(''))}
                            />
                            <button onClick={() => { handleAddRule(blocklistInput, 'block'); setBlocklistInput(''); }} disabled={!blocklistInput} className="bg-red-600 hover:bg-red-500 text-white p-2 rounded-lg"><Plus size={18} /></button>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-2 bg-gray-950/30 p-2 rounded-lg border border-gray-800/50">
                            {blocked.map((rule: string) => (
                                <div key={rule} className="flex justify-between items-center p-2 bg-gray-800/50 rounded group border border-transparent hover:border-red-500/20">
                                    <span className="text-sm font-mono text-gray-300">{rule.replace('||', '').split('^')[0]}</span>
                                    <button onClick={() => handleRemoveRule(rule)} className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100"><Trash2 size={14} /></button>
                                </div>
                            ))}
                            {blocked.length === 0 && <div className="text-gray-600 text-sm text-center py-4">No blocked domains</div>}
                        </div>
                    </div>

                    {/* Whitelist */}
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col h-[500px]">
                        <h3 className="text-lg font-medium text-white mb-1 flex items-center gap-2">
                            <Check className="text-green-400" size={20} /> Allowed Domains
                        </h3>
                        <p className="text-xs text-gray-500 mb-4">Domains allowed for <strong>{selectedClient}</strong> (bypasses blocklists).</p>

                        <div className="flex gap-2 mb-4">
                            <input
                                type="text"
                                value={whitelistInput}
                                onChange={(e) => setWhitelistInput(e.target.value)}
                                placeholder="example.com"
                                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
                                onKeyDown={(e) => e.key === 'Enter' && (handleAddRule(whitelistInput, 'allow'), setWhitelistInput(''))}
                            />
                            <button onClick={() => { handleAddRule(whitelistInput, 'allow'); setWhitelistInput(''); }} disabled={!whitelistInput} className="bg-green-600 hover:bg-green-500 text-white p-2 rounded-lg"><Plus size={18} /></button>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-2 bg-gray-950/30 p-2 rounded-lg border border-gray-800/50">
                            {whitelisted.map((rule: string) => (
                                <div key={rule} className="flex justify-between items-center p-2 bg-gray-800/50 rounded group border border-transparent hover:border-green-500/20">
                                    <span className="text-sm font-mono text-gray-300">{rule.replace('@@||', '').split('^')[0]}</span>
                                    <button onClick={() => handleRemoveRule(rule)} className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100"><Trash2 size={14} /></button>
                                </div>
                            ))}
                            {whitelisted.length === 0 && <div className="text-gray-600 text-sm text-center py-4">No allowed domains</div>}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-center py-20 bg-gray-900/50 border-2 border-dashed border-gray-800 rounded-xl">
                    <Users size={48} className="mx-auto text-gray-700 mb-4" />
                    <p className="text-gray-500 text-lg">Select a client to manage their specific rules.</p>
                </div>
            )}
        </div>
    );
}

function ForwardingTab({ zones, refresh }: any) {
    const [showCreateModal, setShowCreateModal] = useState(false);
    // State for creating zone (simplified from zones/page.tsx)
    const [newZone, setNewZone] = useState({
        name: '', type: 'ConditionalForwarder', isActiveDirectory: false,
        dcServers: '', forwarder: '', protocol: 'Udp'
    });
    const [selectedProvider, setSelectedProvider] = useState('');
    const [creating, setCreating] = useState(false);

    const handleCreateZone = async () => {
        // ... Validation logic ...
        setCreating(true);
        try {
            await fetch('/api/zones', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'create', zone: newZone.name, type: newZone.type, isActiveDirectory: newZone.isActiveDirectory, dcServers: newZone.dcServers, forwarder: newZone.forwarder, protocol: newZone.protocol }),
            });
            setShowCreateModal(false);
            refresh();
        } catch (e) { console.error(e); }
        setCreating(false);
    };

    const handleDeleteZone = async (zone: Zone) => {
        if (!confirm(`Delete zone ${zone.name}?`)) return;
        try {
            await fetch('/api/zones', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'delete', zone: zone.name }),
            });
            refresh();
        } catch (e) { console.error(e); }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex justify-end">
                <button onClick={() => setShowCreateModal(true)} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                    <Plus size={18} /> Add Forwarding Zone
                </button>
            </div>

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
                                <td className="px-6 py-4"><span className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded">{zone.source === 'active-directory' ? 'AD Domain' : zone.type}</span></td>
                                <td className="px-6 py-4 text-gray-400 font-mono text-sm">{zone.source === 'active-directory' ? zone.dcServers : (zone.forwarder || 'Local')}</td>
                                <td className="px-6 py-4 text-green-400 text-xs flex items-center gap-1"><Check size={12} /> Active</td>
                                <td className="px-6 py-4 text-right">
                                    <button onClick={() => handleDeleteZone(zone)} className="text-gray-500 hover:text-red-400"><Trash2 size={16} /></button>
                                </td>
                            </tr>
                        ))}
                        {zones.length === 0 && <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No forwarding zones configured.</td></tr>}
                    </tbody>
                </table>
            </div>

            {/* Reuse Create Modal UI structure roughly */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-lg">
                        <h3 className="text-lg font-medium text-white mb-4">Add Forwarding Zone</h3>
                        <div className="space-y-4">
                            <input type="text" placeholder="Domain (e.g. internal.corp)" value={newZone.name} onChange={e => setNewZone({ ...newZone, name: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white" />

                            <select value={newZone.type} onChange={e => setNewZone({ ...newZone, type: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white">
                                <option value="ConditionalForwarder">Conditional Forwarder</option>
                                <option value="Primary">Primary (Authoritative)</option>
                            </select>

                            {newZone.type === 'ConditionalForwarder' && (
                                <>
                                    <select onChange={(e) => {
                                        const p = e.target.value; setSelectedProvider(p);
                                        if (p && PROVIDERS[p]) setNewZone({ ...newZone, forwarder: PROVIDERS[p].protocols[newZone.protocol] });
                                    }} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white">
                                        <option value="">Select Provider...</option>
                                        {Object.keys(PROVIDERS).map(k => <option key={k} value={k}>{k}</option>)}
                                    </select>
                                    <input type="text" placeholder="Forwarder IP (e.g. 1.1.1.1)" value={newZone.forwarder} onChange={e => setNewZone({ ...newZone, forwarder: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white" />
                                </>
                            )}
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-white">Cancel</button>
                            <button onClick={handleCreateZone} disabled={creating} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg">{creating ? 'Creating...' : 'Create Zone'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// --- Helper Components ---

function TabButton({ active, onClick, icon: Icon, label }: any) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${active ? 'bg-gray-800 text-white shadow-sm' : 'text-gray-400 hover:text-white hover:bg-gray-800/50'}`}
        >
            <Icon size={16} />
            {label}
        </button>
    );
}

// Reused components from original file (simplified for brevity in this replace, assume they exist or I paste them back)
// I need to include the Modal Components defined in the original file to avoid errors.

function ProtectionToggle({ icon: Icon, color, title, description, checked, onChange, showDetails, onDetailsToggle, isOpen }: any) {
    return (
        <div className="flex items-center justify-between py-4 border-b border-gray-800 last:border-0">
            <div className="flex items-center gap-3">
                <Icon className={color} size={20} />
                <div>
                    <div className="flex items-center gap-2">
                        <div className="text-white font-medium">{title}</div>
                        {showDetails && <button onClick={onDetailsToggle} className="text-gray-500">{isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</button>}
                    </div>
                    <div className="text-sm text-gray-500">{description}</div>
                </div>
            </div>
            <Switch checked={checked} onChange={onChange} />
        </div>
    );
}

function ListSection({ title, description, lists, onToggle, onRemove, onEdit, onAdd, onBrowse, onRefresh, variant = 'blocklist' }: any) {
    return (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-gray-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div><h3 className="text-lg font-medium text-white">{title}</h3><p className="text-sm text-gray-500">{description}</p></div>
                <div className="flex gap-2 w-full md:w-auto">
                    <button onClick={onRefresh} className="p-2 text-gray-400 hover:text-white bg-gray-800 rounded-lg"><RefreshCw size={18} /></button>
                    <button onClick={onBrowse} className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium border border-gray-700">Browse Predefined</button>
                    <button onClick={onAdd} className={`flex items-center gap-2 ${variant === 'whitelist' ? 'bg-green-600 hover:bg-green-500' : 'bg-blue-600 hover:bg-blue-500'} text-white px-4 py-2 rounded-lg text-sm font-medium`}><Plus size={18} /> Add List</button>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-950/50"><tr><th className="px-6 py-3">Name</th><th className="px-6 py-3">Rules</th><th className="px-6 py-3">Status</th><th className="px-6 py-3 text-right">Actions</th></tr></thead>
                    <tbody className="divide-y divide-gray-800">
                        {lists.map((filter: any) => (
                            <tr key={filter.id} className="text-sm group hover:bg-gray-850 transition-colors">
                                <td className="px-6 py-4"><div className="text-white font-medium">{filter.name}</div><div className="text-xs text-gray-500 truncate max-w-md">{filter.url}</div></td>
                                <td className="px-6 py-4 text-gray-400 tabular-nums">{filter.rules_count?.toLocaleString()}</td>
                                <td className="px-6 py-4"><Switch checked={filter.enabled} onChange={(v) => onToggle(filter.url, v)} /></td>
                                <td className="px-6 py-4 text-right"><div className="flex justify-end gap-2"><button onClick={() => onEdit(filter)} className="text-gray-400 hover:text-white"><Edit2 size={16} /></button><button onClick={() => onRemove(filter.url)} className="text-gray-400 hover:text-red-400"><Trash2 size={16} /></button></div></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// Modals
function AddListModal({ isOpen, onClose, data, setData, onSubmit }: any) {
    if (!isOpen) return null;
    return (
        <Modal title={data.whitelist ? "Add Whitelist" : "Add Blocklist"} onClose={onClose}>
            <div className="space-y-4">
                <input type="text" value={data.name} onChange={(e) => setData({ ...data, name: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white" placeholder="Name" autoFocus />
                <input type="text" value={data.url} onChange={(e) => setData({ ...data, url: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white" placeholder="URL" />
            </div>
            <div className="flex justify-end gap-3 mt-8"><button onClick={onClose} className="text-gray-400">Cancel</button><button onClick={onSubmit} className="bg-blue-600 text-white px-6 py-2 rounded-lg">Add</button></div>
        </Modal>
    );
}

function EditListModal({ isOpen, onClose, data, setData, onSubmit }: any) {
    if (!isOpen) return null;
    return (
        <Modal title="Edit List" onClose={onClose}>
            <div className="space-y-4">
                <input type="text" value={data.name} onChange={(e) => setData({ ...data, name: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white" />
                <input type="text" value={data.url} onChange={(e) => setData({ ...data, url: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white" />
            </div>
            <div className="flex justify-end gap-3 mt-8"><button onClick={onClose} className="text-gray-400">Cancel</button><button onClick={onSubmit} className="bg-blue-600 text-white px-6 py-2 rounded-lg">Save</button></div>
        </Modal>
    );
}

function AddRuleModal({ isOpen, onClose, rule, setRule, onSubmit }: any) {
    if (!isOpen) return null;
    return (
        <Modal title="Add Custom Rule" onClose={onClose}>
            <input type="text" value={rule} onChange={(e) => setRule(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white font-mono" placeholder="||example.com^" autoFocus />
            <div className="flex justify-end gap-3 mt-8"><button onClick={onClose} className="text-gray-400">Cancel</button><button onClick={onSubmit} className="bg-blue-600 text-white px-6 py-2 rounded-lg">Add Rule</button></div>
        </Modal>
    );
}

function PredefinedListsModal({ isOpen, onClose, whitelist, onSelect }: any) {
    if (!isOpen) return null;
    const lists = whitelist ? PREDEFINED_WHITELISTS : PREDEFINED_BLOCKLISTS;
    return (
        <Modal title="Browse Lists" onClose={onClose} maxWidth="max-w-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto">
                {lists.map((list) => (
                    <div key={list.url} className="p-4 bg-gray-800 border border-gray-700 rounded-xl">
                        <h4 className="text-white font-medium mb-1">{list.name}</h4>
                        <p className="text-xs text-gray-500 mb-3 line-clamp-2">{list.description}</p>
                        <button onClick={() => onSelect(list.name, list.url)} className="w-full py-2 bg-gray-900 text-blue-400 text-sm font-medium rounded-lg border border-gray-700">Select</button>
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
                <div className="px-6 py-4 border-b border-gray-800 flex justify-between items-center bg-gray-900/50"><h3 className="text-xl font-semibold text-white">{title}</h3><button onClick={onClose}><X size={20} className="text-gray-500 hover:text-white" /></button></div>
                <div className="p-6">{children}</div>
            </div>
        </div>
    );
}

function Switch({ checked, onChange, size = 'md' }: { checked: boolean; onChange: (v: boolean) => void; size?: 'sm' | 'md' }) {
    const isSm = size === 'sm';
    return (
        <button onClick={() => onChange(!checked)} className={`${isSm ? 'w-8 h-4.5' : 'w-11 h-6'} rounded-full relative transition-colors ${checked ? 'bg-blue-600' : 'bg-gray-700'}`}>
            <div className={`absolute top-1 left-1 bg-white ${isSm ? 'w-2.5 h-2.5 translate-x-0' : 'w-4 h-4'} rounded-full transition-transform ${checked ? (isSm ? 'translate-x-3.5' : 'translate-x-5') : ''}`} />
        </button>
    );
}
