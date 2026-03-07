import { useState, useCallback } from 'react';
import { OrderCommentRecord } from '@/types/comments';
import { authedFetch } from '@/lib/api';

interface UseCommentsReturn {
    records: OrderCommentRecord[];
    isLoading: boolean;
    error: string | null;
    fetchCommentsByOrder: (orderId: string, forceRefresh?: boolean) => Promise<void>;
}

export function useComments(): UseCommentsReturn {
    const [records, setRecords] = useState<OrderCommentRecord[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchCommentsByOrder = useCallback(async (orderId: string, forceRefresh = false) => {
        setIsLoading(true);
        setError(null);
        try {
            const url = new URL('/api/comments', window.location.origin);
            url.searchParams.append('orderId', orderId);
            if (forceRefresh) {
                url.searchParams.append('refresh', 'true');
            }

            const response = await authedFetch(url.toString());
            if (!response.ok) {
                throw new Error('Failed to fetch Comments records');
            }

            const data = await response.json();
            setRecords(data.records || []);
        } catch (err) {
            console.error('Error fetching Comments records:', err);
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
        } finally {
            setIsLoading(false);
        }
    }, []);

    return {
        records,
        isLoading,
        error,
        fetchCommentsByOrder,
    };
}
