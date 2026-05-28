'use client';

import { useTranslation } from '@/lib/i18n-context';
import { useEffect, useState } from 'react';
import {
    Clock, Baby, Briefcase, Gamepad2, Moon, Plus, Trash2, Edit2,
    Play, Square, Check, X, RefreshCw, Shield, Calendar, Globe,
    ChevronDown, ChevronUp, Save
} from 'lucide-react';

// Icon mapping for profiles
const ICON_MAP: Record<string, React.ElementType> = {
    Baby, Briefcase, Gamepad2, Moon, Clock, Shield, Globe, Calendar,
};

const COLOR_MAP: Record<string, string> = {
    'text-pink-400': 'bg-pink-500/10 border-pink-500/30',
    'text-blue-400': 'bg-blue-500/10 border-blue-500/30',
    'text-green-400': 'bg-green-500/10 border-green-500/30',
    'text-indigo-400': 'bg-indigo-500/10 border-indigo-500/30',
    'text-red-400': 'bg-red-500/10 border-red-500/30',
    'text-yellow-400': 'bg-yellow-500/10 border-yellow-500/30',
    'text-purple-400': 'bg-purple-500/10 border-purple-500/30',
};

const DAY_LABELS = ['profiles.sun', 'profiles.mon', 'profiles.tue', 'profiles.wed', 'profiles.thu', 'profiles.fri', 'profiles.sat'];
const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

interface Profile {
    id: string;
    name: string;
    description: string;
    icon: string;
    color: string;
    blockedServices: string[];
    schedule: {
        timeZone: string;
        days: string[];
        start: string;
        end: string;
    };
    isActiveNow?: boolean;
}

interface AvailableService {
    id: string;
    name: string;
    icon?: string;
}

export default function ProfilesPage() {
    const { t } = useTranslation();
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [availableServices, setAvailableServices] = useState<AvailableService[]>([]);
    const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
    const [formData, setFormData] = useState<Partial<Profile>>({
        id: '',
        name: '',
        description: '',
        icon: 'Shield',
        color: 'text-blue-400',
        blockedServices: [],
        schedule: {
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            days: ['mon', 'tue', 'wed', 'thu', 'fri'],
            start: '08:00',
            end: '17:00',
        },
    });
    const [serviceFilter, setServiceFilter] = useState('');
    const [expandedServices, setExpandedServices] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [profilesRes, servicesRes, activeRes] = await Promise.all([
                fetch('/api/profiles'),
                fetch('/api/adguard/clients?services=true'),
                fetch('/api/profiles?active=true'),
            ]);

            const profilesData = await profilesRes.json();
            const servicesData = await servicesRes.json();
            const activeData = await activeRes.json();

            if (Array.isArray(profilesData)) {
                setProfiles(profilesData);
            }

            // Extract available services
            let services: AvailableService[] = [];
            if (servicesData.available && Array.isArray(servicesData.available)) {
                services = servicesData.available.map((s: any) => ({
                    id: s.id,
                    name: s.name || s.id,
                }));
            } else if (servicesData && Array.isArray(servicesData)) {
                services = servicesData.map((s: any) => ({
                    id: typeof s === 'string' ? s : s.id,
                    name: typeof s === 'string' ? s : (s.name || s.id),
                }));
            }
            setAvailableServices(services);

            if (activeData.profileId !== undefined) {
                setActiveProfileId(activeData.profileId);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load profiles');
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleActivate = async (id: string) => {
        setSaving(true);
        try {
            const res = await fetch('/api/profiles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'apply', id }),
            });
            if (!res.ok) throw new Error('Failed to activate');
            setActiveProfileId(id);
            // Refresh to get updated isActiveNow flags
            await fetchData();
        } catch (err) {
            setError(t('profiles.apply_error'));
        }
        setSaving(false);
    };

    const handleDeactivate = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/profiles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'deactivate' }),
            });
            if (!res.ok) throw new Error('Failed to deactivate');
            setActiveProfileId(null);
            await fetchData();
        } catch (err) {
            setError(t('profiles.deactivate_error'));
        }
        setSaving(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm(t('profiles.delete_confirm').replace('{0}', id))) return;
        setSaving(true);
        try {
            const res = await fetch('/api/profiles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'delete', id }),
            });
            if (!res.ok) throw new Error('Failed to delete');
            if (activeProfileId === id) setActiveProfileId(null);
            await fetchData();
        } catch (err) {
            setError(t('common.error'));
        }
        setSaving(false);
    };

    const openCreateModal = () => {
        setEditingProfile(null);
        setFormData({
            id: `custom_${Date.now()}`,
            name: '',
            description: '',
            icon: 'Shield',
            color: 'text-blue-400',
            blockedServices: [],
            schedule: {
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                days: ['mon', 'tue', 'wed', 'thu', 'fri'],
                start: '08:00',
                end: '17:00',
            },
        });
        setShowModal(true);
    };

    const openEditModal = (profile: Profile) => {
        setEditingProfile(profile);
        setFormData({ ...profile });
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!formData.id || !formData.name) return;
        setSaving(true);
        try {
            const res = await fetch('/api/profiles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: editingProfile ? 'update' : 'create',
                    profile: formData,
                }),
            });
            if (!res.ok) throw new Error('Failed to save');
            setShowModal(false);
            await fetchData();
        } catch (err) {
            setError(t('common.error'));
        }
        setSaving(false);
    };

    const toggleService = (serviceId: string) => {
        const current = formData.blockedServices || [];
        const updated = current.includes(serviceId)
            ? current.filter(id => id !== serviceId)
            : [...current, serviceId];
        setFormData({ ...formData, blockedServices: updated });
    };

    const toggleDay = (day: string) => {
        const schedule = formData.schedule || { days: [], timeZone: 'UTC', start: '08:00', end: '17:00' };
        const currentDays = schedule.days || [];
        const updatedDays = currentDays.includes(day)
            ? currentDays.filter((d: string) => d !== day)
            : [...currentDays, day];
        setFormData({
            ...formData,
            schedule: { ...schedule, days: updatedDays },
        });
    };

    const filteredServices = availableServices.filter(s =>
        s.name.toLowerCase().includes(serviceFilter.toLowerCase()) ||
        s.id.toLowerCase().includes(serviceFilter.toLowerCase())
    );

    const displayedServices = expandedServices ? filteredServices : filteredServices.slice(0, 12);

    return (
        <div className="p-4 md:p-8 space-y-6 md:space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-2">{t('profiles.title')}</h1>
                    <p className="text-gray-400 text-sm md:text-base">{t('profiles.subtitle')}</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={fetchData}
                        className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                        disabled={loading}
                    >
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button
                        onClick={openCreateModal}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                        <Plus size={18} />
                        {t('profiles.create_profile')}
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 flex items-center gap-2">
                    <X size={18} />
                    {error}
                </div>
            )}

            {/* Active Profile Banner */}
            {activeProfileId && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Play size={20} className="text-blue-400" />
                        <div>
                            <p className="text-white font-medium">
                                {t('profiles.active_now')}: {profiles.find(p => p.id === activeProfileId)?.name || activeProfileId}
                            </p>
                            <p className="text-gray-400 text-sm">
                                {profiles.find(p => p.id === activeProfileId)?.description}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleDeactivate}
                        disabled={saving}
                        className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-lg text-sm transition-colors disabled:opacity-50"
                    >
                        <Square size={14} />
                        {t('profiles.deactivate')}
                    </button>
                </div>
            )}

            {/* Profiles Grid */}
            {profiles.length === 0 && !loading ? (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
                    <Shield size={48} className="text-gray-600 mx-auto mb-4" />
                    <p className="text-white font-medium mb-2">{t('profiles.no_profiles')}</p>
                    <p className="text-gray-400 text-sm mb-6">{t('profiles.create_first')}</p>
                    <button
                        onClick={openCreateModal}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                        {t('profiles.create_profile')}
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {profiles.map(profile => {
                        const Icon = ICON_MAP[profile.icon] || Shield;
                        const isActive = activeProfileId === profile.id;
                        const isScheduled = profile.isActiveNow;
                        const colorClass = COLOR_MAP[profile.color] || 'bg-gray-800 border-gray-700';

                        return (
                            <div
                                key={profile.id}
                                className={`border rounded-xl p-5 transition-all ${colorClass} ${
                                    isActive ? 'ring-2 ring-blue-500' : ''
                                }`}
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg bg-gray-950/50 ${profile.color}`}>
                                            <Icon size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-white font-semibold">{profile.name}</h3>
                                            <p className="text-gray-400 text-xs">{profile.description}</p>
                                        </div>
                                    </div>
                                    {isActive && (
                                        <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-xs font-medium">
                                            {t('profiles.active_now')}
                                        </span>
                                    )}
                                    {isScheduled && !isActive && (
                                        <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs font-medium">
                                            {t('profiles.active_now')}
                                        </span>
                                    )}
                                </div>

                                {/* Schedule info */}
                                <div className="flex items-center gap-2 text-gray-400 text-sm mb-3">
                                    <Clock size={14} />
                                    <span>
                                        {profile.schedule.start} - {profile.schedule.end}
                                    </span>
                                    <span className="text-gray-600">•</span>
                                    <span>
                                        {profile.schedule.days.map(d => t(`profiles.${d}`)).join(', ')}
                                    </span>
                                </div>

                                {/* Blocked services count */}
                                <div className="flex items-center gap-2 text-gray-400 text-sm mb-4">
                                    <Shield size={14} />
                                    <span>
                                        {profile.blockedServices.length} {t('profiles.blocked_services')}
                                    </span>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2">
                                    {!isActive ? (
                                        <button
                                            onClick={() => handleActivate(profile.id)}
                                            disabled={saving}
                                            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                                        >
                                            <Play size={14} />
                                            {t('profiles.activate')}
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleDeactivate}
                                            disabled={saving}
                                            className="flex-1 flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                                        >
                                            <Square size={14} />
                                            {t('profiles.deactivate')}
                                        </button>
                                    )}
                                    <button
                                        onClick={() => openEditModal(profile)}
                                        className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-lg transition-colors"
                                        title={t('profiles.edit')}
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(profile.id)}
                                        disabled={saving}
                                        className="p-2 bg-gray-800 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded-lg transition-colors disabled:opacity-50"
                                        title={t('profiles.delete')}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-gray-950 border border-gray-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-800 flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-white">
                                {editingProfile ? t('profiles.edit') : t('profiles.create_profile')}
                            </h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-gray-400 hover:text-white"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Basic Info */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">{t('profiles.name')} *</label>
                                    <input
                                        type="text"
                                        value={formData.name || ''}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                                        placeholder={t('profiles.profile_custom')}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">{t('profiles.description')}</label>
                                    <input
                                        type="text"
                                        value={formData.description || ''}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            {/* Schedule */}
                            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-4">
                                <h3 className="text-white font-medium flex items-center gap-2">
                                    <Clock size={16} className="text-blue-400" />
                                    {t('profiles.schedule')}
                                </h3>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-1">{t('profiles.time_zone')}</label>
                                        <select
                                            value={formData.schedule?.timeZone || 'UTC'}
                                            onChange={e => setFormData({
                                                ...formData,
                                                schedule: { ...(formData.schedule || {}), timeZone: e.target.value } as any,
                                            })}
                                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                                        >
                                            {Intl.supportedValuesOf('timeZone').map(tz => (
                                                <option key={tz} value={tz}>{tz}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-1">{t('profiles.start_time')}</label>
                                        <input
                                            type="time"
                                            value={formData.schedule?.start || '08:00'}
                                            onChange={e => setFormData({
                                                ...formData,
                                                schedule: { ...(formData.schedule || {}), start: e.target.value } as any,
                                            })}
                                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-1">{t('profiles.end_time')}</label>
                                        <input
                                            type="time"
                                            value={formData.schedule?.end || '17:00'}
                                            onChange={e => setFormData({
                                                ...formData,
                                                schedule: { ...(formData.schedule || {}), end: e.target.value } as any,
                                            })}
                                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">{t('profiles.days')}</label>
                                    <div className="flex flex-wrap gap-2">
                                        {DAY_KEYS.map((day, idx) => (
                                            <button
                                                key={day}
                                                onClick={() => toggleDay(day)}
                                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                                    (formData.schedule?.days || []).includes(day)
                                                        ? 'bg-blue-600 text-white'
                                                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                                }`}
                                            >
                                                {t(DAY_LABELS[idx])}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Blocked Services */}
                            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-white font-medium flex items-center gap-2">
                                        <Shield size={16} className="text-red-400" />
                                        {t('profiles.blocked_services')} ({(formData.blockedServices || []).length})
                                    </h3>
                                    <input
                                        type="text"
                                        value={serviceFilter}
                                        onChange={e => setServiceFilter(e.target.value)}
                                        placeholder="Filter..."
                                        className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1 text-sm text-white w-40"
                                    />
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {displayedServices.map(service => {
                                        const isBlocked = (formData.blockedServices || []).includes(service.id);
                                        return (
                                            <button
                                                key={service.id}
                                                onClick={() => toggleService(service.id)}
                                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                                                    isBlocked
                                                        ? 'bg-red-500/10 border border-red-500/30 text-red-400'
                                                        : 'bg-gray-800 border border-gray-700 text-gray-400 hover:bg-gray-700'
                                                }`}
                                            >
                                                {isBlocked ? <Check size={14} /> : <div className="w-3.5" />}
                                                {service.name}
                                            </button>
                                        );
                                    })}
                                </div>

                                {filteredServices.length > 12 && (
                                    <button
                                        onClick={() => setExpandedServices(!expandedServices)}
                                        className="flex items-center gap-1 text-blue-400 text-sm hover:text-blue-300"
                                    >
                                        {expandedServices ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                        {expandedServices ? 'Show less' : `Show all (${filteredServices.length})`}
                                    </button>
                                )}
                            </div>

                            {/* Icon & Color */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">{t('profiles.icon')}</label>
                                    <div className="flex flex-wrap gap-2">
                                        {Object.entries(ICON_MAP).map(([name, IconComp]) => (
                                            <button
                                                key={name}
                                                onClick={() => setFormData({ ...formData, icon: name })}
                                                className={`p-2 rounded-lg transition-colors ${
                                                    formData.icon === name
                                                        ? 'bg-blue-600 text-white'
                                                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                                }`}
                                            >
                                                <IconComp size={18} />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">{t('profiles.color')}</label>
                                    <div className="flex flex-wrap gap-2">
                                        {Object.keys(COLOR_MAP).map(color => (
                                            <button
                                                key={color}
                                                onClick={() => setFormData({ ...formData, color })}
                                                className={`w-8 h-8 rounded-lg transition-all ${
                                                    formData.color === color ? 'ring-2 ring-white' : ''
                                                } ${color.replace('text-', 'bg-').replace('400', '500')}`}
                                            >
                                                {formData.color === color && <Check size={14} className="text-white mx-auto" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-800 flex justify-end gap-3">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                            >
                                {t('profiles.cancel')}
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving || !formData.name}
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                            >
                                <Save size={16} />
                                {saving ? t('common.loading') : t('profiles.save')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
