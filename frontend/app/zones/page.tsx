'use client';

import { useEffect, useState, useMemo } from 'react';
import { Plus, RefreshCw, ChevronRight, Trash2, Check, AlertCircle, Server, Globe, Search } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n-context';

interface Zone {
    name: string;
    type: string;
    disabled?: boolean;
    internal?: boolean;
    forwardingEnabled: boolean;
    source: 'technitium' | 'active-directory';
    dcServers?: string;
    forwarder?: string;
}

const PROVIDERS: Record<string, { name: string; protocols: Record<string, string> }> = {
    'Cloudflare': {
        name: 'Cloudflare',
        protocols: {
            'Udp': '1.1.1.1',
            'Tcp': '1.1.1.1',
            'Tls': '1.1.1.1:853',
            'Https': 'https://cloudflare-dns.com/dns-query',
            'Quic': 'quic://dns.cloudflare.com:853'
        }
    },
    'Google': {
        name: 'Google',
        protocols: {
            'Udp': '8.8.8.8',
            'Tcp': '8.8.8.8',
            'Tls': '8.8.8.8:853',
            'Https': 'https://dns.google/dns-query',
            'Quic': 'quic://dns.google:853'
        }
    },
    'Quad9': {
        name: 'Quad9',
        protocols: {
            'Udp': '9.9.9.9',
            'Tcp': '9.9.9.9',
            'Tls': '9.9.9.9:853',
            'Https': 'https://dns.quad9.net/dns-query',
            'Quic': 'quic://dns.quad9.net:853'
        }
    },
    'OpenDNS': {
        name: 'OpenDNS',
        protocols: {
            'Udp': '208.67.222.222',
            'Tcp': '208.67.222.222',
            'Tls': '208.67.222.222:853', // OpenDNS support for DoT/DoH varies, using assumed defaults or standard IP
            'Https': 'https://doh.opendns.com/dns-query',
            'Quic': '' // Not standard support yet
        }
    }
};

export default function ZonesPage() {
    const { t } = useTranslation();
    const [zones, setZones] = useState<Zone[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newZone, setNewZone] = useState({
        name: '',
        type: 'Primary',
        isActiveDirectory: false,
        dcServers: '',
        forwarder: '',
        protocol: 'Udp', // Default Technitium protocol value
    });
    const [selectedProvider, setSelectedProvider] = useState('');
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredZones = useMemo(() => {
        if (!searchQuery.trim()) return zones;
        const lowerQuery = searchQuery.toLowerCase();
        return zones.filter(zone =>
            zone.name.toLowerCase().includes(lowerQuery) ||
            zone.type.toLowerCase().includes(lowerQuery) ||
            (zone.dcServers && zone.dcServers.toLowerCase().includes(lowerQuery)) ||
            (zone.forwarder && zone.forwarder.toLowerCase().includes(lowerQuery))
        );
    }, [zones, searchQuery]);

    const fetchZones = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/zones');
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setZones(data.zones || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch zones');
        }
        setLoading(false);
    };

    useEffect(() => { fetchZones(); }, []);

    const handleCreateZone = async () => {
        if (!newZone.name) return;
        if (newZone.isActiveDirectory && !newZone.dcServers) {
            setError(t('zones.enter_dc_ip'));
            return;
        }
        if (newZone.type === 'ConditionalForwarder' && !newZone.forwarder) {
            setError(t('zones.enter_forwarder_ip'));
            return;
        }

        setCreating(true);
        setError(null);

        try {
            const res = await fetch('/api/zones', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'create',
                    zone: (newZone as any).formattedReverse || newZone.name,
                    type: newZone.type,
                    isActiveDirectory: newZone.isActiveDirectory,
                    dcServers: newZone.dcServers,
                    forwarder: newZone.forwarder,
                    protocol: newZone.protocol,
                }),
            });

            const data = await res.json();
            if (data.error) throw new Error(data.error);

            setNewZone({ name: '', type: 'Primary', isActiveDirectory: false, dcServers: '', forwarder: '', protocol: 'Udp' });
            setShowCreateModal(false);
            await fetchZones();
        } catch (err) {
            setError(err instanceof Error ? err.message : t('zones.failed_create'));
        }
        setCreating(false);
    };

    const handleDeleteZone = async (zone: Zone) => {
        const isAD = zone.source === 'active-directory';
        const message = isAD
            ? t('zones.delete_ad_confirm', [zone.name])
            : t('zones.delete_zone_confirm', [zone.name]);

        if (!confirm(message)) return;

        setError(null);
        try {
            const res = await fetch('/api/zones', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'delete', zone: zone.name }),
            });

            const data = await res.json();
            if (data.error) throw new Error(data.error);

            await fetchZones();
        } catch (err) {
            setError(err instanceof Error ? err.message : t('zones.failed_delete'));
        }
    };

    return (
        <div className="p-4 md:p-8 space-y-6 md:space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-2">{t('zones.title')}</h1>
                    <p className="text-gray-400 text-sm md:text-base">
                        {t('zones.subtitle')}
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search size={16} className="text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                        </div>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={t('zones.search_placeholder')}
                            className="bg-gray-800 border border-gray-700 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5 transition-all w-full sm:w-64"
                        />
                    </div>
                    <button
                        onClick={async () => {
                            if (!confirm(t('zones.cache_clear_confirm'))) return;

                            setLoading(true);
                            try {
                                const res = await fetch('/api/adguard/cache/clear', { method: 'POST' });
                                if (!res.ok) throw new Error('Failed to clear cache');
                                alert(t('zones.cache_cleared'));
                            } catch (e) {
                                alert(t('zones.cache_clear_error'));
                            }
                            setLoading(false);
                            // Refresh zones data as well
                            fetchZones();
                        }}
                        className="p-2 rounded-lg bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 hover:text-yellow-400 border border-yellow-500/20 transition-colors flex justify-center items-center gap-2 px-3"
                        title={t('zones.reset_cache')}
                    >
                        <RefreshCw size={18} />
                        <span className="hidden sm:inline text-sm font-medium">{t('zones.reset_cache')}</span>
                    </button>

                    <button
                        onClick={fetchZones}
                        className="flex-1 sm:flex-none p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors flex justify-center items-center"
                        title={t('zones.refresh')}
                    >
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex-[3] sm:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap"
                    >
                        <Plus size={18} />
                        {t('zones.add_zone')}
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="text-red-400 flex-shrink-0 mt-0.5" size={20} />
                    <div>
                        <p className="text-red-400 font-medium">{t('zones.error')}</p>
                        <p className="text-red-400/80 text-sm">{error}</p>
                    </div>
                </div>
            )}

            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-950/50">
                        <tr>
                            <th className="px-6 py-4">{t('zones.zone_domain')}</th>
                            <th className="px-6 py-4">{t('zones.type')}</th>
                            <th className="px-6 py-4">{t('zones.target')}</th>
                            <th className="px-6 py-4">{t('zones.status')}</th>
                            <th className="px-6 py-4 text-right">{t('zones.actions')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {filteredZones.map(zone => (
                            <tr key={zone.name} className="group hover:bg-gray-800/50 transition-colors">
                                <td className="px-6 py-4">
                                    {zone.source === 'active-directory' ? (
                                        <div className="flex items-center gap-2">
                                            <Server size={16} className="text-purple-400" />
                                            <span className="text-white font-medium">{zone.name}</span>
                                        </div>
                                    ) : (
                                        <Link
                                            href={`/zones/${encodeURIComponent(zone.name)}`}
                                            className="text-white font-medium hover:text-blue-400 flex items-center gap-2"
                                        >
                                            <Globe size={16} className="text-blue-400" />
                                            {zone.name}
                                            <ChevronRight size={16} className="text-gray-600 group-hover:text-blue-400" />
                                        </Link>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`text-xs font-medium px-2 py-1 rounded ${zone.source === 'active-directory'
                                        ? 'text-purple-400 bg-purple-400/10'
                                        : zone.name.endsWith('.in-addr.arpa')
                                            ? 'text-yellow-400 bg-yellow-400/10'
                                            : 'text-blue-400 bg-blue-400/10'
                                        }`}>
                                        {zone.source === 'active-directory' ? t('zones.active_directory') : zone.name.endsWith('.in-addr.arpa') ? t('zones.reverse_dns') : zone.type || t('zones.primary')}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-gray-400 text-sm font-mono">
                                    {zone.source === 'active-directory'
                                        ? zone.dcServers
                                        : t('zones.technitium_docker')}
                                </td>
                                <td className="px-6 py-4">
                                    {/* Determine status based on zone type */}
                                    {zone.internal ? (
                                        // Internal Technitium zones (localhost, reverse zones, etc.)
                                        <span className="flex items-center gap-2 text-xs font-medium text-gray-400">
                                            <div className="w-2 h-2 rounded-full bg-gray-500" />
                                            {t('zones.internal')}
                                        </span>
                                    ) : zone.forwardingEnabled ? (
                                        // Custom zones with forwarding active
                                        <span className="flex items-center gap-2 text-xs font-medium text-green-400">
                                            <Check size={14} />
                                            {t('zones.active')}
                                        </span>
                                    ) : (
                                        // Custom zones without forwarding
                                        <span className="flex items-center gap-2 text-xs font-medium text-yellow-400">
                                            <AlertCircle size={14} />
                                            {t('zones.pending')}
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => handleDeleteZone(zone)}
                                        className="text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {!filteredZones.length && !loading && (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                    {searchQuery ? t('zones.no_zones_match') : t('zones.no_zones_configured')}
                                </td>
                            </tr>
                        )}
                        {loading && (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                    {t('zones.loading')}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Create Zone Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-lg">
                        <h3 className="text-lg font-medium text-white mb-4">{t('zones.add_dns_zone')}</h3>

                        {/* Zone Type Toggle */}
                        <div className="flex gap-2 mb-6">
                            <button
                                onClick={() => setNewZone(prev => ({ ...prev, isActiveDirectory: false }))}
                                className={`flex-1 p-4 rounded-lg border-2 transition-all ${!newZone.isActiveDirectory
                                    ? 'border-blue-500 bg-blue-500/10'
                                    : 'border-gray-700 hover:border-gray-600'
                                    }`}
                            >
                                <Globe size={24} className={!newZone.isActiveDirectory ? 'text-blue-400' : 'text-gray-500'} />
                                <div className="mt-2 text-left">
                                    <div className={`font-medium ${!newZone.isActiveDirectory ? 'text-white' : 'text-gray-400'}`}>
                                        {t('zones.custom_zone')}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        {t('zones.custom_zone_desc')}
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => setNewZone(prev => ({ ...prev, isActiveDirectory: true }))}
                                className={`flex-1 p-4 rounded-lg border-2 transition-all ${newZone.isActiveDirectory
                                    ? 'border-purple-500 bg-purple-500/10'
                                    : 'border-gray-700 hover:border-gray-600'
                                    }`}
                            >
                                <Server size={24} className={newZone.isActiveDirectory ? 'text-purple-400' : 'text-gray-500'} />
                                <div className="mt-2 text-left">
                                    <div className={`font-medium ${newZone.isActiveDirectory ? 'text-white' : 'text-gray-400'}`}>
                                        {t('zones.active_directory')}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        {t('zones.ad_domain_desc')}
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => {
                                    setNewZone(prev => ({
                                        ...prev,
                                        isActiveDirectory: false,
                                        type: 'Primary',
                                        isReverse: true
                                    }));
                                }}
                                className={`flex-1 p-4 rounded-lg border-2 transition-all ${!newZone.isActiveDirectory && (newZone as any).isReverse
                                    ? 'border-yellow-500 bg-yellow-500/10'
                                    : 'border-gray-700 hover:border-gray-600'
                                    }`}
                            >
                                <RefreshCw size={24} className={!newZone.isActiveDirectory && (newZone as any).isReverse ? 'text-yellow-400' : 'text-gray-500'} />
                                <div className="mt-2 text-left">
                                    <div className={`font-medium ${!newZone.isActiveDirectory && (newZone as any).isReverse ? 'text-white' : 'text-gray-400'}`}>
                                        {t('zones.reverse_dns')}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        {t('zones.reverse_dns_desc')}
                                    </div>
                                </div>
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">
                                    {newZone.isActiveDirectory ? t('zones.ad_domain_name') : (newZone as any).isReverse ? t('zones.subnet') : t('zones.zone_name')}
                                </label>
                                <input
                                    type="text"
                                    value={newZone.name}
                                    onChange={(e) => {
                                        let val = e.target.value;
                                        if ((newZone as any).isReverse && val.match(/^\d+\.\d+\.\d+(\.\d+)?$/)) {
                                            const parts = val.split('.');
                                            if (parts.length >= 3) {
                                                // Take first 3 parts and reverse them
                                                const rev = `${parts[2]}.${parts[1]}.${parts[0]}.in-addr.arpa`;
                                                setNewZone(prev => ({ ...prev, name: val, formattedReverse: rev }));
                                                return;
                                            }
                                        }
                                        setNewZone(prev => ({ ...prev, name: val }));
                                    }}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                                    placeholder={newZone.isActiveDirectory ? 'e.g. corp.vmhaus.de' : (newZone as any).isReverse ? 'e.g. 192.168.1.0' : 'e.g. vmhaus.de'}
                                />
                                {(newZone as any).isReverse && (newZone as any).formattedReverse && (
                                    <p className="text-xs text-yellow-400 mt-1">
                                        {t('zones.will_create_zone')} <strong>{(newZone as any).formattedReverse}</strong>
                                    </p>
                                )}
                            </div>

                            {newZone.isActiveDirectory ? (
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">
                                        {t('zones.dc_ips')}
                                    </label>
                                    <input
                                        type="text"
                                        value={newZone.dcServers}
                                        onChange={(e) => setNewZone(prev => ({ ...prev, dcServers: e.target.value }))}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                                        placeholder="e.g. 10.0.0.10, 10.0.0.11"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        {t('zones.dc_ips_desc')}
                                    </p>
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">{t('zones.zone_type')}</label>
                                    <select
                                        value={newZone.type}
                                        onChange={(e) => setNewZone(prev => ({ ...prev, type: e.target.value }))}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                                    >
                                        <option value="Primary">Primary (Authoritative)</option>
                                        <option value="Secondary">Secondary (Replica)</option>
                                        <option value="ConditionalForwarder">Conditional Forwarder (Split DNS)</option>
                                    </select>
                                </div>
                            )}

                            {/* Conditional Forwarder Input */}
                            {!newZone.isActiveDirectory && newZone.type === 'ConditionalForwarder' && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-1">
                                            {t('zones.upstream_provider')}
                                        </label>
                                        <select
                                            onChange={(e) => {
                                                const providerKey = e.target.value;
                                                setSelectedProvider(providerKey);
                                                if (providerKey && PROVIDERS[providerKey]) {
                                                    const newForwarder = PROVIDERS[providerKey].protocols[newZone.protocol] || '';
                                                    setNewZone(prev => ({ ...prev, forwarder: newForwarder }));
                                                }
                                            }}
                                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 mb-2"
                                            value={selectedProvider}
                                        >
                                            <option value="">{t('zones.select_provider')}</option>
                                            {Object.keys(PROVIDERS).map(key => (
                                                <option key={key} value={key}>{PROVIDERS[key].name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-1">
                                            {t('zones.forwarder_ip')}
                                        </label>
                                        <input
                                            type="text"
                                            value={newZone.forwarder}
                                            onChange={(e) => setNewZone(prev => ({ ...prev, forwarder: e.target.value }))}
                                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                                            placeholder="e.g. 1.1.1.1"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-1">
                                            {t('zones.protocol')}
                                        </label>
                                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                                            {['Udp', 'Tcp', 'Tls', 'Https', 'Quic'].map(p => (
                                                <button
                                                    key={p}
                                                    onClick={() => setNewZone(prev => ({ ...prev, protocol: p }))}
                                                    className={`px-3 py-2 rounded-lg text-sm border transition-colors ${newZone.protocol === p
                                                        ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                                                        : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                                                        }`}
                                                >
                                                    DNS-over-{p.toUpperCase()}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <p className="text-xs text-gray-500">
                                        {t('zones.forwarder_desc')}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="bg-gray-800 rounded-lg p-3 mt-4">
                            <p className="text-xs text-gray-400">
                                {newZone.isActiveDirectory ? (
                                    <>
                                        <strong className="text-purple-400">{t('zones.ad_mode_desc')}</strong> AdGuard will forward all
                                        <code className="bg-gray-700 px-1 mx-1 rounded">*.{newZone.name || 'domain'}</code>
                                        queries directly to your Domain Controllers.
                                    </>
                                ) : (
                                    <>
                                        <strong className="text-blue-400">{t('zones.custom_mode_desc')}</strong> Zone will be created in Technitium.
                                        {newZone.type === 'ConditionalForwarder'
                                            ? ' Local records will be resolved, unknown records forwarded to ' + (newZone.forwarder || 'upstream') + '.'
                                            : ' You can add A, CNAME, TXT records manually.'}
                                        AdGuard forwards <code className="bg-gray-700 px-1 mx-1 rounded">*.{newZone.name || 'domain'}</code> to Technitium.
                                    </>
                                )}
                            </p>
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => {
                                    setShowCreateModal(false);
                                    setError(null);
                                }}
                                className="px-4 py-2 text-gray-400 hover:text-white"
                                disabled={creating}
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                onClick={handleCreateZone}
                                disabled={creating || !newZone.name || (newZone.isActiveDirectory && !newZone.dcServers) || (!newZone.isActiveDirectory && newZone.type === 'ConditionalForwarder' && !newZone.forwarder)}
                                className={`flex items-center gap-2 text-white px-4 py-2 rounded-lg text-sm font-medium ${newZone.isActiveDirectory
                                    ? 'bg-purple-600 hover:bg-purple-500 disabled:bg-purple-600/50'
                                    : 'bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50'
                                    }`}
                            >
                                {creating ? (
                                    <>
                                        <RefreshCw size={18} className="animate-spin" />
                                        {t('zones.creating')}
                                    </>
                                ) : (
                                    <>
                                        <Check size={18} />
                                        {newZone.isActiveDirectory ? t('zones.add_ad_domain') : t('zones.create_zone')}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
