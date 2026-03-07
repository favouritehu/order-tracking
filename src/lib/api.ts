/**
 * Authenticated fetch wrapper
 * Attaches the x-auth-user header required by middleware for all /api calls.
 */
export function authedFetch(input: string, init: RequestInit = {}): Promise<Response> {
    const user = typeof window !== 'undefined' ? localStorage.getItem('auth_user') : null;

    return fetch(input, {
        ...init,
        headers: {
            ...(init.headers || {}),
            ...(user ? { 'x-auth-user': user } : {}),
        },
    });
}
