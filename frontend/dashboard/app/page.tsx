import {
  Activity,
  Shield,
  Globe,
  Wifi,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'

export default function Home() {
  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Network Overview</h1>
        <p className="text-gray-400">Real-time status of your unified DNS infrastructure.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Queries"
          value="2.4M"
          trend="+12%"
          icon={Activity}
          trendUp={true}
        />
        <StatCard
          title="Ads Blocked"
          value="142k"
          trend="5.2%"
          icon={Shield}
          trendUp={true}
          color="text-green-400"
        />
        <StatCard
          title="Active Zones"
          value="8"
          trend="Technitium"
          icon={Globe}
          color="text-blue-400"
        />
        <StatCard
          title="Avg Latency"
          value="14ms"
          trend="-2ms"
          icon={Wifi}
          trendUp={false}
          color="text-purple-400"
        />
      </div>

      {/* Charts / Details Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-medium text-white mb-4">Query Volume (24h)</h3>
          <div className="h-64 flex items-center justify-center text-gray-500 border-2 border-dashed border-gray-800 rounded-lg">
            Chart Placeholder (Recharts)
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-medium text-white mb-4">Service Status</h3>
          <div className="space-y-4">
            <ServiceStatus name="AdGuard Home" status="Operational" version="v0.107.43" />
            <ServiceStatus name="Technitium DNS" status="Operational" version="v12.1" />
            <ServiceStatus name="Dashboard API" status="Operational" version="v1.0.0" />
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, trend, icon: Icon, trendUp, color = "text-white" }: any) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-colors">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-gray-400">{title}</p>
          <h3 className="text-3xl font-bold text-white mt-2">{value}</h3>
        </div>
        <div className={`p-3 rounded-lg bg-gray-800 ${color}`}>
          <Icon size={24} />
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2">
        {trendUp !== undefined && (
          <span className={`flex items-center text-xs font-medium ${trendUp ? 'text-green-400' : 'text-green-400'}`}>
            {trendUp ? <ArrowUpRight size={14} className="mr-1" /> : <ArrowDownRight size={14} className="mr-1" />}
            {trend}
          </span>
        )}
        {trendUp === undefined && <span className="text-xs text-gray-500">{trend}</span>}
      </div>
    </div>
  )
}

function ServiceStatus({ name, status, version }: any) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <div>
          <p className="text-sm font-medium text-white">{name}</p>
          <p className="text-xs text-gray-500">{version}</p>
        </div>
      </div>
      <span className="text-xs font-medium text-green-400 bg-green-400/10 px-2 py-1 rounded">
        {status}
      </span>
    </div>
  )
}
