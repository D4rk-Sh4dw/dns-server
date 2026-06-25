'use client';

import { useTranslation } from '@/lib/i18n-context';

import { useEffect, useState } from 'react';
import { RefreshCw, Plus, Trash2, Check, Server, Globe, AlertCircle, Save, X, Shield, Lock, Network } from 'lucide-react';
import PageLayout, { PageHeader } from '../components/PageLayout';

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

function TabButton({ icon: Icon, label, active, onClick }: { icon: any; label: string; active: boolean; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${active
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white'
                }`}
        >
            <Icon size={16} />
            {label}
        </button>
    );
}

function UpstreamsTab({ upstreams, setUpstreams, originalUpstreams, setOriginalUpstreams, refresh, error, setError }: any) {
    const { t } = useTranslation();
    const [saving, setSaving] = useState(false);
    const [newUpstream, setNewUpstream] = useState('');

    const handleSaveUpstreams = async () => {
        setSaving(true);
        setError(null);
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
            await refresh();
        } catch (e) {
            console.error(e);
            setError(t('forwarding.save_upstream_error'));
        } finally {
            setSaving(false);
        }
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
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-lg font-medium text-white flex items-center gap-2">
                        <Shield className="text-blue-400" size={20} />
                        {t('forwarding.adguard_upstreams')}
                    </h2>
                    <p className="text-sm text-gray-500">{t('forwarding.adguard_upstreams_desc')}</p>
                </div>
                {hasChanges && (
                    <button
                        onClick={handleSaveUpstreams}
                        disabled={saving}
                        className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all animate-in fade-in"
                    >
                        {saving ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
                        {t('common.save_changes')}
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
                        <option value="" disabled>{t('forwarding.predefined_providers')}</option>
                        {Object.keys(PROVIDERS).map(k => (
                            <option key={k} value={k}>{PROVIDERS[k].name}</option>
                        ))}
                    </select>
                    <input
                        type="text"
                        value={newUpstream}
                        onChange={(e) => setNewUpstream(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addUpstream()}
                        placeholder={t('forwarding.upstream_placeholder')}
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
                    {upstreams.map((upstream: string, idx: number) => (
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
                            {t('forwarding.no_upstreams')}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function ForwardingZonesTab({ zones }: { zones: Zone[] }) {
    const { t } = useTranslation();
    return (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="p-6 border-b border-gray-800">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-lg font-medium text-white mb-1">{t('forwarding.technitium_zones')}</h3>
                        <p className="text-sm text-gray-500">
                            {t('forwarding.technitium_zones_desc')} <a href="/technitium" target="_blank" className="text-blue-400 hover:underline">{t('forwarding.technitium_controls')}</a>.
                        </p>
                    </div>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-950/50">
                        <tr>
                            <th className="px-6 py-3">{t('forwarding.domain_zone')}</th>
                            <th className="px-6 py-3">{t('forwarding.type')}</th>
                            <th className="px-6 py-3">{t('forwarding.target_forwarder')}</th>
                            <th className="px-6 py-3">{t('forwarding.status')}</th>
                            <th className="px-6 py-3">{t('forwarding.managed_by')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {zones.map((zone) => (
                            <tr key={zone.name} className="text-sm group hover:bg-gray-850 transition-colors">
                                <td className="px-6 py-4 font-mono text-white">{zone.name}</td>
                                <td className="px-6 py-4 text-gray-400 capitalize">{zone.type}</td>
                                <td className="px-6 py-4 font-mono text-gray-300">
                                    {zone.forwarder ? (
                                        <span className="text-blue-400">{zone.forwarder}</span>
                                    ) : zone.dcServers ? (
                                        <span className="text-purple-400">{zone.dcServers}</span>
                                    ) : (
                                        <span className="text-gray-600">-</span>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    {zone.disabled ? (
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-900/20 text-red-400 border border-red-900/30">Disabled</span>
                                    ) : (
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-900/20 text-green-400 border border-green-900/30">Active</span>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    {zone.source === 'active-directory' ? (
                                        <span className="flex items-center gap-1.5 text-xs text-blue-300 bg-blue-900/20 px-2 py-1 rounded border border-blue-900/30">
                                            <Shield size={12} /> {t('forwarding.ad_domain')}
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1.5 text-xs text-gray-400 bg-gray-800/50 px-2 py-1 rounded border border-gray-700">
                                            <Server size={12} /> {t('forwarding.technitium_zone')}
                                        </span>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {zones.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                    {t('forwarding.no_zones')}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default function ForwardingPage() {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<'upstreams' | 'zones'>('upstreams');
    const [zones, setZones] = useState<Zone[]>([]);
    const [upstreams, setUpstreams] = useState<string[]>([]);
    const [originalUpstreams, setOriginalUpstreams] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
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
            setError(t('forwarding.fetch_data_error'));
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    return (
        <PageLayout
            header={
                <PageHeader
                    icon={<Network className="text-blue-400" size={22} />}
                    title={t('forwarding.title')}
                    subtitle={t('forwarding.subtitle')}
                    actions={
                        <button
                            onClick={fetchData}
                            className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                        >
                            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                        </button>
                    }
                />
            }
        >
            <div className="space-y-6 md:space-y-8">

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="text-red-400 flex-shrink-0 mt-0.5" size={20} />
                    <div>
                        <p className="text-red-400 font-medium">{t('common.error')}</p>
                        <p className="text-red-400/80 text-sm">{error}</p>
                    </div>
                </div>
            )}

            <div className="flex gap-2 mb-6">
                <TabButton
                    active={activeTab === 'upstreams'}
                    onClick={() => setActiveTab('upstreams')}
                    icon={Globe}
                    label={t('forwarding.adguard_upstreams')}
                />
                <TabButton
                    active={activeTab === 'zones'}
                    onClick={() => setActiveTab('zones')}
                    icon={Server}
                    label={t('forwarding.technitium_zones')}
                />
            </div>

            {activeTab === 'upstreams' && (
                <UpstreamsTab
                    upstreams={upstreams}
                    setUpstreams={setUpstreams}
                    originalUpstreams={originalUpstreams}
                    setOriginalUpstreams={setOriginalUpstreams}
                    refresh={fetchData}
                    error={error}
                    setError={setError}
                />
            )}

            {activeTab === 'zones' && (
                <ForwardingZonesTab zones={zones} />
            )}
            </div>
        </PageLayout>
    );
}
