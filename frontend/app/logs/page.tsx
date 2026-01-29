'use client';

import { useEffect, useState } from 'react';
import { Search, RotateCw, Shield, AlertTriangle, Check, ArrowRight } from 'lucide-react';

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
