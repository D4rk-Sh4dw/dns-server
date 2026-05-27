'use client';

import { useTranslation } from '@/lib/i18n-context';

import { useEffect, useState, useMemo } from 'react';
import { Search, RotateCw, Shield, AlertTriangle, Check, ArrowRight, Trash2, ChevronDown, ChevronUp, Ban, User, X } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

interface QueryLogItem {
    time: string;
    client: string;
    question: {
        name: string;
        type: string;
        class?: string;
    };
    status: string;
    reason?: string;
    upstream?: string;
    answer?: {
        type: string;
        value: string;
        ttl?: number;
    }[];
    elapsed?: string;
    elapsedMs?: string;
    client_info?: {
        name?: string;
    };
    client_proto?: string;
    rules?: {
        text: string;
        filter_list_id?: number;
    }[];
}

interface Client {
    name: string;
    ids: string[];
    [key: string]: any;
}

const isBlocked = (log: QueryLogItem) => {
    const s = log.status.toLowerCase();
    const r = log.reason?.toLowerCase() || '';

    if (s.includes('blocked') || s.includes('safe') || s.includes('parental')) return true;
    if (r.includes('blacklist') || r.includes('blockedservice')) return true;

    // Check for 0.0.0.0 or :: (AdGuard blocking)
    if (log.answer?.some(a => a.value === '0.0.0.0' || a.value === '::')) return true;
    return false;
};

export default function LogsPage() {
    const { t } = useTranslation();
    const searchParams = useSearchParams();
    const [logs, setLogs] = useState<QueryLogItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState(searchParams.get('search') || '');
    const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
    const [olderThan, setOlderThan] = useState<string | undefined>(undefined);
    const [expandedLog, setExpandedLog] = useState<number | null>(null);
    const [clients, setClients] = useState<Client[]>([]);

    useEffect(() => {
        // Fetch clients for the dropdown
        fetch('/api/adguard/clients')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setClients(data);
                } else if (data.clients && Array.isArray(data.clients)) {
                    setClients(data.clients);
                }
            })
            .catch(err => console.error('Failed to fetch clients', err));
    }, []);

    const refreshClients = () => {
        fetch('/api/adguard/clients')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setClients(data);
                } else if (data.clients && Array.isArray(data.clients)) {
                    setClients(data.clients);
                }
            })
            .catch(err => console.error('Failed to fetch clients', err));
    };

    const fetchLogs = async (reset = false) => {
        setLoading(true);
        try {
            let url = `/api/adguard/querylog?limit=100`;
            if (olderThan && !reset) url += `&older_than=${olderThan}`;
            if (filter) url += `&search=${encodeURIComponent(filter)}`;
            if (statusFilter) url += `&response_status=${statusFilter}`;

            const res = await fetch(url);
            const data = await res.json();

            const newLogs = data.data || [];
            if (reset) {
                setLogs(newLogs);
            } else {
                setLogs(prev => [...prev, ...newLogs]);
            }
        } catch (err) {
            console.error('Failed to fetch logs', err);
        }
        setLoading(false);
    };

    useEffect(() => {
        setOlderThan(undefined); // Reset pagination on filter change
        fetchLogs(true);
    }, [filter, statusFilter]);

    const loadMore = () => {
        if (logs.length > 0) {
            const lastLogTime = logs[logs.length - 1].time;
            setOlderThan(lastLogTime);
            // Effect below triggers fetch
        }
    };

    useEffect(() => {
        if (olderThan) fetchLogs(false);
    }, [olderThan]);

    const handleClearLogs = async () => {
        if (!confirm(t('logs.clear_confirm'))) return;
        try {
            await fetch('/api/adguard/querylog', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'clear' })
            });
            setLogs([]);
            fetchLogs(true);
        } catch (err) {
            alert(t('filtering.action_failed'));
        }
    };

    const handleRule = async (domain: string, type: 'block' | 'whitelist' | 'block_client' | 'whitelist_client', clientName?: string) => {
        let rule = '';
        if (type === 'block') {
            rule = `||${domain}^`;
        } else if (type === 'whitelist') {
            rule = `@@||${domain}^`;
        } else if (type === 'block_client') {
            if (!clientName) return alert(t('common.error'));
            rule = `||${domain}^$client='${clientName}'`;
        } else if (type === 'whitelist_client') {
            if (!clientName) return alert(t('common.error'));
            rule = `@@||${domain}^$client='${clientName}'`;
        }

        try {
            const res = await fetch('/api/adguard/filtering', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'addRule', rule })
            });
            if (!res.ok) throw new Error('Failed to add rule');
            alert(`Rule added: ${rule}`);
            fetchLogs(true);
        } catch (err) {
            alert(err instanceof Error ? err.message : t('filtering.action_failed'));
        }
    };

    return (
        <div className="p-4 md:p-8 space-y-6 md:space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-2">{t('logs.title')}</h1>
                    <p className="text-gray-400 text-sm md:text-base">{t('logs.subtitle')}</p>
                </div>
                <div className="flex gap-2 self-end sm:self-auto">
                    <button
                        onClick={handleClearLogs}
                        className="p-2 rounded-lg bg-red-900/20 hover:bg-red-900/40 text-red-400 hover:text-red-300 transition-colors"
                        title={t('logs.clear_logs')}
                    >
                        <Trash2 size={20} />
                    </button>
                    <button
                        onClick={() => fetchLogs(true)}
                        className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                        title={t('filtering.refresh_lists')}
                    >
                        <RotateCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>


            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                    <input
                        type="text"
                        placeholder={t('logs.search_placeholder')}
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-800 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-blue-500 transition-colors"
                    />
                </div>
                <select
                    className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 min-w-[200px]"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                >
                    <option value="">{t('logs.all_queries')}</option>
                    <option value="blocked">{t('logs.blocked')}</option>
                    <option value="blocked_services">{t('logs.blocked_services')}</option>
                    <option value="safe_browsing">{t('logs.blocked_threats')}</option>
                    <option value="parental">{t('logs.blocked_parental')}</option>
                    <option value="processed">{t('logs.processed')}</option>
                    <option value="filtered">{t('logs.filtered')}</option>
                    <option value="rewritten">{t('logs.rewritten')}</option>
                    <option value="safe_search">{t('logs.safe_search')}</option>
                </select>
            </div>

            {/* Logs Table */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-950/50 text-gray-500 uppercase font-medium">
                        <tr>
                            <th className="px-6 py-4"></th>
                            <th className="px-6 py-4">{t('logs.time')}</th>
                            <th className="px-6 py-4">{t('logs.status')}</th>
                            <th className="px-6 py-4">{t('logs.client')}</th>
                            <th className="px-6 py-4">{t('logs.domain')}</th>
                            <th className="px-6 py-4">{t('logs.answer_upstream')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {logs.map((log, idx) => (
                            <LogItem
                                key={`${log.time}-${idx}`}
                                log={log}
                                isExpanded={expandedLog === idx}
                                onToggle={() => setExpandedLog(expandedLog === idx ? null : idx)}
                                onFilterClient={(client) => setFilter(client)}
                                handleRule={handleRule}
                                clients={clients}
                                onClientCreated={refreshClients}
                            />
                        ))}
                    </tbody>
                </table>
                {!loading && logs.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        {t('logs.no_logs')}
                    </div>
                )}
                {logs.length > 0 && (
                    <div className="p-4 flex justify-center border-t border-gray-800">
                        <button
                            onClick={loadMore}
                            disabled={loading}
                            className="text-sm text-blue-400 hover:text-blue-300 disabled:opacity-50"
                        >
                            {loading ? t('common.loading') : t('logs.load_more')}
                        </button>
                    </div>
                )}
            </div>
        </div >
    );
}

function LogItem({ log, isExpanded, onToggle, onFilterClient, handleRule, clients, onClientCreated }: {
    log: QueryLogItem;
    isExpanded: boolean;
    onToggle: () => void;
    onFilterClient: (client: string) => void;
    handleRule: (domain: string, type: 'block' | 'whitelist' | 'block_client' | 'whitelist_client', clientName?: string) => void;
    clients: Client[];
    onClientCreated?: () => void;
}) {
    const { t } = useTranslation();
    const blocked = isBlocked(log);
    const [selectedClient, setSelectedClient] = useState<string>('');
    const [clientSearch, setClientSearch] = useState('');

    // Client Creation State
    const [isCreating, setIsCreating] = useState(false);
    const [newClientName, setNewClientName] = useState('');

    // Check if this log belongs to a KNOWN client
    const knownClient = clients.find(c =>
        c.ids.includes(log.client) ||
        (log.client_info?.name && c.ids.includes(log.client_info.name)) ||
        c.name === log.client_info?.name
    );

    // Initial setup for creating a new client
    useEffect(() => {
        if (!knownClient && isExpanded) {
            // @ts-ignore
            setNewClientName(log.client_info?.name || '');
        }
    }, [isExpanded, knownClient, log.client_info]);

    // Handle Client Creation
    const handleCreateClient = async () => {
        if (!newClientName) return;
        setIsCreating(true);
        try {
            const newClient = {
                name: newClientName,
                ids: [log.client], // Use the IP from the log
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

            // Notify parent to refresh clients list
            if (onClientCreated) onClientCreated();

            // Auto-select the new client (optimistic)
            setSelectedClient(newClientName);

        } catch (e) {
            console.error(e);
            alert(t('filtering.action_failed'));
        }
        setIsCreating(false);
    };

    // Try to auto-select client if it matches a known client name or IP
    useEffect(() => {
        if (isExpanded && knownClient) {
            setSelectedClient(knownClient.name);
        }
    }, [isExpanded, knownClient]);

    const filteredClients = useMemo(() => {
        if (!clientSearch) return clients;
        return clients.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase()) || c.ids.some(id => id.includes(clientSearch)));
    }, [clients, clientSearch]);


    return (
        <>
            <tr
                className={`group transition-colors font-mono cursor-pointer ${blocked
                    ? 'bg-red-950/20 hover:bg-red-950/30 border-l-2 border-l-red-500'
                    : 'hover:bg-gray-800/50 border-l-2 border-l-transparent'
                    }`}
                onClick={onToggle}
            >
                <td className="px-6 py-4 text-gray-500">
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </td>
                <td className="px-6 py-4 text-gray-400 whitespace-nowrap">
                    {new Date(log.time).toLocaleTimeString()}
                </td>
                <td className="px-6 py-4">
                    <StatusBadge log={log} />
                </td>
                <td className="px-6 py-4 text-gray-300">
                    {(() => {
                        // Resolve client name priority: 1. AdGuard Info, 2. Configured Clients
                        let name = log.client_info?.name;
                        if (!name) {
                            const match = clients.find(c => c.ids.includes(log.client));
                            if (match) name = match.name;
                        }

                        if (name && name !== log.client) {
                            return (
                                <div>
                                    <div className="text-white font-medium text-sm">{name}</div>
                                    <div className="text-xs text-gray-500 font-mono">{log.client}</div>
                                </div>
                            );
                        }
                        return <span className="font-mono">{log.client}</span>;
                    })()}
                </td>
                <td className="px-6 py-4 text-white">
                    {log.question.name}
                    <span className="ml-2 text-xs text-gray-500 bg-gray-800 px-1.5 py-0.5 rounded">
                        {log.question.type}
                    </span>
                </td>
                <td className="px-6 py-4 text-gray-400 max-w-xs truncate">
                    {log.upstream ? (
                        <span className="flex items-center gap-1 text-xs">
                            <ArrowRight size={12} /> {log.upstream}
                        </span>
                    ) : (
                        log.answer?.[0]?.value
                    )}
                    {log.elapsedMs && <span className="ml-2 text-xs text-gray-600">({parseFloat(log.elapsedMs).toFixed(1)}ms)</span>}
                </td>
            </tr>
            {isExpanded && (
                <tr className={
                    blocked
                        ? 'bg-red-950/10'
                        : 'bg-gray-950/30'
                }>
                    <td colSpan={6} className="px-0 py-4 cursor-auto">
                        <div className="bg-gray-950 rounded-xl border-y border-gray-800 p-4 md:p-6 space-y-6 min-w-[600px] md:min-w-0">
                            {/* Header Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{t('logs.client_details')}</h4>
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-400">IP Address:</span>
                                            <span className="text-white font-mono cursor-pointer hover:text-blue-400" onClick={(e) => { e.stopPropagation(); onFilterClient(log.client); }}>{log.client}</span>
                                        </div>
                                        {/* @ts-ignore */}
                                        {log.client_info?.name && (
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-gray-400">Hostname:</span>
                                                {/* @ts-ignore */}
                                                <span className="text-white">{log.client_info.name}</span>
                                            </div>
                                        )}
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-400">{t('logs.proto')}:</span>
                                            {/* @ts-ignore */}
                                            <span className="text-white">{log.client_proto || 'UDP'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('logs.response_info')}</h4>
                                        <div className="flex gap-2">
                                            {blocked ? (
                                                <button
                                                    onClick={() => handleRule(log.question.name, 'whitelist')}
                                                    className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider bg-green-600 hover:bg-green-500 text-white px-2 py-1 rounded transition-colors"
                                                >
                                                    <Shield size={10} />
                                                    {t('logs.whitelist_global')}
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleRule(log.question.name, 'block')}
                                                    className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider bg-red-600 hover:bg-red-500 text-white px-2 py-1 rounded transition-colors"
                                                >
                                                    <Ban size={10} />
                                                    {t('logs.block_global')}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-400">{t('logs.status')}:</span>
                                            <span className="text-white">{log.status}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-400">{t('logs.elapsed')}:</span>
                                            {/* @ts-ignore */}
                                            <span className="text-white">{log.elapsedMs ? `${parseFloat(log.elapsedMs).toFixed(2)} ms` : log.elapsed}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-400">{t('logs.upstream')}:</span>
                                            <span className="text-blue-400 font-mono text-xs truncate max-w-[200px]">{log.upstream}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Client Operations */}
                            <div>
                                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{t('logs.client_operations')}</h4>

                                {!knownClient ? (
                                    <div className="bg-blue-900/10 border border-blue-500/20 rounded-lg p-4">
                                        <div className="flex items-center gap-3 mb-3">
                                            <User size={18} className="text-blue-400" />
                                            <div className="text-sm text-blue-100">
                                                {t('logs.unconfigured_client')} <span className="text-gray-400 text-xs ml-1">({t('logs.no_client_ip')} {log.client})</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 items-center">
                                            <input
                                                type="text"
                                                placeholder={t('clients.client_name')}
                                                value={newClientName}
                                                onChange={(e) => setNewClientName(e.target.value)}
                                                className="flex-1 bg-gray-950 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white focus:border-blue-500 outline-none"
                                            />
                                            <button
                                                onClick={handleCreateClient}
                                                disabled={isCreating || !newClientName}
                                                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                            >
                                                {isCreating ? <RotateCw size={14} className="animate-spin" /> : <User size={14} />}
                                                {t('logs.create_client')}
                                            </button>
                                        </div>
                                        <p className="text-[10px] text-gray-500 mt-2">
                                            {t('logs.create_client_desc')} <span className="font-mono text-gray-400">{log.client}</span>.
                                            {/* @ts-ignore */}
                                            {log.client_info?.name && <span> {t('logs.detected_hostname')}: <span className="text-gray-400">{log.client_info.name}</span>.</span>}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
                                        <div className="flex flex-col md:flex-row gap-4 items-end">
                                            <div className="flex-1 w-full space-y-1">
                                                <label className="text-xs text-gray-400">Select Client</label>
                                                <div className="relative">
                                                    <select
                                                        className="w-full bg-black border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                                                        value={selectedClient}
                                                        onChange={(e) => setSelectedClient(e.target.value)}
                                                    >
                                                        <option value="">-- {t('logs.select_client')} --</option>
                                                        {clients.map(c => (
                                                            <option key={c.name} value={c.name}>{c.name} ({c.ids.join(', ')})</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleRule(log.question.name, 'block_client', selectedClient)}
                                                    disabled={!selectedClient}
                                                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-900/30 text-red-400 hover:bg-red-900/50 hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs font-medium border border-red-900/50"
                                                >
                                                    <Ban size={14} />
                                                    {t('logs.block_client')}
                                                </button>
                                                <button
                                                    onClick={() => handleRule(log.question.name, 'whitelist_client', selectedClient)}
                                                    disabled={!selectedClient}
                                                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-green-900/30 text-green-400 hover:bg-green-900/50 hover:text-green-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs font-medium border border-green-900/50"
                                                >
                                                    <Shield size={14} />
                                                    {t('logs.whitelist_client')}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="mt-2 text-[10px] text-gray-600">
                                            Applies rule <code>$client='{selectedClient || '...'}'</code> to domain <code>{log.question.name}</code>.
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* DNS Question */}
                            <div>
                                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{t('logs.question')}</h4>
                                <div className="bg-gray-900 rounded-lg p-3 text-sm font-mono flex gap-4 text-white">
                                    <span className="text-purple-400">[{log.question.type}]</span>
                                    <span className="text-purple-400">[{log.question.class || 'IN'}]</span>
                                    <span>{log.question.name}</span>
                                </div>
                            </div>

                            {/* Blocking Rules */}
                            {log.rules && log.rules.length > 0 && (
                                <div>
                                    <h4 className="text-xs font-semibold text-red-500 uppercase tracking-wider mb-2">{t('logs.matched_rules')}</h4>
                                    <div className="bg-red-950/20 border border-red-900/50 rounded-lg p-3 space-y-2">
                                        {log.rules.map((rule, i) => (
                                            <div key={i} className="font-mono text-sm text-red-300 break-all">
                                                {rule.text}
                                                {rule.filter_list_id && <span className="ml-2 text-xs text-gray-500">({t('logs.list_id')}: {rule.filter_list_id})</span>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* DNS Answers */}
                            {log.answer && log.answer.length > 0 && (
                                <div>
                                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{t('logs.answer')}</h4>
                                    <div className="overflow-hidden rounded-lg border border-gray-800">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-900 text-gray-400">
                                                <tr>
                                                    <th className="px-4 py-2 text-left">{t('logs.type')}</th>
                                                    <th className="px-4 py-2 text-left">{t('logs.value')}</th>
                                                    <th className="px-4 py-2 text-right">{t('logs.ttl')}</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-800 bg-gray-900/50">
                                                {log.answer.map((ans, i) => (
                                                    <tr key={i}>
                                                        <td className="px-4 py-2 font-mono text-yellow-400">{ans.type}</td>
                                                        <td className="px-4 py-2 font-mono text-white break-all">{ans.value}</td>
                                                        <td className="px-4 py-2 font-mono text-gray-400 text-right">{ans.ttl}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Raw JSON Toggle (Optional, maybe hidden or bottom) */}
                            <div className="pt-4 border-t border-gray-800">
                                <details className="text-xs text-gray-600 cursor-pointer">
                                    <summary className="hover:text-gray-400 font-medium">{t('logs.view_json')}</summary>
                                    <pre className="mt-2 text-green-500 font-mono overflow-auto p-2 bg-black rounded max-h-60">
                                        {JSON.stringify(log, null, 2)}
                                    </pre>
                                </details>
                            </div>
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
}

function StatusBadge({ log }: { log: QueryLogItem }) {
    const { t } = useTranslation();
    const status = log.status;
    const reason = log.reason;
    const blocked = isBlocked(log);

    if (blocked) {
        return (
            <div className="flex flex-col items-start gap-1">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-500">
                    <Shield size={12} />
                    {t('logs.blocked')}
                </span>
                {(reason || status !== 'OK') && <span className="text-[10px] text-gray-500 max-w-[150px] truncate">{reason || status}</span>}
                {log.rules && log.rules.length > 0 && (
                    <span className="text-[10px] text-red-400 font-mono max-w-[150px] truncate" title={log.rules[0].text}>
                        {log.rules[0].text}
                    </span>
                )}
            </div>
        );
    }
    if (status === 'Filtered') {
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-500">
                <AlertTriangle size={12} />
                {t('logs.filtered')}
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-500">
            <Check size={12} />
            {t('logs.processed')}
        </span>
    );
}
