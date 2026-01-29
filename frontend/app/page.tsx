'use client';

import { useEffect, useState } from 'react';
import {
  Activity,
  Shield,
  Globe,
  Wifi,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw
} from 'lucide-react';

interface AdGuardStats {
  num_dns_queries: number;
  num_blocked_filtering: number;
  avg_processing_time: number;
  dns_queries: number[]; // History array
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
  const [data, setData] = useState<DashboardData>({
    adguard: null,
    loading: true,
    error: null,
  });

  const fetchData = async () => {
    setData(prev => ({ ...prev, loading: true }));
    try {
      const adguardRes = await fetch('/api/adguard');
      if (!adguardRes.ok) throw new Error('Failed to fetch AdGuard data');
      const adguard = await adguardRes.json();

      setData({
        adguard,
        loading: false,
        error: null,
      });
    } catch (err) {
      setData({
        adguard: null,
        loading: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const stats = data.adguard?.stats;

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Network Overview</h1>
          <p className="text-gray-400">Real-time status of your unified DNS infrastructure.</p>
        </div>
        <button
          onClick={fetchData}
          className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
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
          title="Total Queries"
          value={stats?.num_dns_queries?.toLocaleString() || '—'}
          trend="24h"
          icon={Activity}
          loading={data.loading}
        />
        <StatCard
          title="Ads Blocked"
          value={stats?.num_blocked_filtering?.toLocaleString() || '—'}
          trend={stats ? `${((stats.num_blocked_filtering / stats.num_dns_queries) * 100).toFixed(1)}%` : '—'}
          icon={Shield}
          trendUp={true}
          color="text-green-400"
          loading={data.loading}
        />
        <StatCard
          title="Protection"
          value={data.adguard?.status?.protection_enabled ? 'Active' : 'Disabled'}
          trend={data.adguard?.status?.protection_enabled ? 'Enabled' : 'Warning'}
          icon={Globe}
          color={data.adguard?.status?.protection_enabled ? 'text-green-400' : 'text-red-400'}
          loading={data.loading}
        />
        <StatCard
          title="Avg Latency"
          value={stats ? `${stats.avg_processing_time.toFixed(1)}ms` : '—'}
          trend="per query"
          icon={Wifi}
          color="text-purple-400"
          loading={data.loading}
        />
      </div>

      {/* Charts / Details Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-medium text-white mb-4">Query Volume (24h)</h3>
          <div className="h-64">
            <QueryChart data={stats?.dns_queries} />
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-medium text-white mb-4">Service Status</h3>
          <div className="space-y-4">
            <ServiceStatus
              name="AdGuard Home"
              status={data.adguard ? 'Operational' : 'Checking...'}
              version="v0.107"
            />
            <ServiceStatus
              name="Technitium DNS"
              status="Operational"
              version="v12.1"
            />
            <ServiceStatus
              name="Dashboard API"
              status="Operational"
              version="v1.0.0"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function QueryChart({ data }: { data?: any[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500 border-2 border-dashed border-gray-800 rounded-lg">
        No data available
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

  const chartData = data.map((value, index) => ({
    time: `${index}h`,
    queries: value,
  }));

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

function ServiceStatus({ name, status, version }: any) {
  const isOperational = status === 'Operational';
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
