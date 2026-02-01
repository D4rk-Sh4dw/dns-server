'use client';

import { useEffect, useState } from 'react';
import { Search, RotateCw, Shield, AlertTriangle, Check, ArrowRight, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

interface QueryLogItem {
    time: string;
    client: string;
    question: {
        name: string;
        type: string;
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
}

export default function LogsPage() {
    const [logs, setLogs] = useState<QueryLogItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');
    const [olderThan, setOlderThan] = useState<string | undefined>(undefined);
    const [expandedLog, setExpandedLog] = useState<number | null>(null);

    const fetchLogs = async (reset = false) => {
        setLoading(true);
        try {
            const url = `/api/adguard/querylog?limit=100${olderThan && !reset ? `&older_than=${olderThan}` : ''}${filter ? `&search=${encodeURIComponent(filter)}` : ''}`;
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
        fetchLogs(true);
    }, [filter]); // Re-fetch when filter changes

    const loadMore = () => {
        if (logs.length > 0) {
            const lastLogTime = logs[logs.length - 1].time;
            setOlderThan(lastLogTime);
            // Effect will trigger? No, olderThan is state but fetch uses it. 
            // I need to trigger fetch explicitly or depend on olderThan.
            // But reset dependency calls fetch(true).
            // Let's just call fetch directly here.
        }
    };

    // Fix: loadMore logic properly
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

    return (
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Query Log</h1>
                    <p className="text-gray-400">Real-time DNS query inspection.</p>
                </div>
                <div className="flex gap-2">
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

            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                <input
                    type="text"
                    placeholder="Search domain or client IP..."
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
            </div>

            {/* Logs Table */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
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
                            <>
                                <tr key={idx} className="group hover:bg-gray-800/50 transition-colors font-mono cursor-pointer" onClick={() => setExpandedLog(expandedLog === idx ? null : idx)}>
                                    <td className="px-6 py-4 text-gray-500">
                                        {expandedLog === idx ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                    </td>
                                    <td className="px-6 py-4 text-gray-400 whitespace-nowrap">
                                        {new Date(log.time).toLocaleTimeString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <StatusBadge status={log.status} reason={log.reason} />
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
                                        {log.elapsed && <span className="ml-2 text-xs text-gray-600">({log.elapsed})</span>}
                                    </td>
                                </tr>
                                {expandedLog === idx && (
                                    <tr className="bg-gray-950/30">
                                        <td colSpan={6} className="px-6 py-4">
                                            <div className="bg-gray-950 rounded p-4 overflow-x-auto">
                                                <pre className="text-xs text-green-400 font-mono">
                                                    {JSON.stringify(log, null, 2)}
                                                </pre>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </>
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
        </div>
    );
}

function StatusBadge({ status, reason }: { status: string, reason?: string }) {
    if (status === 'Blocked' || status === 'SafeBrowsing' || status === 'Parental') {
        return (
            <div className="flex flex-col items-start gap-1">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-500">
                    <Shield size={12} />
                    {status}
                </span>
                {reason && <span className="text-[10px] text-gray-500 max-w-[100px] truncate">{reason}</span>}
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
            Processed
        </span>
    );
}
time: string;
client: string;
question: {
    name: string;
    type: string;
};
status: string;
reason ?: string;
upstream ?: string;
answer ?: {
    type: string;
    value: string;
}[];
}

export default function LogsPage() {
    const [logs, setLogs] = useState<QueryLogItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');

    const fetchLogs = async () => {
        setLoading(true);
        try {
            // We need to implement this endpoint or call AdGuard directly via our backend proxy
            // Assuming we'll add /api/adguard/querylog
            const res = await fetch('/api/adguard/querylog?limit=100');
            const data = await res.json();
            setLogs(data.data || []); // AdGuard typically returns { data: [...] }
        } catch (err) {
            console.error('Failed to fetch logs', err);
        }
        setLoading(false);
    };

    useEffect(() => { fetchLogs(); }, []);

    const filteredLogs = logs.filter(log =>
        log.question.name.toLowerCase().includes(filter.toLowerCase()) ||
        log.client.includes(filter)
    );

    return (
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Query Log</h1>
                    <p className="text-gray-400">Real-time DNS query inspection.</p>
                </div>
                <button
                    onClick={fetchLogs}
                    className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                >
                    <RotateCw size={20} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                <input
                    type="text"
                    placeholder="Search domain or client IP..."
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
            </div>

            {/* Logs Table */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-950/50 text-gray-500 uppercase font-medium">
                        <tr>
                            <th className="px-6 py-4">Time</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Client</th>
                            <th className="px-6 py-4">Domain</th>
                            <th className="px-6 py-4">Answer / Upstream</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {filteredLogs.map((log, idx) => (
                            <tr key={idx} className="group hover:bg-gray-800/50 transition-colors font-mono">
                                <td className="px-6 py-4 text-gray-400 whitespace-nowrap">
                                    {new Date(log.time).toLocaleTimeString()}
                                </td>
                                <td className="px-6 py-4">
                                    <StatusBadge status={log.status} reason={log.reason} />
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
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {!loading && filteredLogs.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        No logs found matching your criteria.
                    </div>
                )}
            </div>
        </div>
    );
}

function StatusBadge({ status, reason }: { status: string, reason?: string }) {
    if (status === 'Blocked') {
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-500">
                <Shield size={12} />
                Blocked
            </span>
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
            OK
        </span>
    );
}
