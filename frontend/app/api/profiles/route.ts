import { NextResponse } from 'next/server';
import {
    getProfiles,
    getProfile,
    saveProfile,
    deleteProfile,
    getActiveProfile,
    setActiveProfile,
    applyProfile,
    deactivateProfile,
    isProfileActiveNow,
    type Profile,
} from '@/lib/profiles';

// GET /api/profiles - List all profiles or get active status
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const active = searchParams.get('active') === 'true';

    try {
        if (active) {
            const activeProfile = await getActiveProfile();
            return NextResponse.json(activeProfile);
        }

        if (id) {
            const profile = await getProfile(id);
            if (!profile) {
                return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
            }
            return NextResponse.json({ ...profile, isActiveNow: isProfileActiveNow(profile) });
        }

        const profiles = await getProfiles();
        // Add isActiveNow flag to each
        const enriched = profiles.map(p => ({
            ...p,
            isActiveNow: isProfileActiveNow(p),
        }));
        return NextResponse.json(enriched);
    } catch (error) {
        console.error('Profile API error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to fetch profiles' },
            { status: 500 }
        );
    }
}

// POST /api/profiles - Create, update, delete, apply, or deactivate a profile
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { action } = body;

        switch (action) {
            case 'create':
            case 'update': {
                const profile: Profile = body.profile;
                if (!profile.id || !profile.name) {
                    return NextResponse.json(
                        { error: 'Profile ID and name are required' },
                        { status: 400 }
                    );
                }
                const saved = await saveProfile(profile);
                return NextResponse.json({ success: true, profile: saved });
            }

            case 'delete': {
                const { id } = body;
                if (!id) {
                    return NextResponse.json(
                        { error: 'Profile ID is required' },
                        { status: 400 }
                    );
                }
                await deleteProfile(id);
                return NextResponse.json({ success: true });
            }

            case 'apply': {
                const { id } = body;
                if (!id) {
                    return NextResponse.json(
                        { error: 'Profile ID is required' },
                        { status: 400 }
                    );
                }
                await applyProfile(id);
                return NextResponse.json({ success: true, message: `Profile ${id} applied` });
            }

            case 'deactivate': {
                await deactivateProfile();
                return NextResponse.json({ success: true, message: 'Profile deactivated' });
            }

            default:
                return NextResponse.json(
                    { error: 'Invalid action. Use: create, update, delete, apply, deactivate' },
                    { status: 400 }
                );
        }
    } catch (error) {
        console.error('Profile API error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Operation failed' },
            { status: 500 }
        );
    }
}
