'use client';

import { useState, useEffect } from 'react';
import { Save, RefreshCw, CheckCircle, XCircle, Shield, Server, Database } from 'lucide-react';

export default function SettingsPage() {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{
        adguard: boolean;
        technitium: boolean;
    } | null>(null);

    const checkConnection = async () => {
        setLoading(true);
        try {
            // We can add a real health check endpoint later
            // For now, let's just create a dummy check or fetch status from existing APIs
            const [adguardRes, techRes] = await Promise.all([
                fetch('/api/adguard'),
                fetch('/api/technitium/zones')
            ]);

            setStatus({
                adguard: adguardRes.ok,
                technitium: techRes.ok
            });
        } catch (e) {
            setStatus({ adguard: false, technitium: false });
        }
        setLoading(false);
    };

    useEffect(() => {
        checkConnection();
    }, []);

    return (
        <div className="p-4 md:p-8 space-y-6 md:space-y-8">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-2">Settings</h1>
                <p className="text-gray-400 text-sm md:text-base">
                    System configuration and status.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* System Status Card */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                            <Server className="text-blue-500" size={24} />
                            System Status
                        </h2>
                        <button
                            onClick={checkConnection}
                            className="p-2 text-gray-400 hover:text-white bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
                            title="Refresh Status"
                        >
                            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-800">
                            <div className="flex items-center gap-3">
                                <Shield className="text-green-500" size={20} />
                                <div>
                                    <div className="font-medium text-white">AdGuard Home</div>
                                    <div className="text-xs text-gray-500">Recursive DNS & Filtering</div>
                                </div>
                            </div>
                            <div>
                                {status?.adguard ? (
                                    <span className="flex items-center gap-1.5 text-green-400 text-sm font-medium bg-green-400/10 px-2 py-1 rounded">
                                        <CheckCircle size={14} /> Connected
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1.5 text-red-400 text-sm font-medium bg-red-400/10 px-2 py-1 rounded">
                                        <XCircle size={14} /> Error
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-800">
                            <div className="flex items-center gap-3">
                                <Database className="text-blue-500" size={20} />
                                <div>
                                    <div className="font-medium text-white">Technitium DNS</div>
                                    <div className="text-xs text-gray-500">Authoritative DNS</div>
                                </div>
                            </div>
                            <div>
                                {status?.technitium ? (
                                    <span className="flex items-center gap-1.5 text-green-400 text-sm font-medium bg-green-400/10 px-2 py-1 rounded">
                                        <CheckCircle size={14} /> Connected
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1.5 text-red-400 text-sm font-medium bg-red-400/10 px-2 py-1 rounded">
                                        <XCircle size={14} /> Error
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Configuration Backup & Restore */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                    <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                        <Save className="text-purple-500" size={24} />
                        Backup & Restore
                    </h2>

                    <div className="space-y-6">
                        <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-800">
                            <h3 className="text-white font-medium mb-2">Export Configuration</h3>
                            <p className="text-sm text-gray-400 mb-4">
                                Download a backup of AdGuard and Technitium configurations.
                            </p>
                            <a
                                href="/api/system/backup"
                                target="_blank"
                                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                            >
                                <Save size={18} />
                                Download Backup
                            </a>
                        </div>

                        <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-800">
                            <h3 className="text-white font-medium mb-2">Import Configuration</h3>
                            <p className="text-sm text-gray-400 mb-4">
                                Restore configuration from a previous backup file.
                                <br />
                                <span className="text-red-400 text-xs">Warning: This will overwrite current settings and restart services.</span>
                            </p>
                            <label className="inline-flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors">
                                <Database size={18} />
                                Select Backup File
                                <input
                                    type="file"
                                    accept=".tar.gz"
                                    className="hidden"
                                    onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        if (!confirm('This will overwrite current settings and restart services. Are you sure?')) return;

                                        const formData = new FormData();
                                        formData.append('backup', file);

                                        setLoading(true);
                                        try {
                                            const res = await fetch('/api/system/restore', {
                                                method: 'POST',
                                                body: formData
                                            });
                                            if (!res.ok) throw new Error('Restore failed');
                                            alert('Restore started. System will restart shortly.');
                                        } catch (err) {
                                            alert('Failed to restore backup');
                                        }
                                        setLoading(false);
                                    }}
                                />
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <DnsCacheSettings />
                <ReverseDnsSettings />
            </div>
        </div>
    );
}

function ReverseDnsSettings() {
    const [config, setConfig] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetch('/api/adguard/config')
            .then(res => res.json())
            .then(data => setConfig(data))
            .catch(err => console.error(err));
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            await fetch('/api/adguard/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    use_private_ptr_resolvers: config.use_private_ptr_resolvers,
                    resolve_clients: config.resolve_clients,
                    local_ptr_upstreams: config.local_ptr_upstreams
                })
            });
            alert('Reverse DNS settings saved!');
        } catch (err) {
            alert('Failed to save settings');
        }
        setSaving(false);
    };

    if (!config) return null;

    return (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                <Server className="text-orange-500" size={24} />
                Reverse DNS & Client Resolution
            </h2>

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <label className="text-white font-medium block">Use Private Reverse DNS</label>
                        <p className="text-xs text-gray-500">Use local upstream servers for reverse lookups (PTR)</p>
                    </div>
                    <input
                        type="checkbox"
                        checked={config.use_private_ptr_resolvers}
                        onChange={e => setConfig({ ...config, use_private_ptr_resolvers: e.target.checked })}
                        className="w-5 h-5 rounded bg-gray-800 border-gray-700 text-blue-600 focus:ring-blue-500"
                    />
                </div>

                <div className="flex items-center justify-between">
                    <div>
                        <label className="text-white font-medium block">Resolve Client Hostnames</label>
                        <p className="text-xs text-gray-500">Attempt to resolve IPs to hostnames for dashboard clients</p>
                    </div>
                    <input
                        type="checkbox"
                        checked={config.resolve_clients}
                        onChange={e => setConfig({ ...config, resolve_clients: e.target.checked })}
                        className="w-5 h-5 rounded bg-gray-800 border-gray-700 text-blue-600 focus:ring-blue-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Private Reverse DNS Servers</label>
                    <textarea
                        value={Array.isArray(config.local_ptr_upstreams) ? config.local_ptr_upstreams.join('\n') : config.local_ptr_upstreams || ''}
                        onChange={e => setConfig({ ...config, local_ptr_upstreams: e.target.value.split('\n') })}
                        rows={4}
                        placeholder="172.25.0.101"
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white font-mono text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">One IP address per line. Default Technitium: 172.25.0.101</p>
                </div>

                <div className="flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                        <Save size={18} />
                        {saving ? 'Saving...' : 'Save Reverse DNS'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function DnsCacheSettings() {
    const [config, setConfig] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetch('/api/adguard/config')
            .then(res => res.json())
            .then(data => setConfig(data))
            .catch(err => console.error(err));
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            await fetch('/api/adguard/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cache_size: parseInt(config.cache_size),
                    cache_ttl_min: parseInt(config.cache_ttl_min),
                    cache_ttl_max: parseInt(config.cache_ttl_max),
                    cache_optimistic: config.cache_optimistic
                })
            });
            alert('Settings saved!');
        } catch (err) {
            alert('Failed to save settings');
        }
        setSaving(false);
    };

    if (!config) return null;

    return (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                <Database className="text-green-500" size={24} />
                DNS Cache Settings (AdGuard)
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Cache Size (bytes)</label>
                    <input
                        type="number"
                        value={config.cache_size}
                        onChange={e => setConfig({ ...config, cache_size: e.target.value })}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                    />
                    <p className="text-xs text-gray-500 mt-1">Memory cache size (default: 4194304 = 4MB)</p>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Generic TTL (seconds)</label>
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <span className="text-xs text-gray-500 block mb-1">Min</span>
                            <input
                                type="number"
                                value={config.cache_ttl_min}
                                onChange={e => setConfig({ ...config, cache_ttl_min: e.target.value })}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                            />
                        </div>
                        <div className="flex-1">
                            <span className="text-xs text-gray-500 block mb-1">Max</span>
                            <input
                                type="number"
                                value={config.cache_ttl_max}
                                onChange={e => setConfig({ ...config, cache_ttl_max: e.target.value })}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                            />
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <input
                        type="checkbox"
                        id="optimistic"
                        checked={config.cache_optimistic}
                        onChange={e => setConfig({ ...config, cache_optimistic: e.target.checked })}
                        className="w-4 h-4 rounded bg-gray-800 border-gray-700"
                    />
                    <label htmlFor="optimistic" className="text-white">Optimistic Caching</label>
                </div>
            </div>

            <div className="mt-6 flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                    <Save size={18} />
                    {saving ? 'Saving...' : 'Save Cache Settings'}
                </button>
            </div>
        </div>
    );
}
