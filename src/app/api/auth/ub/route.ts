import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
    try {
        const { password } = await request.json();
        const correctPassword = process.env.UB_PASSWORD;

        if (!correctPassword) {
            console.error('UB_PASSWORD environment variable is not set');
            return NextResponse.json({ success: false, error: 'Server configuration error' }, { status: 500 });
        }

        if (password === correctPassword) {
            // Set simple auth cookie valid for 1 day (86400 seconds)
            const cookieStore = await cookies();
            cookieStore.set('ub-token', 'valid', {
                maxAge: 86400,
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/',
            });

            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ success: false, error: 'Incorrect password' }, { status: 401 });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
    }
}

export async function GET() {
    const cookieStore = await cookies();
    const hasToken = cookieStore.has('ub-token');
    return NextResponse.json({ authenticated: hasToken });
}
