/**
 * Orders List Component
 * Responsive grid showing order cards with infinite scroll
 */

'use client';

import { MemoizedOrderCard } from './order-card';
import { Package, Loader2 } from 'lucide-react';
import { Order } from '@/types';
import { OrderCardSkeleton } from '@/components/ui/skeleton-loader';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, memo } from 'react';

interface OrdersListProps {
  orders: Order[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  updatingId: string | null;
  onUpdateStatus: (order: Order) => void;
  onViewDetails: (order: Order) => void;
  onLoadMore: () => void;
}

export const OrdersList = memo(function OrdersList({
  orders,
  isLoading,
  isLoadingMore,
  hasMore,
  updatingId,
  onUpdateStatus,
  onViewDetails,
  onLoadMore
}: OrdersListProps) {
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore && !isLoading) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, isLoading, onLoadMore]);

  if (isLoading && orders.length === 0) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
          <OrderCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (orders.length === 0 && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="p-4 rounded-2xl bg-muted/50 mb-4">
          <Package className="h-12 w-12 text-muted-foreground/40" />
        </div>
        <h3 className="text-base font-semibold mb-1">No orders found</h3>
        <p className="text-sm text-muted-foreground">
          Try adjusting your search or filter criteria
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <motion.div
        layout
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3"
      >
        <AnimatePresence mode="popLayout">
          {orders.map((order) => (
            <MemoizedOrderCard
              key={order['Unique Id']}
              order={order}
              onUpdateStatus={onUpdateStatus}
              onViewDetails={onViewDetails}
              isUpdating={updatingId === order['Unique Id']}
            />
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Load More trigger / Loading indicator */}
      {(hasMore || isLoadingMore) && (
        <div
          ref={loadMoreRef}
          className="flex justify-center py-6"
        >
          {isLoadingMore ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading more...</span>
            </div>
          ) : (
            <div className="h-6" />
          )}
        </div>
      )}
    </div>
  );
}, (prev, next) => {
  return (
    prev.isLoading === next.isLoading &&
    prev.isLoadingMore === next.isLoadingMore &&
    prev.hasMore === next.hasMore &&
    prev.updatingId === next.updatingId &&
    prev.orders === next.orders
  );
});
