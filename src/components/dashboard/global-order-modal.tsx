'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { OrderDetailsModal } from './order-details-modal';
import { Order } from '@/types';
import { authedFetch } from '@/lib/api';

export function GlobalOrderModal() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const [order, setOrder] = useState<Order | null>(null);

    const viewOrderId = searchParams.get('viewOrder');

    const handleClose = useCallback(() => {
        setOrder(null);

        // Remove 'viewOrder' from URL without causing a full page refresh
        const newSearchParams = new URLSearchParams(searchParams.toString());
        newSearchParams.delete('viewOrder');

        const queryStr = newSearchParams.toString();
        const newUrl = queryStr ? `${pathname}?${queryStr}` : pathname;

        router.replace(newUrl, { scroll: false });
    }, [pathname, router, searchParams]);

    useEffect(() => {
        let isMounted = true;

        async function loadOrder(id: string) {
            try {
                // Because the orders API doesn't have a direct "get by ID" endpoint,
                // we will use the search endpoint, which should return the exact match.
                const res = await authedFetch(`/api/orders?search=${encodeURIComponent(id)}&limit=1`);
                if (res.ok) {
                    const data = await res.json();
                    if (isMounted) {
                        if (data.orders && data.orders.length > 0) {
                            setOrder(data.orders[0]);
                        } else {
                            console.error('Order not found');
                            handleClose();
                        }
                    }
                }
            } catch (error) {
                console.error('Failed to fetch order details for modal:', error);
                if (isMounted) handleClose();
            }
        }

        if (viewOrderId) {
            loadOrder(viewOrderId);
        }

        return () => {
            isMounted = false;
        };
    }, [viewOrderId, handleClose, order]);

    if (!viewOrderId) return null;

    return (
        <OrderDetailsModal
            order={order}
            isOpen={!!viewOrderId}
            onClose={handleClose}
        />
    );
}
