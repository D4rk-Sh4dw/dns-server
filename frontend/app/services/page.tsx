'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, Clock, Save, ShieldOff } from 'lucide-react';

interface Service {
    id: string;
    name: string;
    icon_svg: string;
    rules_count: number;
}

interface ServiceGroup {
    category: string;
    services: Service[];
}

export default function ServicesPage() {
    const [availableServices, setAvailableServices] = useState<Service[]>([]);
    const [blockedServices, setBlockedServices] = useState<string[]>([]);
    const [schedule, setSchedule] = useState<{
        ids?: string[],
        schedule?: {
            time_zone?: string;
            days?: string[]; // "sun", "mon" etc
            start?: string; // HH:mm
            end?: string; // HH:mm
        }
    }>({});

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [scheduleSaving, setScheduleSaving] = useState(false);

    // Grouping manually or if API provides categories?
    // AdGuard `available` list usually is flat array of objects. 
    // We might need to guess categories or just show a flat list / search.
    // Wait, the user image shows categories "Artificial intelligence", "Content delivery networks", etc.
    // This implies AdGuard API DOES return categories or it's hardcoded in AdGuard UI.
    // If the API returns flat list, we can try to map them or just use a grid.
    // Let's assume flat list for now but add a search.
    const [filter, setFilter] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            const [servicesRes, scheduleRes] = await Promise.all([
                fetch('/api/adguard/services'),
                fetch('/api/adguard/services/schedule')
            ]);

            const servicesData = await servicesRes.json();
            // Ensure array type before setting state to avoid render crashes
            // Use logical OR to fallback to empty array if response is bad
            const available = Array.isArray(servicesData.available) ? servicesData.available : [];
            const blocked = Array.isArray(servicesData.blocked) ? servicesData.blocked : [];

            setAvailableServices(available);
            setBlockedServices(blocked);

            // Handle schedule safely
            try {
                const scheduleData = await scheduleRes.json();
                setSchedule(scheduleData || {});
            } catch (e) {
                console.error("Failed to parse schedule", e);
                setSchedule({});
            }
        } catch (err) {
            console.error('Failed to fetch data:', err);
            // Ensure we don't leave loading state hanging if fetch fails
            setAvailableServices([]);
            setBlockedServices([]);
        }
        setLoading(false);
    };

    useEffect(() => { fetchData(); }, []);

    // Helper functions for safe rendering
    const formatTime = (timeStr?: string) => {
        if (!timeStr) return '';
        try {
            // If valid HH:mm
            if (/^\d{2}:\d{2}$/.test(timeStr)) return timeStr;
            // If date string or milliseconds, try to parse
            // AdGuard sometimes sends milliseconds.
            return new Date(`2000-01-01T${timeStr}`).toTimeString().substring(0, 5);
        } catch (e) {
            return '';
        }
    };

    const toggleService = async (serviceId: string) => {
        setSaving(true);
        const newBlocked = blockedServices.includes(serviceId)
            ? blockedServices.filter(id => id !== serviceId)
            : [...blockedServices, serviceId];

        setBlockedServices(newBlocked);

        try {
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

    // ... saveSchedule ...

    // Filter availableServices only if it's an array (now guaranteed by fetchData but state could be initial)
    const safeAvailableServices = Array.isArray(availableServices) ? availableServices : [];
    const filteredServices = safeAvailableServices.filter(s =>
        (s.name || '').toLowerCase().includes(filter.toLowerCase()) ||
        (s.id || '').toLowerCase().includes(filter.toLowerCase())
    );

    const saveSchedule = async () => {
        setScheduleSaving(true);
        try {
            const payload = {
                ids: blockedServices, // Schedule update often requires resending IDs too
                schedule: schedule.schedule
            };

            await fetch('/api/adguard/services/schedule', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            alert('Schedule saved!');
        } catch (err) {
            alert('Failed to save schedule');
        }
        setScheduleSaving(false);
    };



    return (
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Service Blocking</h1>
                    <p className="text-gray-400">Block popular applications and configure pause schedules.</p>
                </div>
                <button
                    onClick={fetchData}
                    className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                >
                    <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            {/* Schedule Configuration */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                    <Clock className="text-blue-500" size={24} />
                    Pause Service Blocking
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Time Zone</label>
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
                        <label className="block text-sm font-medium text-gray-400 mb-1">Pause Start Time</label>
                        <input
                            type="time"
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                            value={formatTime(schedule.schedule?.start)}
                            onChange={e => setSchedule({
                                ...schedule,
                                schedule: { ...schedule.schedule, start: e.target.value } // AdGuard expects milliseconds? Or HH:mm? Needs verify. Assuming HH:mm for now.
                            })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Pause End Time</label>
                        <input
                            type="time"
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                            value={formatTime(schedule.schedule?.end)}
                            onChange={e => setSchedule({
                                ...schedule,
                                schedule: { ...schedule.schedule, end: e.target.value }
                            })}
                        />
                    </div>
                </div>

                <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-400 mb-2">Days of Week</label>
                    <div className="flex flex-wrap gap-2">
                        {['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'].map((day, idx) => (
                            <button
                                key={day}
                                onClick={() => {
                                    const currentDays = schedule.schedule?.days || [];
                                    const newDays = currentDays.includes(day)
                                        ? currentDays.filter(d => d !== day)
                                        : [...currentDays, day];
                                    setSchedule({
                                        ...schedule,
                                        schedule: { ...schedule.schedule, days: newDays }
                                    });
                                }}
                                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${(schedule.schedule?.days || []).includes(day)
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                    }`}
                            >
                                {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][idx]}
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
                        {scheduleSaving ? 'Saving...' : 'Save Schedule'}
                    </button>
                </div>
            </div>

            {/* Services List */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-medium text-white flex items-center gap-2">
                        <ShieldOff className="text-red-500" size={20} />
                        Blocked Services ({blockedServices.length})
                    </h3>
                    <input
                        type="text"
                        placeholder="Filter services..."
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
                                    {/* Render SVG Icon if available, else placeholder */}
                                    {service.icon_svg ? (
                                        <div
                                            className="w-8 h-8 flex-shrink-0 text-gray-400"
                                            dangerouslySetInnerHTML={{ __html: service.icon_svg }}
                                        />
                                    ) : (
                                        <div className="w-8 h-8 bg-gray-700 rounded flex items-center justify-center text-xs font-bold text-gray-400">
                                            {service.name.substring(0, 2)}
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
                            No services found.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function Switch({ checked }: { checked: boolean }) {
    return (
        <div className={`w-11 h-6 rounded-full relative transition-colors flex-shrink-0 ${checked ? 'bg-red-500' : 'bg-gray-600'}`}>
            <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${checked ? 'translate-x-5' : ''}`} />
        </div>
    );
}
