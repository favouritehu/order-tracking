/**
 * Auth Login API Endpoint
 * POST /api/auth/login - Validate credentials server-side
 * Credentials are read from env vars, never exposed to the client.
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { username, password } = await request.json();

        const validUsername = process.env.AUTH_USERNAME;
        const validPassword = process.env.AUTH_PASSWORD;

        if (!validUsername || !validPassword) {
            console.error('AUTH_USERNAME or AUTH_PASSWORD env vars are not set');
            return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
        }

        if (username === validUsername && password === validPassword) {
            return NextResponse.json({ success: true, user: username });
        }

        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    } catch {
        return NextResponse.json({ error: 'Bad request' }, { status: 400 });
    }
}
