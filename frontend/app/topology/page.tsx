'use client';

import { useTranslation } from '@/lib/i18n-context';
import { useEffect, useState } from 'react';
import {
    Network, Server, Wifi, Smartphone, Laptop, Tv, Cpu, HardDrive,
    RefreshCw, Search, X, Activity, Shield, Globe, Clock, Tag,
    ChevronDown, ChevronUp, Router
} from 'lucide-react';

interface Device {
    id: string;
    name: string;
    ip?: string;
    mac?: string;
    hostname?: string;
    source: string;
    status: string;
    type?: string;
    scope?: string;
    tags?: string[];
    blockedServices?: string[];
    filteringEnabled?: boolean;
}

interface TopologyData {
    devices: Device[];
    stats: {
        totalDevices: number;
        onlineDevices: number;
        dhcpDevices: number;
        manualDevices: number;
        totalQueries: number;
        totalBlocked: number;
    };
}

const DEVICE_ICONS: Record<string, React.ElementType> = {
    default: Smartphone,
    dynamic: Smartphone,
    static: Laptop,
    reserved: Server,
    manual: Cpu,
    discovered: Wifi,
};

const SOURCE_COLORS: Record<string, string> = {
    'adguard-dhcp': 'text-blue-400 bg-blue-500/10',
    'adguard-static': 'text-green-400 bg-green-500/10',
    'adguard-manual': 'text-purple-400 bg-purple-500/10',
    'adguard-auto': 'text-yellow-400 bg-yellow-500/10',
    'adguard-both': 'text-cyan-400 bg-cyan-500/10',
    'technitium-dhcp': 'text-orange-400 bg-orange-500/10',
    'both': 'text-pink-400 bg-pink-500/10',
    'opnsense': 'text-amber-400 bg-amber-500/10',
};

function getSubnet(ip?: string): string {
    if (!ip) return 'Unknown';
    const parts = ip.split('.');
    if (parts.length !== 4) return 'Unknown';
    return `${parts[0]}.${parts[1]}.${parts[2]}.0/24`;
}

interface SubnetTopologyProps {
    devices: Device[];
    stats: TopologyData['stats'];
    onSelectDevice: (device: Device) => void;
    getDeviceIcon: (device: Device) => React.ReactNode;
    groupBySubnet: boolean;
}

function SubnetTopology({ devices, stats, onSelectDevice, getDeviceIcon, groupBySubnet }: SubnetTopologyProps) {
    if (!groupBySubnet) {
        // Flat list view (not grouped by subnet)
        return (
            <div className="space-y-4">
                {/* Central DNS Server */}
                <div className="flex items-center justify-center py-4">
                    <div className="flex flex-col items-center">
                        <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <Server size={24} className="text-white" />
                        </div>
                        <span className="text-white text-xs mt-2 font-medium">DNS Server</span>
                        <span className="text-gray-500 text-xs">{stats.totalQueries.toLocaleString()} queries</span>
                    </div>
                </div>

                {/* Flat Device List */}
                <div className="flex flex-wrap gap-2">
                    {devices.map(device => {
                        const isBlocked = device.blockedServices && device.blockedServices.length > 0;
                        return (
                            <button
                                key={device.id}
                                onClick={() => onSelectDevice(device)}
                                className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs transition-colors hover:scale-105 ${
                                    isBlocked
                                        ? 'bg-red-500/10 border border-red-500/30 text-red-400'
                                        : device.status === 'online'
                                            ? 'bg-green-500/10 border border-green-500/30 text-green-400'
                                            : 'bg-gray-800 border border-gray-700 text-gray-400'
                                }`}
                            >
                                <span className="flex-shrink-0">{getDeviceIcon(device)}</span>
                                <span className="truncate max-w-[100px]">{device.name}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    }

    const grouped = devices.reduce((acc, device) => {
        const subnet = getSubnet(device.ip);
        if (!acc[subnet]) acc[subnet] = [];
        acc[subnet].push(device);
        return acc;
    }, {} as Record<string, Device[]>);

    const subnets = Object.entries(grouped).sort((a, b) => a[0].localeCompare(b[0]));

    return (
        <div className="space-y-4">
            {/* Central DNS Server */}
            <div className="flex items-center justify-center py-4">
                <div className="flex flex-col items-center">
                    <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <Server size={24} className="text-white" />
                    </div>
                    <span className="text-white text-xs mt-2 font-medium">DNS Server</span>
                    <span className="text-gray-500 text-xs">{stats.totalQueries.toLocaleString()} queries</span>
                </div>
            </div>

            {/* Subnet Groups */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {subnets.map(([subnet, subnetDevices]) => (
                    <div key={subnet} className="bg-gray-950 border border-gray-800 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-800">
                            <Globe size={14} className="text-blue-400" />
                            <span className="text-white text-sm font-medium">{subnet}</span>
                            <span className="text-gray-500 text-xs ml-auto">{subnetDevices.length} devices</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {subnetDevices.map(device => {
                                const isBlocked = device.blockedServices && device.blockedServices.length > 0;
                                return (
                                    <button
                                        key={device.id}
                                        onClick={() => onSelectDevice(device)}
                                        className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs transition-colors hover:scale-105 ${
                                            isBlocked
                                                ? 'bg-red-500/10 border border-red-500/30 text-red-400'
                                                : device.status === 'online'
                                                    ? 'bg-green-500/10 border border-green-500/30 text-green-400'
                                                    : 'bg-gray-800 border border-gray-700 text-gray-400'
                                        }`}
                                    >
                                        <span className="flex-shrink-0">{getDeviceIcon(device)}</span>
                                        <span className="truncate max-w-[100px]">{device.name}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function TopologyPage() {
    const { t } = useTranslation();
    const [data, setData] = useState<TopologyData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
    const [filterSource, setFilterSource] = useState<string | 'all'>('all');
    const [filterStatus, setFilterStatus] = useState<string | 'all'>('all');

    const [groupBySubnet, setGroupBySubnet] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/topology');
            const json = await res.json();
            if (json.error) throw new Error(json.error);
            setData(json);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load topology');
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filteredDevices = data?.devices.filter(d => {
        const matchesSearch = !searchTerm ||
            d.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            d.ip?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            d.mac?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            d.hostname?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesSource = filterSource === 'all' || d.source === filterSource;
        const matchesStatus = filterStatus === 'all' || d.status === filterStatus;
        return matchesSearch && matchesSource && matchesStatus;
    }) || [];

    const getDeviceIcon = (device: Device) => {
        const Icon = DEVICE_ICONS[device.type || 'default'] || Smartphone;
        return <Icon size={20} />;
    };

    const getSourceLabel = (source: string) => {
        const labels: Record<string, string> = {
            'adguard-dhcp': 'AdGuard DHCP',
            'adguard-static': 'AdGuard Static',
            'adguard-manual': 'AdGuard Manual',
            'adguard-auto': 'AdGuard Auto',
            'adguard-both': 'AdGuard Both',
            'technitium-dhcp': 'Technitium DHCP',
            'both': 'Both Sources',
            'opnsense': 'OPNsense',
        };
        return labels[source] || source;
    };

    return (
        <div className="p-4 md:p-8 space-y-6 md:space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-2">Network Topology</h1>
                    <p className="text-gray-400 text-sm md:text-base">DNS client topology based on DHCP leases and configured clients.</p>
                </div>
                <button
                    onClick={fetchData}
                    className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                    disabled={loading}
                >
                    <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 flex items-center gap-2">
                    <X size={18} /> {error}
                </div>
            )}

            {data && (
                <>
                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                            <div className="flex items-center gap-2 text-gray-400 mb-2">
                                <Network size={16} />
                                <span className="text-sm">Total Devices</span>
                            </div>
                            <p className="text-2xl font-bold text-white">{data.stats.totalDevices}</p>
                        </div>
                        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                            <div className="flex items-center gap-2 text-green-400 mb-2">
                                <Activity size={16} />
                                <span className="text-sm">Online</span>
                            </div>
                            <p className="text-2xl font-bold text-green-400">{data.stats.onlineDevices}</p>
                        </div>
                        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                            <div className="flex items-center gap-2 text-blue-400 mb-2">
                                <Wifi size={16} />
                                <span className="text-sm">DHCP</span>
                            </div>
                            <p className="text-2xl font-bold text-blue-400">{data.stats.dhcpDevices}</p>
                        </div>
                        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                            <div className="flex items-center gap-2 text-purple-400 mb-2">
                                <Cpu size={16} />
                                <span className="text-sm">Manual</span>
                            </div>
                            <p className="text-2xl font-bold text-purple-400">{data.stats.manualDevices}</p>
                        </div>
                    </div>

                    {/* Subnet Grouped Visualization */}
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-white font-medium flex items-center gap-2">
                                <Router size={16} className="text-blue-400" />
                                Network Topology
                            </h2>
                            <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={groupBySubnet}
                                    onChange={e => setGroupBySubnet(e.target.checked)}
                                    className="rounded bg-gray-800 border-gray-700 text-blue-500"
                                />
                                Group by subnet
                            </label>
                        </div>
                        <SubnetTopology
                            devices={filteredDevices}
                            stats={data.stats}
                            onSelectDevice={setSelectedDevice}
                            getDeviceIcon={getDeviceIcon}
                            groupBySubnet={groupBySubnet}
                        />
                    </div>

                    {/* Filters */}
                    <div className="flex flex-wrap gap-2">
                        <div className="flex items-center gap-2 bg-gray-900 border border-gray-800 rounded-lg px-3 py-2">
                            <Search size={14} className="text-gray-500" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                placeholder="Search devices..."
                                className="bg-transparent text-white text-sm focus:outline-none w-48"
                            />
                            {searchTerm && (
                                <button onClick={() => setSearchTerm('')} className="text-gray-500 hover:text-white">
                                    <X size={14} />
                                </button>
                            )}
                        </div>

                        <select
                            value={filterSource}
                            onChange={e => setFilterSource(e.target.value)}
                            className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-white text-sm"
                        >
                            <option value="all">All Sources</option>
                            <option value="adguard-dhcp">AdGuard DHCP</option>
                            <option value="adguard-static">AdGuard Static</option>
                            <option value="adguard-manual">AdGuard Manual</option>
                            <option value="technitium-dhcp">Technitium DHCP</option>
                            <option value="opnsense">OPNsense</option>
                            <option value="both">Both Sources</option>
                        </select>

                        <select
                            value={filterStatus}
                            onChange={e => setFilterStatus(e.target.value)}
                            className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-white text-sm"
                        >
                            <option value="all">All Status</option>
                            <option value="online">Online</option>
                            <option value="unknown">Unknown</option>
                        </select>
                    </div>

                    {/* Device Table */}
                    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-800 text-gray-500 text-xs">
                                        <th className="px-4 py-3 text-left">Device</th>
                                        <th className="px-4 py-3 text-left">IP Address</th>
                                        <th className="px-4 py-3 text-left">MAC Address</th>
                                        <th className="px-4 py-3 text-left">Source</th>
                                        <th className="px-4 py-3 text-left">Status</th>
                                        <th className="px-4 py-3 text-left">Tags</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                    {filteredDevices.map((device) => (
                                        <tr
                                            key={device.id}
                                            className="hover:bg-gray-800/50 cursor-pointer transition-colors"
                                            onClick={() => setSelectedDevice(device)}
                                        >
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-gray-400">{getDeviceIcon(device)}</span>
                                                    <div>
                                                        <div className="text-white font-medium">{device.name}</div>
                                                        {device.hostname && device.hostname !== device.name && (
                                                            <div className="text-gray-500 text-xs">{device.hostname}</div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-gray-300 font-mono text-xs">{device.ip || '-'}</td>
                                            <td className="px-4 py-3 text-gray-400 font-mono text-xs">{device.mac || '-'}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-0.5 rounded text-xs ${SOURCE_COLORS[device.source] || 'bg-gray-800 text-gray-400'}`}>
                                                    {getSourceLabel(device.source)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center gap-1 text-xs ${
                                                    device.status === 'online' ? 'text-green-400' : 'text-gray-500'
                                                }`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${
                                                        device.status === 'online' ? 'bg-green-400' : 'bg-gray-600'
                                                    }`} />
                                                    {device.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex flex-wrap gap-1">
                                                    {device.tags?.map(tag => (
                                                        <span key={tag} className="px-1.5 py-0.5 bg-gray-800 text-gray-400 rounded text-xs">
                                                            {tag}
                                                        </span>
                                                    ))}
                                                    {device.blockedServices && device.blockedServices.length > 0 && (
                                                        <span className="px-1.5 py-0.5 bg-red-500/10 text-red-400 rounded text-xs">
                                                            {device.blockedServices.length} blocked
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredDevices.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                                                No devices match your filters.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {/* Device Detail Modal */}
            {selectedDevice && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                >
                    <div className="bg-gray-950 border border-gray-800 rounded-xl w-full max-w-md">
                        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="text-blue-400">{getDeviceIcon(selectedDevice)}</div>
                                <div>
                                    <h3 className="text-white font-medium">{selectedDevice.name}</h3>
                                    <p className="text-gray-500 text-xs">{selectedDevice.id}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedDevice(null)}
                                className="text-gray-400 hover:text-white"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="p-4 space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-gray-900 rounded-lg p-3">
                                    <div className="text-gray-500 text-xs mb-1">IP Address</div>
                                    <div className="text-white font-mono text-sm">{selectedDevice.ip || 'N/A'}</div>
                                </div>
                                <div className="bg-gray-900 rounded-lg p-3">
                                    <div className="text-gray-500 text-xs mb-1">MAC Address</div>
                                    <div className="text-white font-mono text-sm">{selectedDevice.mac || 'N/A'}</div>
                                </div>
                            </div>

                            <div className="bg-gray-900 rounded-lg p-3">
                                <div className="text-gray-500 text-xs mb-1">Source</div>
                                <span className={`px-2 py-0.5 rounded text-xs ${SOURCE_COLORS[selectedDevice.source] || 'bg-gray-800 text-gray-400'}`}>
                                    {getSourceLabel(selectedDevice.source)}
                                </span>
                            </div>

                            {selectedDevice.scope && (
                                <div className="bg-gray-900 rounded-lg p-3">
                                    <div className="text-gray-500 text-xs mb-1">DHCP Scope</div>
                                    <div className="text-white text-sm">{selectedDevice.scope}</div>
                                </div>
                            )}

                            {selectedDevice.tags && selectedDevice.tags.length > 0 && (
                                <div className="bg-gray-900 rounded-lg p-3">
                                    <div className="text-gray-500 text-xs mb-2">Tags</div>
                                    <div className="flex flex-wrap gap-1">
                                        {selectedDevice.tags.map(tag => (
                                            <span key={tag} className="px-2 py-0.5 bg-gray-800 text-gray-300 rounded text-xs">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {selectedDevice.blockedServices && selectedDevice.blockedServices.length > 0 && (
                                <div className="bg-gray-900 rounded-lg p-3">
                                    <div className="text-gray-500 text-xs mb-2">Blocked Services</div>
                                    <div className="flex flex-wrap gap-1">
                                        {selectedDevice.blockedServices.map(s => (
                                            <span key={s} className="px-2 py-0.5 bg-red-500/10 text-red-400 rounded text-xs">
                                                {s}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {selectedDevice.filteringEnabled !== undefined && (
                                <div className="bg-gray-900 rounded-lg p-3">
                                    <div className="text-gray-500 text-xs mb-1">DNS Filtering</div>
                                    <span className={`text-sm ${selectedDevice.filteringEnabled ? 'text-green-400' : 'text-gray-500'}`}>
                                        {selectedDevice.filteringEnabled ? 'Enabled' : 'Disabled'}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
