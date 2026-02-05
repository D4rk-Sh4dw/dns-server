'use client';

import { useEffect, useState } from 'react';
import { Network, RefreshCw, Cpu, Activity, Plus, Trash2, Search, Info, ShieldAlert } from 'lucide-react';
import TechnitiumScopeModal from '@/app/components/TechnitiumScopeModal';
import { Settings, Play, Pause } from 'lucide-react';

interface Lease {
    mac: string;
    ip: string;
    hostname: string;
    expires?: string;
}

interface DhcpStatus {
    enabled: boolean;
    interface_name: string;
    conf: {
        range_start: string;
        range_end: string;
        subnet_mask: string;
        gateway_ip: string;
        lease_duration: number;
    };
    leases: Lease[];
    static_leases: Lease[];
    scopes?: any[];
}

export default function DhcpPage() {
    const [status, setStatus] = useState<DhcpStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'dhcp' | 'opnsense'>('dhcp'); // Renamed adguard to dhcp Generic
    const [opnsenseLeases, setOpnsenseLeases] = useState<any[]>([]);
    const [opnsenseLoading, setOpnsenseLoading] = useState(false);
    const [provider, setProvider] = useState<'adguard' | 'technitium'>('adguard');

    const [showAddModal, setShowAddModal] = useState(false);
    const [newLease, setNewLease] = useState({ mac: '', ip: '', hostname: '' });

    // Technitium Scope Management
    const [showScopeModal, setShowScopeModal] = useState(false);
    const [editingScope, setEditingScope] = useState<any>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedProvider = localStorage.getItem('dhcp_provider') as any;
            if (savedProvider) setProvider(savedProvider);
        }
    }, []);

    const fetchOpnsenseData = async () => {
        setOpnsenseLoading(true);
        try {
            // Trigger API to use server-side config
            const res = await fetch('/api/opnsense/leases', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}) // Empty body signals backend to use stored config
            });
            const data = await res.json();

            if (res.ok) {
                setOpnsenseLeases(data.leases || []);
            } else {
                console.warn('OPNsense fetch failed:', data.error);
                // Don't show error to user immediately unless they are on the tab, 
                // just leave list empty or show specific error state in UI
            }
        } catch (err) {
            console.error('Failed to fetch OPNsense leases:', err);
        }
        setOpnsenseLoading(false);
    };


    const fetchData = async () => {
        setLoading(true);
        try {
            const savedProvider = localStorage.getItem('dhcp_provider') || 'adguard';
            const endpoint = savedProvider === 'technitium' ? '/api/technitium/dhcp' : '/api/adguard/dhcp';

            const res = await fetch(endpoint);
            const data = await res.json();
            setStatus(data);

            // Auto-switch tab if DHCP is disabled
            if (!data.enabled && activeTab === 'dhcp') {
                // Optional: switch logic
            }
        } catch (err) {
            setError('Failed to fetch DHCP status');
        }
        setLoading(false);
        fetchOpnsenseData();
    };

    useEffect(() => { fetchData(); }, []);

    const handleToggleDhcp = async (enabled: boolean) => {
        if (!status) return;
        try {
            await fetch('/api/adguard/dhcp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'set_config',
                    enabled,
                    interface_name: status.interface_name,
                    conf: status.conf
                })
            });
            fetchData();
        } catch (err) {
            alert('Failed to toggle DHCP');
        }
    };

    const handleEditScope = async (scope: any) => {
        try {
            const res = await fetch(`/api/technitium/dhcp/scope?name=${encodeURIComponent(scope.name)}`);
            if (res.ok) {
                const fullScope = await res.json();
                setEditingScope(fullScope);
                setShowScopeModal(true);
            } else {
                // Fallback to basic info if fetch fails
                setEditingScope(scope);
                setShowScopeModal(true);
            }
        } catch (err) {
            console.error('Failed to fetch scope details', err);
            setEditingScope(scope);
            setShowScopeModal(true);
        }
    };

    // Technitium Scope Actions
    const handleSaveScope = async (scopeData: any) => {
        try {
            const res = await fetch('/api/technitium/dhcp/scope', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(scopeData)
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to save scope');
            }

            setShowScopeModal(false);
            setEditingScope(null);
            fetchData();
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleDeleteScope = async (scopeName: string) => {
        if (!confirm(`Are you sure you want to delete scope "${scopeName}"?`)) return;
        try {
            const res = await fetch('/api/technitium/dhcp/scope', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'delete', name: scopeName })
            });

            if (!res.ok) throw new Error('Failed to delete scope');
            fetchData();
        } catch (err) {
            alert('Failed to delete scope');
        }
    };

    const handleToggleScope = async (scope: any) => {
        try {
            const res = await fetch('/api/technitium/dhcp/scope', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'toggle', name: scope.name, enabled: !scope.enabled })
            });

            if (!res.ok) throw new Error('Failed to toggle scope');
            fetchData();
        } catch (err) {
            alert('Failed to toggle scope');
        }
    };

    const handleAddStatic = async () => { /* ... existing handleAddStatic ... */
        try {
            const res = await fetch('/api/adguard/dhcp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'add_static', ...newLease })
            });
            if (!res.ok) throw new Error('Failed to add static lease');
            setShowAddModal(false);
            setNewLease({ mac: '', ip: '', hostname: '' });
            fetchData();
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Operation failed');
        }
    };

    const handleRemoveStatic = async (lease: Lease) => {
        if (!confirm(`Remove static lease for ${lease.hostname}?`)) return;
        try {
            await fetch('/api/adguard/dhcp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'remove_static', ...lease })
            });
            fetchData();
        } catch (err) {
            alert('Failed to remove static lease');
        }
    };

    if (loading && !status) {
        return (
            <div className="p-8 flex items-center justify-center">
                <RefreshCw className="animate-spin text-blue-500" size={32} />
            </div>
        );
    }

    const allLeases = [
        ...(status?.leases || []).map(l => ({ ...l, type: 'Dynamic' })),
        ...(status?.static_leases || []).map(l => ({ ...l, type: 'Static' }))
    ];

    const filteredLeases = allLeases.filter(l =>
        l.ip.includes(searchTerm) ||
        l.mac.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.hostname.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-4 md:p-8 space-y-6 md:space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-2">DHCP Server</h1>
                    <p className="text-gray-400 text-sm md:text-base">Manage network address assignments and leases.</p>
                </div>
                <div className="flex gap-2 self-end sm:self-auto">
                    <button
                        onClick={fetchData}
                        className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                    >
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                    {provider === 'technitium' && (
                        <button
                            onClick={() => { setEditingScope(null); setShowScopeModal(true); }}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                            <Plus size={18} />
                            Create Scope
                        </button>
                    )}
                </div>
            </div>

            {/* Technitium Scope List (if provider is Technitium) */}
            {provider === 'technitium' && status?.scopes && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {status.scopes.map((scope: any, idx: number) => (
                        <div key={idx} className={`bg-gray-900 border ${scope.enabled ? 'border-gray-800' : 'border-yellow-900/50'} rounded-xl p-6 relative group hover:border-blue-500/50 transition-colors`}>
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-semibold text-white flex items-center gap-2">
                                        {scope.name}
                                        {scope.enabled ? (
                                            <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                                        ) : (
                                            <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                        )}
                                    </h3>
                                    <p className="text-xs text-gray-500 mt-1">{scope.description || 'No description'}</p>
                                </div>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => handleToggleScope(scope)}
                                        className={`p-1.5 rounded-lg transition-colors ${scope.enabled ? 'text-green-400 hover:bg-green-400/10' : 'text-gray-500 hover:text-green-400 hover:bg-gray-800'}`}
                                        title={scope.enabled ? 'Disable Scope' : 'Enable Scope'}
                                    >
                                        {scope.enabled ? <Pause size={16} /> : <Play size={16} />}
                                    </button>
                                    <button
                                        onClick={() => handleEditScope(scope)}
                                        className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"
                                        title="Configure Scope"
                                    >
                                        <Settings size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteScope(scope.name)}
                                        className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                                        title="Delete Scope"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between py-1 border-b border-gray-800/50">
                                    <span className="text-gray-500">Range</span>
                                    <span className="text-gray-300 font-mono text-xs">{scope.startAddress} - {scope.endAddress}</span>
                                </div>
                                <div className="flex justify-between py-1 border-b border-gray-800/50">
                                    <span className="text-gray-500">Gateway</span>
                                    <span className="text-gray-300 font-mono text-xs">{scope.gateway}</span>
                                </div>
                                <div className="flex justify-between py-1 border-b border-gray-800/50">
                                    <span className="text-gray-500">Mask</span>
                                    <span className="text-gray-300 font-mono text-xs">{scope.subnetMask}</span>
                                </div>
                                <div className="flex justify-between py-1">
                                    <span className="text-gray-500">DNS</span>
                                    <span className="text-gray-300 font-mono text-xs truncate max-w-[120px]" title={scope.dnsServers?.join(', ') || 'Local System'}>
                                        {scope.dnsServers && scope.dnsServers.length > 0 ? scope.dnsServers.join(', ') : 'Local System'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Empty State for Technitium Scopes */}
                    {status.scopes.length === 0 && (
                        <button
                            onClick={() => { setEditingScope(null); setShowScopeModal(true); }}
                            className="bg-gray-900 border border-gray-800 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-gray-500 hover:text-white hover:border-gray-600 hover:bg-gray-800 transition-all min-h-[200px] group"
                        >
                            <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center mb-4 group-hover:bg-gray-700 transition-colors">
                                <Plus size={24} />
                            </div>
                            <h3 className="font-medium">Create First Scope</h3>
                            <p className="text-sm text-gray-600 mt-2 text-center max-w-[200px]">Define a subnet range to start serving IP addresses.</p>
                        </button>
                    )}
                </div>
            )}

            {/* Keeping the old AdGuard Status card only if AdGuard is active provider */}
            {provider === 'adguard' && (
                <div className={`bg-gray-900 border ${status?.enabled ? 'border-gray-800' : 'border-yellow-500/30'} rounded-xl p-6`}>
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-xl ${status?.enabled ? 'bg-blue-500/10 text-blue-400' : 'bg-gray-800 text-gray-500'}`}>
                                <Network size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-medium text-white">AdGuard DHCP Status</h3>
                                <p className="text-sm text-gray-500">{status?.enabled ? `Running on ${status.interface_name}` : 'Server is disabled'}</p>
                            </div>
                        </div>
                        {provider === 'adguard' && (
                            <button
                                onClick={() => handleToggleDhcp(!status?.enabled)}
                                className={`w-14 h-7 rounded-full relative transition-colors ${status?.enabled ? 'bg-blue-600' : 'bg-gray-700'}`}
                            >
                                <div className={`absolute top-1 left-1 bg-white w-5 h-5 rounded-full transition-transform ${status?.enabled ? 'translate-x-7' : ''}`} />
                            </button>
                        )}
                    </div>

                    {status?.enabled ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-4 bg-gray-950/50 rounded-lg border border-gray-800">
                                <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">IP Range</span>
                                <div className="text-white font-mono mt-1">{status.conf.range_start} — {status.conf.range_end}</div>
                            </div>
                            <div className="p-4 bg-gray-950/50 rounded-lg border border-gray-800">
                                <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">Gateway</span>
                                <div className="text-white font-mono mt-1">{status.conf.gateway_ip}</div>
                            </div>
                            <div className="p-4 bg-gray-950/50 rounded-lg border border-gray-800">
                                <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">Active Leases</span>
                                <div className="text-white font-mono mt-1">{status.leases.length} Dynamic / {status.static_leases.length} Static</div>
                            </div>
                        </div>
                    ) : (
                        <div className="p-4 bg-yellow-500/5 border border-yellow-500/10 rounded-lg text-yellow-500/80 text-sm flex items-center gap-3">
                            <Info size={16} />
                            The DHCP server must be enabled for AdGuard to manage your network addresses.
                        </div>
                    )}
                </div>
            )}

            {/* Tabs & Search */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-900 border border-gray-800 rounded-xl p-2">
                <div className="flex p-1 bg-gray-950 rounded-lg w-full md:w-auto">
                    <button
                        onClick={() => setActiveTab('dhcp')}
                        className={`flex-1 md:flex-none px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'dhcp' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        {provider === 'technitium' ? 'Technitium Leases' : 'AdGuard DHCP'}
                    </button>
                    <button
                        onClick={() => setActiveTab('opnsense')}
                        className={`flex-1 md:flex-none px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'opnsense' ? 'bg-red-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        OPNsense Discovery
                    </button>
                </div>

                <div className="flex flex-wrap gap-2 w-full md:w-auto pr-2">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                        <input
                            type="text"
                            placeholder="Search leases..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                        />
                    </div>
                </div>
            </div>

            {activeTab === 'dhcp' ? (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-medium text-white">{provider === 'technitium' ? 'Technitium Leases' : 'AdGuard Leases'}</h3>
                        {provider === 'adguard' && (
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                            >
                                <Plus size={18} />
                                Static Lease
                            </button>
                        )}
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="text-xs text-gray-500 uppercase bg-gray-950/50">
                                <tr>
                                    <th className="px-6 py-4">Hostname</th>
                                    <th className="px-6 py-4">IP Address</th>
                                    <th className="px-6 py-4">MAC Address</th>
                                    <th className="px-6 py-4">Type</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800 text-sm">
                                {filteredLeases.map((lease, idx) => (
                                    <tr key={idx} className="hover:bg-gray-800/30 group transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="text-white font-medium">{lease.hostname || 'Unknown'}</div>
                                            {lease.expires && <div className="text-[10px] text-gray-500 mt-0.5">Expires: {new Date(lease.expires).toLocaleString()}</div>}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-blue-400 font-mono">{lease.ip}</span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-400 font-mono uppercase text-xs">{lease.mac}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${lease.type === 'Static' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-blue-500/20 text-blue-400'
                                                }`}>
                                                {lease.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {/* TODO: Add Technitium Lease Deletion support */}
                                            {provider === 'adguard' && lease.type === 'Static' && (
                                                <button
                                                    onClick={() => handleRemoveStatic(lease)}
                                                    className="p-2 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {!filteredLeases.length && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                            No leases found matching your search.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-medium text-white flex items-center gap-2">
                            OPNsense Leases
                            {opnsenseLoading && <RefreshCw size={16} className="animate-spin text-gray-500" />}
                        </h3>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="text-xs text-gray-500 uppercase bg-gray-950/50">
                                <tr>
                                    <th className="px-6 py-4">Hostname</th>
                                    <th className="px-6 py-4">IP Address</th>
                                    <th className="px-6 py-4">MAC Address</th>
                                    <th className="px-6 py-4">Type</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800 text-sm">
                                {opnsenseLeases
                                    .filter(l =>
                                        l.address.includes(searchTerm) ||
                                        l.hostname.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                        l.mac.toLowerCase().includes(searchTerm.toLowerCase())
                                    )
                                    .map((lease, idx) => (
                                        <tr key={idx} className="hover:bg-gray-800/30 group transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="text-white font-medium">{lease.hostname || 'Unknown'}</div>
                                                {lease.descr && <div className="text-[10px] text-gray-500 mt-0.5">{lease.descr}</div>}
                                                {lease.end && <div className="text-[10px] text-gray-500 mt-0.5 text-xs">Ends: {lease.end}</div>}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-red-400 font-mono">{lease.address}</span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-400 font-mono uppercase text-xs">{lease.mac}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${lease.type === 'static' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-blue-500/20 text-blue-400'
                                                    }`}>
                                                    {lease.type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    title="Sync to Technitium DNS"
                                                    onClick={() => {
                                                        const parts = lease.address.split('.');
                                                        const subnet = `${parts[0]}.${parts[1]}.${parts[2]}.0`;
                                                        const revZone = `${parts[2]}.${parts[1]}.${parts[0]}.in-addr.arpa`;
                                                        // This would ideally open the zone creation modal with prefilled data
                                                        window.location.href = `/zones?create_ptr=${lease.address}&hostname=${lease.hostname}`;
                                                    }}
                                                    className="p-2 text-gray-500 hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-all"
                                                >
                                                    <RefreshCw size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                {!opnsenseLeases.length && !opnsenseLoading && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                            {localStorage.getItem('opnsense_config')
                                                ? 'No leases found in OPNsense.'
                                                : 'OPNsense is not configured in Settings.'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Technitium Scope Modal */}
            <TechnitiumScopeModal
                isOpen={showScopeModal}
                onClose={() => setShowScopeModal(false)}
                onSave={handleSaveScope}
                existingScope={editingScope}
            />

            {/* Existing AdGuard Static Lease Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-800 flex justify-between items-center bg-gray-900/50">
                            <h3 className="text-xl font-semibold text-white">Add Static Lease</h3>
                            <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-white transition-colors">
                                <Plus size={24} className="rotate-45" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">MAC Address</label>
                                <input
                                    type="text"
                                    value={newLease.mac}
                                    onChange={(e) => setNewLease({ ...newLease, mac: e.target.value })}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 font-mono"
                                    placeholder="00:11:22:33:44:55"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">IP Address</label>
                                <input
                                    type="text"
                                    value={newLease.ip}
                                    onChange={(e) => setNewLease({ ...newLease, ip: e.target.value })}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 font-mono"
                                    placeholder="192.168.1.50"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Hostname (Optional)</label>
                                <input
                                    type="text"
                                    value={newLease.hostname}
                                    onChange={(e) => setNewLease({ ...newLease, hostname: e.target.value })}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                                    placeholder="My Device"
                                />
                            </div>
                            <div className="flex justify-end gap-3 mt-8">
                                <button onClick={() => setShowAddModal(false)} className="px-4 py-2 text-gray-400 hover:text-white">Cancel</button>
                                <button
                                    onClick={handleAddStatic}
                                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                                >
                                    <Plus size={18} />
                                    Add Lease
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
