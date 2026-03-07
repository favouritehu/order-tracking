/**
 * useDispatchList Hook
 * List-style hook for Dispatch Summary: search, pagination, create
 */

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { DispatchSummaryRecord } from '@/types/dispatch';
import { authedFetch } from '@/lib/api';

interface UseDispatchListReturn {
    records: DispatchSummaryRecord[];
    isLoading: boolean;
    total: number;
    refresh: () => Promise<void>;
    createRecord: (data: Record<string, unknown>) => Promise<boolean>;
    updateRecord: (data: Record<string, unknown>) => Promise<boolean>;
    isCreating: boolean;
    isSaving: boolean;
}

export function useDispatchList(searchQuery: string): UseDispatchListReturn {
    const [records, setRecords] = useState<DispatchSummaryRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [total, setTotal] = useState(0);

    const fetchRecords = useCallback(async (query: string, forceRefresh = false) => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            if (query) params.append('search', query);
            if (forceRefresh) params.append('refresh', 'true');

            const response = await authedFetch(`/api/dispatch?${params.toString()}`);
            if (response.ok) {
                const data = await response.json();
                setRecords(data.records || []);
                setTotal(data.total || 0);
            }
        } catch (error) {
            console.error('Failed to fetch Dispatch records:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchRecords(searchQuery);
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [searchQuery, fetchRecords]);

    const refresh = useCallback(async () => {
        await fetchRecords(searchQuery, true);
    }, [searchQuery, fetchRecords]);

    const createRecord = useCallback(async (data: Record<string, unknown>): Promise<boolean> => {
        setIsCreating(true);
        const promise = authedFetch('/api/dispatch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        }).then(async (response) => {
            if (!response.ok) throw new Error('Failed to create Dispatch record');
            await refresh();
            return true;
        });

        toast.promise(promise, {
            loading: 'Adding dispatch record...',
            success: 'Dispatch record added successfully',
            error: 'Failed to add dispatch record',
        });

        try {
            await promise;
            return true;
        } catch (error) {
            console.error('Failed to create dispatch:', error);
            return false;
        } finally {
            setIsCreating(false);
        }
    }, [refresh]);

    const updateRecord = useCallback(async (data: Record<string, unknown>): Promise<boolean> => {
        setIsSaving(true);
        const promise = authedFetch('/api/dispatch', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        }).then(async (response) => {
            if (!response.ok) throw new Error('Failed to update Dispatch record');
            await refresh();
            return true;
        });

        toast.promise(promise, {
            loading: 'Updating dispatch record...',
            success: 'Dispatch record updated successfully',
            error: 'Failed to update dispatch record',
        });

        try {
            await promise;
            return true;
        } catch (error) {
            console.error('Failed to update dispatch:', error);
            return false;
        } finally {
            setIsSaving(false);
        }
    }, [refresh]);

    return {
        records,
        isLoading,
        total,
        refresh,
        createRecord,
        updateRecord,
        isCreating,
        isSaving,
    };
}
