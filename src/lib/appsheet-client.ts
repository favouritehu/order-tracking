/**
 * Generic AppSheet API client factory
 * Encapsulates the fetch/cache/promise-dedup pattern shared by all AppSheet tables.
 *
 * Usage:
 *   const client = createAppSheetClient<MyRecord>(url, apiKey);
 *   const records = await client.find();
 *   await client.add([{ ... }]);
 *   await client.edit([{ ... }]);
 */

export interface AppSheetClient<T> {
    find: (forceRefresh?: boolean) => Promise<T[]>;
    add: (rows: Partial<T>[]) => Promise<T[]>;
    edit: (rows: Partial<T>[]) => Promise<T[]>;
    clearCache: () => void;
}

export function createAppSheetClient<T>(
    apiUrl: string,
    apiKey: string,
    cacheDurationMs = 30_000,
): AppSheetClient<T> {
    let cache: T[] | null = null;
    let lastFetchTime = 0;
    let fetchPromise: Promise<T[]> | null = null;

    async function request(action: string, rows?: Partial<T>[]): Promise<T[]> {
        const body: Record<string, unknown> = {
            Action: action,
            Properties: { Locale: 'en-US' },
        };
        if (rows && rows.length > 0) body.Rows = rows;

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ApplicationAccessKey: apiKey,
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`AppSheet API error: ${response.status} - ${errorText}`);
        }

        return response.json();
    }

    async function find(forceRefresh = false): Promise<T[]> {
        const now = Date.now();

        if (!forceRefresh && cache) {
            if (now - lastFetchTime < cacheDurationMs) {
                return cache;
            }
            // Stale-while-revalidate: return stale, refresh in background
            if (!fetchPromise) {
                fetchPromise = request('Find').then((data) => {
                    cache = data;
                    lastFetchTime = Date.now();
                    fetchPromise = null;
                    return data;
                }).catch((err) => {
                    fetchPromise = null;
                    throw err;
                });
            }
            return cache;
        }

        if (fetchPromise) return fetchPromise;

        fetchPromise = request('Find').then((data) => {
            cache = data;
            lastFetchTime = Date.now();
            fetchPromise = null;
            return data;
        }).catch((err) => {
            fetchPromise = null;
            throw err;
        });

        return fetchPromise;
    }

    function clearCache() {
        cache = null;
        lastFetchTime = 0;
    }

    return {
        find,
        add: (rows) => request('Add', rows).then((data) => { clearCache(); return data; }),
        edit: (rows) => request('Edit', rows),
        clearCache,
    };
}
