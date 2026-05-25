import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";

const authDisabled = process.env.AUTH_DISABLED === "true";

/**
 * Session validation endpoint for nginx auth_request
 * Returns 200 if user is authenticated, 401 otherwise
 * When AUTH_DISABLED=true, always returns 200 (for use with forward auth proxies like Authentik)
 */
export async function GET() {
    if (authDisabled) {
        return new NextResponse(null, { status: 200 });
    }

    const session = await getServerSession();

    if (session) {
        // User is authenticated
        return new NextResponse(null, { status: 200 });
    }

    // User is not authenticated
    return new NextResponse(null, { status: 401 });
}
