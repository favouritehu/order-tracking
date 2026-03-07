/**
 * useUb Hook
 * Manages U.B (Under Billing) records state, search, and pagination
 */

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { UbRecord } from '@/types/ub';
import { authedFetch } from '@/lib/api';

interface UseUbReturn {
    records: UbRecord[];
    isLoading: boolean;
    isLoadingMore: boolean;
    hasMore: boolean;
    total: number;
    loadMore: () => Promise<void>;
    refresh: () => Promise<void>;
    createRecord: (data: Record<string, unknown>) => Promise<boolean>;
    updateRecord: (data: Record<string, unknown>) => Promise<boolean>;
    isCreating: boolean;
    isSaving: boolean;
}

export function useUb(searchQuery: string): UseUbReturn {
    const [records, setRecords] = useState<UbRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [total, setTotal] = useState(0);

    // Reset and fetch first page when search changes
    useEffect(() => {
        setPage(1);
        setRecords([]);
        setHasMore(true);
        setIsLoading(true);

        const fetchFirstPage = async () => {
            try {
                const params = new URLSearchParams();
                if (searchQuery) params.append('search', searchQuery);
                params.append('page', '1');
                params.append('limit', '20');

                const response = await authedFetch(`/api/ub?${params.toString()}`);
                if (response.ok) {
                    const data = await response.json();
                    setRecords(data.records || []);
                    setHasMore(data.hasMore);
                    setTotal(data.total || 0);
                }
            } catch (error) {
                console.error('Failed to fetch U.B records:', error);
            } finally {
                setIsLoading(false);
            }
        };

        const timeoutId = setTimeout(() => {
            fetchFirstPage();
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    const loadMore = useCallback(async () => {
        if (isLoadingMore || !hasMore) return;

        setIsLoadingMore(true);
        const nextPage = page + 1;

        try {
            const params = new URLSearchParams();
            if (searchQuery) params.append('search', searchQuery);
            params.append('page', nextPage.toString());
            params.append('limit', '20');

            const response = await authedFetch(`/api/ub?${params.toString()}`);
            if (response.ok) {
                const data = await response.json();
                setRecords(prev => [...prev, ...(data.records || [])]);
                setHasMore(data.hasMore);
                setPage(nextPage);
            }
        } catch (error) {
            console.error('Failed to load more U.B records:', error);
        } finally {
            setIsLoadingMore(false);
        }
    }, [page, hasMore, isLoadingMore, searchQuery]);

    const refresh = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            if (searchQuery) params.append('search', searchQuery);
            params.append('page', '1');
            params.append('limit', '20');
            params.append('refresh', 'true');

            const response = await authedFetch(`/api/ub?${params.toString()}`);
            if (response.ok) {
                const data = await response.json();
                setRecords(data.records || []);
                setHasMore(data.hasMore);
                setTotal(data.total || 0);
                setPage(1);
            }
        } catch (error) {
            console.error('Failed to refresh U.B records:', error);
        } finally {
            setIsLoading(false);
        }
    }, [searchQuery]);

    const createRecord = useCallback(async (data: Record<string, unknown>): Promise<boolean> => {
        setIsCreating(true);
        const promise = authedFetch('/api/ub', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        }).then(async (response) => {
            if (!response.ok) throw new Error('Failed to create U.B record');
            await refresh();
            return true;
        });

        toast.promise(promise, {
            loading: 'Creating U.B record in background...',
            success: 'U.B record created successfully',
            error: 'Failed to create U.B record',
        });

        try {
            await promise;
            return true;
        } catch (error) {
            console.error('Failed to create U.B record:', error);
            return false;
        } finally {
            setIsCreating(false);
        }
    }, [refresh]);

    const updateRecord = useCallback(async (data: Record<string, unknown>): Promise<boolean> => {
        setIsSaving(true);
        const promise = authedFetch('/api/ub', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        }).then(async (response) => {
            if (!response.ok) throw new Error('Failed to update U.B record');
            await refresh();
            return true;
        });

        toast.promise(promise, {
            loading: 'Updating U.B record in background...',
            success: 'U.B record updated successfully',
            error: 'Failed to update U.B record',
        });

        try {
            await promise;
            return true;
        } catch (error) {
            console.error('Failed to update U.B record:', error);
            return false;
        } finally {
            setIsSaving(false);
        }
    }, [refresh]);

    return {
        records,
        isLoading,
        isLoadingMore,
        hasMore,
        total,
        loadMore,
        refresh,
        createRecord,
        updateRecord,
        isCreating,
        isSaving,
    };
}
