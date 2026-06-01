// Profile Manager for DNS Service Blocking
// Stores profiles as JSON in /app/data_mount/profiles.json
// Profiles define which services to block - they are applied immediately via AdGuard

import fs from 'fs/promises';
import {
    getBlockedServices,
    setBlockedServices,
} from './adguard';

const PROFILES_FILE = '/app/data_mount/profiles.json';
const ACTIVE_PROFILE_FILE = '/app/data_mount/active_profile.json';

export interface Profile {
    id: string;
    name: string;
    description: string;
    icon: string; // lucide icon name
    color: string; // tailwind color class
    blockedServices: string[];
    createdAt: string;
    updatedAt: string;
}

// Default profiles shipped with the system
export const DEFAULT_PROFILES: Profile[] = [
    {
        id: 'children',
        name: 'Kinder',
        description: 'Social Media, Gaming und Streaming blockiert.',
        icon: 'Baby',
        color: 'text-pink-400',
        blockedServices: [
            'facebook', 'instagram', 'twitter', 'tiktok', 'snapchat', 'reddit',
            'youtube', 'netflix', 'twitch', 'disney_plus', 'prime_video',
            'steam', 'roblox', 'minecraft', 'epic_games', 'psn', 'xbox_live',
            'discord', 'whatsapp', 'telegram'
        ],
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
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: 'social_only',
        name: 'Nur Social Media blockiert',
        description: 'Nur Social-Media-Dienste blockiert, alles andere erlaubt.',
        icon: 'Shield',
        color: 'text-green-400',
        blockedServices: [
            'facebook', 'instagram', 'twitter', 'tiktok', 'snapchat', 'reddit'
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: 'all_blocked',
        name: 'Alles blockiert',
        description: 'Alle bekannten Dienste blockiert.',
        icon: 'Moon',
        color: 'text-indigo-400',
        blockedServices: [
            'facebook', 'instagram', 'twitter', 'tiktok', 'snapchat', 'reddit',
            'youtube', 'netflix', 'twitch', 'disney_plus', 'prime_video',
            'steam', 'roblox', 'minecraft', 'epic_games', 'psn', 'xbox_live',
            'discord', 'whatsapp', 'telegram', 'amazon', 'ebay', 'spotify'
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
];

// Ensure profiles file exists with defaults
async function ensureProfilesFile(): Promise<Profile[]> {
    try {
        const data = await fs.readFile(PROFILES_FILE, 'utf-8');
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
            return parsed;
        }
        throw new Error('Invalid profile data');
    } catch {
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
        profile.createdAt = profile.createdAt || new Date().toISOString();
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

// Apply a profile to AdGuard (simple - no schedule, just sets blocked services)
export async function applyProfile(profileId: string): Promise<void> {
    const profile = await getProfile(profileId);
    if (!profile) {
        throw new Error(`Profile ${profileId} not found`);
    }

    // Simply set the blocked services - no schedule complexity
    await setBlockedServices(profile.blockedServices);
    await setActiveProfile(profileId);
}

// Deactivate current profile (unblock all services)
export async function deactivateProfile(): Promise<void> {
    await setBlockedServices([]);
    await setActiveProfile(null);
}

// Legacy: Check if a profile should be active based on current time
// Kept for backward compatibility - now always returns false
export function isProfileActiveNow(_profile: Profile): boolean {
    return false;
}
