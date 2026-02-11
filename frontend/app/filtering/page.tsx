'use client';

import { useTranslation } from '@/lib/i18n-context';

import { useEffect, useState, useRef } from 'react';
import { PREDEFINED_BLOCKLISTS, PREDEFINED_WHITELISTS } from '@/constants/predefined-lists';
import {
    RefreshCw, Plus, Trash2, Check, X, Shield, ShieldCheck,
    Baby, Search, Edit2, Info, ExternalLink, ChevronDown, ChevronUp,
    Globe, Server, Laptop, Smartphone, Tablet, Tv, Cpu, Filter, Users, Upload,
    LayoutGrid, LayoutList
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

interface Lease {
    mac: string;
    ip: string;
    hostname: string;
    expires?: string;
    isStatic?: boolean;
}



export default function FilteringPage() {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<'global' | 'clients'>('global');
    const [loading, setLoading] = useState(false);

    // Global State
    const [filtering, setFiltering] = useState<FilteringStatus | null>(null);
    const [protection, setProtection] = useState<ProtectionStatus | null>(null);

    // Clients State
    const [clients, setClients] = useState<AdGuardClient[]>([]);
    const [leases, setLeases] = useState<Lease[]>([]);
    const [selectedClient, setSelectedClient] = useState<string>(''); // Client name



    const fetchData = async () => {
        setLoading(true);
        try {
            // Always fetch basics, optimize later
            const [filterRes, protectionRes, clientsRes, dhcpRes] = await Promise.all([
                fetch('/api/adguard/filtering'),
                fetch('/api/adguard/protection'),
                fetch('/api/adguard/clients'),
                fetch('/api/adguard/dhcp'),
            ]);

            const filterData = await filterRes.json();
            const protectionData = await protectionRes.json();
            const clientsData = await clientsRes.json();
            const dhcpData = await dhcpRes.json();

            setFiltering(filterData);
            setProtection(protectionData);
            setClients(clientsData.clients || []);

            // Handle DHCP status possibly being disabled/empty
            const activeLeases: Lease[] = [];
            if (dhcpData) {
                if (dhcpData.leases) {
                    activeLeases.push(...dhcpData.leases.map((l: any) => ({ ...l, isStatic: false })));
                }
                if (dhcpData.static_leases) {
                    activeLeases.push(...dhcpData.static_leases.map((l: any) => ({ ...l, isStatic: true })));
                }
            }
            setLeases(activeLeases);

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
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-2">{t('filtering.title')}</h1>
                    <p className="text-gray-400 text-sm md:text-base">{t('filtering.subtitle')}</p>
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
                    label={t('filtering.global_rules')}
                />
                <TabButton
                    active={activeTab === 'clients'}
                    onClick={() => setActiveTab('clients')}
                    icon={Users}
                    label={t('filtering.client_rules')}
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
                        leases={leases}
                        selectedClient={selectedClient}
                        setSelectedClient={setSelectedClient}
                        userRules={filtering?.user_rules || []}
                        refresh={fetchData}
                    />
                )}

            </div>
        </div>
    );
}

// --- Tab Components ---

function GlobalFilteringTab({ filtering, protection, setFiltering, setProtection, refresh }: any) {
    const { t } = useTranslation();
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
    const [showImportCSV, setShowImportCSV] = useState(false);
    const [importWhitelist, setImportWhitelist] = useState(false);
    const [returnToPredefined, setReturnToPredefined] = useState(false);

    // State for timer
    const [pauseTimer, setPauseTimer] = useState<number | null>(null);
    const [showTimerMenu, setShowTimerMenu] = useState(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Clear timer on unmount
    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    const startPauseTimer = async (minutes: number) => {
        // Protection is already disabled at this point, just set the timer
        setShowTimerMenu(false);
        try {
            const res = await fetch('/api/adguard/protection', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ setting: 'protection', enabled: false, duration: minutes }),
            });

            if (!res.ok) throw new Error('Failed to set pause timer');

            // Re-fetch to get the exact pauseUntil from server
            refresh();
        } catch (e) {
            console.error(e);
            alert(t('filtering.failed_pause_timer'));
        }
    };

    // Helper to sync timer with server state
    useEffect(() => {
        if (protection?.pauseUntil) {
            const remaining = Math.max(0, Math.floor((protection.pauseUntil - Date.now()) / 1000));
            setPauseTimer(remaining);
            setShowTimerMenu(false);

            if (timerRef.current) clearInterval(timerRef.current);
            timerRef.current = setInterval(() => {
                setPauseTimer((prev) => {
                    if (prev === null || prev <= 1) {
                        if (timerRef.current) clearInterval(timerRef.current);
                        // No need to call toggleProtection(true) here as the backend status check will handle it
                        // but refreshing helps the UI catch up
                        refresh();
                        return null;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            setPauseTimer(null);
            if (timerRef.current) clearInterval(timerRef.current);
        }
    }, [protection?.pauseUntil]);

    const cancelPause = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        setPauseTimer(null);
        toggleProtection('protection', true);
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    // Handlers (moved from original)
    const toggleProtection = async (setting: string, enabled: boolean, duration?: number) => {
        // Optimistic update
        const previousStatus = { ...protection };
        setProtection((prev: any) => ({ ...prev, [`${setting}Enabled`]: enabled }));

        // If turning OFF DNS Protection, show timer menu
        if (setting === 'protection' && !enabled && !duration) {
            setShowTimerMenu(true);
        } else if (setting === 'protection' && enabled) {
            // If turning ON, cancel any active timer
            if (timerRef.current) clearInterval(timerRef.current);
            setPauseTimer(null);
            setShowTimerMenu(false);
        }

        try {
            const res = await fetch('/api/adguard/protection', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ setting, enabled, duration }),
            });

            if (!res.ok) throw new Error('Failed to update protection');

            // Re-fetch to get the exact pauseUntil from server
            refresh();
        } catch (e) {
            console.error(e);
            setProtection(previousStatus); // Revert on error
            alert(`${t('filtering.failed_update_protection')} ${setting}.`);
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
        // Optimistic update for toggle
        let previousFiltering = filtering ? { ...filtering } : null;
        if (action === 'toggle' && filtering) {
            const listKey = body.whitelist ? 'whitelist_filters' : 'filters';
            const updatedLists = filtering[listKey as keyof FilteringStatus].map((f: any) =>
                f.url === body.url ? { ...f, enabled: body.enabled } : f
            );
            setFiltering({ ...filtering, [listKey]: updatedLists });
        }

        try {
            const res = await fetch('/api/adguard/filtering', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, ...body }),
            });

            if (!res.ok) throw new Error('Action failed');

            // For toggle, we don't strictly need a full refresh if optimistic worked
            if (action !== 'toggle') {
                refresh();
            }
        } catch (e) {
            console.error(e);
            if (action === 'toggle') setFiltering(previousFiltering);
            alert(`${t('filtering.action_failed')} "${action}".`);
            refresh(); // Ensure synced state
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            {/* Protection Switches */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                    <h3 className="text-lg font-medium text-white mb-4">{t('filtering.protection_settings')}</h3>
                    <div className="space-y-1">
                        <ProtectionToggle
                            icon={Shield} color="text-blue-400" title={t('filtering.dns_protection')}
                            description={pauseTimer ? `${t('filtering.temporarily_disable')} ${formatTime(pauseTimer)}` : t('filtering.dns_protection_desc')}
                            checked={protection?.protectionEnabled ?? false}
                            onChange={(v: boolean) => toggleProtection('protection', v)}
                            variant="protection"
                        />

                        {showTimerMenu && !protection?.protectionEnabled && (
                            <div className="ml-11 mt-2 p-4 bg-gray-950/50 rounded-lg border border-blue-500/20 animate-in slide-in-from-top-2 duration-200">
                                <div className="text-sm text-gray-400 mb-3">{t('filtering.temporarily_disable')}</div>
                                <div className="flex flex-wrap gap-2">
                                    {[1, 5, 10, 30].map(m => (
                                        <button
                                            key={m}
                                            onClick={() => startPauseTimer(m)}
                                            className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-white text-xs font-medium rounded-md border border-gray-700 transition-colors"
                                        >
                                            {m} min
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => setShowTimerMenu(false)}
                                        className="px-3 py-1.5 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 text-xs font-medium rounded-md border border-blue-500/20 transition-colors"
                                    >
                                        {t('filtering.stay_off')}
                                    </button>
                                </div>
                            </div>
                        )}

                        {pauseTimer && !showTimerMenu && (
                            <div className="ml-11 mt-2 p-3 bg-blue-600/10 border border-blue-500/20 rounded-lg flex items-center justify-between animate-in fade-in duration-300">
                                <div className="flex items-center gap-2 text-blue-400 text-sm">
                                    <RefreshCw size={14} className="animate-spin" />
                                    <span>{t('filtering.protection_paused')} <strong>{formatTime(pauseTimer)}</strong></span>
                                </div>
                                <button
                                    onClick={cancelPause}
                                    className="text-white text-xs font-medium bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded-md transition-colors"
                                >
                                    {t('filtering.enable_now')}
                                </button>
                            </div>
                        )}

                        <ProtectionToggle
                            icon={Baby} color="text-pink-400" title={t('filtering.parental_control')}
                            description={t('filtering.parental_control_desc')}
                            checked={protection?.parentalEnabled ?? false}
                            onChange={(v: boolean) => toggleProtection('parental', v)}
                        />
                        <ProtectionToggle
                            icon={ShieldCheck} color="text-green-400" title={t('filtering.safe_browsing')}
                            description={t('filtering.safe_browsing_desc')}
                            checked={protection?.safeBrowsingEnabled ?? false}
                            onChange={(v: boolean) => toggleProtection('safeBrowsing', v)}
                        />
                        <ProtectionToggle
                            icon={Search} color="text-yellow-400" title={t('filtering.safe_search')}
                            description={t('filtering.safe_search_desc')}
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
                            <h3 className="text-lg font-medium text-white">{t('filtering.global_custom_rules')}</h3>
                            <p className="text-sm text-gray-500">{t('filtering.global_custom_rules_desc')}</p>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setShowDocs(!showDocs)} className="p-2 text-gray-400 hover:text-white bg-gray-800 rounded-lg"><Info size={18} /></button>
                            <button onClick={() => setShowRuleModal(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium"><Plus size={18} /> {t('filtering.add_rule')}</button>
                        </div>
                    </div>
                    {showDocs && (
                        <div className="mb-4 p-4 bg-blue-600/10 border border-blue-600/20 rounded-lg text-sm text-blue-100 space-y-2">
                            <p><strong>{t('filtering.syntax_examples')}:</strong></p>
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
                    title={t('filtering.filter_blocklists')}
                    description={t('filtering.filter_blocklists_desc')}
                    lists={filtering?.filters || []}
                    onToggle={(url: string, e: boolean) => handleListOp('toggle', { url, enabled: e, whitelist: false })}
                    onRemove={(url: string) => handleListOp('remove', { url, whitelist: false })}
                    onEdit={(list: FilterList) => { setEditList({ name: list.name, url: list.url, whitelist: false }); setShowEditModal(list); }}
                    onAdd={() => { setNewList({ name: '', url: '', whitelist: false }); setShowAddModal(true); setReturnToPredefined(false); }}
                    onBrowse={() => { setNewList({ name: '', url: '', whitelist: false }); setShowPredefined(true); }}
                    onImport={() => { setImportWhitelist(false); setShowImportCSV(true); }}
                    onRefresh={() => handleListOp('refresh', { whitelist: false })}
                />

                <ListSection
                    title={t('filtering.allow_whitelists')}
                    description={t('filtering.allow_whitelists_desc')}
                    lists={filtering?.whitelist_filters || []}
                    onToggle={(url: string, e: boolean) => handleListOp('toggle', { url, enabled: e, whitelist: true })}
                    onRemove={(url: string) => handleListOp('remove', { url, whitelist: true })}
                    onEdit={(list: FilterList) => { setEditList({ name: list.name, url: list.url, whitelist: true }); setShowEditModal(list); }}
                    onAdd={() => { setNewList({ name: '', url: '', whitelist: true }); setShowAddModal(true); setReturnToPredefined(false); }}
                    onBrowse={() => { setNewList({ name: '', url: '', whitelist: true }); setShowPredefined(true); }}
                    onImport={() => { setImportWhitelist(true); setShowImportCSV(true); }}
                    onRefresh={() => handleListOp('refresh', { whitelist: true })}
                    variant="whitelist"
                />
            </div>

            {/* Modals from Global */}
            <AddListModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} data={newList} setData={setNewList} onSubmit={() => { handleListOp('add', newList); setShowAddModal(false); if (returnToPredefined) setShowPredefined(true); }} />
            <EditListModal isOpen={!!showEditModal} onClose={() => setShowEditModal(null)} data={editList} setData={setEditList} onSubmit={() => { handleListOp('update', { url: showEditModal?.url, name: editList.name, newUrl: editList.url, whitelist: editList.whitelist }); setShowEditModal(null); }} />
            <AddRuleModal isOpen={showRuleModal} onClose={() => setShowRuleModal(false)} rule={newRule} setRule={setNewRule} onSubmit={() => { handleListOp('addRule', { rule: newRule }); setNewRule(''); setShowRuleModal(false); }} />
            <PredefinedListsModal
                isOpen={showPredefined}
                onClose={() => setShowPredefined(false)}
                whitelist={newList.whitelist}
                existingUrls={(newList.whitelist ? filtering?.whitelist_filters : filtering?.filters)?.map((f: any) => f.url) || []}
                onSelect={(name: string, url: string) => {
                    setNewList({ ...newList, name, url });
                    setShowPredefined(false);
                    setShowAddModal(true);
                    setReturnToPredefined(true);
                }}
                onBatchSelect={async (selectedLists: any[]) => {
                    for (const list of selectedLists) {
                        await handleListOp('add', { name: list.name, url: list.url, whitelist: newList.whitelist });
                    }
                    setShowPredefined(false);
                    refresh();
                }}
            />
            <ImportCSVModal isOpen={showImportCSV} onClose={() => setShowImportCSV(false)} whitelist={importWhitelist} onImport={(lists: any[]) => { lists.forEach(list => handleListOp('add', { name: list.name, url: list.url, whitelist: importWhitelist })); setShowImportCSV(false); }} />

        </div>
    );
}

function ClientSelector({ clients, leases, selectedClient, onSelect }: any) {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Filter already configured clients from leases to avoid duplicates
    // A lease is "configured" if its MAC or IP matches any client ID
    const configuredIds = new Set(clients.flatMap((c: any) => c.ids));
    const availableLeases = (leases || []).filter((l: any) =>
        !configuredIds.has(l.mac) && !configuredIds.has(l.ip)
    );

    // Filter lists based on search
    const filteredClients = clients.filter((c: any) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.ids.some((id: string) => id.includes(search))
    );

    const filteredLeases = availableLeases.filter((l: any) =>
        (l.hostname || 'Unknown').toLowerCase().includes(search.toLowerCase()) ||
        l.ip.includes(search) ||
        l.mac.toLowerCase().includes(search.toLowerCase())
    );

    const clientObj = clients.find((c: any) => c.name === selectedClient);
    const leaseObj = !clientObj ? availableLeases.find((l: any) => l.hostname === selectedClient || l.ip === selectedClient) : null;

    let selectedName = selectedClient || t('filtering.choose_client');
    if (clientObj) {
        // Attempt to find associated hostname from leases for display
        const lease = leases.find((l: any) => clientObj.ids.includes(l.mac) || clientObj.ids.includes(l.ip));
        const hostname = lease?.hostname ? ` (${lease.hostname})` : '';
        selectedName = `${clientObj.name}${hostname}`;
    }
    else if (leaseObj) selectedName = `[New] ${leaseObj.hostname || leaseObj.ip} (${leaseObj.ip})`;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-left text-white flex justify-between items-center focus:outline-none focus:border-blue-500"
            >
                <span className="truncate">{selectedName}</span>
                <ChevronDown size={16} className="text-gray-500" />
            </button>

            {isOpen && (
                <div className="absolute z-10 w-full mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-h-60 overflow-y-auto overflow-x-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100">
                    <div className="p-2 border-b border-gray-700 sticky top-0 bg-gray-800 z-10">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                            <input
                                autoFocus
                                type="text"
                                placeholder="Search clients..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full bg-gray-900 border border-gray-700 rounded-md py-1.5 pl-9 pr-3 text-sm text-white focus:outline-none focus:border-blue-500"
                            />
                        </div>
                    </div>

                    {/* Configured Clients Section */}
                    {filteredClients.length > 0 && (
                        <div className="border-b border-gray-700/50">
                            <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase bg-gray-900/50 sticky top-0">{t('filtering.configured_clients')}</div>
                            {filteredClients.map((c: any) => {
                                // Find lease for extra info
                                const lease = leases.find((l: any) => c.ids.includes(l.mac) || c.ids.includes(l.ip));
                                return (
                                    <button
                                        key={c.name}
                                        onClick={() => { onSelect(c.name); setIsOpen(false); setSearch(''); }}
                                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-700 transition-colors border-b border-gray-800/50 last:border-0 ${selectedClient === c.name ? 'bg-blue-500/10 text-blue-400' : 'text-gray-300'}`}
                                    >
                                        <div className="font-medium">
                                            {c.name}
                                            {lease?.hostname && <span className="ml-2 text-xs font-normal text-gray-500 italic">({lease.hostname})</span>}
                                        </div>
                                        <div className="text-xs text-gray-500 truncate">{c.ids.join(', ')}</div>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* Detected Devices Section */}
                    {filteredLeases.length > 0 && (
                        <div>
                            <div className="px-3 py-1.5 text-xs font-semibold text-blue-400/80 uppercase bg-gray-900/50 sticky top-0">{t('filtering.recognized_devices')}</div>
                            {filteredLeases.map((l: any) => (
                                <button
                                    key={l.mac}
                                    onClick={() => { onSelect(l.hostname || l.ip); setIsOpen(false); setSearch(''); }}
                                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-700 transition-colors border-b border-gray-800/50 last:border-0 ${selectedClient === (l.hostname || l.ip) ? 'bg-blue-500/10 text-blue-400' : 'text-gray-300'}`}
                                >
                                    <div className="font-medium truncate">{l.hostname || t('dashboard.unknown')}</div>
                                    <div className="text-xs text-gray-500 truncate">{l.ip} • {l.mac} {l.isStatic && <span className="ml-1 text-green-500 font-bold text-[10px] uppercase border border-green-500/30 px-1 rounded">Static</span>}</div>
                                </button>
                            ))}
                        </div>
                    )}

                    {filteredClients.length === 0 && filteredLeases.length === 0 && (
                        <div className="p-3 text-sm text-gray-500 text-center">{t('filtering.no_clients_found')}</div>
                    )}
                </div>
            )}
        </div>
    );
}

function ClientFilteringTab({ clients, leases, selectedClient, setSelectedClient, userRules, refresh }: any) {
    const { t } = useTranslation();
    const [whitelistInput, setWhitelistInput] = useState('');
    const [blocklistInput, setBlocklistInput] = useState('');

    // New Client Creation State
    const [newClientName, setNewClientName] = useState('');
    const [isCreatingClient, setIsCreatingClient] = useState(false);

    // Identify if the selected "client" is actually a recognized lease that needs creation
    const configuredClient = clients.find((c: any) => c.name === selectedClient);
    const activeLease = !configuredClient ? leases?.find((l: any) => (l.hostname || l.ip) === selectedClient) : null;

    useEffect(() => {
        if (activeLease) {
            setNewClientName(activeLease.hostname || activeLease.ip);
        }
    }, [activeLease]);

    const handleCreateClient = async () => {
        if (!activeLease || !newClientName) return;

        setIsCreatingClient(true);
        try {
            // Check if we should make it a static lease
            if (!activeLease.isStatic) {
                if (window.confirm(`Detected dynamic lease for ${activeLease.ip}.\n\nDo you want to assign a static IP to this device to ensure rules adhere permanently?`)) {
                    await fetch('/api/adguard/dhcp', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            action: 'add_static',
                            mac: activeLease.mac,
                            ip: activeLease.ip,
                            hostname: newClientName
                        })
                    });
                }
            }

            const newClient = {
                name: newClientName,
                ids: [activeLease.mac, activeLease.ip], // Add both MAC and IP for robustness
                use_global_settings: true,
                filtering_enabled: true,
                parental_enabled: false,
                safebrowsing_enabled: false,
                safesearch_enabled: false,
                use_global_blocked_services: true,
                upstreams: [],
                tags: []
            };

            const res = await fetch('/api/adguard/clients', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'add', client: newClient })
            });

            if (!res.ok) throw new Error('Failed to create client');

            // Select the new client name (which is now a real client) and refresh
            setSelectedClient(newClientName);
            await refresh();
        } catch (e) {
            console.error(e);
            alert('Failed to create client');
        }
        setIsCreatingClient(false);
    };

    const escapeClientName = (name: string) => {
        return name.replace(/'/g, "\\'").replace(/,/g, "\\,");
    };

    const handleAddRule = async (domain: string, type: 'allow' | 'block') => {
        if (!selectedClient || !domain) return;

        const escapedName = escapeClientName(selectedClient);
        const rule = type === 'allow'
            ? `@@||${domain}^$client='${escapedName}'`
            : `||${domain}^$client='${escapedName}'`;

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


    if (activeLease) {
        return (
            <div className="space-y-6 animate-in fade-in duration-300">
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                    <label className="block text-sm font-medium text-gray-400 mb-2">{t('filtering.client_selector_label')}</label>
                    <ClientSelector clients={clients} leases={leases} selectedClient={selectedClient} onSelect={setSelectedClient} />
                </div>

                <div className="bg-blue-900/10 border border-blue-500/20 rounded-xl p-8 text-center max-w-2xl mx-auto">
                    <div className="inline-flex p-3 rounded-full bg-blue-500/10 text-blue-400 mb-4">
                        <Users size={32} />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">{t('filtering.configure_new_client')}</h3>
                    <p className="text-gray-400 mb-8 max-w-md mx-auto">
                        {t('filtering.new_client_desc')}
                    </p>

                    <div className="grid gap-6 max-w-md mx-auto text-left">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">{t('filtering.client_name')}</label>
                            <input
                                type="text"
                                value={newClientName}
                                onChange={e => setNewClientName(e.target.value)}
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1 uppercase">{t('filtering.ip_address')}</label>
                                <div className="font-mono text-sm text-gray-300 bg-gray-900/50 px-3 py-2 rounded-lg border border-gray-800">{activeLease.ip}</div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1 uppercase">{t('filtering.mac_address')}</label>
                                <div className="font-mono text-sm text-gray-300 bg-gray-900/50 px-3 py-2 rounded-lg border border-gray-800">{activeLease.mac}</div>
                            </div>
                        </div>

                        <button
                            onClick={handleCreateClient}
                            disabled={isCreatingClient}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 rounded-lg transition-colors flex justify-center items-center gap-2"
                        >
                            {isCreatingClient ? <RefreshCw className="animate-spin" size={20} /> : <Check size={20} />}
                            {t('filtering.create_client')}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const escapedName = escapeClientName(selectedClient);
    const clientRules = userRules.filter((r: string) => r.includes(`$client='${escapedName}'`));
    const whitelisted = clientRules.filter((r: string) => r.startsWith('@@||'));
    const blocked = clientRules.filter((r: string) => r.startsWith('||'));

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Client Selector */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <label className="block text-sm font-medium text-gray-400 mb-2">{t('filtering.client_selector_label')}</label>
                <ClientSelector clients={clients} leases={leases} selectedClient={selectedClient} onSelect={setSelectedClient} />
            </div>

            {selectedClient ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Blocklist */}
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col h-[500px]">
                        <h3 className="text-lg font-medium text-white mb-1 flex items-center gap-2">
                            <Shield className="text-red-400" size={20} /> {t('filtering.blocked_domains')}
                        </h3>
                        <p className="text-xs text-gray-500 mb-4">{t('filtering.blocked_domains_desc')} <strong>{selectedClient}</strong>.</p>

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
                            {blocked.length === 0 && <div className="text-gray-600 text-sm text-center py-4">{t('filtering.no_blocked_domains')}</div>}
                        </div>
                    </div>

                    {/* Whitelist */}
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col h-[500px]">
                        <h3 className="text-lg font-medium text-white mb-1 flex items-center gap-2">
                            <Check className="text-green-400" size={20} /> {t('filtering.allowed_domains')}
                        </h3>
                        <p className="text-xs text-gray-500 mb-4">{t('filtering.allowed_domains_desc')} <strong>{selectedClient}</strong>.</p>

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
                            {whitelisted.length === 0 && <div className="text-gray-600 text-sm text-center py-4">{t('filtering.no_allowed_domains')}</div>}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-center py-20 bg-gray-900/50 border-2 border-dashed border-gray-800 rounded-xl">
                    <Users size={48} className="mx-auto text-gray-700 mb-4" />
                    <p className="text-gray-500 text-lg">{t('filtering.select_client_msg')}</p>
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

function ProtectionToggle({ icon: Icon, color, title, description, checked, onChange, showDetails, onDetailsToggle, isOpen, variant }: any) {
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
            <Switch checked={checked} onChange={onChange} variant={variant} />
        </div>
    );
}

function ListSection({ title, description, lists, onToggle, onRemove, onEdit, onAdd, onBrowse, onImport, onRefresh, variant = 'blocklist' }: any) {
    const { t } = useTranslation();
    return (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-gray-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div><h3 className="text-lg font-medium text-white">{title}</h3><p className="text-sm text-gray-500">{description}</p></div>
                <div className="flex gap-2 w-full md:w-auto flex-wrap">
                    <button onClick={onRefresh} className="p-2 text-gray-400 hover:text-white bg-gray-800 rounded-lg" title={t('filtering.refresh_lists')}><RefreshCw size={18} /></button>
                    <button onClick={onBrowse} className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium border border-gray-700">{t('filtering.browse_predefined')}</button>
                    <button onClick={onImport} className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg text-sm font-medium"><Upload size={18} /> {t('filtering.import_csv')}</button>
                    <button onClick={onAdd} className={`flex items-center gap-2 ${variant === 'whitelist' ? 'bg-green-600 hover:bg-green-500' : 'bg-blue-600 hover:bg-blue-500'} text-white px-4 py-2 rounded-lg text-sm font-medium`}><Plus size={18} /> {t('filtering.add_list')}</button>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-950/50"><tr><th className="px-6 py-3">{t('filtering.name')}</th><th className="px-6 py-3">Rules</th><th className="px-6 py-3">{t('forwarding.status')}</th><th className="px-6 py-3 text-right">Actions</th></tr></thead>
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
    const { t } = useTranslation();
    if (!isOpen) return null;
    return (
        <Modal title={data.whitelist ? t('filtering.add_whitelist') : t('filtering.add_blocklist')} onClose={onClose}>
            <div className="space-y-4">
                <input type="text" value={data.name} onChange={(e) => setData({ ...data, name: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white" placeholder={t('filtering.name')} autoFocus />
                <input type="text" value={data.url} onChange={(e) => setData({ ...data, url: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white" placeholder={t('filtering.url')} />
            </div>
            <div className="flex justify-end gap-3 mt-8"><button onClick={onClose} className="text-gray-400">{t('filtering.cancel')}</button><button onClick={onSubmit} className="bg-blue-600 text-white px-6 py-2 rounded-lg">{t('filtering.add')}</button></div>
        </Modal>
    );
}

function EditListModal({ isOpen, onClose, data, setData, onSubmit }: any) {
    const { t } = useTranslation();
    if (!isOpen) return null;
    return (
        <Modal title={t('filtering.edit_list')} onClose={onClose}>
            <div className="space-y-4">
                <input type="text" value={data.name} onChange={(e) => setData({ ...data, name: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white" />
                <input type="text" value={data.url} onChange={(e) => setData({ ...data, url: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white" />
            </div>
            <div className="flex justify-end gap-3 mt-8"><button onClick={onClose} className="text-gray-400">{t('filtering.cancel')}</button><button onClick={onSubmit} className="bg-blue-600 text-white px-6 py-2 rounded-lg">{t('filtering.save')}</button></div>
        </Modal>
    );
}

function AddRuleModal({ isOpen, onClose, rule, setRule, onSubmit }: any) {
    const { t } = useTranslation();
    if (!isOpen) return null;
    return (
        <Modal title={t('filtering.add_custom_rule')} onClose={onClose}>
            <input type="text" value={rule} onChange={(e) => setRule(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white font-mono" placeholder="||example.com^" autoFocus />
            <div className="flex justify-end gap-3 mt-8"><button onClick={onClose} className="text-gray-400">{t('filtering.cancel')}</button><button onClick={onSubmit} className="bg-blue-600 text-white px-6 py-2 rounded-lg">{t('filtering.add_rule')}</button></div>
        </Modal>
    );
}

function PredefinedListsModal({ isOpen, onClose, whitelist, onSelect, onBatchSelect, existingUrls = [] }: any) {
    const { t } = useTranslation();
    const [lists, setLists] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set());

    // Fetch lists from CSV API
    useEffect(() => {
        if (!isOpen) return;

        const fetchLists = async () => {
            setLoading(true);
            setError(null);

            try {
                const type = whitelist ? 'whitelist' : 'blocklist';
                const res = await fetch(`/api/adguard/predefined-lists?type=${type}`);

                if (!res.ok) {
                    throw new Error('Failed to fetch lists');
                }

                const data = await res.json();

                if (data.success) {
                    setLists(data.lists || []);
                } else {
                    throw new Error(data.error || 'Unknown error');
                }
            } catch (err) {
                console.error('Error fetching predefined lists:', err);
                setError(err instanceof Error ? err.message : 'Failed to load lists');
                // Fallback to hardcoded lists
                setLists(whitelist ? PREDEFINED_WHITELISTS : PREDEFINED_BLOCKLISTS);
            } finally {
                setLoading(false);
            }
        };

        fetchLists();
    }, [isOpen, whitelist]);

    // Filter lists based on search
    const filteredLists = lists.filter(list =>
        list.name.toLowerCase().includes(search.toLowerCase()) ||
        list.url.toLowerCase().includes(search.toLowerCase())
    );

    const toggleList = (url: string) => {
        if (existingUrls.includes(url)) return;
        const newSelected = new Set(selectedUrls);
        if (newSelected.has(url)) {
            newSelected.delete(url);
        } else {
            newSelected.add(url);
        }
        setSelectedUrls(newSelected);
    };

    const handleBatchAdd = async () => {
        if (selectedUrls.size === 0) return;
        setSubmitting(true);
        const listsToAdd = lists.filter(l => selectedUrls.has(l.url));
        await onBatchSelect(listsToAdd);
        setSubmitting(false);
        setSelectedUrls(new Set());
    };

    if (!isOpen) return null;

    return (
        <Modal title={`${t('filtering.browse_predefined')} (${whitelist ? t('filtering.allow_whitelists') : t('filtering.filter_blocklists')})`} onClose={onClose} maxWidth="max-w-4xl">
            {/* Header with search and view toggle */}
            <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                    <input
                        type="text"
                        placeholder={t('filtering.search_lists')}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                    />
                </div>

                <div className="flex bg-gray-900 border border-gray-800 p-1 rounded-lg">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-gray-800 text-blue-400 shadow-sm border border-gray-700' : 'text-gray-500 hover:text-gray-400'}`}
                        title="Grid View"
                    >
                        <LayoutGrid size={18} />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-gray-800 text-blue-400 shadow-sm border border-gray-700' : 'text-gray-500 hover:text-gray-400'}`}
                        title="List View"
                    >
                        <LayoutList size={18} />
                    </button>
                </div>
            </div>

            {/* Select All Toggle */}
            {!loading && filteredLists.length > 0 && (
                <div className="flex justify-end mb-2">
                    <button
                        onClick={() => {
                            const available = filteredLists.filter(l => !existingUrls.includes(l.url));
                            if (selectedUrls.size === available.length) {
                                setSelectedUrls(new Set());
                            } else {
                                setSelectedUrls(new Set(available.map(l => l.url)));
                            }
                        }}
                        className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1.5 px-2 py-1 hover:bg-blue-400/10 rounded-lg transition-all"
                    >
                        {selectedUrls.size === filteredLists.filter(l => !existingUrls.includes(l.url)).length ? t('filtering.deselect_all') : t('filtering.select_all_available')}
                    </button>
                </div>
            )}

            {/* Loading state */}
            {loading && (
                <div className="flex items-center justify-center py-12">
                    <RefreshCw className="animate-spin text-blue-500" size={32} />
                    <span className="ml-3 text-gray-400">{t('filtering.loading_lists')}</span>
                </div>
            )}

            {/* Error state */}
            {error && !loading && (
                <div className="p-4 bg-yellow-900/20 border border-yellow-700/50 rounded-lg mb-4">
                    <div className="flex items-start gap-2">
                        <Info className="text-yellow-500 mt-0.5" size={16} />
                        <div>
                            <div className="text-yellow-500 font-medium text-sm">{t('filtering.failed_load_csv')}</div>
                            <div className="text-yellow-600 text-xs mt-1">{error}</div>
                            <div className="text-gray-500 text-xs mt-1">{t('filtering.showing_fallback')}</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Lists view */}
            {!loading && (
                <>
                    <div className="text-sm text-gray-500 mb-4 flex justify-between items-center">
                        <span>Showing {filteredLists.length} of {lists.length} lists</span>
                    </div>

                    <div className="max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                        {viewMode === 'grid' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredLists.map((list, index) => (
                                    <div
                                        key={`${list.url}-${index}`}
                                        onClick={() => toggleList(list.url)}
                                        className={`p-4 bg-gray-800/40 border rounded-xl transition-all group shadow-sm flex flex-col h-full cursor-pointer relative ${selectedUrls.has(list.url)
                                            ? 'border-blue-500/50 bg-blue-500/5 ring-1 ring-blue-500/20'
                                            : existingUrls.includes(list.url)
                                                ? 'border-gray-800 opacity-60 grayscale'
                                                : 'border-gray-700/50 hover:border-blue-500/30'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between mb-2 gap-2">
                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                                {!existingUrls.includes(list.url) && (
                                                    <div className={`shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-all ${selectedUrls.has(list.url) ? 'bg-blue-600 border-blue-500' : 'border-gray-600'
                                                        }`}>
                                                        {selectedUrls.has(list.url) && <Check size={12} className="text-white" />}
                                                    </div>
                                                )}
                                                <h4 className={`font-medium text-sm line-clamp-2 leading-tight transition-colors ${selectedUrls.has(list.url) ? 'text-blue-400' : 'text-white'
                                                    }`}>{list.name}</h4>
                                            </div>
                                            {list.enabled !== undefined && (
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider shrink-0 ${list.enabled ? 'bg-green-900/30 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
                                                    {list.enabled ? 'Suggested' : 'Optional'}
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-xs text-gray-500 mb-4 line-clamp-2 break-all opacity-60 group-hover:opacity-100 transition-opacity flex-1">{list.url}</div>
                                        <div className="flex gap-2">
                                            {existingUrls.includes(list.url) ? (
                                                <div className="w-full py-2 bg-gray-900/50 text-gray-500 text-sm font-medium rounded-lg border border-gray-800 flex items-center justify-center gap-2">
                                                    <Check size={14} /> {t('filtering.added')}
                                                </div>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); toggleList(list.url); }}
                                                        className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all flex items-center justify-center gap-2 ${selectedUrls.has(list.url)
                                                            ? 'bg-blue-600 border-blue-500 text-white'
                                                            : 'bg-gray-900/80 border-gray-700 text-blue-400 hover:border-blue-500'
                                                            }`}
                                                    >
                                                        {selectedUrls.has(list.url) ? <Check size={16} /> : <Plus size={16} />}
                                                        {selectedUrls.has(list.url) ? t('filtering.selected') : t('filtering.select')}
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-1 bg-gray-950/20 rounded-xl border border-gray-800/50 overflow-hidden">
                                {filteredLists.map((list, index) => (
                                    <div
                                        key={`${list.url}-${index}`}
                                        onClick={() => toggleList(list.url)}
                                        className={`flex items-center justify-between p-3 transition-colors border-b border-gray-800/30 last:border-0 group cursor-pointer ${selectedUrls.has(list.url) ? 'bg-blue-500/5' : 'hover:bg-gray-800/40'
                                            } ${existingUrls.includes(list.url) ? 'opacity-60 grayscale' : ''}`}
                                    >
                                        <div className="flex-1 min-w-0 pr-4 flex items-center gap-3">
                                            {!existingUrls.includes(list.url) && (
                                                <div className={`shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-all ${selectedUrls.has(list.url) ? 'bg-blue-600 border-blue-500' : 'border-gray-600'
                                                    }`}>
                                                    {selectedUrls.has(list.url) && <Check size={12} className="text-white" />}
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-3 mb-0.5">
                                                    <h4 className={`font-medium text-sm truncate transition-colors ${selectedUrls.has(list.url) ? 'text-blue-400' : 'text-white'
                                                        }`}>{list.name}</h4>
                                                    {list.enabled !== undefined && (
                                                        <span className={`text-[9px] px-1.5 py-0.25 rounded uppercase font-bold tracking-wider ${list.enabled ? 'bg-green-900/30 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
                                                            {list.enabled ? 'Suggested' : 'Optional'}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-[11px] text-gray-500 truncate font-mono opacity-50 group-hover:opacity-80 transition-opacity">{list.url}</div>
                                            </div>
                                            {existingUrls.includes(list.url) ? (
                                                <div className="px-4 py-1.5 text-gray-500 text-xs font-medium flex items-center gap-1.5 opacity-60">
                                                    <Check size={14} /> Added
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => toggleList(list.url)}
                                                    className={`px-6 py-1.5 rounded-lg border transition-all whitespace-nowrap text-xs font-medium flex items-center gap-2 ${selectedUrls.has(list.url)
                                                        ? 'bg-blue-600 border-blue-500 text-white'
                                                        : 'bg-gray-900/50 border-gray-700 text-blue-400 hover:border-blue-500'
                                                        }`}
                                                >
                                                    {selectedUrls.has(list.url) ? <Check size={14} /> : <Plus size={14} />}
                                                    {selectedUrls.has(list.url) ? 'Selected' : 'Select'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {filteredLists.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <div className="p-4 bg-gray-800/30 rounded-full mb-4 ring-1 ring-gray-700">
                                    <Search size={32} className="text-gray-600" />
                                </div>
                                <h3 className="text-white font-medium">{t('filtering.no_results')}</h3>
                                <p className="text-gray-500 text-sm mt-1 max-w-[200px]">No lists found matching "{search}".</p>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Modal Footer for Batch Action */}
            {!loading && selectedUrls.size > 0 && (
                <div className="mt-6 pt-4 border-t border-gray-800 flex items-center justify-between animate-in slide-in-from-bottom-2 duration-300">
                    <div className="text-sm text-gray-400">
                        <span className="text-blue-400 font-medium">{selectedUrls.size}</span> {t('filtering.lists_selected')}
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setSelectedUrls(new Set())}
                            className="text-sm text-gray-500 hover:text-white transition-colors"
                        >
                            {t('filtering.clear_selection')}
                        </button>
                        <button
                            onClick={handleBatchAdd}
                            disabled={submitting}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 disabled:text-gray-600 text-white px-6 py-2 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-blue-900/20"
                        >
                            {submitting ? (
                                <>
                                    <RefreshCw size={16} className="animate-spin" />
                                    {t('filtering.adding')}
                                </>
                            ) : (
                                <>
                                    <Plus size={16} />
                                    {t('filtering.add_selected_lists')}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}
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

function Switch({ checked, onChange, size = 'md', variant }: { checked: boolean; onChange: (v: boolean) => void; size?: 'sm' | 'md'; variant?: 'protection' }) {
    const isSm = size === 'sm';

    // Determine colors
    let activeColor = 'bg-blue-600';
    let inactiveColor = 'bg-gray-700';

    if (variant === 'protection') {
        activeColor = 'bg-green-500';
        inactiveColor = 'bg-red-500/80';
    }

    return (
        <button
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onChange(!checked);
            }}
            className={`${isSm ? 'w-8 h-4.5' : 'w-11 h-6'} rounded-full relative transition-all duration-300 ${checked ? activeColor : inactiveColor}`}
        >
            <div className={`absolute top-1 left-1 bg-white ${isSm ? 'w-2.5 h-2.5 translate-x-0' : 'w-4 h-4'} rounded-full shadow-sm transition-transform duration-300 ${checked ? (isSm ? 'translate-x-3.5' : 'translate-x-5') : ''}`} />
        </button>
    );
}

// Import CSV Modal
function ImportCSVModal({ isOpen, onClose, whitelist, onImport }: any) {
    const { t } = useTranslation();
    const [csvContent, setCsvContent] = useState('');
    const [parsedLists, setParsedLists] = useState<any[]>([]);
    const [selectedLists, setSelectedLists] = useState<Set<string>>(new Set());
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setLoading(true);
        setError(null);

        try {
            const content = await file.text();
            setCsvContent(content);

            // Parse CSV via API
            const res = await fetch('/api/adguard/import-csv', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ csvContent: content, type: whitelist ? 'whitelist' : 'blocklist' })
            });

            const data = await res.json();

            if (data.success) {
                setParsedLists(data.lists);
                // Select all by default
                setSelectedLists(new Set(data.lists.map((l: any) => l.url)));
            } else {
                setError(data.error || 'Failed to parse CSV');
            }
        } catch (err) {
            console.error('Error reading CSV:', err);
            setError('Failed to read CSV file');
        } finally {
            setLoading(false);
        }

        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const toggleSelection = (url: string) => {
        const newSelected = new Set(selectedLists);
        if (newSelected.has(url)) {
            newSelected.delete(url);
        } else {
            newSelected.add(url);
        }
        setSelectedLists(newSelected);
    };

    const handleImport = () => {
        const listsToImport = parsedLists.filter(l => selectedLists.has(l.url));
        onImport(listsToImport);
        // Reset state
        setCsvContent('');
        setParsedLists([]);
        setSelectedLists(new Set());
        setError(null);
    };

    const handleReset = () => {
        setCsvContent('');
        setParsedLists([]);
        setSelectedLists(new Set());
        setError(null);
    };

    if (!isOpen) return null;

    return (
        <Modal title={t('filtering.import_csv')} onClose={onClose} maxWidth="max-w-3xl">
            {parsedLists.length === 0 ? (
                // File upload view
                <div className="space-y-4">
                    <div className="text-sm text-gray-400 mb-4">
                        {t('filtering.upload_csv_desc')} <code className="text-blue-400">enabled,url,name,id</code>
                    </div>

                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-gray-700 rounded-xl p-12 text-center cursor-pointer hover:border-blue-500 hover:bg-gray-800/50 transition-colors"
                    >
                        <Upload size={48} className="mx-auto text-gray-600 mb-4" />
                        <div className="text-white font-medium mb-2">{t('filtering.click_upload')}</div>
                        <div className="text-sm text-gray-500">{t('filtering.drag_drop')}</div>
                        <div className="text-xs text-gray-600 mt-2">{t('filtering.supports_csv')}</div>
                    </div>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv,.txt"
                        onChange={handleFileSelect}
                        className="hidden"
                    />

                    {error && (
                        <div className="p-4 bg-red-900/20 border border-red-700/50 rounded-lg text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {loading && (
                        <div className="flex items-center justify-center py-8">
                            <RefreshCw className="animate-spin text-blue-500 mr-3" size={24} />
                            <span className="text-gray-400">{t('filtering.parsing_csv')}</span>
                        </div>
                    )}
                </div>
            ) : (
                // Preview and selection view
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-blue-900/20 border border-blue-700/50 rounded-lg">
                        <div>
                            <div className="text-white font-medium">{t('filtering.found_lists')} {parsedLists.length}</div>
                            <div className="text-sm text-gray-400">{selectedLists.size} {t('filtering.selected_import')}</div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setSelectedLists(new Set(parsedLists.map(l => l.url)))}
                                className="text-sm text-blue-400 hover:text-blue-300"
                            >
                                {t('filtering.select_all')}
                            </button>
                            <span className="text-gray-600">|</span>
                            <button
                                onClick={() => setSelectedLists(new Set())}
                                className="text-sm text-blue-400 hover:text-blue-300"
                            >
                                {t('filtering.deselect_all')}
                            </button>
                        </div>
                    </div>

                    <div className="max-h-96 overflow-y-auto space-y-2 bg-gray-950/30 p-3 rounded-lg border border-gray-800">
                        {parsedLists.map((list, index) => (
                            <div
                                key={`${list.url}-${index}`}
                                onClick={() => toggleSelection(list.url)}
                                className={`p-3 rounded-lg border cursor-pointer transition-colors ${selectedLists.has(list.url)
                                    ? 'bg-blue-900/20 border-blue-700/50'
                                    : 'bg-gray-800/50 border-gray-700 hover:border-gray-600'
                                    }`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className={`mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center ${selectedLists.has(list.url)
                                        ? 'bg-blue-600 border-blue-600'
                                        : 'border-gray-600'
                                        }`}>
                                        {selectedLists.has(list.url) && <Check size={12} className="text-white" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-white font-medium text-sm">{list.name}</div>
                                        <div className="text-xs text-gray-500 truncate">{list.url}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-between gap-3">
                        <button
                            onClick={handleReset}
                            className="text-gray-400 hover:text-white"
                        >
                            {t('filtering.upload_different')}
                        </button>
                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-white"
                            >
                                {t('filtering.cancel')}
                            </button>
                            <button
                                onClick={handleImport}
                                disabled={selectedLists.size === 0}
                                className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white px-6 py-2 rounded-lg transition-colors"
                            >
                                {t('filtering.import_lists')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Modal>
    );
}

