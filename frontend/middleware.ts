import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

const authDisabled = process.env.AUTH_DISABLED === "true";

function middleware(req: NextRequest) {
    if (authDisabled) {
        return NextResponse.next();
    }
    return withAuth(req as any);
}

export default middleware;

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
