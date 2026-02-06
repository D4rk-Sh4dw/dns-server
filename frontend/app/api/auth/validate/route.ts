import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";

/**
 * Session validation endpoint for nginx auth_request
 * Returns 200 if user is authenticated, 401 otherwise
 */
export async function GET() {
    const session = await getServerSession();

    if (session) {
        // User is authenticated
        return new NextResponse(null, { status: 200 });
    }

    // User is not authenticated
    return new NextResponse(null, { status: 401 });
}
