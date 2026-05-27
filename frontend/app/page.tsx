'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  Activity,
  Shield,
  Globe,
  Wifi,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n-context';

interface AdGuardStats {
  num_dns_queries: number;
  num_blocked_filtering: number;
  avg_processing_time: number;
  dns_queries: number[];
  top_queried_domains: { [key: string]: number }[];
  top_blocked_domains: { [key: string]: number }[];
  top_clients: { [key: string]: number }[];
  top_upstreams_avg_time?: { name: string; count: number }[];
  top_upstreams_responses?: { name: string; count: number }[];
  // AdGuard API typo variants (missing 'a' in upstreams)
  top_upstrems_avg_time?: { name: string; count: number }[];
  top_upstrems_responses?: { name: string; count: number }[];
}

interface DashboardData {
  adguard: {
    stats: AdGuardStats;
    status: { protection_enabled: boolean };
  } | null;
  loading: boolean;
  error: string | null;
}

export default function Home() {
  const [data, setData] = useState<{
    adguard: any;
    technitium: any;
    apiStatus: string;
    loading: boolean;
    error: string | null;
  }>({
    adguard: null,
    technitium: null,
    apiStatus: 'Operational',
    loading: true,
    error: null,
  });

  const { t } = useTranslation();

  const fetchData = async () => {
    setData(prev => ({ ...prev, loading: true }));
    try {
      const [adguardRes, techRes] = await Promise.all([
        fetch('/api/adguard'),
        fetch('/api/technitium/status')
      ]);

      const adguard = await adguardRes.json();
      const technitium = await techRes.json();

      setData({
        adguard,
        technitium,
        apiStatus: 'Operational',
        loading: false,
        error: null,
      });
    } catch (err) {
      setData({
        adguard: null,
        technitium: null,
        apiStatus: 'Degraded',
        loading: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const stats = data.adguard?.stats;

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">{t('dashboard.title')}</h1>
          <p className="text-gray-400">{t('dashboard.subtitle')}</p>
        </div>
        <button
          onClick={fetchData}
          className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors border border-gray-700"
        >
          <RefreshCw size={20} className={data.loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {data.error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400">
          {data.error}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title={t('dashboard.total_queries')}
          value={stats?.num_dns_queries?.toLocaleString() || '—'}
          trend={t('dashboard.last_24h')}
          icon={Activity}
          loading={data.loading}
        />
        <StatCard
          title={t('dashboard.threats_blocked')}
          value={stats?.num_blocked_filtering?.toLocaleString() || '—'}
          trend={stats && stats.num_dns_queries > 0 ? `${((stats.num_blocked_filtering / stats.num_dns_queries) * 100).toFixed(1)}% ${t('dashboard.blocked')}` : '—'}
          icon={Shield}
          trendUp={true}
          color="text-red-400"
          loading={data.loading}
        />
        <StatCard
          title={t('dashboard.protection')}
          value={data.adguard?.status?.protection_enabled ? t('dashboard.active') : t('dashboard.disabled')}
          trend={data.adguard?.status?.protection_enabled ? t('dashboard.status_ok') : t('dashboard.status_error')}
          icon={Globe}
          color={data.adguard?.status?.protection_enabled ? 'text-green-400' : 'text-red-400'}
          loading={data.loading}
        />
        <StatCard
          title={t('dashboard.performance')}
          value={stats ? `${(stats.avg_processing_time * 1000).toFixed(1)} ms` : '—'}
          trend={t('dashboard.avg_time')}
          icon={Wifi}
          color="text-blue-400"
          loading={data.loading}
        />
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Chart Section */}
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-white">{t('dashboard.dns_traffic')}</h3>
              <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">{t('dashboard.queries_per_hour')}</span>
            </div>
            <div className="h-72">
              <QueryChart data={stats?.dns_queries} />
            </div>
          </div>

          {/* Top Domains Split */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TopTable
              title={t('dashboard.top_queried')}
              data={stats?.top_queried_domains}
              icon={Globe}
              color="text-blue-400"
              linkTo="/logs"
            />
            <TopTable
              title={t('dashboard.top_blocked')}
              data={stats?.top_blocked_domains}
              icon={Shield}
              color="text-red-400"
              linkTo="/logs"
              statusFilter="blocked"
            />
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <TopTable
            title={t('dashboard.top_clients')}
            data={stats?.top_clients}
            icon={Activity}
            color="text-purple-400"
            clientNames={data.adguard?.clientNames}
            linkTo="/logs"
          />

          {/* Upstream Response Times */}
          <UpstreamLatency upstreams={stats?.top_upstreams_avg_time || stats?.top_upstrems_avg_time} upstreamResponses={stats?.top_upstreams_responses || stats?.top_upstrems_responses} />

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-medium text-white mb-4">{t('dashboard.infra_status')}</h3>
            <div className="space-y-4">
              <div className="space-y-4">
                <ServiceStatus
                  name="AdGuard Home"
                  status={data.adguard?.status ? t('dashboard.operational') : t('dashboard.disconnected')}
                  isOperational={!!data.adguard?.status}
                  version={data.adguard?.status?.version || t('dashboard.primary_dns')}
                />
                <ServiceStatus
                  name="Technitium DNS"
                  status={data.technitium?.summary ? t('dashboard.operational') : t('dashboard.disconnected')}
                  isOperational={!!data.technitium?.summary}
                  version={data.technitium?.summary?.version || t('dashboard.recursive_resolver')}
                />
                <ServiceStatus
                  name="Dashboard API"
                  status={data.apiStatus === 'Operational' ? t('dashboard.operational') : data.apiStatus}
                  isOperational={data.apiStatus === 'Operational'}
                  version={`v1.1.0 (Next.js)`}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TopTable({ title, data, icon: Icon, color, clientNames, linkTo, statusFilter }: { title: string, data?: any[], icon: any, color: string, clientNames?: Record<string, string>, linkTo?: string, statusFilter?: string }) {
  const { t } = useTranslation();
  const router = useRouter();

  if (!data || data.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 min-h-[300px] flex flex-col">
        <h3 className="text-lg font-medium text-white mb-4">{title}</h3>
        <div className="flex-1 flex items-center justify-center text-gray-500 text-sm italic">{t('dashboard.no_records')}</div>
      </div>
    );
  }

  // AdGuard format can be:
  // 1. [{ "domain.com": 100 }]
  // 2. [{ "domain": "domain.com", "count": 100 }]
  // 3. [{ "host": "1.2.3.4", "count": 100 }] (for clients)
  const normalizedData = data.slice(0, 10).map(item => {
    if (typeof item !== 'object' || item === null) return { key: t('dashboard.unknown'), value: 0, originalKey: '' };

    // Check for nested properties (Format 2 and 3)
    if ('domain' in item && 'count' in item) {
      const key = String(item.domain);
      return { key, value: Number(item.count), originalKey: key };
    }
    if ('host' in item && 'count' in item) {
      const key = String(item.host);
      // Resolve IP to hostname if clientNames is available
      const resolved = clientNames?.[key];
      return { key: resolved || key, value: Number(item.count), originalKey: resolved ? key : '' };
    }

    // Fallback to Format 1
    const key = Object.keys(item)[0];
    const value = item[key];
    // Try to resolve IP to hostname for Format 1 (top_clients uses {IP: count})
    const resolved = clientNames?.[key];
    return { key: resolved || key, value: Number(value) || 0, originalKey: resolved ? key : '' };
  });

  if (normalizedData.length === 0) return null; // Should not happen if data check is above

  const maxValue = Math.max(...normalizedData.map(d => d.value), 1);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-sm overflow-hidden flex flex-col">
      <div className="flex items-center gap-2 mb-6">
        <Icon size={18} className={color} />
        <h3 className="text-lg font-medium text-white">{title}</h3>
      </div>
      <div className="space-y-4 flex-1">
        {normalizedData.map((item, i) => (
          <div key={i} className="space-y-1.5">
            <div className="flex justify-between text-sm items-center">
              {linkTo ? (
                <button
                  onClick={() => {
                    const params = new URLSearchParams();
                    if (item.originalKey) {
                      // Resolved hostname: search by original IP
                      params.set('search', item.originalKey);
                    } else {
                      params.set('search', item.key);
                    }
                    if (statusFilter) params.set('status', statusFilter);
                    router.push(`${linkTo}?${params.toString()}`);
                  }}
                  className="text-gray-300 font-mono truncate max-w-[200px] text-left hover:text-blue-400 hover:underline transition-colors cursor-pointer"
                  title={item.originalKey ? `${item.originalKey} → ${item.key}` : item.key}
                >
                  {item.key}
                </button>
              ) : (
                <span className="text-gray-300 font-mono truncate max-w-[200px]" title={item.originalKey || item.key}>
                  {item.key}
                </span>
              )}
              <span className="text-white font-medium">{item.value.toLocaleString()}</span>
            </div>
            <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full opacity-60 rounded-full ${color.replace('text-', 'bg-')}`}
                style={{ width: `${(item.value / maxValue) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function QueryChart({ data }: { data?: any[] }) {
  const { t } = useTranslation();

  if (!data || data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500 border-2 border-dashed border-gray-800 rounded-lg">
        {t('dashboard.no_records')}
      </div>
    );
  }

  // AdGuard returns stats as array of { domain, queries } or similar depending on the endpoint.
  // For the main /stats endpoint, dns_queries might be a total number or a timeseries.
  // Let's assume for now we need a timeseries. If AdGuard /stats only returns a number, 
  // we might need to fetch /control/stats/history.
  // Assuming 'data' passed here is actually the timeseries array if available.

  // Actually, AdGuard /control/stats returns:
  // { "dns_queries": [...numbers...], "time_units": "hours" }
  // Users want to see the volume over time.

  const now = new Date();
  const currentHour = now.getHours();
  const totalPoints = data.length;

  const chartData = data.map((value, index) => {
    const hour = (currentHour - (totalPoints - 1 - index) + 24) % 24;
    return {
      time: `${hour.toString().padStart(2, '0')}:00`,
      queries: value,
    };
  });

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={chartData}>
        <defs>
          <linearGradient id="colorQueries" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
        <XAxis dataKey="time" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', color: '#fff' }}
          itemStyle={{ color: '#3B82F6' }}
        />
        <Area
          type="monotone"
          dataKey="queries"
          stroke="#3B82F6"
          fillOpacity={1}
          fill="url(#colorQueries)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function StatCard({ title, value, trend, icon: Icon, trendUp, color = "text-white", loading }: any) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-colors">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-gray-400">{title}</p>
          <h3 className={`text-3xl font-bold text-white mt-2 ${loading ? 'animate-pulse' : ''}`}>
            {loading ? '...' : value}
          </h3>
        </div>
        <div className={`p-3 rounded-lg bg-gray-800 ${color}`}>
          <Icon size={24} />
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2">
        {trendUp !== undefined && (
          <span className={`flex items-center text-xs font-medium ${trendUp ? 'text-green-400' : 'text-red-400'}`}>
            {trendUp ? <ArrowUpRight size={14} className="mr-1" /> : <ArrowDownRight size={14} className="mr-1" />}
            {trend}
          </span>
        )}
        {trendUp === undefined && <span className="text-xs text-gray-500">{trend}</span>}
      </div>
    </div>
  );
}

function ServiceStatus({ name, status, version, isOperational }: any) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full ${isOperational ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`} />
        <div>
          <p className="text-sm font-medium text-white">{name}</p>
          <p className="text-xs text-gray-500">{version}</p>
        </div>
      </div>
      <span className={`text-xs font-medium px-2 py-1 rounded ${isOperational ? 'text-green-400 bg-green-400/10' : 'text-yellow-400 bg-yellow-400/10'
        }`}>
        {status}
      </span>
    </div>
  );
}

function UpstreamLatency({ upstreams, upstreamResponses }: { upstreams?: { name: string; count: number }[]; upstreamResponses?: { name: string; count: number }[] }) {
  const { t } = useTranslation();

  // Safely normalize upstream data - AdGuard may return different formats
  const normalizedUpstreams: { name: string; avgTime: number }[] = useMemo(() => {
    if (!upstreams || !Array.isArray(upstreams) || upstreams.length === 0) return [];
    return upstreams
      .filter(u => u && typeof u.name === 'string')
      .map(u => ({
        name: u.name,
        avgTime: typeof u.count === 'number' ? u.count : 0,
      }));
  }, [upstreams]);

  if (normalizedUpstreams.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 min-h-[200px] flex flex-col">
        <h3 className="text-lg font-medium text-white mb-4">{t('dashboard.upstream_response_times')}</h3>
        <div className="flex-1 flex items-center justify-center text-gray-500 text-sm italic">{t('dashboard.no_records')}</div>
      </div>
    );
  }

  // Build a response count map for quick lookup
  const responseMap = new Map<string, number>();
  if (upstreamResponses && Array.isArray(upstreamResponses)) {
    for (const item of upstreamResponses) {
      if (item && typeof item.name === 'string') {
        responseMap.set(item.name, typeof item.count === 'number' ? item.count : 0);
      }
    }
  }

  // Format upstream name for display (remove protocol prefix)
  const formatUpstream = (name: string) => {
    return name
      .replace(/^https?:\/\//, '')
      .replace(/^tls:\/\//, '')
      .replace(/^quic:\/\//, '')
      .replace(/^h3:\/\//, '')
      .replace(/:443$/, '')
      .replace(/:853$/, '')
      .replace(/:53$/, '');
  };

  // Color based on latency
  const getLatencyColor = (ms: number) => {
    if (ms < 20) return 'text-green-400';
    if (ms < 50) return 'text-yellow-400';
    if (ms < 100) return 'text-orange-400';
    return 'text-red-400';
  };

  const getBarColor = (ms: number) => {
    if (ms < 20) return 'bg-green-500';
    if (ms < 50) return 'bg-yellow-500';
    if (ms < 100) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const maxTime = Math.max(...normalizedUpstreams.map(u => u.avgTime), 0.001);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-sm">
      <h3 className="text-lg font-medium text-white mb-4">{t('dashboard.upstream_response_times')}</h3>
      <div className="space-y-3">
        {normalizedUpstreams.slice(0, 8).map((upstream, i) => {
          const ms = upstream.avgTime * 1000; // AdGuard returns seconds, convert to ms
          const queries = responseMap.get(upstream.name) || 0;
          return (
            <div key={i} className="space-y-1">
              <div className="flex justify-between text-sm items-center">
                <span className="text-gray-300 font-mono truncate max-w-[180px]" title={upstream.name}>
                  {formatUpstream(upstream.name)}
                </span>
                <div className="flex items-center gap-3">
                  {queries > 0 && (
                    <span className="text-xs text-gray-500">{queries.toLocaleString()} {t('dashboard.upstream_queries')}</span>
                  )}
                  <span className={`font-medium ${getLatencyColor(ms)}`}>
                    {ms < 1 ? `${(ms).toFixed(2)} ${t('dashboard.ms')}` : `${ms.toFixed(1)} ${t('dashboard.ms')}`}
                  </span>
                </div>
              </div>
              <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full opacity-60 ${getBarColor(ms)}`}
                  style={{ width: `${Math.min((ms / maxTime) * 100, 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
