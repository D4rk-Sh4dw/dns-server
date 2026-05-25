import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

const authDisabled = process.env.AUTH_DISABLED === "true";

export default authDisabled
    ? (req) => NextResponse.next()
    : withAuth;

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - login (login page)
         * - api/auth (auth api routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        "/((?!login|api/auth|_next/static|_next/image|favicon.ico).*)",
    ],
}
