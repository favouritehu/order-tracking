import { useState, useCallback } from 'react';
import { DispatchSummaryRecord } from '@/types/dispatch';
import { authedFetch } from '@/lib/api';

interface UseDispatchReturn {
    records: DispatchSummaryRecord[];
    isLoading: boolean;
    error: string | null;
    fetchDispatchByOrder: (orderId: string, forceRefresh?: boolean) => Promise<void>;
}

export function useDispatch(): UseDispatchReturn {
    const [records, setRecords] = useState<DispatchSummaryRecord[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchDispatchByOrder = useCallback(async (orderId: string, forceRefresh = false) => {
        setIsLoading(true);
        setError(null);
        try {
            const url = new URL('/api/dispatch', window.location.origin);
            url.searchParams.append('orderId', orderId);
            if (forceRefresh) {
                url.searchParams.append('refresh', 'true');
            }

            const response = await authedFetch(url.toString());
            if (!response.ok) {
                throw new Error('Failed to fetch Dispatch records');
            }

            const data = await response.json();
            setRecords(data.records || []);
        } catch (err) {
            console.error('Error fetching Dispatch records:', err);
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
        } finally {
            setIsLoading(false);
        }
    }, []);

    return {
        records,
        isLoading,
        error,
        fetchDispatchByOrder,
    };
}
