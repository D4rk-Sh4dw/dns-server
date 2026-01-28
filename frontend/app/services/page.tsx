'use client';

import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';

// AdGuard's built-in blocked services list
const AVAILABLE_SERVICES = [
    { id: 'instagram', name: 'Instagram', icon: '📷', description: 'Block Instagram app and website' },
    { id: 'tiktok', name: 'TikTok', icon: '🎵', description: 'Block TikTok app and website' },
    { id: 'facebook', name: 'Facebook', icon: '👤', description: 'Block Facebook and Messenger' },
    { id: 'whatsapp', name: 'WhatsApp', icon: '💬', description: 'Block WhatsApp messaging' },
    { id: 'youtube', name: 'YouTube', icon: '▶️', description: 'Block YouTube video streaming' },
    { id: 'twitter', name: 'X (Twitter)', icon: '🐦', description: 'Block X/Twitter' },
    { id: 'snapchat', name: 'Snapchat', icon: '👻', description: 'Block Snapchat' },
    { id: 'telegram', name: 'Telegram', icon: '✈️', description: 'Block Telegram messaging' },
    { id: 'discord', name: 'Discord', icon: '🎮', description: 'Block Discord' },
    { id: 'twitch', name: 'Twitch', icon: '📺', description: 'Block Twitch streaming' },
    { id: 'spotify', name: 'Spotify', icon: '🎧', description: 'Block Spotify music' },
    { id: 'netflix', name: 'Netflix', icon: '🎬', description: 'Block Netflix streaming' },
    { id: 'amazon', name: 'Amazon', icon: '📦', description: 'Block Amazon shopping' },
    { id: 'ebay', name: 'eBay', icon: '🛒', description: 'Block eBay' },
    { id: 'reddit', name: 'Reddit', icon: '🤖', description: 'Block Reddit' },
    { id: 'pinterest', name: 'Pinterest', icon: '📌', description: 'Block Pinterest' },
    { id: 'tinder', name: 'Tinder', icon: '🔥', description: 'Block Tinder dating' },
    { id: 'steam', name: 'Steam', icon: '🎮', description: 'Block Steam gaming' },
    { id: 'epic_games', name: 'Epic Games', icon: '🎯', description: 'Block Epic Games' },
    { id: 'minecraft', name: 'Minecraft', icon: '⛏️', description: 'Block Minecraft' },
    { id: 'fortnite', name: 'Fortnite', icon: '🏝️', description: 'Block Fortnite' },
    { id: 'roblox', name: 'Roblox', icon: '🧱', description: 'Block Roblox' },
];

export default function ServicesPage() {
    const [blockedServices, setBlockedServices] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/adguard/services');
            const data = await res.json();
            setBlockedServices(data.ids || data || []);
        } catch (err) {
            console.error('Failed to fetch blocked services:', err);
        }
        setLoading(false);
    };

    useEffect(() => { fetchData(); }, []);

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
            // Revert on error
            setBlockedServices(blockedServices);
        }
        setSaving(false);
    };

    return (
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Service Blocking</h1>
                    <p className="text-gray-400">One-click blocking for popular applications and services.</p>
                </div>
                <div className="flex items-center gap-4">
                    {saving && <span className="text-sm text-blue-400">Saving...</span>}
                    <button
                        onClick={fetchData}
                        className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                    >
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-medium text-white">
                        Blocked: {blockedServices.length} / {AVAILABLE_SERVICES.length}
                    </h3>
                    <div className="flex gap-2">
                        <button
                            onClick={() => {
                                setBlockedServices([]);
                                fetch('/api/adguard/services', {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ ids: [] }),
                                });
                            }}
                            className="text-sm text-gray-400 hover:text-white px-3 py-1 rounded border border-gray-700 hover:border-gray-600"
                        >
                            Unblock All
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {AVAILABLE_SERVICES.map(service => {
                        const isBlocked = blockedServices.includes(service.id);
                        return (
                            <div
                                key={service.id}
                                className={`bg-gray-800 border rounded-xl p-4 flex items-start justify-between cursor-pointer transition-all ${isBlocked ? 'border-red-500/50 bg-red-500/5' : 'border-gray-700 hover:border-gray-600'
                                    }`}
                                onClick={() => toggleService(service.id)}
                            >
                                <div className="flex gap-3">
                                    <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center text-xl">
                                        {service.icon}
                                    </div>
                                    <div>
                                        <h3 className="text-white font-medium">{service.name}</h3>
                                        <p className="text-xs text-gray-500 mt-0.5">{service.description}</p>
                                    </div>
                                </div>
                                <Switch checked={isBlocked} />
                            </div>
                        );
                    })}
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
