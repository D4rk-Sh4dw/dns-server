'use client';

import { useEffect, useState, useMemo } from 'react';
import { Search, RotateCw, Shield, AlertTriangle, Check, ArrowRight, Trash2, ChevronDown, ChevronUp, Ban, User, X } from 'lucide-react';

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
    const [logs, setLogs] = useState<QueryLogItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [olderThan, setOlderThan] = useState<string | undefined>(undefined);
    const [expandedLog, setExpandedLog] = useState<number | null>(null);
    const [clients, setClients] = useState<Client[]>([]);

    useEffect(() => {
        // Fetch clients for the dropdown
        fetch('/api/adguard/clients')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setClients(data);
            })
            .catch(err => console.error('Failed to fetch clients', err));
    }, []);

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
        if (!confirm('Are you sure you want to clear the query log?')) return;
        try {
            await fetch('/api/adguard/querylog', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'clear' })
            });
            setLogs([]);
            fetchLogs(true);
        } catch (err) {
            alert('Failed to clear logs');
        }
    };

    const handleRule = async (domain: string, type: 'block' | 'whitelist' | 'block_client' | 'whitelist_client', clientName?: string) => {
        let rule = '';
        if (type === 'block') {
            rule = `||${domain}^`;
        } else if (type === 'whitelist') {
            rule = `@@||${domain}^`;
        } else if (type === 'block_client') {
            if (!clientName) return alert('No client selected');
            rule = `||${domain}^$client='${clientName}'`;
        } else if (type === 'whitelist_client') {
            if (!clientName) return alert('No client selected');
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
            alert(err instanceof Error ? err.message : 'Failed to add rule');
        }
    };

    return (
        <div className="p-4 md:p-8 space-y-6 md:space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-2">Query Log</h1>
                    <p className="text-gray-400 text-sm md:text-base">Real-time DNS query inspection.</p>
                </div>
                <div className="flex gap-2 self-end sm:self-auto">
                    <button
                        onClick={handleClearLogs}
                        className="p-2 rounded-lg bg-red-900/20 hover:bg-red-900/40 text-red-400 hover:text-red-300 transition-colors"
                        title="Clear Logs"
                    >
                        <Trash2 size={20} />
                    </button>
                    <button
                        onClick={() => fetchLogs(true)}
                        className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                        title="Refresh"
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
                        placeholder="Search domain, client IP, or answer..."
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
                    <option value="">All Queries</option>
                    <option value="blocked">Blocked</option>
                    <option value="blocked_services">Blocked Services</option>
                    <option value="safe_browsing">Blocked Threats</option>
                    <option value="parental">Blocked by Parental</option>
                    <option value="processed">Processed</option>
                    <option value="filtered">Filtered</option>
                    <option value="rewritten">Rewritten</option>
                    <option value="safe_search">Safe Search</option>
                </select>
            </div>

            {/* Logs Table */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-950/50 text-gray-500 uppercase font-medium">
                        <tr>
                            <th className="px-6 py-4"></th>
                            <th className="px-6 py-4">Time</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Client</th>
                            <th className="px-6 py-4">Domain</th>
                            <th className="px-6 py-4">Answer / Upstream</th>
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
                            />
                        ))}
                    </tbody>
                </table>
                {!loading && logs.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        No logs found matching your criteria.
                    </div>
                )}
                {logs.length > 0 && (
                    <div className="p-4 flex justify-center border-t border-gray-800">
                        <button
                            onClick={loadMore}
                            disabled={loading}
                            className="text-sm text-blue-400 hover:text-blue-300 disabled:opacity-50"
                        >
                            {loading ? 'Loading...' : 'Load More Logs'}
                        </button>
                    </div>
                )}
            </div>
        </div >
    );
}

function LogItem({ log, isExpanded, onToggle, onFilterClient, handleRule, clients }: {
    log: QueryLogItem;
    isExpanded: boolean;
    onToggle: () => void;
    onFilterClient: (client: string) => void;
    handleRule: (domain: string, type: 'block' | 'whitelist' | 'block_client' | 'whitelist_client', clientName?: string) => void;
    clients: Client[];
}) {
    const blocked = isBlocked(log);
    const [selectedClient, setSelectedClient] = useState<string>('');
    const [clientSearch, setClientSearch] = useState('');

    // Try to auto-select client if it matches a known client name or IP
    useEffect(() => {
        if (isExpanded) {
            const match = clients.find(c =>
                c.ids.includes(log.client) ||
                (log.client_info?.name && c.ids.includes(log.client_info.name)) ||
                c.name === log.client_info?.name
            );
            if (match) {
                setSelectedClient(match.name);
            } else {
                // If no exact match, maybe default to empty or the first one?
                // For now, let's leave it empty so user chooses, or maybe default to 'Client X' if created?
                // Actually, if we can't map it, user might want to select manually.
            }
        }
    }, [isExpanded, log.client, log.client_info, clients]);

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
                <td className="px-6 py-4 text-gray-300">{log.client}</td>
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
                                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Client Details</h4>
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
                                            <span className="text-gray-400">Proto:</span>
                                            {/* @ts-ignore */}
                                            <span className="text-white">{log.client_proto || 'UDP'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Response Info</h4>
                                        <div className="flex gap-2">
                                            {blocked ? (
                                                <button
                                                    onClick={() => handleRule(log.question.name, 'whitelist')}
                                                    className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider bg-green-600 hover:bg-green-500 text-white px-2 py-1 rounded transition-colors"
                                                >
                                                    <Shield size={10} />
                                                    Whitelist Global
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleRule(log.question.name, 'block')}
                                                    className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider bg-red-600 hover:bg-red-500 text-white px-2 py-1 rounded transition-colors"
                                                >
                                                    <Ban size={10} />
                                                    Block Global
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-400">Status:</span>
                                            <span className="text-white">{log.status}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-400">Elapsed:</span>
                                            {/* @ts-ignore */}
                                            <span className="text-white">{log.elapsedMs ? `${parseFloat(log.elapsedMs).toFixed(2)} ms` : log.elapsed}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-400">Upstream:</span>
                                            <span className="text-blue-400 font-mono text-xs truncate max-w-[200px]">{log.upstream}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Client Operations */}
                            <div>
                                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Client Operations</h4>
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
                                                    <option value="">-- Select Client --</option>
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
                                                Block for Client
                                            </button>
                                            <button
                                                onClick={() => handleRule(log.question.name, 'whitelist_client', selectedClient)}
                                                disabled={!selectedClient}
                                                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-green-900/30 text-green-400 hover:bg-green-900/50 hover:text-green-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs font-medium border border-green-900/50"
                                            >
                                                <Shield size={14} />
                                                Whitelist for Client
                                            </button>
                                        </div>
                                    </div>
                                    <div className="mt-2 text-[10px] text-gray-600">
                                        Applies rule <code>$client='{selectedClient || '...'}'</code> to domain <code>{log.question.name}</code>.
                                    </div>
                                </div>
                            </div>

                            {/* DNS Question */}
                            <div>
                                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Question</h4>
                                <div className="bg-gray-900 rounded-lg p-3 text-sm font-mono flex gap-4 text-white">
                                    <span className="text-purple-400">[{log.question.type}]</span>
                                    <span className="text-purple-400">[{log.question.class || 'IN'}]</span>
                                    <span>{log.question.name}</span>
                                </div>
                            </div>

                            {/* Blocking Rules */}
                            {log.rules && log.rules.length > 0 && (
                                <div>
                                    <h4 className="text-xs font-semibold text-red-500 uppercase tracking-wider mb-2">Matched Rules</h4>
                                    <div className="bg-red-950/20 border border-red-900/50 rounded-lg p-3 space-y-2">
                                        {log.rules.map((rule, i) => (
                                            <div key={i} className="font-mono text-sm text-red-300 break-all">
                                                {rule.text}
                                                {rule.filter_list_id && <span className="ml-2 text-xs text-gray-500">(List ID: {rule.filter_list_id})</span>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* DNS Answers */}
                            {log.answer && log.answer.length > 0 && (
                                <div>
                                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Answer</h4>
                                    <div className="overflow-hidden rounded-lg border border-gray-800">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-900 text-gray-400">
                                                <tr>
                                                    <th className="px-4 py-2 text-left">Type</th>
                                                    <th className="px-4 py-2 text-left">Value</th>
                                                    <th className="px-4 py-2 text-right">TTL</th>
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
                                    <summary className="hover:text-gray-400 font-medium">View Raw JSON</summary>
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
    const status = log.status;
    const reason = log.reason;
    const blocked = isBlocked(log);

    if (blocked) {
        return (
            <div className="flex flex-col items-start gap-1">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-500">
                    <Shield size={12} />
                    Blocked
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
                Filtered
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-500">
            <Check size={12} />
            Allowed
        </span>
    );
}
