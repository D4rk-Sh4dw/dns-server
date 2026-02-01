
import {
    Youtube, Facebook, Instagram, Twitter, MessageCircle,
    Video, ShoppingBag, Gamepad2, Tv, Music, Briefcase,
    Send, MessageSquare, Box, Globe, Star
} from 'lucide-react';
import { LucideIcon } from 'lucide-react';

export interface ServiceDefinition {
    id: string;
    name: string;
    category: 'Social' | 'Messaging' | 'Video' | 'Gaming' | 'Shopping' | 'Other';
    description?: string;
    icon?: LucideIcon;
}

export const POPULAR_SERVICES: ServiceDefinition[] = [
    // Social Media
    { id: 'facebook', name: 'Facebook', category: 'Social', icon: Facebook },
    { id: 'instagram', name: 'Instagram', category: 'Social', icon: Instagram },
    { id: 'twitter', name: 'Twitter / X', category: 'Social', icon: Twitter },
    { id: 'tiktok', name: 'TikTok', category: 'Social', icon: Music },
    { id: 'snapchat', name: 'Snapchat', category: 'Social', icon: MessageCircle },
    { id: 'reddit', name: 'Reddit', category: 'Social', icon: MessageSquare },
    { id: 'linkedin', name: 'LinkedIn', category: 'Social', icon: Briefcase },

    // Messaging
    { id: 'whatsapp', name: 'WhatsApp', category: 'Messaging', icon: MessageCircle },
    { id: 'telegram', name: 'Telegram', category: 'Messaging', icon: Send },
    { id: 'signal', name: 'Signal', category: 'Messaging', icon: MessageCircle },
    { id: 'discord', name: 'Discord', category: 'Messaging', icon: Gamepad2 },
    { id: 'teams', name: 'Microsoft Teams', category: 'Messaging', icon: Briefcase },
    { id: 'zoom', name: 'Zoom', category: 'Messaging', icon: Video },
    { id: 'skype', name: 'Skype', category: 'Messaging', icon: Video },

    // Video / Streaming
    { id: 'youtube', name: 'YouTube', category: 'Video', icon: Youtube },
    { id: 'netflix', name: 'Netflix', category: 'Video', icon: Tv },
    { id: 'twitch', name: 'Twitch', category: 'Video', icon: Tv },
    { id: 'prime_video', name: 'Amazon Prime Video', category: 'Video', icon: Tv },
    { id: 'disney_plus', name: 'Disney+', category: 'Video', icon: Tv },
    { id: 'vimeo', name: 'Vimeo', category: 'Video', icon: Video },

    // Gaming
    { id: 'steam', name: 'Steam', category: 'Gaming', icon: Gamepad2 },
    { id: 'roblox', name: 'Roblox', category: 'Gaming', icon: Gamepad2 },
    { id: 'minecraft', name: 'Minecraft', category: 'Gaming', icon: Box },
    { id: 'epic_games', name: 'Epic Games', category: 'Gaming', icon: Gamepad2 },
    { id: 'psn', name: 'PlayStation', category: 'Gaming', icon: Gamepad2 },
    { id: 'xbox_live', name: 'Xbox Live', category: 'Gaming', icon: Gamepad2 },

    // Shopping
    { id: 'amazon', name: 'Amazon', category: 'Shopping', icon: ShoppingBag },
    { id: 'ebay', name: 'eBay', category: 'Shopping', icon: ShoppingBag },

    // Other
    { id: 'dropbox', name: 'Dropbox', category: 'Other', icon: Box },
    { id: 'spotify', name: 'Spotify', category: 'Other', icon: Music },
];
