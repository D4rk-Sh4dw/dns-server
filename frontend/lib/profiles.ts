// Profile Manager for Time-Based DNS Policies
// Stores profiles as JSON in /app/data_mount/profiles.json
// Profiles combine blocked services, schedules, and optional client-specific settings

import fs from 'fs/promises';
import path from 'path';
import {
    getBlockedServices,
    setBlockedServices,
    setBlockedServicesSchedule,
    getClients,
    updateClient,
    getAllBlockedServices,
} from './adguard';

const PROFILES_FILE = '/app/data_mount/profiles.json';
const ACTIVE_PROFILE_FILE = '/app/data_mount/active_profile.json';

export interface ProfileSchedule {
    timeZone: string;
    days: string[]; // ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
    start: string; // "HH:MM"
    end: string; // "HH:MM"
}

export interface Profile {
    id: string;
    name: string;
    description: string;
    icon: string; // lucide icon name
    color: string; // tailwind color class
    blockedServices: string[];
    schedule: ProfileSchedule;
    // Optional: per-client overrides
    clientOverrides?: Record<string, {
        blockedServices?: string[];
        filteringEnabled?: boolean;
        safeSearchEnabled?: boolean;
        upstreams?: string[];
    }>;
    // Optional: filter list adjustments
    filterLists?: {
        enable?: number[]; // filter IDs to enable
        disable?: number[]; // filter IDs to disable
    };
    createdAt: string;
    updatedAt: string;
}

// Default profiles shipped with the system
export const DEFAULT_PROFILES: Profile[] = [
    {
        id: 'children',
        name: 'Kinder',
        description: 'Social Media, Gaming und Streaming blockiert. Bildung erlaubt.',
        icon: 'Baby',
        color: 'text-pink-400',
        blockedServices: [
            'facebook', 'instagram', 'twitter', 'tiktok', 'snapchat', 'reddit',
            'youtube', 'netflix', 'twitch', 'disney_plus', 'prime_video',
            'steam', 'roblox', 'minecraft', 'epic_games', 'psn', 'xbox_live',
            'discord', 'whatsapp', 'telegram'
        ],
        schedule: {
            timeZone: 'Europe/Berlin',
            days: ['mon', 'tue', 'wed', 'thu', 'fri'],
            start: '07:00',
            end: '19:00',
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: 'work',
        name: 'Arbeit',
        description: 'Social Media, Gaming und Streaming blockiert. Fokus-Modus.',
        icon: 'Briefcase',
        color: 'text-blue-400',
        blockedServices: [
            'facebook', 'instagram', 'twitter', 'tiktok', 'snapchat', 'reddit',
            'youtube', 'netflix', 'twitch', 'disney_plus', 'prime_video',
            'steam', 'roblox', 'minecraft', 'epic_games', 'psn', 'xbox_live',
            'discord'
        ],
        schedule: {
            timeZone: 'Europe/Berlin',
            days: ['mon', 'tue', 'wed', 'thu', 'fri'],
            start: '08:00',
            end: '17:00',
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: 'weekend',
        name: 'Wochenende',
        description: 'Gaming erlaubt, Social Media limitiert.',
        icon: 'Gamepad2',
        color: 'text-green-400',
        blockedServices: [
            'facebook', 'instagram', 'twitter', 'tiktok', 'snapchat',
            'youtube', 'netflix', 'twitch'
        ],
        schedule: {
            timeZone: 'Europe/Berlin',
            days: ['sat', 'sun'],
            start: '10:00',
            end: '22:00',
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: 'night',
        name: 'Nacht',
        description: 'Alles außer Messaging und Notfälle blockiert.',
        icon: 'Moon',
        color: 'text-indigo-400',
        blockedServices: [
            'facebook', 'instagram', 'twitter', 'tiktok', 'snapchat', 'reddit',
            'youtube', 'netflix', 'twitch', 'disney_plus', 'prime_video',
            'steam', 'roblox', 'minecraft', 'epic_games', 'psn', 'xbox_live',
            'amazon', 'ebay', 'spotify'
        ],
        schedule: {
            timeZone: 'Europe/Berlin',
            days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
            start: '22:00',
            end: '06:00',
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
];

// Ensure profiles file exists with defaults
async function ensureProfilesFile(): Promise<Profile[]> {
    try {
        const data = await fs.readFile(PROFILES_FILE, 'utf-8');
        return JSON.parse(data);
    } catch {
        // File doesn't exist, create with defaults
        await fs.writeFile(PROFILES_FILE, JSON.stringify(DEFAULT_PROFILES, null, 2));
        return DEFAULT_PROFILES;
    }
}

// Read all profiles
export async function getProfiles(): Promise<Profile[]> {
    return ensureProfilesFile();
}

// Get a single profile by ID
export async function getProfile(id: string): Promise<Profile | null> {
    const profiles = await getProfiles();
    return profiles.find(p => p.id === id) || null;
}

// Create or update a profile
export async function saveProfile(profile: Profile): Promise<Profile> {
    const profiles = await getProfiles();
    const idx = profiles.findIndex(p => p.id === profile.id);

    profile.updatedAt = new Date().toISOString();

    if (idx >= 0) {
        profiles[idx] = profile;
    } else {
        profile.createdAt = new Date().toISOString();
        profiles.push(profile);
    }

    await fs.writeFile(PROFILES_FILE, JSON.stringify(profiles, null, 2));
    return profile;
}

// Delete a profile
export async function deleteProfile(id: string): Promise<void> {
    const profiles = await getProfiles();
    const filtered = profiles.filter(p => p.id !== id);
    await fs.writeFile(PROFILES_FILE, JSON.stringify(filtered, null, 2));
}

// Get currently active profile
export async function getActiveProfile(): Promise<{ profileId: string | null; appliedAt: string | null }> {
    try {
        const data = await fs.readFile(ACTIVE_PROFILE_FILE, 'utf-8');
        return JSON.parse(data);
    } catch {
        return { profileId: null, appliedAt: null };
    }
}

// Set active profile
export async function setActiveProfile(profileId: string | null): Promise<void> {
    const data = { profileId, appliedAt: profileId ? new Date().toISOString() : null };
    await fs.writeFile(ACTIVE_PROFILE_FILE, JSON.stringify(data, null, 2));
}

// Apply a profile to AdGuard
export async function applyProfile(profileId: string): Promise<void> {
    const profile = await getProfile(profileId);
    if (!profile) {
        throw new Error(`Profile ${profileId} not found`);
    }

    // 1. Set blocked services with schedule
    const scheduleMs = {
        time_zone: profile.schedule.timeZone,
        days: profile.schedule.days.map(day => ({
            start: timeToMs(profile.schedule.start),
            end: timeToMs(profile.schedule.end),
        })),
    };

    await setBlockedServicesSchedule(scheduleMs);
    await setBlockedServices(profile.blockedServices);

    // 2. Apply client overrides if any
    if (profile.clientOverrides) {
        const clients = await getClients();
        for (const [clientName, override] of Object.entries(profile.clientOverrides)) {
            const client = clients.clients?.find((c: any) => c.name === clientName);
            if (client) {
                const updated = {
                    ...client,
                    ...(override.blockedServices !== undefined && {
                        use_global_blocked_services: false,
                        blocked_services: override.blockedServices,
                    }),
                    ...(override.filteringEnabled !== undefined && {
                        use_global_settings: false,
                        filtering_enabled: override.filteringEnabled,
                    }),
                    ...(override.safeSearchEnabled !== undefined && {
                        use_global_settings: false,
                        safesearch_enabled: override.safeSearchEnabled,
                    }),
                    ...(override.upstreams !== undefined && {
                        use_global_settings: false,
                        upstreams: override.upstreams,
                    }),
                };
                await updateClient(clientName, updated);
            }
        }
    }

    // 3. Mark as active
    await setActiveProfile(profileId);
}

// Deactivate current profile (restore defaults)
export async function deactivateProfile(): Promise<void> {
    // Clear blocked services schedule and unblock all services
    await setBlockedServicesSchedule({
        time_zone: 'Local',
        days: [],
    });
    await setBlockedServices([]);

    // Reset client overrides (restore global settings)
    const clients = await getClients();
    for (const client of (clients.clients || [])) {
        if (!client.use_global_settings) {
            await updateClient(client.name, {
                ...client,
                use_global_settings: true,
                use_global_blocked_services: true,
            });
        }
    }

    await setActiveProfile(null);
}

// Check if a profile should be active based on current time
export function isProfileActiveNow(profile: Profile): boolean {
    const now = new Date();
    const tz = profile.schedule.timeZone;

    // Get current day/time in profile's timezone
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });
    const parts = formatter.formatToParts(now);
    const day = parts.find(p => p.type === 'weekday')?.value.toLowerCase() || '';
    const hour = parts.find(p => p.type === 'hour')?.value || '00';
    const minute = parts.find(p => p.type === 'minute')?.value || '00';
    const currentTime = `${hour}:${minute}`;

    // Map weekday names to our format
    const dayMap: Record<string, string> = {
        'mon': 'mon', 'tue': 'tue', 'wed': 'wed', 'thu': 'thu',
        'fri': 'fri', 'sat': 'sat', 'sun': 'sun',
        'monday': 'mon', 'tuesday': 'tue', 'wednesday': 'wed', 'thursday': 'thu',
        'friday': 'fri', 'saturday': 'sat', 'sunday': 'sun',
    };
    const mappedDay = dayMap[day] || day;

    // Check if today is in schedule
    if (!profile.schedule.days.includes(mappedDay)) {
        return false;
    }

    // Check time range (handles overnight ranges like 22:00-06:00)
    const start = profile.schedule.start;
    const end = profile.schedule.end;

    if (start <= end) {
        // Normal range (e.g., 08:00-17:00)
        return currentTime >= start && currentTime <= end;
    } else {
        // Overnight range (e.g., 22:00-06:00)
        return currentTime >= start || currentTime <= end;
    }
}

// Check all profiles and apply the one that should be active
export async function checkAndApplyScheduledProfiles(): Promise<string | null> {
    const profiles = await getProfiles();
    const active = await getActiveProfile();

    // Find profile that should be active now
    let targetProfile: Profile | null = null;
    for (const profile of profiles) {
        if (isProfileActiveNow(profile)) {
            targetProfile = profile;
            break;
        }
    }

    if (targetProfile) {
        // Only apply if different from currently active
        if (active.profileId !== targetProfile.id) {
            console.log(`[Profile Scheduler] Activating profile: ${targetProfile.name}`);
            await applyProfile(targetProfile.id);
            return targetProfile.id;
        }
    } else {
        // No profile should be active - deactivate if something is active
        if (active.profileId) {
            console.log('[Profile Scheduler] No profile scheduled, deactivating current profile');
            await deactivateProfile();
            return null;
        }
    }

    return active.profileId;
}

// Helper: Convert "HH:MM" to milliseconds since midnight
function timeToMs(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return (hours * 3600000) + (minutes * 60000);
}
