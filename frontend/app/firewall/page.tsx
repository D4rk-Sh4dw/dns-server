'use client';

import { useTranslation } from '@/lib/i18n-context';
import { useEffect, useState } from 'react';
import {
    Shield, Globe, ArrowRightLeft, Plus, Trash2, Play, Search,
    RefreshCw, ChevronUp, ChevronDown, Server, Check, X, AlertTriangle,
    ArrowUp, ArrowDown, Save
} from 'lucide-react';
import PageLayout, { PageHeader } from '../components/PageLayout';

interface ForwardRule {
    id: string;
    type: 'forward';
    domains: string[];
    servers: string[];
    raw: string;
    index: number;
}

interface RewriteRule {
    id: string;
    type: 'rewrite';
    domain: string;
    answer: string;
    recordType: string;
}

interface ClientRule {
    id: string;
    type: 'client';
    clientName: string;
    clientIds: string[];
    servers: string[];
}

interface FirewallData {
    forwardRules: ForwardRule[];
    rewriteRules: RewriteRule[];
    clientRules: ClientRule[];
    upstreams: string[];
}

export default function FirewallPage() {
    const { t } = useTranslation();
    const [data, setData] = useState<FirewallData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Modal states
    const [showForwardModal, setShowForwardModal] = useState(false);
    const [showRewriteModal, setShowRewriteModal] = useState(false);
    const [showSimulateModal, setShowSimulateModal] = useState(false);

    // Form states
    const [forwardDomains, setForwardDomains] = useState('');
    const [forwardServers, setForwardServers] = useState('');
    const [rewriteDomain, setRewriteDomain] = useState('');
    const [rewriteAnswer, setRewriteAnswer] = useState('');
    const [rewriteType, setRewriteType] = useState('A');
    const [simulateDomain, setSimulateDomain] = useState('');
    const [simulateResult, setSimulateResult] = useState<any>(null);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/firewall');
            const json = await res.json();
            if (json.error) throw new Error(json.error);
            setData(json);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load rules');
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAddForward = async () => {
        if (!forwardDomains.trim() || !forwardServers.trim()) return;
        setSaving(true);
        try {
            const res = await fetch('/api/firewall', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'addForward',
                    domains: forwardDomains.split(',').map(d => d.trim()).filter(Boolean),
                    servers: forwardServers.split(',').map(s => s.trim()).filter(Boolean),
                }),
            });
            if (!res.ok) throw new Error('Failed to add rule');
            setShowForwardModal(false);
            setForwardDomains('');
            setForwardServers('');
            await fetchData();
        } catch (err) {
            setError('Failed to add forwarding rule');
        }
        setSaving(false);
    };

    const handleRemoveForward = async (index: number) => {
        if (!confirm('Remove this forwarding rule?')) return;
        setSaving(true);
        try {
            const res = await fetch('/api/firewall', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'removeForward', index }),
            });
            if (!res.ok) throw new Error('Failed to remove');
            await fetchData();
        } catch (err) {
            setError('Failed to remove rule');
        }
        setSaving(false);
    };

    const handleAddRewrite = async () => {
        if (!rewriteDomain.trim() || !rewriteAnswer.trim()) return;
        setSaving(true);
        try {
            const res = await fetch('/api/firewall', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'addRewrite',
                    domain: rewriteDomain.trim(),
                    answer: rewriteAnswer.trim(),
                    type: rewriteType,
                }),
            });
            if (!res.ok) throw new Error('Failed to add rewrite');
            setShowRewriteModal(false);
            setRewriteDomain('');
            setRewriteAnswer('');
            setRewriteType('A');
            await fetchData();
        } catch (err) {
            setError('Failed to add rewrite rule');
        }
        setSaving(false);
    };

    const handleRemoveRewrite = async (rule: RewriteRule) => {
        if (!confirm(`Remove rewrite for ${rule.domain}?`)) return;
        setSaving(true);
        try {
            const res = await fetch('/api/firewall', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'removeRewrite',
                    domain: rule.domain,
                    answer: rule.answer,
                    type: rule.recordType,
                }),
            });
            if (!res.ok) throw new Error('Failed to remove');
            await fetchData();
        } catch (err) {
            setError('Failed to remove rewrite');
        }
        setSaving(false);
    };

    const handleSimulate = async () => {
        if (!simulateDomain.trim()) return;
        setSaving(true);
        try {
            const res = await fetch('/api/firewall', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'simulate', domain: simulateDomain.trim() }),
            });
            const json = await res.json();
            if (json.error) throw new Error(json.error);
            setSimulateResult(json.result);
        } catch (err) {
            setError('Simulation failed');
        }
        setSaving(false);
    };

    const moveRule = async (index: number, direction: 'up' | 'down') => {
        if (!data) return;
        const newUpstreams = [...data.upstreams];
        if (direction === 'up' && index > 0) {
            [newUpstreams[index], newUpstreams[index - 1]] = [newUpstreams[index - 1], newUpstreams[index]];
        } else if (direction === 'down' && index < newUpstreams.length - 1) {
            [newUpstreams[index], newUpstreams[index + 1]] = [newUpstreams[index + 1], newUpstreams[index]];
        }
        setSaving(true);
        try {
            const res = await fetch('/api/firewall', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'reorder', rules: newUpstreams }),
            });
            if (!res.ok) throw new Error('Failed to reorder');
            await fetchData();
        } catch (err) {
            setError('Failed to reorder rules');
        }
        setSaving(false);
    };

    return (
        <PageLayout
            header={
                <PageHeader
                    icon={<Shield className="text-blue-400" size={22} />}
                    title="DNS Firewall Rules"
                    subtitle="Manage conditional forwarding and DNS rewrites."
                    actions={
                        <>
                            <button
                                onClick={() => setShowSimulateModal(true)}
                                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
                            >
                                <Play size={14} />
                                Simulate
                            </button>
                            <button
                                onClick={fetchData}
                                className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                                disabled={loading}
                            >
                                <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                            </button>
                        </>
                    }
                />
            }
        >
            <div className="space-y-6 md:space-y-8">

            {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 flex items-center gap-2">
                    <X size={18} /> {error}
                </div>
            )}

            {/* Conditional Forwarding Rules */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
                    <div className="flex items-center gap-2">
                        <ArrowRightLeft size={16} className="text-blue-400" />
                        <h2 className="text-white font-medium">Conditional Forwarding</h2>
                        <span className="text-xs text-gray-500">({data?.forwardRules.length || 0} rules)</span>
                    </div>
                    <button
                        onClick={() => setShowForwardModal(true)}
                        className="flex items-center gap-1 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-sm transition-colors"
                    >
                        <Plus size={14} /> Add Rule
                    </button>
                </div>

                <div className="divide-y divide-gray-800">
                    {data?.forwardRules.map((rule, idx) => (
                        <div key={rule.id} className="px-4 py-3 flex items-center gap-3 hover:bg-gray-800/30">
                            <div className="flex flex-col gap-1">
                                <button
                                    onClick={() => moveRule(rule.index, 'up')}
                                    disabled={idx === 0 || saving}
                                    className="text-gray-600 hover:text-gray-400 disabled:opacity-30"
                                >
                                    <ChevronUp size={14} />
                                </button>
                                <button
                                    onClick={() => moveRule(rule.index, 'down')}
                                    disabled={idx === (data?.forwardRules.length || 0) - 1 || saving}
                                    className="text-gray-600 hover:text-gray-400 disabled:opacity-30"
                                >
                                    <ChevronDown size={14} />
                                </button>
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    {rule.domains.map(d => (
                                        <span key={d} className="px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded text-xs font-medium">
                                            {d}
                                        </span>
                                    ))}
                                    <span className="text-gray-500 text-xs">→</span>
                                    {rule.servers.map(s => (
                                        <span key={s} className="px-2 py-0.5 bg-gray-800 text-gray-300 rounded text-xs">
                                            {s}
                                        </span>
                                    ))}
                                </div>
                                <p className="text-gray-600 text-xs mt-1 font-mono truncate">{rule.raw}</p>
                            </div>

                            <button
                                onClick={() => handleRemoveForward(rule.index)}
                                disabled={saving}
                                className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}

                    {(!data || data.forwardRules.length === 0) && (
                        <div className="px-4 py-8 text-center text-gray-500">
                            <Globe size={24} className="mx-auto mb-2 text-gray-700" />
                            <p>No conditional forwarding rules configured.</p>
                            <p className="text-sm mt-1">Add a rule to forward specific domains to custom DNS servers.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Client Upstream Rules */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
                    <div className="flex items-center gap-2">
                        <Server size={16} className="text-orange-400" />
                        <h2 className="text-white font-medium">Client Upstream Rules</h2>
                        <span className="text-xs text-gray-500">({data?.clientRules.length || 0} rules)</span>
                    </div>
                </div>

                <div className="divide-y divide-gray-800">
                    {data?.clientRules.map((rule) => (
                        <div key={rule.id} className="px-4 py-3 flex items-center gap-3 hover:bg-gray-800/30">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="px-2 py-0.5 bg-orange-500/10 text-orange-400 rounded text-xs font-medium">
                                        {rule.clientName}
                                    </span>
                                    <span className="text-gray-500 text-xs">({rule.clientIds.join(', ')})</span>
                                    <span className="text-gray-500 text-xs">→</span>
                                    {rule.servers.map(s => (
                                        <span key={s} className="px-2 py-0.5 bg-gray-800 text-gray-300 rounded text-xs">
                                            {s}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}

                    {(!data || data.clientRules.length === 0) && (
                        <div className="px-4 py-8 text-center text-gray-500">
                            <Server size={24} className="mx-auto mb-2 text-gray-700" />
                            <p>No client-specific upstream rules configured.</p>
                            <p className="text-sm mt-1">Configure per-client upstreams in AdGuard Home Clients settings.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* DNS Rewrites */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
                    <div className="flex items-center gap-2">
                        <Shield size={16} className="text-green-400" />
                        <h2 className="text-white font-medium">DNS Rewrites</h2>
                        <span className="text-xs text-gray-500">({data?.rewriteRules.length || 0} rules)</span>
                    </div>
                    <button
                        onClick={() => setShowRewriteModal(true)}
                        className="flex items-center gap-1 bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded-lg text-sm transition-colors"
                    >
                        <Plus size={14} /> Add Rewrite
                    </button>
                </div>

                <div className="divide-y divide-gray-800">
                    {data?.rewriteRules.map((rule) => (
                        <div key={rule.id} className="px-4 py-3 flex items-center gap-3 hover:bg-gray-800/30">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="px-2 py-0.5 bg-green-500/10 text-green-400 rounded text-xs font-medium">
                                        {rule.recordType}
                                    </span>
                                    <span className="text-blue-300 text-sm">{rule.domain}</span>
                                    <span className="text-gray-500">→</span>
                                    <span className="text-gray-300 text-sm">{rule.answer}</span>
                                </div>
                            </div>

                            <button
                                onClick={() => handleRemoveRewrite(rule)}
                                disabled={saving}
                                className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}

                    {(!data || data.rewriteRules.length === 0) && (
                        <div className="px-4 py-8 text-center text-gray-500">
                            <Shield size={24} className="mx-auto mb-2 text-gray-700" />
                            <p>No DNS rewrites configured.</p>
                            <p className="text-sm mt-1">Add a rewrite to return custom answers for specific domains.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Add Forward Modal */}
            {showForwardModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-gray-950 border border-gray-800 rounded-xl w-full max-w-lg">
                        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                            <h3 className="text-white font-medium">Add Conditional Forwarding Rule</h3>
                            <button onClick={() => setShowForwardModal(false)} className="text-gray-400 hover:text-white"><X size={18} /></button>
                        </div>
                        <div className="p-4 space-y-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Domains (comma-separated)</label>
                                <input
                                    type="text"
                                    value={forwardDomains}
                                    onChange={e => setForwardDomains(e.target.value)}
                                    placeholder="example.com, sub.example.com"
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                                />
                                <p className="text-xs text-gray-500 mt-1">Use *.example.com for wildcards</p>
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">DNS Servers (comma-separated)</label>
                                <input
                                    type="text"
                                    value={forwardServers}
                                    onChange={e => setForwardServers(e.target.value)}
                                    placeholder="1.1.1.1, 8.8.8.8"
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                                />
                            </div>
                        </div>
                        <div className="p-4 border-t border-gray-800 flex justify-end gap-2">
                            <button onClick={() => setShowForwardModal(false)} className="px-4 py-2 text-gray-400 hover:text-white">Cancel</button>
                            <button
                                onClick={handleAddForward}
                                disabled={saving || !forwardDomains.trim() || !forwardServers.trim()}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg disabled:opacity-50"
                            >
                                {saving ? 'Saving...' : 'Add Rule'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Rewrite Modal */}
            {showRewriteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-gray-950 border border-gray-800 rounded-xl w-full max-w-lg">
                        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                            <h3 className="text-white font-medium">Add DNS Rewrite</h3>
                            <button onClick={() => setShowRewriteModal(false)} className="text-gray-400 hover:text-white"><X size={18} /></button>
                        </div>
                        <div className="p-4 space-y-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Domain</label>
                                <input
                                    type="text"
                                    value={rewriteDomain}
                                    onChange={e => setRewriteDomain(e.target.value)}
                                    placeholder="example.local"
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Answer</label>
                                    <input
                                        type="text"
                                        value={rewriteAnswer}
                                        onChange={e => setRewriteAnswer(e.target.value)}
                                        placeholder="192.168.1.10"
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Record Type</label>
                                    <select
                                        value={rewriteType}
                                        onChange={e => setRewriteType(e.target.value)}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                                    >
                                        <option value="A">A (IPv4)</option>
                                        <option value="AAAA">AAAA (IPv6)</option>
                                        <option value="CNAME">CNAME</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 border-t border-gray-800 flex justify-end gap-2">
                            <button onClick={() => setShowRewriteModal(false)} className="px-4 py-2 text-gray-400 hover:text-white">Cancel</button>
                            <button
                                onClick={handleAddRewrite}
                                disabled={saving || !rewriteDomain.trim() || !rewriteAnswer.trim()}
                                className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg disabled:opacity-50"
                            >
                                {saving ? 'Saving...' : 'Add Rewrite'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Simulate Modal */}
            {showSimulateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-gray-950 border border-gray-800 rounded-xl w-full max-w-lg">
                        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                            <h3 className="text-white font-medium">Simulate DNS Query</h3>
                            <button onClick={() => { setShowSimulateModal(false); setSimulateResult(null); }} className="text-gray-400 hover:text-white"><X size={18} /></button>
                        </div>
                        <div className="p-4 space-y-4">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={simulateDomain}
                                    onChange={e => setSimulateDomain(e.target.value)}
                                    placeholder="Enter domain to test..."
                                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                                    onKeyDown={e => e.key === 'Enter' && handleSimulate()}
                                />
                                <button
                                    onClick={handleSimulate}
                                    disabled={saving || !simulateDomain.trim()}
                                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg disabled:opacity-50"
                                >
                                    <Play size={16} />
                                </button>
                            </div>

                            {simulateResult && (
                                <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-400 text-sm">Domain:</span>
                                        <span className="text-white">{simulateDomain}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-400 text-sm">Reason:</span>
                                        <span className={`text-sm font-medium ${
                                            simulateResult.reason === 'NotFilteredNotFound' ? 'text-green-400' :
                                            simulateResult.reason === 'FilteredBlackList' ? 'text-red-400' :
                                            'text-yellow-400'
                                        }`}>
                                            {simulateResult.reason}
                                        </span>
                                    </div>
                                    {simulateResult.rules && simulateResult.rules.length > 0 && (
                                        <div>
                                            <span className="text-gray-400 text-sm">Matched Rules:</span>
                                            <div className="mt-1 space-y-1">
                                                {simulateResult.rules.map((r: any, i: number) => (
                                                    <div key={i} className="text-xs text-gray-300 bg-gray-800 rounded px-2 py-1">
                                                        {r.text} {r.filter_list_id && `(List #${r.filter_list_id})`}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {simulateResult.cname && (
                                        <div className="text-sm text-gray-300">
                                            CNAME: {simulateResult.cname}
                                        </div>
                                    )}
                                    {simulateResult.service_name && (
                                        <div className="text-sm text-gray-300">
                                            Service: {simulateResult.service_name}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
            </div>
        </PageLayout>
    );
}
