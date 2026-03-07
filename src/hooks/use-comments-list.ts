/**
 * useCommentsList Hook
 * List-style hook for Comments: search, pagination, create
 */

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { OrderCommentRecord } from '@/types/comments';
import { authedFetch } from '@/lib/api';

interface UseCommentsListReturn {
    records: OrderCommentRecord[];
    isLoading: boolean;
    total: number;
    refresh: () => Promise<void>;
    createRecord: (data: Record<string, unknown>) => Promise<boolean>;
    updateRecord: (data: Record<string, unknown>) => Promise<boolean>;
    isCreating: boolean;
    isSaving: boolean;
}

export function useCommentsList(searchQuery: string): UseCommentsListReturn {
    const [records, setRecords] = useState<OrderCommentRecord[]>([]);
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

            const response = await authedFetch(`/api/comments?${params.toString()}`);
            if (response.ok) {
                const data = await response.json();
                setRecords(data.records || []);
                setTotal(data.total || 0);
            }
        } catch (error) {
            console.error('Failed to fetch Comments records:', error);
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
        const promise = authedFetch('/api/comments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        }).then(async (response) => {
            if (!response.ok) throw new Error('Failed to create Comment');
            await refresh();
            return true;
        });

        toast.promise(promise, {
            loading: 'Adding comment...',
            success: 'Comment added successfully',
            error: 'Failed to add comment',
        });

        try {
            await promise;
            return true;
        } catch (error) {
            console.error('Failed to create comment:', error);
            return false;
        } finally {
            setIsCreating(false);
        }
    }, [refresh]);

    const updateRecord = useCallback(async (data: Record<string, unknown>): Promise<boolean> => {
        setIsSaving(true);
        const promise = authedFetch('/api/comments', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        }).then(async (response) => {
            if (!response.ok) throw new Error('Failed to update Comment');
            await refresh();
            return true;
        });

        toast.promise(promise, {
            loading: 'Updating comment...',
            success: 'Comment updated successfully',
            error: 'Failed to update comment',
        });

        try {
            await promise;
            return true;
        } catch (error) {
            console.error('Failed to update comment:', error);
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
