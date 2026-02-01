'use client';

import { useEffect, useState } from 'react';
import { Network, RefreshCw, Cpu, Activity, Plus, Trash2, Search, Info, ShieldAlert } from 'lucide-react';

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
}

export default function DhcpPage() {
    const [status, setStatus] = useState<DhcpStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const [showAddModal, setShowAddModal] = useState(false);
    const [newLease, setNewLease] = useState({ mac: '', ip: '', hostname: '' });

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/adguard/dhcp');
            const data = await res.json();
            setStatus(data);
        } catch (err) {
            setError('Failed to fetch DHCP status');
        }
        setLoading(false);
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

    const handleAddStatic = async () => {
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
                </div>
            </div>

            {/* Main Config Card */}
            <div className={`bg-gray-900 border ${status?.enabled ? 'border-gray-800' : 'border-yellow-500/30'} rounded-xl p-6`}>
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${status?.enabled ? 'bg-blue-500/10 text-blue-400' : 'bg-gray-800 text-gray-500'}`}>
                            <Network size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-medium text-white">DHCP Status</h3>
                            <p className="text-sm text-gray-500">{status?.enabled ? `Running on ${status.interface_name}` : 'Server is disabled'}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => handleToggleDhcp(!status?.enabled)}
                        className={`w-14 h-7 rounded-full relative transition-colors ${status?.enabled ? 'bg-blue-600' : 'bg-gray-700'}`}
                    >
                        <div className={`absolute top-1 left-1 bg-white w-5 h-5 rounded-full transition-transform ${status?.enabled ? 'translate-x-7' : ''}`} />
                    </button>
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

            {status?.enabled && (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                        <h3 className="text-lg font-medium text-white">Network Leases</h3>
                        <div className="flex flex-wrap gap-2 w-full md:w-auto">
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
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                            >
                                <Plus size={18} />
                                <span className="hidden sm:inline">Static Lease</span>
                            </button>
                        </div>
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
                                            {lease.expires && <div className="text-[10px] text-gray-500 mt-0.5">Expires: {lease.expires}</div>}
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
                                            {lease.type === 'Static' && (
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
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Add Static Lease Modal */}
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
