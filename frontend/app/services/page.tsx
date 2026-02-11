'use client';

import { useTranslation } from '@/lib/i18n-context';

import { useEffect, useState } from 'react';
import { RefreshCw, Clock, Save, ShieldOff } from 'lucide-react';
import { POPULAR_SERVICES, ServiceDefinition } from '../../config/services';

function Switch({ checked }: { checked: boolean }) {
    return (
        <div className={`w-11 h-6 rounded-full relative transition-colors flex-shrink-0 ${checked ? 'bg-red-500' : 'bg-gray-600'}`}>
            <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${checked ? 'translate-x-5' : ''}`} />
        </div>
    );
}

export default function ServicesPage() {
    const { t } = useTranslation();
    const [availableServices, setAvailableServices] = useState<any[]>([]);
    const [blockedServices, setBlockedServices] = useState<string[]>([]);
    const [schedule, setSchedule] = useState<any>({});

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [scheduleSaving, setScheduleSaving] = useState(false);
    const [filter, setFilter] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            const [servicesRes, scheduleRes] = await Promise.all([
                fetch('/api/adguard/services'),
                fetch('/api/adguard/services/schedule')
            ]);

            const servicesData = await servicesRes.json();
            const scheduleData = await scheduleRes.json();

            // Set blocked list
            const blocked = Array.isArray(servicesData.blocked) ? servicesData.blocked : [];
            setBlockedServices(blocked);

            // Normalize and validates available services
            const rawAvailable = Array.isArray(servicesData.available) ? servicesData.available : [];
            const validAvailable = rawAvailable.filter((s: any) => s && typeof s === 'object' && s.id && s.name);
            setAvailableServices(validAvailable);

            // Set schedule
            setSchedule(scheduleData || {});
        } catch (err) {
            console.error('Failed to fetch data:', err);
            // Ensure we don't leave loading state hanging if fetch fails
            setBlockedServices([]);
            setAvailableServices([]);
        }
        setLoading(false);
    };

    useEffect(() => { fetchData(); }, []);

    // Helper functions for time conversion
    const msToTime = (ms?: number | string) => {
        if (ms === undefined || ms === null) return '';
        // If already string HH:MM
        if (typeof ms === 'string' && /^\d{2}:\d{2}$/.test(ms)) return ms;

        const totalMinutes = Math.floor(Number(ms) / 60000);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    };

    const timeToMs = (timeStr: string) => {
        if (!timeStr) return 0;
        const [hours, minutes] = timeStr.split(':').map(Number);
        return (hours * 3600000) + (minutes * 60000);
    };

    const toggleService = async (serviceId: string) => {
        setSaving(true);
        const newBlocked = blockedServices.includes(serviceId)
            ? blockedServices.filter(id => id !== serviceId)
            : [...blockedServices, serviceId];

        setBlockedServices(newBlocked);

        try {
            // Must fetch current schedule to preserve it, but API route logic might handle partials?
            // Ideally we send the full object. But our atomic 'setBlockedServices' usage in route 
            // relies on the lib which refetches. 
            // Client side logic here sends just IDs to a PUT endpoint?
            // Wait, previous logical flow in page calls:
            await fetch('/api/adguard/services', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: newBlocked }),
            });
        } catch (err) {
            console.error('Failed to update blocked services:', err);
            setBlockedServices(blockedServices);
        }
        setSaving(false);
    };

    const saveSchedule = async () => {
        setScheduleSaving(true);
        try {
            // Convert times to milliseconds for API
            const apiSchedule = {
                ...schedule.schedule,
                start: timeToMs(schedule.schedule?.start),
                end: timeToMs(schedule.schedule?.end),
            };

            const payload = {
                ids: blockedServices,
                schedule: apiSchedule
            };

            await fetch('/api/adguard/services/schedule', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            alert(t('services.schedule_saved'));
        } catch (err) {
            console.error(err);
            alert(`${t('filtering.action_failed')} "save schedule".`);
        }
        setScheduleSaving(false);
    };

    // Determine which list to show: Merge Dynamic with Static Metadata
    const displayServices = availableServices.length > 0
        ? availableServices.map(s => {
            const metadata = POPULAR_SERVICES.find(p => p.id === s.id);
            return {
                ...s,
                ...metadata, // Override with metadata (icons, etc) if found
                name: metadata?.name || s.name // Metadata name usually cleaner
            };
        })
        : POPULAR_SERVICES;

    const filteredServices = displayServices.filter(s =>
        (s.name || '').toLowerCase().includes(filter.toLowerCase()) ||
        (s.id || '').toLowerCase().includes(filter.toLowerCase())
    );

    return (
        <div className="p-4 md:p-8 space-y-6 md:space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-2">{t('services.title')}</h1>
                    <p className="text-gray-400 text-sm md:text-base">{t('services.subtitle')}</p>
                </div>
                <button
                    onClick={fetchData}
                    className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors self-end sm:self-auto"
                >
                    <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            {/* Schedule Configuration */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                    <Clock className="text-blue-500" size={24} />
                    {t('services.pause_blocking')}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">{t('services.time_zone')}</label>
                        <select
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                            value={schedule.schedule?.time_zone || 'UTC'}
                            onChange={e => setSchedule({
                                ...schedule,
                                schedule: { ...schedule.schedule, time_zone: e.target.value }
                            })}
                        >
                            {Intl.supportedValuesOf('timeZone').map(tz => (
                                <option key={tz} value={tz}>{tz}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">{t('services.start_time')}</label>
                        <input
                            type="time"
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                            value={msToTime(schedule.schedule?.start)}
                            onChange={e => setSchedule({
                                ...schedule,
                                schedule: { ...schedule.schedule, start: e.target.value }
                                // Keep as string in state until save? Or convert immediately?
                                // Better to keep "UI value" in state if possible, but our schedule object mirrors API.
                                // Let's keep it mixed for now (helper handles string/number) but best to keep consistent.
                                // Actually, `msToTime` handles string. `timeToMs` handles string.
                                // Let's just store the string from input in state, and convert ONLY on save.
                                // The API response will be number (ms). `msToTime` converts to string.
                                // So on change, we write string. On render `msToTime` handles string or number.
                            })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">{t('services.end_time')}</label>
                        <input
                            type="time"
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                            value={msToTime(schedule.schedule?.end)}
                            onChange={e => setSchedule({
                                ...schedule,
                                schedule: { ...schedule.schedule, end: e.target.value }
                            })}
                        />
                    </div>
                </div>

                <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-400 mb-2">{t('services.days')}</label>
                    <div className="flex flex-wrap gap-2">
                        {['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'].map((day, idx) => (
                            <button
                                key={day}
                                onClick={() => {
                                    const currentDays = schedule.schedule?.days || [];
                                    const newDays = currentDays.includes(day)
                                        ? currentDays.filter((d: string) => d !== day)
                                        : [...currentDays, day];
                                    setSchedule({
                                        ...schedule,
                                        schedule: { ...schedule.schedule, days: newDays }
                                    });
                                }}
                                className={`px-3 py-2 rounded text-xs md:text-sm font-medium transition-colors flex-1 sm:flex-none text-center min-w-[60px] ${(schedule.schedule?.days || []).includes(day)
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                    }`}
                            >
                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][idx]}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mt-6 flex justify-end">
                    <button
                        onClick={saveSchedule}
                        disabled={scheduleSaving}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                        <Save size={18} />
                        {scheduleSaving ? t('services.saving') : t('services.save_schedule')}
                    </button>
                </div>
            </div>

            {/* Services List */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-medium text-white flex items-center gap-2">
                        <ShieldOff className="text-red-500" size={20} />
                        {t('services.blocked_services')} ({blockedServices.length})
                    </h3>
                    <input
                        type="text"
                        placeholder={t('services.filter_services')}
                        value={filter}
                        onChange={e => setFilter(e.target.value)}
                        className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1 text-sm text-white focus:outline-none focus:border-blue-500"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredServices.map(service => {
                        const isBlocked = blockedServices.includes(service.id);

                        return (
                            <div
                                key={service.id}
                                className={`bg-gray-800 border rounded-xl p-4 flex items-center justify-between cursor-pointer transition-all ${isBlocked ? 'border-red-500/50 bg-red-500/5' : 'border-gray-700 hover:border-gray-600'
                                    }`}
                                onClick={() => toggleService(service.id)}
                            >
                                <div className="flex gap-3 items-center">
                                    {service.icon_svg ? (
                                        <div
                                            className="w-8 h-8 flex-shrink-0 text-gray-400 [&>svg]:w-full [&>svg]:h-full"
                                            dangerouslySetInnerHTML={{
                                                // AdGuard API returns icons as Base64 encoded SVGs (start with PHN...)
                                                // We must decode them to render as inline SVG
                                                __html: service.icon_svg.startsWith('PHN') || !service.icon_svg.trim().startsWith('<')
                                                    ? atob(service.icon_svg)
                                                    : service.icon_svg
                                            }}
                                        />
                                    ) : (
                                        <div className="w-8 h-8 flex items-center justify-center text-gray-400">
                                            {/* Dynamic check for icon component vs simple text fallback */}
                                            {/* @ts-ignore */}
                                            {service.icon ? <service.icon size={24} /> : (
                                                <div className="text-xs font-bold w-full text-center">{service.name.substring(0, 2)}</div>
                                            )}
                                        </div>
                                    )}
                                    <span className="text-white font-medium">{service.name}</span>
                                </div>
                                <Switch checked={isBlocked} />
                            </div>
                        );
                    })}
                    {filteredServices.length === 0 && !loading && (
                        <div className="col-span-full text-center text-gray-500 py-8">
                            {t('services.no_services_found')} "{filter}".
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
