'use client';

import { useState, useEffect } from 'react';
import { Save, RefreshCw, CheckCircle, XCircle, Shield, Server, Database, Wifi, Upload } from 'lucide-react';

import { useTranslation } from '@/lib/i18n-context';

export default function SettingsPage() {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{
        adguard: boolean;
        technitium: boolean;
    } | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            // Enforce Technitium as DHCP provider
            localStorage.setItem('dhcp_provider', 'technitium');
        }
    }, []);

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
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-white">{t('settings.title')}</h1>
                <p className="text-gray-400">{t('settings.subtitle')}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* System Status Card */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                            <Server className="text-blue-500" size={24} />
                            {t('settings.system_status')}
                        </h2>
                        <button
                            onClick={checkConnection}
                            className="p-2 text-gray-400 hover:text-white bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
                            title={t('settings.refresh')}
                        >
                            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-800">
                            <div className="flex items-center gap-3">
                                <Shield className="text-green-500" size={20} />
                                <div>
                                    <div className="font-medium text-white">{t('settings.adguard')}</div>
                                    <div className="text-xs text-gray-500">{t('settings.adguard_desc')}</div>
                                </div>
                            </div>
                            <div>
                                {status?.adguard ? (
                                    <span className="flex items-center gap-1.5 text-green-400 text-sm font-medium bg-green-400/10 px-2 py-1 rounded">
                                        <CheckCircle size={14} /> {t('settings.connected')}
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1.5 text-red-400 text-sm font-medium bg-red-400/10 px-2 py-1 rounded">
                                        <XCircle size={14} /> {t('settings.error')}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-800">
                            <div className="flex items-center gap-3">
                                <Database className="text-blue-500" size={20} />
                                <div>
                                    <div className="font-medium text-white">{t('settings.technitium')}</div>
                                    <div className="text-xs text-gray-500">{t('settings.technitium_desc')}</div>
                                </div>
                            </div>
                            <div>
                                {status?.technitium ? (
                                    <span className="flex items-center gap-1.5 text-green-400 text-sm font-medium bg-green-400/10 px-2 py-1 rounded">
                                        <CheckCircle size={14} /> {t('settings.connected')}
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1.5 text-red-400 text-sm font-medium bg-red-400/10 px-2 py-1 rounded">
                                        <XCircle size={14} /> {t('settings.error')}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-800">
                            <div className="flex items-center gap-3">
                                <Wifi className="text-purple-500" size={20} />
                                <div>
                                    <div className="font-medium text-white">{t('settings.dhcp')}</div>
                                    <div className="text-xs text-gray-500">{t('settings.dhcp_desc')}</div>
                                </div>
                            </div>
                            <div>
                                {status?.technitium ? (
                                    <span className="flex items-center gap-1.5 text-green-400 text-sm font-medium bg-green-400/10 px-2 py-1 rounded">
                                        <CheckCircle size={14} /> {t('settings.active')}
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1.5 text-gray-400 text-sm font-medium bg-gray-400/10 px-2 py-1 rounded">
                                        <RefreshCw size={14} /> {t('settings.waiting')}
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
                        {t('settings.backup_restore')}
                    </h2>

                    <div className="space-y-6">
                        <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-800">
                            <h3 className="text-white font-medium mb-2">{t('settings.export_config')}</h3>
                            <p className="text-sm text-gray-400 mb-4">
                                {t('settings.export_desc')}
                            </p>
                            <a
                                href="/api/system/backup"
                                target="_blank"
                                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                            >
                                <Save size={18} />
                                {t('settings.download_backup')}
                            </a>
                        </div>

                        <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-800">
                            <h3 className="text-white font-medium mb-2">{t('settings.import_config')}</h3>
                            <p className="text-sm text-gray-400 mb-4">
                                {t('settings.import_desc')}
                                <br />
                                <span className="text-red-400 text-xs">{t('settings.warning')}</span>
                            </p>
                            <label className="inline-flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors">
                                <Database size={18} />
                                {t('settings.select_file')}
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
                                            if (!res.ok) {
                                                const data = await res.json();
                                                throw new Error(data.error || 'Restore failed');
                                            }
                                            alert('Restore successful! Please restart your Docker containers to apply the changes (docker compose down && docker compose up -d).');
                                        } catch (err) {
                                            alert('Failed to restore backup: ' + (err instanceof Error ? err.message : 'Unknown error'));
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

            <AdGuardImport />

            <OpnsenseSettings />
        </div>
    );
}

function AdGuardImport() {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

    const handlePreview = async () => {
        if (!file) return;
        setLoading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('action', 'preview');

        try {
            const res = await fetch('/api/import/adguard', { method: 'POST', body: formData });
            const data = await res.json();
            setPreview(data);
        } catch (err) {
            alert('Failed to parse file');
        }
        setLoading(false);
    };

    const handleImport = async () => {
        if (!file) return;
        setLoading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('action', 'import');

        try {
            const res = await fetch('/api/import/adguard', { method: 'POST', body: formData });
            const data = await res.json();
            setResult(data);
        } catch (err) {
            alert('Import failed');
        }
        setLoading(false);
    };

    return (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Upload size={20} className="text-green-400" />
                Import AdGuard Config
            </h2>
            <p className="text-gray-400 text-sm mb-4">
                Upload your <code className="bg-gray-800 px-1 rounded">AdGuardHome.yaml</code> to import blocklists, whitelists, clients, and DNS rewrites.
            </p>

            <div className="space-y-4">
                <input
                    type="file"
                    accept=".yaml,.yml"
                    onChange={(e) => { setFile(e.target.files?.[0] || null); setPreview(null); setResult(null); }}
                    className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-500"
                />

                {file && !preview && (
                    <button onClick={handlePreview} disabled={loading} className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm">
                        {loading ? 'Parsing...' : 'Preview'}
                    </button>
                )}

                {preview && (
                    <div className="bg-gray-800 rounded-lg p-4 text-sm space-y-2">
                        <p className="text-white font-medium">Found:</p>
                        <ul className="text-gray-400 list-disc list-inside">
                            <li>{preview.zones?.length || 0} DNS zones ({preview.zones?.reduce((a: number, z: any) => a + z.records.length, 0) || 0} records) → Technitium</li>
                            <li>{preview.blocklists?.length || 0} blocklists → AdGuard</li>
                            <li>{preview.whitelists?.length || 0} whitelists → AdGuard</li>
                            <li>{preview.userRules?.length || 0} custom rules → AdGuard</li>
                            <li>{preview.clients?.length || 0} clients → AdGuard</li>
                        </ul>
                        <button onClick={handleImport} disabled={loading} className="mt-3 bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium">
                            {loading ? 'Importing...' : 'Import All'}
                        </button>
                    </div>
                )}

                {result && (
                    <div className="bg-green-900/20 border border-green-700 rounded-lg p-4 text-sm">
                        <p className="text-green-400 font-medium">Import Complete!</p>
                        <ul className="text-gray-300 list-disc list-inside mt-2">
                            <li>{result.zonesCreated} zones created</li>
                            <li>{result.recordsCreated} records created</li>
                            <li>{result.blocklistsAdded} blocklists added</li>
                            <li>{result.whitelistsAdded} whitelists added</li>
                            <li>{result.clientsAdded} clients added</li>
                        </ul>
                        {result.errors?.length > 0 && (
                            <p className="text-red-400 mt-2">Errors: {result.errors.join(', ')}</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function OpnsenseSettings() {
    const [config, setConfig] = useState<any>({
        url: '',
        key: '',
        secret: '',
        backend: 'kea',
        skip_ssl_verify: false // Add default
    });
    const [loading, setLoading] = useState(true); // Initial loading state
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);

    useEffect(() => {
        // Fetch from backend on load
        fetch('/api/opnsense/config')
            .then(res => res.json())
            .then(data => {
                setConfig(data);
                setLoading(false);
            })
            .catch(err => {
                console.error('Failed to load OPNsense config', err);
                // Fallback to localStorage if API fails (migration path?)
                // Or just empty. Let's try migrating once if empty? 
                // Actually, let's just stick to API. If API fails, we show empty or error.
                // But for user convenience, check localStorage if API returned empty/defaults?
                // The API returns defaults if file missing. 
                const local = localStorage.getItem('opnsense_config');
                if (local) {
                    try {
                        const parsed = JSON.parse(local);
                        // If API returned empty URL, maybe use local?
                        // Let's not overcomplicate, just load API. 
                        // If the user sees empty fields, they can re-enter. 
                        // Or we can pre-fill locally if API has empty URL.
                        if (!data.url && parsed.url) {
                            setConfig({ ...data, ...parsed });
                        }
                    } catch (e) { }
                }
                setLoading(false);
            });
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/opnsense/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });
            if (!res.ok) throw new Error('Failed to save');

            // Also update localStorage for redundancy/legacy until cleared? 
            // Better to remove it to avoid confusion later.
            localStorage.removeItem('opnsense_config');

            alert('OPNsense configuration saved to server!');
        } catch (err) {
            alert('Failed to save OPNsense config: ' + (err instanceof Error ? err.message : 'Unknown error'));
        }
        setSaving(false);
    };

    const handleTest = async () => {
        setTesting(true);
        try {
            const res = await fetch('/api/opnsense/leases', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });
            const data = await res.json();
            if (res.ok) {
                alert(`Success! Found ${data.leases?.length || 0} leases.`);
            } else {
                throw new Error(data.error);
            }
        } catch (err) {
            alert('Test failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
        }
        setTesting(false);
    };

    if (loading) return <div className="text-white p-6">Loading OPNsense settings...</div>;

    return (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                <Wifi className="text-red-500" size={24} />
                OPNsense DHCP Discovery Integration
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">OPNsense URL</label>
                        <input
                            type="text"
                            value={config.url}
                            onChange={e => setConfig({ ...config, url: e.target.value })}
                            placeholder="https://192.168.1.1"
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">DHCP Backend</label>
                        <select
                            value={config.backend}
                            onChange={e => setConfig({ ...config, backend: e.target.value })}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                        >
                            <option value="kea">Kea DHCP (Modern)</option>
                            <option value="dnsmasq">Dnsmasq (Legacy/Small)</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            id="skip_ssl_verify"
                            checked={config.skip_ssl_verify}
                            onChange={e => setConfig({ ...config, skip_ssl_verify: e.target.checked })}
                            className="w-4 h-4 bg-gray-800 border-gray-700 rounded text-red-600 focus:ring-red-500"
                        />
                        <label htmlFor="skip_ssl_verify" className="text-sm font-medium text-gray-400 cursor-pointer">
                            Skip SSL Verification (for self-signed certs)
                        </label>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">API Key</label>
                        <input
                            type="password"
                            value={config.key}
                            onChange={e => setConfig({ ...config, key: e.target.value })}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">API Secret</label>
                        <input
                            type="password"
                            value={config.secret}
                            onChange={e => setConfig({ ...config, secret: e.target.value })}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                        />
                    </div>
                </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
                <button
                    onClick={handleTest}
                    disabled={testing}
                    className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                    <RefreshCw size={18} className={testing ? 'animate-spin' : ''} />
                    {testing ? 'Testing...' : 'Test Connection'}
                </button>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                    <Save size={18} />
                    {saving ? 'Saving...' : 'Save OPNsense Config'}
                </button>
            </div>
            <p className="text-xs text-gray-500 mt-4">
                Note: Credentials are now saved on the server ({'/app/config_mount/opnsense.json'}) to persist across sessions.
            </p>
        </div>
    );
}

function ReverseDnsSettings() {
    const [config, setConfig] = useState<any>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetch('/api/adguard/config')
            .then(res => res.json())
            .then(data => setConfig(data))
            .catch(err => console.error(err));
    }, []);

    const handleSave = async () => {
        if (config.use_private_ptr_resolvers && (!config.local_ptr_upstreams || config.local_ptr_upstreams.length === 0 || (Array.isArray(config.local_ptr_upstreams) && config.local_ptr_upstreams.join('').trim() === ''))) {
            alert('Please specify at least one Private Reverse DNS Server.');
            return;
        }

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

                <div className="flex items-center justify-between">
                    <div>
                        <label className="text-white font-medium block">Use Private Reverse DNS</label>
                        <p className="text-xs text-gray-500">Use local upstream servers for reverse lookups (PTR)</p>
                    </div>
                    <input
                        type="checkbox"
                        checked={config.use_private_ptr_resolvers}
                        onChange={e => {
                            const checked = e.target.checked;
                            let newUpstreams = config.local_ptr_upstreams;
                            // Pre-fill default if enabling and empty
                            if (checked && (!newUpstreams || newUpstreams.length === 0)) {
                                newUpstreams = ['172.25.0.101'];
                            }
                            setConfig({ ...config, use_private_ptr_resolvers: checked, local_ptr_upstreams: newUpstreams })
                        }}
                        className="w-5 h-5 rounded bg-gray-800 border-gray-700 text-blue-600 focus:ring-blue-500"
                    />
                </div>

                {config.use_private_ptr_resolvers && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                        <label className="block text-sm font-medium text-white mb-2">
                            Private Reverse DNS Servers <span className="text-red-500">*</span>
                        </label>
                        <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                            <textarea
                                value={Array.isArray(config.local_ptr_upstreams) ? config.local_ptr_upstreams.join('\n') : config.local_ptr_upstreams || ''}
                                onChange={e => setConfig({ ...config, local_ptr_upstreams: e.target.value.split('\n') })}
                                rows={3}
                                placeholder="172.25.0.101"
                                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white font-mono text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                            />
                            <p className="text-xs text-gray-400 mt-2">
                                Enter the IP addresses of your private DNS servers (e.g., Technitium) that handle reverse lookups for your local network.
                                <br />Default Technitium IP: <span className="font-mono text-orange-400">172.25.0.101</span>
                            </p>
                        </div>
                    </div>
                )}

                <div className="flex justify-end pt-2">
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
