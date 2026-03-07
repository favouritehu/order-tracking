/**
 * Next.js Middleware
 * Protects all /api routes (except /api/auth/login) by requiring the
 * x-auth-user header set by the client after successful login.
 *
 * This is a lightweight guard — the real credential validation happens
 * server-side in /api/auth/login. The header just proves the user
 * completed that flow.
 */

import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_API_PATHS = ['/api/auth/login'];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Only guard /api routes
    if (!pathname.startsWith('/api')) {
        return NextResponse.next();
    }

    // Allow public endpoints through
    if (PUBLIC_API_PATHS.some((p) => pathname.startsWith(p))) {
        return NextResponse.next();
    }

    // Check for auth header sent by the client
    const authUser = request.headers.get('x-auth-user');
    if (!authUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.next();
}

export const config = {
    matcher: '/api/:path*',
};
