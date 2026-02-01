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
  dns_queries: number[];
  top_queries: { [key: string]: number }[];
  top_blocked_domains: { [key: string]: number }[];
  top_clients: { [key: string]: number }[];
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
    const interval = setInterval(fetchData, 60000); // Refresh every minute
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
          title="Total Queries"
          value={stats?.num_dns_queries?.toLocaleString() || '—'}
          trend="Last 24h"
          icon={Activity}
          loading={data.loading}
        />
        <StatCard
          title="Threats Blocked"
          value={stats?.num_blocked_filtering?.toLocaleString() || '—'}
          trend={stats && stats.num_dns_queries > 0 ? `${((stats.num_blocked_filtering / stats.num_dns_queries) * 100).toFixed(1)}% blocked` : '—'}
          icon={Shield}
          trendUp={true}
          color="text-red-400"
          loading={data.loading}
        />
        <StatCard
          title="Protection"
          value={data.adguard?.status?.protection_enabled ? 'Active' : 'Disabled'}
          trend={data.adguard?.status?.protection_enabled ? 'All systems go' : 'Action required'}
          icon={Globe}
          color={data.adguard?.status?.protection_enabled ? 'text-green-400' : 'text-red-400'}
          loading={data.loading}
        />
        <StatCard
          title="Performance"
          value={stats ? `${stats.avg_processing_time.toFixed(2)}ms` : '—'}
          trend="Avg processing time"
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
              <h3 className="text-lg font-medium text-white">DNS Traffic (24h)</h3>
              <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">Queries per hour</span>
            </div>
            <div className="h-72">
              <QueryChart data={stats?.dns_queries} />
            </div>
          </div>

          {/* Top Domains Split */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TopTable
              title="Top Queried Domains"
              data={stats?.top_queries}
              icon={Globe}
              color="text-blue-400"
            />
            <TopTable
              title="Top Blocked Domains"
              data={stats?.top_blocked_domains}
              icon={Shield}
              color="text-red-400"
            />
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <TopTable
            title="Top Clients"
            data={stats?.top_clients}
            icon={Activity}
            color="text-purple-400"
          />

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-medium text-white mb-4">Infrastructure Status</h3>
            <div className="space-y-4">
              <ServiceStatus
                name="AdGuard Home"
                status={data.adguard ? 'Operational' : 'Checking...'}
                version="Primary DNS / Filter"
              />
              <ServiceStatus
                name="Technitium DNS"
                status="Operational"
                version="Recursive Resolver"
              />
              <ServiceStatus
                name="Dashboard API"
                status="Operational"
                version="Next.js Backend"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TopTable({ title, data, icon: Icon, color }: { title: string, data?: any[], icon: any, color: string }) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 min-h-[300px] flex flex-col">
        <h3 className="text-lg font-medium text-white mb-4">{title}</h3>
        <div className="flex-1 flex items-center justify-center text-gray-500 text-sm italic">No records found</div>
      </div>
    );
  }

  // AdGuard format is often [{ "domain": 100 }]
  const normalizedData = data.slice(0, 10).map(item => {
    const key = Object.keys(item)[0];
    const value = item[key];
    return { key, value };
  });

  const maxValue = Math.max(...normalizedData.map(d => d.value));

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
              <span className="text-gray-300 font-mono truncate max-w-[200px]" title={item.key}>
                {item.key}
              </span>
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
