'use client';

import { useEffect, useState } from 'react';
import {
    Users, Plus, Trash2, Edit2, Shield,
    ShieldCheck, Baby, Search, Check, X,
    Laptop, Tablet, Smartphone, Tv, Cpu, Info, Globe
} from 'lucide-react';

interface AdGuardClient {
    name: string;
    ids: string[];
    use_global_settings: boolean;
    filtering_enabled: boolean;
    parental_enabled: boolean;
    safebrowsing_enabled: boolean;
    safesearch_enabled: boolean;
    use_global_blocked_services: boolean;
    blocked_services: string[];
    upstreams: string[];
    tags?: string[];
}

export default function ClientsPage() {
    const [clients, setClients] = useState<AdGuardClient[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingClient, setEditingClient] = useState<string | null>(null);
    const [formData, setFormData] = useState<AdGuardClient>({
        name: '',
        ids: [],
        use_global_settings: true,
        filtering_enabled: true,
        parental_enabled: false,
        safebrowsing_enabled: true,
        safesearch_enabled: false,
        use_global_blocked_services: true,
        blocked_services: [],
        upstreams: []
    });

    const [availableServices, setAvailableServices] = useState<string[]>([]);
    const [idInput, setIdInput] = useState('');
    const [serviceSearch, setServiceSearch] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [customRules, setCustomRules] = useState<string[]>([]);
    const [whitelistInput, setWhitelistInput] = useState('');

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [clientsRes, servicesRes, filteringRes] = await Promise.all([
                fetch('/api/adguard/clients'),
                fetch('/api/adguard/clients?services=true'),
                fetch('/api/adguard/filtering')
            ]);

            if (!clientsRes.ok) {
                const errData = await clientsRes.json().catch(() => ({}));
                throw new Error(errData.error || 'Failed to fetch clients');
            }

            const clientsData = await clientsRes.json();
            setClients(clientsData.clients || []);

            // Services endpoint might fail but shouldn't block clients display
            if (servicesRes.ok) {
                const servicesData = await servicesRes.json();
                setAvailableServices(Array.isArray(servicesData) ? servicesData : []);
            }

            if (filteringRes.ok) {
                const filteringData = await filteringRes.json();
                setCustomRules(filteringData.user_rules || []);
            }
        } catch (err) {
            console.error('Failed to fetch data:', err);
            setError(err instanceof Error ? err.message : 'Failed to connect to AdGuard');
        }
        setLoading(false);
    };

    useEffect(() => { fetchData(); }, []);

    const handleSubmit = async () => {
        if (!formData.name || formData.ids.length === 0) {
            alert('Please provide a name and at least one Identifier (IP/MAC/CIDR)');
            return;
        }

        try {
            const res = await fetch('/api/adguard/clients', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: editingClient ? 'update' : 'add',
                    oldName: editingClient,
                    client: formData
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setShowModal(false);
            setEditingClient(null);
            resetForm();
            await fetchData();
        } catch (err) {
            alert(`Error: ${err instanceof Error ? err.message : 'Operation failed'}`);
        }
    };

    const handleDelete = async (name: string) => {
        if (!confirm(`Delete client "${name}"?`)) return;

        try {
            const res = await fetch('/api/adguard/clients', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'delete', name }),
            });
            await fetchData();
        } catch (err) {
            console.error('Delete failed:', err);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            ids: [],
            use_global_settings: true,
            filtering_enabled: true,
            parental_enabled: false,
            safebrowsing_enabled: true,
            safesearch_enabled: false,
            use_global_blocked_services: true,
            blocked_services: [],
            upstreams: [],
            tags: []
        });
        setIdInput('');
        setServiceSearch('');
    };

    const handleEdit = (client: AdGuardClient) => {
        setEditingClient(client.name);
        setFormData({ ...client, tags: client.tags || [], blocked_services: client.blocked_services || [] });
        setShowModal(true);
    };

    const filteredClients = clients.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.ids.some(id => id.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const filteredServices = availableServices.filter(s =>
        s.toLowerCase().includes(serviceSearch.toLowerCase())
    );

    return (
        <div className="p-4 md:p-8 space-y-6 md:space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-2">Client Management</h1>
                    <p className="text-gray-400 text-sm md:text-base">Configure per-device DNS policies and protection settings.</p>
                </div>
                <button
                    onClick={() => { resetForm(); setShowModal(true); }}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-blue-500/50 shadow-lg shadow-blue-900/20"
                >
                    <Plus size={18} />
                    Add Client
                </button>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                    <input
                        type="text"
                        placeholder="Search by name or IP/MAC address..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                    />
                </div>
            </div>

            {error ? (
                <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-6 text-center">
                    <p className="text-red-400 mb-2">Failed to load clients</p>
                    <p className="text-gray-500 text-sm">{error}</p>
                    <button
                        onClick={() => fetchData()}
                        className="mt-4 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-sm transition-colors"
                    >
                        Retry
                    </button>
                </div>
            ) : loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 h-64 animate-pulse" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredClients.map((client) => (
                        <ClientCard
                            key={client.name}
                            client={client}
                            onEdit={() => handleEdit(client)}
                            onDelete={() => handleDelete(client.name)}
                        />
                    ))}
                    {filteredClients.length === 0 && (
                        <div className="col-span-full py-20 text-center text-gray-500 bg-gray-900/50 border-2 border-dashed border-gray-800 rounded-2xl">
                            <Users size={48} className="mx-auto mb-4 opacity-10" />
                            <p className="text-xl font-medium text-gray-400">No clients found</p>
                            <p className="text-sm mt-1">Try a different search or add a new client.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-6xl my-auto shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-900/50">
                            <h3 className="text-xl font-semibold text-white">
                                {editingClient ? 'Edit Client' : 'Add New Client'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-8 overflow-y-auto flex-1 space-y-8">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Left Column: Basic Info & IDs */}
                                <div className="space-y-6">
                                    <section>
                                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Basic Information</h4>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-400 mb-1.5">Client Name</label>
                                                <input
                                                    type="text"
                                                    value={formData.name}
                                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                                    placeholder="e.g. My Laptop"
                                                    autoFocus
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-400 mb-1.5">Identifiers (IP, MAC, CIDR)</label>
                                                <div className="flex gap-2 mb-3">
                                                    <input
                                                        type="text"
                                                        value={idInput}
                                                        onChange={(e) => setIdInput(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter' && idInput) {
                                                                e.preventDefault();
                                                                setFormData({ ...formData, ids: [...new Set([...formData.ids, idInput])] });
                                                                setIdInput('');
                                                            }
                                                        }}
                                                        className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
                                                        placeholder="192.168.1.10"
                                                    />
                                                    <button
                                                        onClick={() => { if (idInput) { setFormData({ ...formData, ids: [...new Set([...formData.ids, idInput])] }); setIdInput(''); } }}
                                                        className="bg-gray-800 hover:bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-700 transition-colors"
                                                    >
                                                        <Plus size={18} />
                                                    </button>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {formData.ids.map(id => (
                                                        <span key={id} className="bg-blue-500/10 text-blue-400 px-2 py-1 rounded border border-blue-500/20 text-xs font-mono flex items-center gap-1.5 transition-colors group">
                                                            {id}
                                                            <button onClick={() => setFormData({ ...formData, ids: formData.ids.filter(i => i !== id) })} className="text-blue-500/40 hover:text-red-400">
                                                                <X size={12} />
                                                            </button>
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-400 mb-1.5">Tags</label>
                                                <div className="flex gap-2 mb-3">
                                                    <select
                                                        value=""
                                                        onChange={(e) => {
                                                            if (e.target.value) {
                                                                setFormData({ ...formData, tags: [...new Set([...(formData.tags || []), e.target.value])] });
                                                            }
                                                        }}
                                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500 appearance-none cursor-pointer"
                                                    >
                                                        <option value="" disabled>Select tag...</option>
                                                        <optgroup label="Devices">
                                                            <option value="device_phone">Phone</option>
                                                            <option value="device_tablet">Tablet</option>
                                                            <option value="device_laptop">Laptop</option>
                                                            <option value="device_pc">PC</option>
                                                            <option value="device_tv">TV</option>
                                                            <option value="device_gameconsole">Game Console</option>
                                                            <option value="device_camera">Camera</option>
                                                            <option value="device_printer">Printer</option>
                                                            <option value="device_audio">Audio</option>
                                                            <option value="device_nas">NAS</option>
                                                            <option value="device_other">Other Device</option>
                                                        </optgroup>
                                                        <optgroup label="Users">
                                                            <option value="user_admin">Admin</option>
                                                            <option value="user_regular">Regular User</option>
                                                            <option value="user_kids">Kids</option>
                                                            <option value="user_guest">Guest</option>
                                                        </optgroup>
                                                    </select>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {(formData.tags || []).map(tag => (
                                                        <span key={tag} className="bg-gray-800 text-gray-400 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 border border-gray-700 group hover:border-gray-500 transition-colors">
                                                            {tag}
                                                            <button onClick={() => setFormData({ ...formData, tags: (formData.tags || []).filter(t => t !== tag) })} className="hover:text-red-400">
                                                                <X size={12} />
                                                            </button>
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </section>

                                    <section>
                                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Protection Settings</h4>
                                        <div className="bg-gray-950/30 rounded-2xl p-5 space-y-5 border border-gray-800">
                                            <SimpleSwitch
                                                label="Global Settings"
                                                description="Inherit from server-wide rules"
                                                checked={formData.use_global_settings}
                                                onChange={(v) => setFormData({ ...formData, use_global_settings: v })}
                                            />
                                            {!formData.use_global_settings && (
                                                <div className="space-y-4 pt-4 border-t border-gray-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <SimpleSwitch label="DNS Filtering" checked={formData.filtering_enabled} onChange={(v) => setFormData({ ...formData, filtering_enabled: v })} />
                                                    <SimpleSwitch label="Safe Browsing" checked={formData.safebrowsing_enabled} onChange={(v) => setFormData({ ...formData, safebrowsing_enabled: v })} />
                                                    <SimpleSwitch label="Parental Control" checked={formData.parental_enabled} onChange={(v) => setFormData({ ...formData, parental_enabled: v })} />
                                                    <SimpleSwitch label="Safe Search" checked={formData.safesearch_enabled} onChange={(v) => setFormData({ ...formData, safesearch_enabled: v })} />
                                                </div>
                                            )}
                                        </div>
                                    </section>

                                    <section>
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Client Whitelist</h4>
                                        </div>
                                        <div className="bg-gray-950/30 rounded-2xl p-5 border border-gray-800 space-y-4">
                                            <div className="text-xs text-gray-500 italic mb-2">
                                                Domains allowed specifically for this client (AdGuard User Rules).
                                            </div>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={whitelistInput}
                                                    onChange={(e) => setWhitelistInput(e.target.value)}
                                                    onKeyDown={async (e) => {
                                                        if (e.key === 'Enter' && whitelistInput && editingClient) {
                                                            e.preventDefault();
                                                            const domain = whitelistInput.trim();
                                                            const rule = `@@||${domain}^$client='${editingClient}'`;
                                                            try {
                                                                await fetch('/api/adguard/filtering', {
                                                                    method: 'POST',
                                                                    headers: { 'Content-Type': 'application/json' },
                                                                    body: JSON.stringify({ action: 'addRule', rule })
                                                                });
                                                                setCustomRules([...customRules, rule]);
                                                                setWhitelistInput('');
                                                            } catch (err) {
                                                                console.error('Failed to add rule', err);
                                                            }
                                                        }
                                                    }}
                                                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
                                                    placeholder="example.com"
                                                />
                                                <button
                                                    disabled={!whitelistInput || !editingClient}
                                                    onClick={async () => {
                                                        if (whitelistInput && editingClient) {
                                                            const domain = whitelistInput.trim();
                                                            const rule = `@@||${domain}^$client='${editingClient}'`;
                                                            try {
                                                                await fetch('/api/adguard/filtering', {
                                                                    method: 'POST',
                                                                    headers: { 'Content-Type': 'application/json' },
                                                                    body: JSON.stringify({ action: 'addRule', rule })
                                                                });
                                                                setCustomRules([...customRules, rule]);
                                                                setWhitelistInput('');
                                                            } catch (err) {
                                                                console.error('Failed to add rule', err);
                                                            }
                                                        }
                                                    }}
                                                    className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-2 rounded-lg transition-colors"
                                                >
                                                    <Plus size={18} />
                                                </button>
                                            </div>
                                            <div className="space-y-2 max-h-[150px] overflow-y-auto pr-1 custom-scrollbar">
                                                {customRules
                                                    .filter(r => editingClient && r.includes(`$client='${editingClient}'`) && r.startsWith('@@||'))
                                                    .map(rule => {
                                                        const domain = rule.replace('@@||', '').split('^')[0];
                                                        return (
                                                            <div key={rule} className="flex items-center justify-between bg-gray-800/50 px-3 py-2 rounded-lg border border-gray-700/50 group">
                                                                <span className="text-xs font-mono text-green-400">{domain}</span>
                                                                <button
                                                                    onClick={async () => {
                                                                        try {
                                                                            await fetch('/api/adguard/filtering', {
                                                                                method: 'POST',
                                                                                headers: { 'Content-Type': 'application/json' },
                                                                                body: JSON.stringify({ action: 'removeRule', rule })
                                                                            });
                                                                            setCustomRules(customRules.filter(r => r !== rule));
                                                                        } catch (err) {
                                                                            console.error('Failed to remove rule', err);
                                                                        }
                                                                    }}
                                                                    className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </div>
                                                        );
                                                    })}
                                                {editingClient && customRules.filter(r => r.includes(`$client='${editingClient}'`) && r.startsWith('@@||')).length === 0 && (
                                                    <div className="text-center text-gray-600 text-[10px] py-2">
                                                        No custom whitelisted domains for this client.
                                                    </div>
                                                )}
                                                {!editingClient && (
                                                    <div className="text-center text-gray-500 text-[10px] py-2">
                                                        Please create the client first to add specific rules.
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </section>
                                </div>

                                {/* Right Column: Blocked Services */}
                                <div className="space-y-6">
                                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center justify-between">
                                        Blocked Services
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-normal lowercase tracking-normal bg-gray-800 px-2 py-0.5 rounded italic">Services matching server-wide rules are blocked by default</span>
                                        </div>
                                    </h4>

                                    <div className="bg-gray-950/30 rounded-2xl p-5 border border-gray-800 space-y-4">
                                        <SimpleSwitch
                                            label="Use Global Blocked Services"
                                            description="Use server-wide blocked services list"
                                            checked={formData.use_global_blocked_services}
                                            onChange={(v) => setFormData({ ...formData, use_global_blocked_services: v })}
                                        />

                                        {!formData.use_global_blocked_services && (
                                            <div className="pt-4 border-t border-gray-800 space-y-4">
                                                <div className="flex gap-2">
                                                    <div className="relative flex-1">
                                                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                                        <input
                                                            type="text"
                                                            placeholder="Search services..."
                                                            value={serviceSearch}
                                                            onChange={(e) => setServiceSearch(e.target.value)}
                                                            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                                                        />
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const current = formData.blocked_services || [];
                                                            const toBlock = filteredServices.filter(s => !current.includes(s));
                                                            setFormData({ ...formData, blocked_services: [...current, ...toBlock] });
                                                        }}
                                                        className="px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-xs font-medium text-gray-300 transition-colors whitespace-nowrap"
                                                        title="Block all visible services"
                                                    >
                                                        Block All
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const current = formData.blocked_services || [];
                                                            // Remove observable services from blocklist
                                                            setFormData({
                                                                ...formData,
                                                                blocked_services: current.filter(s => !filteredServices.includes(s))
                                                            });
                                                        }}
                                                        className="px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-xs font-medium text-gray-300 transition-colors whitespace-nowrap"
                                                        title="Unblock all visible services"
                                                    >
                                                        Unblock All
                                                    </button>
                                                </div>
                                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar p-1">
                                                    {filteredServices.length === 0 ? (
                                                        <div className="col-span-full py-12 text-center text-gray-500 text-xs italic flex flex-col items-center justify-center gap-2">
                                                            <div className="bg-gray-800/50 p-3 rounded-full">
                                                                <Globe size={24} className="opacity-20" />
                                                            </div>
                                                            {availableServices.length === 0
                                                                ? "No services available. Check connection."
                                                                : "No services found."}
                                                        </div>
                                                    ) : (
                                                        filteredServices.map(service => {
                                                            const isBlocked = (formData.blocked_services || []).includes(service);
                                                            const iconSlug = service.toLowerCase().replace(/_/g, '');
                                                            return (
                                                                <button
                                                                    key={service}
                                                                    onClick={() => {
                                                                        const current = formData.blocked_services || [];
                                                                        const next = isBlocked
                                                                            ? current.filter(s => s !== service)
                                                                            : [...current, service];
                                                                        setFormData({ ...formData, blocked_services: next });
                                                                    }}
                                                                    className={`relative group p-3 rounded-xl text-center transition-all border flex flex-col items-center justify-center gap-2 h-24 ${isBlocked
                                                                        ? 'bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20'
                                                                        : 'bg-gray-800/50 text-gray-400 border-gray-700/50 hover:border-gray-600 hover:bg-gray-800 hover:text-white'
                                                                        }`}
                                                                >
                                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 ${isBlocked ? 'bg-red-500/20' : 'bg-gray-700/50'}`}>
                                                                        <img
                                                                            src={`https://cdn.simpleicons.org/${iconSlug}/${isBlocked ? 'ff8888' : '9ca3af'}`}
                                                                            alt=""
                                                                            className="w-5 h-5"
                                                                            onError={(e) => {
                                                                                (e.target as HTMLImageElement).style.display = 'none';
                                                                                (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                                                            }}
                                                                        />
                                                                        <Globe size={16} className={`hidden absolute ${isBlocked ? 'text-red-400' : 'text-gray-500'}`} />
                                                                    </div>
                                                                    <span className="text-[10px] font-medium leading-tight line-clamp-2 w-full">
                                                                        {service.charAt(0).toUpperCase() + service.slice(1).replace(/_/g, ' ')}
                                                                    </span>
                                                                    {isBlocked && (
                                                                        <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
                                                                    )}
                                                                </button>
                                                            );
                                                        })
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-800 flex justify-end gap-3 bg-gray-900/50">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-5 py-2 text-gray-400 hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-blue-900/40 transition-all active:scale-95 border border-blue-400/50"
                            >
                                {editingClient ? 'Update Client' : 'Add Client'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function SimpleSwitch({ label, description, checked, onChange }: { label: string; description?: string; checked: boolean; onChange: (v: boolean) => void }) {
    return (
        <div className="flex items-center justify-between">
            <div>
                <div className="text-sm font-medium text-white">{label}</div>
                {description && <div className="text-xs text-gray-500">{description}</div>}
            </div>
            <button
                onClick={() => onChange(!checked)}
                className={`w-10 h-5 rounded-full relative transition-colors ${checked ? 'bg-blue-600' : 'bg-gray-700'}`}
            >
                <div className={`absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-transform ${checked ? 'translate-x-5' : ''}`} />
            </button>
        </div>
    );
}

function ClientCard({ client, onEdit, onDelete }: { client: AdGuardClient; onEdit: () => void; onDelete: () => void }) {
    const getIcon = (name: string) => {
        const n = name.toLowerCase();
        if (n.includes('mac') || n.includes('pc') || n.includes('laptop')) return Laptop;
        if (n.includes('phone') || n.includes('iphone') || n.includes('samsung')) return Smartphone;
        if (n.includes('tablet') || n.includes('ipad')) return Tablet;
        if (n.includes('tv') || n.includes('shield')) return Tv;
        return Cpu;
    };

    const StatusIcon = getIcon(client.name);

    return (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-gray-700 transition-all group shadow-sm flex flex-col h-full">
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-gray-800 rounded-xl text-blue-400 group-hover:scale-110 transition-transform">
                        <StatusIcon size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">
                            {client.name}
                        </h3>
                        <div className="flex flex-wrap gap-1 mt-1">
                            {client.ids.slice(0, 2).map(id => (
                                <span key={id} className="text-[10px] font-mono text-gray-500 bg-gray-950 px-1.5 py-0.5 rounded">
                                    {id}
                                </span>
                            ))}
                            {client.ids.length > 2 && (
                                <span className="text-[10px] text-gray-600">+{client.ids.length - 2} more</span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={onEdit} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg">
                        <Edit2 size={16} />
                    </button>
                    <button onClick={onDelete} className="p-2 text-red-500 hover:text-red-400 hover:bg-red-900/10 rounded-lg">
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-6">
                {client.tags?.map(tag => (
                    <span key={tag} className="text-[9px] font-bold uppercase tracking-wider bg-gray-800 text-gray-400 px-2 py-0.5 rounded border border-gray-700">
                        {tag}
                    </span>
                ))}
                {!client.use_global_blocked_services && client.blocked_services && client.blocked_services.length > 0 && (
                    <span className="text-[9px] font-bold uppercase tracking-wider bg-red-500/10 text-red-500 px-2 py-0.5 rounded border border-red-500/20">
                        {client.blocked_services.length} Services Blocked
                    </span>
                )}
            </div>

            <div className="mt-auto pt-6 border-t border-gray-800/50 flex items-center justify-between">
                <div className="flex gap-3">
                    <ProtectionIndicator active={client.filtering_enabled || client.use_global_settings} icon={Shield} color="text-blue-400" label="Filt" />
                    <ProtectionIndicator active={client.safebrowsing_enabled || client.use_global_settings} icon={ShieldCheck} color="text-green-400" label="Safe" />
                    <ProtectionIndicator active={client.parental_enabled} icon={Baby} color="text-pink-400" label="Kids" />
                </div>
                {client.use_global_settings && (
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-600 bg-gray-800/50 px-2 py-0.5 rounded">Global</span>
                )}
            </div>
        </div>
    );
}

function ProtectionIndicator({ active, icon: Icon, color, label }: any) {
    return (
        <div className={`flex items-center gap-1 ${active ? color : 'text-gray-700'} transition-colors`} title={`${label}: ${active ? 'Active' : 'Disabled'}`}>
            <Icon size={14} />
            <span className="text-[10px] font-bold uppercase">{label}</span>
        </div>
    );
}
