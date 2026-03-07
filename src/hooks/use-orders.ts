import { useState, useEffect, useCallback, useRef } from 'react';
import { Order, Stats } from '@/types';
import { authedFetch } from '@/lib/api';

interface UseOrdersReturn {
    orders: Order[];
    stats: Stats | null;
    isLoading: boolean;
    isLoadingMore: boolean;
    isRefreshing: boolean;
    updatingId: string | null;
    hasMore: boolean;
    fetchOrders: (forceRefresh?: boolean) => Promise<void>;
    fetchStats: () => Promise<void>;
    refreshAll: () => Promise<void>;
    updateOrderStatus: (orderId: string, newStatus: string) => Promise<boolean>;
    loadMore: () => Promise<void>;
}


export function useOrders(activeFilter: string | null, searchQuery: string): UseOrdersReturn {
    const [orders, setOrders] = useState<Order[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    // Pagination State
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    // Stable refs so the auto-refresh interval never needs to re-register
    const fetchOrdersRef = useRef<(forceRefresh?: boolean) => Promise<void>>(() => Promise.resolve());
    const fetchStatsRef = useRef<() => Promise<void>>(() => Promise.resolve());

    // Reset pagination when filters change
    useEffect(() => {
        setPage(1);
        setOrders([]);
        setHasMore(true);
        setIsLoading(true);

        const fetchFirstPage = async () => {
            try {
                const params = new URLSearchParams();
                if (activeFilter) params.append('status', activeFilter);
                if (searchQuery) params.append('search', searchQuery);
                params.append('page', '1');
                params.append('limit', '20');

                const response = await authedFetch(`/api/orders?${params.toString()}`);
                if (response.ok) {
                    const data = await response.json();
                    setOrders(data.orders || []);
                    setHasMore(data.hasMore);
                }
            } catch (error) {
                console.error('Failed to fetch orders:', error);
            } finally {
                setIsLoading(false);
            }
        };

        const timeoutId = setTimeout(() => {
            fetchFirstPage();
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [activeFilter, searchQuery]);

    // Same stats fetch
    const fetchStats = useCallback(async () => {
        try {
            const response = await authedFetch('/api/orders/stats');
            if (response.ok) {
                const data = await response.json();
                setStats(data);
            }
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        }
    }, []);

    // Fetch orders (refreshes page 1)
    const fetchOrders = useCallback(async (forceRefresh = false) => {
        try {
            if (!forceRefresh) setIsLoading(true);

            const params = new URLSearchParams();
            if (activeFilter) params.append('status', activeFilter);
            if (searchQuery) params.append('search', searchQuery);
            if (forceRefresh) params.append('refresh', 'true');
            params.append('page', '1');
            params.append('limit', '20');

            const response = await authedFetch(`/api/orders?${params.toString()}`);
            if (response.ok) {
                const data = await response.json();
                setOrders(data.orders || []);
                setHasMore(data.hasMore);
                setPage(1);
            } else {
                throw new Error('Failed to fetch orders');
            }
        } catch (error) {
            console.error('Failed to fetch orders:', error);
        } finally {
            if (!forceRefresh) setIsLoading(false);
        }
    }, [activeFilter, searchQuery]);

    // Load More
    const loadMore = useCallback(async () => {
        if (isLoadingMore || !hasMore) return;

        setIsLoadingMore(true);
        const nextPage = page + 1;

        try {
            const params = new URLSearchParams();
            if (activeFilter) params.append('status', activeFilter);
            if (searchQuery) params.append('search', searchQuery);
            params.append('page', nextPage.toString());
            params.append('limit', '20');

            const response = await authedFetch(`/api/orders?${params.toString()}`);
            if (response.ok) {
                const data = await response.json();
                setOrders(prev => [...prev, ...(data.orders || [])]);
                setHasMore(data.hasMore);
                setPage(nextPage);
            }
        } catch (error) {
            console.error('Failed to load more orders:', error);
        } finally {
            setIsLoadingMore(false);
        }
    }, [page, hasMore, isLoadingMore, activeFilter, searchQuery]);

    // Keep refs in sync with latest callbacks
    useEffect(() => { fetchOrdersRef.current = fetchOrders; }, [fetchOrders]);
    useEffect(() => { fetchStatsRef.current = fetchStats; }, [fetchStats]);

    // Update order status
    const updateOrderStatus = useCallback(async (orderId: string, newStatus: string): Promise<boolean> => {
        setUpdatingId(orderId);
        try {
            const response = await authedFetch(`/api/orders/${encodeURIComponent(orderId)}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });

            if (response.ok) {
                await Promise.all([fetchOrders(true), fetchStats()]);
                return true;
            } else {
                const data = await response.json();
                throw new Error(data.error || 'Failed to update order');
            }
        } catch (error) {
            console.error('Update error:', error);
            return false;
        } finally {
            setUpdatingId(null);
        }
    }, [fetchOrders, fetchStats]);

    // Refresh all data
    const refreshAll = async () => {
        setIsRefreshing(true);
        await Promise.all([fetchOrders(true), fetchStats()]);
        setIsRefreshing(false);
    };

    // Fetch stats on mount
    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    // Auto-refresh interval — uses refs so the interval never re-registers on filter/search changes
    useEffect(() => {
        const interval = setInterval(() => {
            fetchOrdersRef.current();
            fetchStatsRef.current();
        }, 60000);

        return () => clearInterval(interval);
    }, []);

    return {
        orders,
        stats,
        isLoading,
        isLoadingMore,
        isRefreshing,
        updatingId,
        hasMore,
        fetchOrders,
        fetchStats,
        refreshAll,
        updateOrderStatus,
        loadMore
    };
}
