import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    const url = request.nextUrl.clone()
    const path = url.pathname
    const referer = request.headers.get('referer') || ''

    // Define backend URLs
    const ADGUARD_URL = 'http://dns-adguard:3000'
    const TECHNITIUM_URL = 'http://dns-technitium:5380'

    // 1. Explicit path matches (iframe src)
    if (path.startsWith('/adguard')) {
        // Rewrite /adguard/foo -> http://adguard:3000/foo
        // We strip the /adguard prefix
        const targetPath = path.replace(/^\/adguard/, '') || '/'
        return NextResponse.rewrite(new URL(targetPath, ADGUARD_URL))
    }

    if (path.startsWith('/technitium')) {
        // Rewrite /technitium/foo -> http://technitium:5380/foo
        const targetPath = path.replace(/^\/technitium/, '') || '/'
        return NextResponse.rewrite(new URL(targetPath, TECHNITIUM_URL))
    }

    // 2. Context-aware proxying based on Referer (for assets, API calls, redirects)

    // If the request is coming from an AdGuard page (referer contains /adguard)
    if (referer.includes('/adguard')) {
        // Proxy to AdGuard
        return NextResponse.rewrite(new URL(path, ADGUARD_URL))
    }

    // If the request is coming from a Technitium page
    if (referer.includes('/technitium')) {
        return NextResponse.rewrite(new URL(path, TECHNITIUM_URL))
    }

    // 3. Fallback for known specific paths that might lose referer or be tricky
    const adguardKnownPaths = ['/login.html', '/control', '/api']
    if (adguardKnownPaths.some(p => path.startsWith(p))) {
        // Default to AdGuard for these common paths if no other match
        return NextResponse.rewrite(new URL(path, ADGUARD_URL))
    }

    // Technitium specific known paths
    // Technitium uses /api usually, we might conflict if both use /api. 
    // But AdGuard uses /control usually. 

    return NextResponse.next()
}

// Determine which paths this middleware runs on
export const config = {
    matcher: [
        // Run on everything EXCEPT Next.js internals and static files
        '/((?!_next/static|_next/image|favicon.ico|api/auth).*)',
    ],
}
