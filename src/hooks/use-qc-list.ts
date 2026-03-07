/**
 * useQcList Hook
 * Fetches all QC records with search, for the list-view dashboard
 */

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { QcRecord } from '@/types';
import { authedFetch } from '@/lib/api';

interface UseQcListReturn {
    records: QcRecord[];
    isLoading: boolean;
    total: number;
    refresh: () => Promise<void>;
    createRecord: (data: Record<string, unknown>) => Promise<boolean>;
    isCreating: boolean;
}

export function useQcList(searchQuery: string): UseQcListReturn {
    const [records, setRecords] = useState<QcRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [total, setTotal] = useState(0);

    const fetchRecords = useCallback(async (query: string, forceRefresh = false) => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            if (query) params.append('search', query);
            if (forceRefresh) params.append('refresh', 'true');
            params.append('limit', '200');

            const response = await authedFetch(`/api/qc?${params.toString()}`);
            if (response.ok) {
                const data = await response.json();
                setRecords(data.records || []);
                setTotal(data.total || 0);
            }
        } catch (error) {
            console.error('Failed to fetch QC records:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRecords(searchQuery);
    }, [searchQuery, fetchRecords]);

    const refresh = useCallback(async () => {
        await fetchRecords(searchQuery || '', true);
    }, [fetchRecords, searchQuery]);

    const createRecord = useCallback(async (data: Record<string, unknown>): Promise<boolean> => {
        setIsCreating(true);
        const promise = authedFetch('/api/qc', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        }).then(async (response) => {
            if (!response.ok) throw new Error('Failed to create QC record');
            await refresh();
            return true;
        });

        toast.promise(promise, {
            loading: 'Adding QC record...',
            success: 'QC record added successfully',
            error: 'Failed to add QC record',
        });

        try {
            await promise;
            return true;
        } catch (error) {
            console.error('Failed to create QC record:', error);
            return false;
        } finally {
            setIsCreating(false);
        }
    }, [refresh]);

    return {
        records,
        isLoading,
        total,
        refresh,
        createRecord,
        isCreating,
    };
}
