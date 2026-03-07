/**
 * useQc Hook
 * Manages QC data fetching, searching, and state
 */

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { QcRecord, Order } from '@/types';
import { authedFetch } from '@/lib/api';

interface UseQcReturn {
    qcRecords: QcRecord[];
    order: Order | null;
    isLoading: boolean;
    isSearching: boolean;
    error: string | null;
    searchOrder: (orderId: string) => Promise<void>;
    addQcRecord: (data: Partial<QcRecord>) => Promise<boolean>;
    refreshQc: () => Promise<void>;
    clearSearch: () => void;
}

export function useQc(): UseQcReturn {
    const [qcRecords, setQcRecords] = useState<QcRecord[]>([]);
    const [order, setOrder] = useState<Order | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentOrderId, setCurrentOrderId] = useState<string>('');

    // Search order and load QC records
    const searchOrder = useCallback(async (orderId: string) => {
        if (!orderId.trim()) return;

        setIsSearching(true);
        setError(null);
        setCurrentOrderId(orderId.trim());

        try {
            // Fetch order details and QC records in parallel
            const [orderRes, qcRes] = await Promise.all([
                authedFetch(`/api/orders?search=${encodeURIComponent(orderId.trim())}&limit=1`),
                authedFetch(`/api/qc?orderId=${encodeURIComponent(orderId.trim())}`),
            ]);

            if (orderRes.ok) {
                const orderData = await orderRes.json();
                const found = orderData.orders?.[0] || null;
                setOrder(found);
                if (!found) {
                    setError(`No order found with ID "${orderId}"`);
                }
            } else {
                setOrder(null);
            }

            if (qcRes.ok) {
                const qcData = await qcRes.json();
                setQcRecords(qcData.records || []);
            } else {
                setQcRecords([]);
            }
        } catch (err) {
            console.error('Failed to search:', err);
            setError('Failed to search. Please try again.');
            setOrder(null);
            setQcRecords([]);
        } finally {
            setIsSearching(false);
        }
    }, []);

    // Refresh current QC data
    const refreshQc = useCallback(async () => {
        if (!currentOrderId) return;
        setIsLoading(true);
        try {
            const response = await authedFetch(`/api/qc?orderId=${encodeURIComponent(currentOrderId)}&refresh=true`);
            if (response.ok) {
                const data = await response.json();
                setQcRecords(data.records || []);
            }
        } catch (err) {
            console.error('Failed to refresh QC:', err);
        } finally {
            setIsLoading(false);
        }
    }, [currentOrderId]);

    // Add new QC record
    const addQcRecordFn = useCallback(async (data: Partial<QcRecord>): Promise<boolean> => {
        const promise = authedFetch('/api/qc', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        }).then(async (response) => {
            if (!response.ok) throw new Error('Failed to add QC record');
            await refreshQc();
            return true;
        });

        toast.promise(promise, {
            loading: 'Adding QC record in background...',
            success: 'QC record added successfully',
            error: 'Failed to add QC record',
        });

        try {
            await promise;
            return true;
        } catch (err) {
            console.error('Failed to add QC record:', err);
            return false;
        }
    }, [refreshQc]);

    // Clear search state
    const clearSearch = useCallback(() => {
        setQcRecords([]);
        setOrder(null);
        setError(null);
        setCurrentOrderId('');
    }, []);

    return {
        qcRecords,
        order,
        isLoading,
        isSearching,
        error,
        searchOrder,
        addQcRecord: addQcRecordFn,
        refreshQc,
        clearSearch,
    };
}
