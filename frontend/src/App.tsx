import { useState, useEffect } from 'react'
import { LayoutDashboard, Users, Shield, Activity, Settings, Menu, X } from 'lucide-react'

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tenants', label: 'Tenants', icon: Users },
    { id: 'policies', label: 'Policies', icon: Shield },
    { id: 'blocklists', label: 'Blocklists', icon: Menu }, // Reusing Menu icon or List
    { id: 'logs', label: 'Query Logs', icon: Activity },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`${isSidebarOpen ? 'w-64' : 'w-20'} 
        bg-gray-800 border-r border-gray-700 transition-all duration-300 flex flex-col`}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-700">
          {isSidebarOpen && <span className="font-bold text-xl tracking-tight text-blue-400">UnifiedDNS</span>}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 py-4">
          <ul className="space-y-2 px-2">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <li key={item.id}>
                  <button
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center px-4 py-3 rounded-lg transition-all duration-200 group
                      ${activeTab === item.id
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                        : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                      }`}
                  >
                    <Icon size={20} strokeWidth={activeTab === item.id ? 2.5 : 2} />
                    {isSidebarOpen && (
                      <span className="ml-3 font-medium">{item.label}</span>
                    )}
                    {!isSidebarOpen && (
                      <div className="absolute left-20 bg-gray-800 text-white px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap border border-gray-700">
                        {item.label}
                      </div>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center font-bold text-xs">
              Admin
            </div>
            {isSidebarOpen && (
              <div className="flex flex-col">
                <span className="text-sm font-medium">Platform Admin</span>
                <span className="text-xs text-gray-500">admin@unified-dns.io</span>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-gray-900">
        <header className="h-16 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-6">
          <h1 className="text-xl font-semibold text-white capitalize">{activeTab}</h1>
          <div className="flex items-center gap-4">
            <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30">
              System Operational
            </span>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6">
          {activeTab === 'dashboard' && <DashboardView />}
          {activeTab === 'tenants' && <TenantsView />}
          {activeTab === 'policies' && <PoliciesView />}
          {activeTab === 'blocklists' && <BlocklistsView />}
          {activeTab === 'logs' && <QueryLogsView />}
          {activeTab === 'settings' && <SettingsView />}
        </div>
      </main>
    </div>
  )
}

function DashboardView() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard title="Total Queries" value="2.4M" trend="+12%" />
      <StatCard title="Blocked Requests" value="142k" trend="-5%" color="red" />
      <StatCard title="Active Tenants" value="8" trend="+1" />
      <StatCard title="Avg Latency" value="14ms" trend="-2ms" color="green" />
    </div>
  )
}

function StatCard({ title, value, trend, color = "blue" }: { title: string, value: string, trend: string, color?: string }) {
  const isPositive = trend.startsWith('+')
  // Simple logic for trend color, can be refined
  const trendColor = isPositive ? 'text-green-400' : 'text-red-400'
  // Use color prop to change border subtly (example)
  const borderColor = color === 'red' ? 'border-red-900/50' : color === 'green' ? 'border-green-900/50' : 'border-gray-700'

  return (
    <div className={`bg-gray-800 p-6 rounded-xl border ${borderColor} shadow-sm transition-colors duration-300`}>
      <h3 className="text-gray-400 text-sm font-medium">{title}</h3>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-3xl font-bold text-white">{value}</span>
        <span className={`text-sm ${trendColor}`}>{trend}</span>
      </div>
    </div>
  )
}

function TenantsView() {
  const [tenants, setTenants] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [newTenantName, setNewTenantName] = useState('')

  useEffect(() => {
    loadTenants()
  }, [])

  const loadTenants = async () => {
    try {
      const data = await import('./lib/api').then(m => m.getTenants())
      setTenants(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!newTenantName) return
    setIsCreating(true)
    try {
      await import('./lib/api').then(m => m.createTenant(newTenantName))
      setNewTenantName('')
      loadTenants()
    } catch (e) {
      console.error(e)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium">Active Tenants</h2>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="New Tenant Name"
            value={newTenantName}
            onChange={(e) => setNewTenantName(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={handleCreate}
            disabled={isCreating || !newTenantName}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm font-medium"
          >
            {isCreating ? 'Creating...' : 'Create Tenant'}
          </button>
        </div>
      </div>

      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading tenants...</div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-gray-750 text-gray-400 text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Created At</th>
                <th className="px-6 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {tenants.map((t) => (
                <tr key={t.id} className="hover:bg-gray-750/50 transition-colors">
                  <td className="px-6 py-4 font-medium">{t.name}</td>
                  <td className="px-6 py-4 text-gray-400 font-mono text-xs">{t.id}</td>
                  <td className="px-6 py-4 text-gray-400 text-sm">{new Date(t.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <button className="text-blue-400 hover:text-blue-300 text-sm font-medium">Manage</button>
                  </td>
                </tr>
              ))}
              {tenants.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    No tenants found. Create one to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function PoliciesView() {
  return (
    <div className="p-8 text-center text-gray-500">
      <h2 className="text-lg font-medium text-white mb-2">Policies</h2>
      <p>Configure DNS filtering rules and security policies here.</p>
    </div>
  )
}

function BlocklistsView() {
  const [lists, setLists] = useState<any[]>([])
  const [url, setUrl] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  // Mock-ish api call wrapper or use real api if I update api.ts
  const fetchLists = async () => {
    try {
      const res = await fetch('http://localhost:8080/api/v1/blocklists')
      // Fallback mock if fetch fails for demo
      if (!res.ok) throw new Error("API not reachable")
      const data = await res.json()
      if (Array.isArray(data)) setLists(data)
    } catch (e) {
      // fallback
    }
  }

  useEffect(() => { fetchLists() }, [])

  const addList = async () => {
    if (!url || !name) return
    setLoading(true)
    try {
      await fetch('http://localhost:8080/api/v1/blocklists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, url })
      })
      setName(''); setUrl('')
      fetchLists()
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const triggerUpdate = async () => {
    try { await fetch('http://localhost:8080/api/v1/blocklists/refresh', { method: 'POST' }) } catch (e) { }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium">Blocklists</h2>
        <button onClick={triggerUpdate} className="text-blue-400 text-sm hover:underline">Trigger Update Now</button>
      </div>

      <div className="flex gap-2">
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Name (e.g. StevenBlack)" className="bg-gray-800 border-gray-700 border rounded px-3 py-2 text-sm text-white" />
        <input value={url} onChange={e => setUrl(e.target.value)} placeholder="URL" className="flex-1 bg-gray-800 border-gray-700 border rounded px-3 py-2 text-sm text-white" />
        <button onClick={addList} disabled={loading} className="bg-blue-600 px-4 py-2 rounded text-white text-sm">Add</button>
      </div>

      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-750 text-gray-400 text-xs uppercase font-semibold">
            <tr>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">URL</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {lists.map((l, i) => (
              <tr key={i}>
                <td className="px-6 py-4 text-white font-medium">{l.name}</td>
                <td className="px-6 py-4 text-gray-400 text-xs truncate max-w-xs">{l.url}</td>
                <td className="px-6 py-4"><span className="text-green-400 text-xs">Active</span></td>
              </tr>
            ))}
            {lists.length === 0 && <tr><td colSpan={3} className="p-6 text-center text-gray-500">No blocklists configured</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function QueryLogsView() {
  const [logs, setLogs] = useState<import('./lib/api').QueryLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    import('./lib/api').then(m => m.getQueryLogs()).then(data => {
      setLogs(data)
      setLoading(false)
    })
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium">Recent Queries</h2>
        <button className="text-sm text-blue-400 hover:text-blue-300">Live View (Coming Soon)</button>
      </div>
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-750 text-gray-400 text-xs uppercase font-semibold border-b border-gray-700">
            <tr>
              <th className="px-6 py-3">Time</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Client</th>
              <th className="px-6 py-3">Domain</th>
              <th className="px-6 py-3">Type</th>
              <th className="px-6 py-3">Duration</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {loading ? (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-400">Loading logs...</td></tr>
            ) : logs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-750/50 transition-colors">
                <td className="px-6 py-3 text-gray-400 text-xs font-mono">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </td>
                <td className="px-6 py-3">
                  <span className={`px-2 py-0.5 rounded textxs font-medium border ${log.status === 'BLOCKED'
                    ? 'bg-red-500/10 text-red-400 border-red-500/20'
                    : 'bg-green-500/10 text-green-400 border-green-500/20'
                    }`}>
                    {log.status}
                  </span>
                </td>
                <td className="px-6 py-3 text-gray-300 text-sm">{log.client_ip || 'N/A'}</td>
                <td className="px-6 py-3 text-white font-medium text-sm">{log.domain || (log as any).query}</td>
                <td className="px-6 py-3 text-gray-400 text-xs">{log.query_type || 'A'}</td>
                <td className="px-6 py-3 text-gray-400 text-xs">{log.duration_ms || 0}ms</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function SettingsView() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
        <h3 className="text-lg font-medium mb-4">Network Configuration</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">DNS Listening Port</label>
            <input type="text" disabled value="53 / 1053" className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-gray-500 cursor-not-allowed" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Upstream DNS</label>
            <select className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white">
              <option>Google (8.8.8.8)</option>
              <option>Cloudflare (1.1.1.1)</option>
              <option>Quad9 (9.9.9.9)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
        <h3 className="text-lg font-medium mb-4">Security</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white font-medium">Safe Search</div>
              <div className="text-xs text-gray-500">Enforce safe search on Google/Bing</div>
            </div>
            <div className="w-10 h-6 bg-green-600 rounded-full relative cursor-pointer">
              <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
