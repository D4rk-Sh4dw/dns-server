'use client';

import { useTranslation } from '@/lib/i18n-context';
import { useEffect, useState, useRef, useCallback } from 'react';
import {
    Play, Pause, RefreshCw, Filter, Search, Zap,
    Shield, ShieldCheck, ShieldAlert, ArrowRightLeft,
    X, Activity, Clock, Globe, Server, ChevronDown, ChevronUp
} from 'lucide-react';
import PageLayout, { PageHeader } from '../components/PageLayout';

interface StreamQuery {
    time: string;
    client: string;
    client_info?: { name?: string };
    question: { name: string; type: string };
    status: string;
    reason?: string;
    upstream?: string;
    answer?: { type: string; value: string; ttl?: number }[];
    elapsed?: number;
    client_proto?: string;
    isBlocked: boolean;
    isSafeSearch: boolean;
    isRewrite: boolean;
    timestamp: number;
}

const MAX_ENTRIES = 500;
const POLL_INTERVAL = 3000;

export default function StreamPage() {
    const { t } = useTranslation();
    const [queries, setQueries] = useState<StreamQuery[]>([]);
    const [isPlaying, setIsPlaying] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastPoll, setLastPoll] = useState(Date.now());

    // Filters
    const [filterBlocked, setFilterBlocked] = useState(false);
    const [filterClient, setFilterClient] = useState('');
    const [filterDomain, setFilterDomain] = useState('');
    const [expandedRow, setExpandedRow] = useState<number | null>(null);

    // Stats
    const [queriesPerSec, setQueriesPerSec] = useState(0);
    const [totalBlocked, setTotalBlocked] = useState(0);
    const [totalAllowed, setTotalAllowed] = useState(0);

    const scrollRef = useRef<HTMLDivElement>(null);
    const shouldAutoScroll = useRef(true);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // Fetch new queries
    const fetchStream = useCallback(async () => {
        if (!isPlaying) return;
        setLoading(true);
        try {
            // Get the most recent timestamp we have
            const mostRecent = queries.length > 0 ? queries[0].timestamp : lastPoll - 60000;
            const res = await fetch(`/api/adguard/stream?since=${mostRecent}&limit=100`);
            const data = await res.json();

            if (data.error) throw new Error(data.error);

            if (data.queries && data.queries.length > 0) {
                setQueries(prev => {
                    // Merge new queries, deduplicate by timestamp+client+domain
                    const merged = [...data.queries, ...prev];
                    const seen = new Set();
                    const deduped = merged.filter((q: StreamQuery) => {
                        const key = `${q.timestamp}-${q.client}-${q.question?.name}`;
                        if (seen.has(key)) return false;
                        seen.add(key);
                        return true;
                    });
                    // Keep only MAX_ENTRIES
                    return deduped.slice(0, MAX_ENTRIES);
                });
            }
            setLastPoll(Date.now());
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Stream error');
        }
        setLoading(false);
    }, [isPlaying, queries, lastPoll]);

    // Initial load and polling
    useEffect(() => {
        fetchStream();
        intervalRef.current = setInterval(fetchStream, POLL_INTERVAL);
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []);

    // Update polling when play state changes
    useEffect(() => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        if (isPlaying) {
            intervalRef.current = setInterval(fetchStream, POLL_INTERVAL);
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isPlaying, fetchStream]);

    // Calculate stats
    useEffect(() => {
        const now = Date.now();
        const last60s = queries.filter(q => now - q.timestamp < 60000);
        const qps = last60s.length / 60;
        setQueriesPerSec(Math.round(qps * 10) / 10);

        const blocked = queries.filter(q => q.isBlocked).length;
        setTotalBlocked(blocked);
        setTotalAllowed(queries.length - blocked);
    }, [queries]);

    // Auto-scroll to bottom
    useEffect(() => {
        if (shouldAutoScroll.current && scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [queries]);

    // Handle scroll to detect user scrolling up
    const handleScroll = () => {
        if (!scrollRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
        const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
        shouldAutoScroll.current = isAtBottom;
    };

    // Filtered queries
    const filteredQueries = queries.filter(q => {
        if (filterBlocked && !q.isBlocked) return false;
        if (filterClient && !q.client?.toLowerCase().includes(filterClient.toLowerCase())) return false;
        if (filterDomain && !q.question?.name?.toLowerCase().includes(filterDomain.toLowerCase())) return false;
        return true;
    });

    // Reverse for display (newest at bottom)
    const displayQueries = [...filteredQueries].reverse();

    const getStatusColor = (q: StreamQuery) => {
        if (q.isBlocked) return 'text-red-400 bg-red-500/10 border-red-500/20';
        if (q.isSafeSearch) return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
        if (q.isRewrite) return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
        return 'text-green-400 bg-green-500/10 border-green-500/20';
    };

    const getStatusIcon = (q: StreamQuery) => {
        if (q.isBlocked) return <ShieldAlert size={14} />;
        if (q.isSafeSearch) return <ShieldCheck size={14} />;
        if (q.isRewrite) return <ArrowRightLeft size={14} />;
        return <Shield size={14} />;
    };

    const getStatusLabel = (q: StreamQuery) => {
        if (q.isBlocked) return 'Blocked';
        if (q.isSafeSearch) return 'SafeSearch';
        if (q.isRewrite) return 'Rewrite';
        return 'Allowed';
    };

    const formatTime = (timestamp: number) => {
        const d = new Date(timestamp);
        return d.toLocaleTimeString('de-DE', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 });
    };

    return (
        <PageLayout
            flush
            noHeaderBorder
            header={
                <PageHeader
                    dense
                    icon={<Activity className="text-blue-400" size={20} />}
                    title="Live Query Stream"
                    subtitle={<>
                        Real-time DNS queries <span className="text-gray-600">•</span> {queries.length} entries <span className="text-gray-600">•</span> {queriesPerSec} q/s
                    </>}
                    actions={
                        <>
                            <button
                                onClick={() => setIsPlaying(!isPlaying)}
                                className={`p-2 rounded-lg transition-colors ${
                                    isPlaying ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
                                }`}
                                title={isPlaying ? 'Pause' : 'Play'}
                            >
                                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                            </button>
                            <button
                                onClick={fetchStream}
                                disabled={loading}
                                className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                            >
                                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                            </button>
                        </>
                    }
                />
            }
        >

            {/* Stats Bar */}
            <div className="grid grid-cols-3 border-b border-gray-800">
                <div className="px-4 py-2 border-r border-gray-800">
                    <div className="flex items-center gap-2 text-green-400">
                        <Zap size={14} />
                        <span className="text-sm font-medium">{totalAllowed}</span>
                        <span className="text-gray-500 text-xs">Allowed</span>
                    </div>
                </div>
                <div className="px-4 py-2 border-r border-gray-800">
                    <div className="flex items-center gap-2 text-red-400">
                        <ShieldAlert size={14} />
                        <span className="text-sm font-medium">{totalBlocked}</span>
                        <span className="text-gray-500 text-xs">Blocked</span>
                    </div>
                </div>
                <div className="px-4 py-2">
                    <div className="flex items-center gap-2 text-blue-400">
                        <Activity size={14} />
                        <span className="text-sm font-medium">{queriesPerSec}</span>
                        <span className="text-gray-500 text-xs">q/s</span>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-800 bg-gray-950/50">
                <Filter size={14} className="text-gray-500" />
                <button
                    onClick={() => setFilterBlocked(!filterBlocked)}
                    className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                        filterBlocked ? 'bg-red-500/20 text-red-400' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                >
                    Blocked only
                </button>
                <input
                    type="text"
                    value={filterClient}
                    onChange={e => setFilterClient(e.target.value)}
                    placeholder="Client IP..."
                    className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white w-32 focus:outline-none focus:border-blue-500"
                />
                <input
                    type="text"
                    value={filterDomain}
                    onChange={e => setFilterDomain(e.target.value)}
                    placeholder="Domain..."
                    className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white w-40 focus:outline-none focus:border-blue-500"
                />
                {(filterBlocked || filterClient || filterDomain) && (
                    <button
                        onClick={() => { setFilterBlocked(false); setFilterClient(''); setFilterDomain(''); }}
                        className="text-gray-500 hover:text-white"
                    >
                        <X size={14} />
                    </button>
                )}
            </div>

            {error && (
                <div className="px-4 py-2 bg-red-500/10 border-b border-red-500/20 text-red-400 text-sm flex items-center gap-2">
                    <X size={14} /> {error}
                </div>
            )}

            {/* Stream Table */}
            <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="overflow-y-auto"
            >
                <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-gray-950 z-10">
                        <tr className="border-b border-gray-800 text-gray-500 text-xs">
                            <th className="px-3 py-2 text-left w-24">Time</th>
                            <th className="px-3 py-2 text-left w-20">Status</th>
                            <th className="px-3 py-2 text-left">Client</th>
                            <th className="px-3 py-2 text-left">Domain</th>
                            <th className="px-3 py-2 text-left w-16">Type</th>
                            <th className="px-3 py-2 text-left w-20">Answer</th>
                            <th className="px-3 py-2 text-right w-16">Ms</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-900">
                        {displayQueries.map((q, idx) => {
                            const isExpanded = expandedRow === idx;
                            const statusClass = getStatusColor(q);
                            const clientName = q.client_info?.name || q.client;

                            return (
                                <>
                                    <tr
                                        key={`${q.timestamp}-${q.client}-${q.question?.name}-${idx}`}
                                        onClick={() => setExpandedRow(isExpanded ? null : idx)}
                                        className="hover:bg-gray-900/50 cursor-pointer transition-colors"
                                    >
                                        <td className="px-3 py-1.5 text-gray-500 font-mono text-xs whitespace-nowrap">
                                            {formatTime(q.timestamp)}
                                        </td>
                                        <td className="px-3 py-1.5">
                                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium ${statusClass}`}>
                                                {getStatusIcon(q)}
                                                {getStatusLabel(q)}
                                            </span>
                                        </td>
                                        <td className="px-3 py-1.5 text-gray-300">
                                            <div className="flex items-center gap-1">
                                                <Server size={12} className="text-gray-600" />
                                                <span className="truncate max-w-[120px]">{clientName}</span>
                                            </div>
                                        </td>
                                        <td className="px-3 py-1.5">
                                            <div className="flex items-center gap-1">
                                                <Globe size={12} className="text-gray-600" />
                                                <span className={`truncate max-w-[200px] ${q.isBlocked ? 'text-red-300' : 'text-blue-300'}`}>
                                                    {q.question?.name || '-'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-3 py-1.5 text-gray-500 text-xs">
                                            {q.question?.type || 'A'}
                                        </td>
                                        <td className="px-3 py-1.5 text-gray-400 text-xs truncate max-w-[100px]">
                                            {q.answer?.[0]?.value || (q.isBlocked ? '0.0.0.0' : '-')}
                                        </td>
                                        <td className="px-3 py-1.5 text-right text-gray-500 text-xs font-mono">
                                            {q.elapsed ? `${(q.elapsed / 1000).toFixed(1)}` : '-'}
                                        </td>
                                    </tr>
                                    {isExpanded && (
                                        <tr>
                                            <td colSpan={7} className="px-3 py-2 bg-gray-950">
                                                <div className="text-xs text-gray-400 space-y-1">
                                                    <div><span className="text-gray-600">Status:</span> {q.status} {q.reason && `(${q.reason})`}</div>
                                                    <div><span className="text-gray-600">Client:</span> {q.client} {q.client_proto && `(${q.client_proto})`}</div>
                                                    <div><span className="text-gray-600">Upstream:</span> {q.upstream || 'Local'}</div>
                                                    {q.answer && q.answer.length > 0 && (
                                                        <div>
                                                            <span className="text-gray-600">Answers:</span>{' '}
                                                            {q.answer.map((a, i) => (
                                                                <span key={i} className="text-gray-300">
                                                                    {a.value} (TTL: {a.ttl})
                                                                    {i < q.answer!.length - 1 && ', '}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </>
                            );
                        })}
                        {displayQueries.length === 0 && (
                            <tr>
                                <td colSpan={7} className="px-3 py-8 text-center text-gray-500">
                                    {loading ? 'Loading...' : 'No queries yet. Waiting for DNS traffic...'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </PageLayout>
    );
}
