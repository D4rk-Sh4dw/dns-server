'use client';

import { useTranslation } from '@/lib/i18n-context';
import { useEffect, useState } from 'react';
import {
    Database, Zap, Clock, Globe, Search, RefreshCw,
    AlertTriangle, CheckCircle, Info, X, ChevronDown, ChevronUp,
    HardDrive, TrendingUp, Server
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    Cell
} from 'recharts';

interface CacheData {
    adguard: {
        enabled: boolean;
        size: number;
        ttlMin: number;
        ttlMax: number;
        optimistic: boolean;
    } | null;
    technitium: {
        totalCached: number;
        cachedEntries: number;
        totalQueries: number;
        totalBlocked: number;
    } | null;
    cacheHitRate: number;
    ttlDistribution: Record<string, number>;
    zoneStats: Array<{
        zone: string;
        count: number;
        avgTtl: number;
    }>;
    cacheEntries: Array<any>;
    recommendations: string[];
}

const TTL_COLORS: Record<string, string> = {
    'lt60s': '#ef4444',
    '1to5min': '#f97316',
    '5to30min': '#eab308',
    '30to1h': '#22c55e',
    '1to6h': '#3b82f6',
    '6to24h': '#8b5cf6',
    'gt24h': '#10b981',
};

const TTL_LABELS: Record<string, string> = {
    'lt60s': '<1 min',
    '1to5min': '1-5 min',
    '5to30min': '5-30 min',
    '30to1h': '30-60 min',
    '1to6h': '1-6 h',
    '6to24h': '6-24 h',
    'gt24h': '>24 h',
};

export default function CachePage() {
    const { t } = useTranslation();
    const [data, setData] = useState<CacheData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedRecs, setExpandedRecs] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/cache?search=${encodeURIComponent(searchTerm)}&limit=100`);
            const json = await res.json();
            if (json.error) throw new Error(json.error);
            setData(json);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load cache data');
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchTerm !== '') fetchData();
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    if (loading && !data) {
        return (
            <div className="p-8 flex items-center justify-center h-64">
                <RefreshCw size={24} className="animate-spin text-blue-400" />
            </div>
        );
    }

    // Prepare chart data
    const chartData = data ? Object.entries(data.ttlDistribution).map(([key, value]) => ({
        name: TTL_LABELS[key] || key,
        value,
        color: TTL_COLORS[key] || '#6b7280',
    })) : [];

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    return (
        <div className="p-4 md:p-8 space-y-6 md:space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-2">DNS Cache Analytics</h1>
                    <p className="text-gray-400 text-sm md:text-base">Cache performance, TTL distribution, and optimization recommendations.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={fetchData}
                        className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                        disabled={loading}
                    >
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 flex items-center gap-2">
                    <X size={18} /> {error}
                </div>
            )}

            {data && (
                <>
                    {/* KPI Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                            <div className="flex items-center gap-2 text-gray-400 mb-2">
                                <HardDrive size={16} />
                                <span className="text-sm">Cache Size</span>
                            </div>
                            <p className="text-2xl font-bold text-white">
                                {data.adguard ? formatBytes(data.adguard.size) : 'N/A'}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                {data.adguard?.enabled ? 'Enabled' : 'Disabled'}
                                {data.adguard?.optimistic && ' • Optimistic'}
                            </p>
                        </div>

                        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                            <div className="flex items-center gap-2 text-gray-400 mb-2">
                                <Database size={16} />
                                <span className="text-sm">Cached Entries</span>
                            </div>
                            <p className="text-2xl font-bold text-white">
                                {data.technitium?.cachedEntries?.toLocaleString() || 'N/A'}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                {data.technitium?.totalCached?.toLocaleString() || 0} total cached
                            </p>
                        </div>

                        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                            <div className="flex items-center gap-2 text-gray-400 mb-2">
                                <TrendingUp size={16} />
                                <span className="text-sm">Cache Hit Rate</span>
                            </div>
                            <p className={`text-2xl font-bold ${data.cacheHitRate > 50 ? 'text-green-400' : data.cacheHitRate > 20 ? 'text-yellow-400' : 'text-red-400'}`}>
                                {data.cacheHitRate}%
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                {data.technitium?.totalQueries?.toLocaleString() || 0} total queries
                            </p>
                        </div>

                        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                            <div className="flex items-center gap-2 text-gray-400 mb-2">
                                <Clock size={16} />
                                <span className="text-sm">TTL Range</span>
                            </div>
                            <p className="text-2xl font-bold text-white">
                                {data.adguard ? `${data.adguard.ttlMin}s - ${data.adguard.ttlMax}s` : 'N/A'}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">Min / Max configured</p>
                        </div>
                    </div>

                    {/* Recommendations */}
                    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                        <button
                            onClick={() => setExpandedRecs(!expandedRecs)}
                            className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-800/50 transition-colors"
                        >
                            <div className="flex items-center gap-2">
                                <Zap size={16} className="text-yellow-400" />
                                <span className="text-white font-medium">Optimization Recommendations</span>
                                <span className="text-xs text-gray-500">({data.recommendations.length})</span>
                            </div>
                            {expandedRecs ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                        </button>
                        {expandedRecs && (
                            <div className="px-4 pb-4 space-y-2">
                                {data.recommendations.map((rec, idx) => (
                                    <div key={idx} className="flex items-start gap-2 text-sm">
                                        {rec.includes('good') || rec.includes('No immediate') ? (
                                            <CheckCircle size={14} className="text-green-400 mt-0.5 flex-shrink-0" />
                                        ) : rec.includes('Unable') ? (
                                            <AlertTriangle size={14} className="text-red-400 mt-0.5 flex-shrink-0" />
                                        ) : (
                                            <Info size={14} className="text-blue-400 mt-0.5 flex-shrink-0" />
                                        )}
                                        <span className="text-gray-300">{rec}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* TTL Distribution Chart */}
                        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                            <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                                <Clock size={16} className="text-blue-400" />
                                TTL Distribution
                            </h3>
                            {chartData.some(d => d.value > 0) ? (
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                            <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                                            <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: '#1f2937',
                                                    border: '1px solid #374151',
                                                    borderRadius: '8px',
                                                    color: '#fff',
                                                }}
                                            />
                                            <Bar dataKey="value">
                                                {chartData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div className="h-64 flex items-center justify-center text-gray-500">
                                    No cache entries available for analysis
                                </div>
                            )}
                        </div>

                        {/* Top Zones */}
                        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                            <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                                <Globe size={16} className="text-green-400" />
                                Top Zones by Cache Entries
                            </h3>
                            {data.zoneStats.length > 0 ? (
                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                    {data.zoneStats.map((zone) => (
                                        <div key={zone.zone} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                                            <div className="flex items-center gap-2">
                                                <Server size={14} className="text-gray-500" />
                                                <span className="text-gray-300 text-sm">{zone.zone}</span>
                                            </div>
                                            <div className="flex items-center gap-4 text-sm">
                                                <span className="text-gray-500">{zone.count} entries</span>
                                                <span className={`${zone.avgTtl < 300 ? 'text-red-400' : 'text-gray-500'}`}>
                                                    avg {zone.avgTtl}s
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="h-64 flex items-center justify-center text-gray-500">
                                    No zone data available
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Cache Entries Search */}
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                        <div className="flex items-center gap-3 mb-4">
                            <Search size={16} className="text-gray-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                placeholder="Search cache entries by domain..."
                                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                            />
                            <button
                                onClick={fetchData}
                                className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm transition-colors"
                            >
                                Search
                            </button>
                        </div>

                        {data.cacheEntries.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-gray-800 text-gray-500 text-xs">
                                            <th className="px-3 py-2 text-left">Domain</th>
                                            <th className="px-3 py-2 text-left">Type</th>
                                            <th className="px-3 py-2 text-left">TTL</th>
                                            <th className="px-3 py-2 text-left">Value</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-800">
                                        {data.cacheEntries.map((entry, idx) => (
                                            <tr key={idx} className="hover:bg-gray-800/50">
                                                <td className="px-3 py-2 text-blue-300">{entry.name || entry.domain || '-'}</td>
                                                <td className="px-3 py-2 text-gray-400">{entry.type || 'A'}</td>
                                                <td className="px-3 py-2 text-gray-400 font-mono">{entry.ttl || '-'}</td>
                                                <td className="px-3 py-2 text-gray-300 truncate max-w-[300px]">
                                                    {entry.value || entry.rData || JSON.stringify(entry.rData || {})}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                No cache entries found. Try adjusting your search or check if Technitium cache API is accessible.
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
