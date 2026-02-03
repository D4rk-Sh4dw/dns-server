'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, Plus, Trash2, Check, Server, Globe, AlertCircle, Save, X, Shield, Lock } from 'lucide-react';

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
            'Tls': '208.67.222.222:853',
            'Https': 'https://doh.opendns.com/dns-query',
            'Quic': ''
        }
    }
};

export default function ForwardingPage() {
    const [zones, setZones] = useState<Zone[]>([]);
    const [upstreams, setUpstreams] = useState<string[]>([]);
    const [originalUpstreams, setOriginalUpstreams] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [newUpstream, setNewUpstream] = useState('');
    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [zonesRes, configRes] = await Promise.all([
                fetch('/api/zones'),
                fetch('/api/adguard/config')
            ]);

            const zonesData = await zonesRes.json();
            const configData = await configRes.json();

            if (zonesData.zones) {
                setZones(zonesData.zones);
            }

            if (configData.upstream_dns) {
                // Filter out upstream rules that are actually zone rules (contain [/domain/])
                // We only want to manage global upstreams here
                const globalUpstreams = configData.upstream_dns.filter((u: string) => !u.includes('[/'));
                setUpstreams(globalUpstreams);
                setOriginalUpstreams(globalUpstreams);
            }
        } catch (e) {
            console.error('Failed to fetch data:', e);
            setError('Failed to fetch data');
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSaveUpstreams = async () => {
        setSaving(true);
        try {
            // We need to fetch the current config first to preserve zone forwarding rules
            const configRes = await fetch('/api/adguard/config');
            const currentConfig = await configRes.json();
            const currentZoneRules = (currentConfig.upstream_dns || []).filter((u: string) => u.includes('[/'));

            // Merge our global upstreams with the existing zone rules
            const mergedUpstreams = [...currentZoneRules, ...upstreams];

            const res = await fetch('/api/adguard/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ upstream_dns: mergedUpstreams }),
            });

            if (!res.ok) throw new Error('Failed to save upstreams');

            setOriginalUpstreams([...upstreams]);
            // Re-fetch to ensure sync
            fetchData();
        } catch (e) {
            console.error(e);
            setError('Failed to save upstream servers');
        }
        setSaving(false);
    };

    const addUpstream = () => {
        if (!newUpstream) return;
        if (upstreams.includes(newUpstream)) return;
        setUpstreams([...upstreams, newUpstream]);
        setNewUpstream('');
    };

    const removeUpstream = (index: number) => {
        const newList = [...upstreams];
        newList.splice(index, 1);
        setUpstreams(newList);
    };

    const hasChanges = JSON.stringify(upstreams) !== JSON.stringify(originalUpstreams);

    return (
        <div className="p-4 md:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-2">Forwarding & Upstreams</h1>
                    <p className="text-gray-400 text-sm md:text-base">Manage global AdGuard upstream servers and view forwarding zones.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={fetchData}
                        className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                    >
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="text-red-400 flex-shrink-0 mt-0.5" size={20} />
                    <div>
                        <p className="text-red-400 font-medium">Error</p>
                        <p className="text-red-400/80 text-sm">{error}</p>
                    </div>
                </div>
            )}

            {/* AdGuard Upstreams Section */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-lg font-medium text-white flex items-center gap-2">
                            <Shield className="text-blue-400" size={20} />
                            AdGuard Upstream Servers
                        </h2>
                        <p className="text-sm text-gray-500">Default DNS servers used for resolving non-local queries.</p>
                    </div>
                    {hasChanges && (
                        <button
                            onClick={handleSaveUpstreams}
                            disabled={saving}
                            className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all animate-in fade-in"
                        >
                            {saving ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
                            Save Changes
                        </button>
                    )}
                </div>

                <div className="space-y-4 max-w-2xl">
                    <div className="flex gap-2">
                        <select
                            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                            onChange={(e) => {
                                const p = PROVIDERS[e.target.value];
                                if (p) setNewUpstream(p.protocols['Udp'] || ''); // Default to UDP
                            }}
                            defaultValue=""
                        >
                            <option value="" disabled>Predefined Providers...</option>
                            {Object.keys(PROVIDERS).map(k => (
                                <option key={k} value={k}>{PROVIDERS[k].name}</option>
                            ))}
                        </select>
                        <input
                            type="text"
                            value={newUpstream}
                            onChange={(e) => setNewUpstream(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && addUpstream()}
                            placeholder="IP Address or URL (e.g. 1.1.1.1)"
                            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                        />
                        <button
                            onClick={addUpstream}
                            disabled={!newUpstream}
                            className="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white p-2 rounded-lg transition-colors"
                        >
                            <Plus size={20} />
                        </button>
                    </div>

                    <div className="space-y-2">
                        {upstreams.map((upstream, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-gray-800/50 border border-gray-700/50 rounded-lg group">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-green-500" />
                                    <span className="font-mono text-gray-300">{upstream}</span>
                                </div>
                                <button
                                    onClick={() => removeUpstream(idx)}
                                    className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                        {upstreams.length === 0 && (
                            <div className="p-4 text-center text-gray-500 border border-dashed border-gray-800 rounded-lg">
                                No upstream servers configured. DNS resolution might fail.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Technitium Zones Section (Read-Only) */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <div className="p-6 border-b border-gray-800">
                    <h2 className="text-lg font-medium text-white flex items-center gap-2">
                        <Globe className="text-purple-400" size={20} />
                        Technitium Zones (Read-Only)
                    </h2>
                    <p className="text-sm text-gray-500">
                        These zones are managed via <span className="text-gray-300 font-medium">Technitium Controls &gt; Zones & Records</span>.
                    </p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-950/50">
                            <tr>
                                <th className="px-6 py-4">Domain / Zone</th>
                                <th className="px-6 py-4">Type</th>
                                <th className="px-6 py-4">Target Forwarder</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Managed By</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {zones.map((zone: Zone) => (
                                <tr key={zone.name} className="group hover:bg-gray-800/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            {zone.source === 'active-directory' ? <Server size={16} className="text-purple-400" /> : <Globe size={16} className="text-blue-400" />}
                                            <span className="text-white font-medium">{zone.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`text-xs px-2 py-1 rounded border ${zone.source === 'technitium'
                                            ? 'bg-blue-900/20 text-blue-400 border-blue-800'
                                            : (zone.source === 'active-directory' ? 'bg-purple-900/20 text-purple-400 border-purple-800' : 'bg-gray-800 text-gray-400 border-gray-700')
                                            }`}>
                                            {zone.source === 'active-directory' ? 'AD Domain' : (zone.source === 'technitium' ? 'Technitium Zone' : zone.type)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-400 font-mono text-sm">{zone.source === 'active-directory' ? zone.dcServers : (zone.forwarder || 'Local')}</td>
                                    <td className="px-6 py-4 text-green-400 text-xs flex items-center gap-1"><Check size={12} /> Active</td>
                                    <td className="px-6 py-4 text-right text-gray-500 text-xs flex items-center justify-end gap-1">
                                        <Lock size={12} /> Technitium
                                    </td>
                                </tr>
                            ))}
                            {zones.length === 0 && !loading && <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No forwarding zones configured.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
