/**
 * Order Card Component
 * Compact, information-dense card with branded styling
 */

'use client';

import { Button } from '@/components/ui/button';
import { memo } from 'react';
import { StatusBadge } from './status-badge';
import { Building2, Hash, Phone, MapPin, Calendar, Weight, Palette, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { Order } from '@/types';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface OrderCardProps {
  order: Order;
  onUpdateStatus: (order: Order) => void;
  onViewDetails: (order: Order) => void;
  isUpdating: boolean;
}

// Map status to gradient border
const STATUS_ACCENTS: Record<string, string> = {
  'New Order': 'from-blue-500 to-blue-400',
  'Material In Process': 'from-orange-500 to-amber-400',
  'Loading Point': 'from-amber-500 to-yellow-400',
  'Loading Done': 'from-violet-500 to-purple-400',
  'Documents Ready': 'from-teal-500 to-cyan-400',
  'Dispatched': 'from-emerald-500 to-green-400',
  'Hold': 'from-rose-500 to-red-400',
  'Cancel': 'from-slate-500 to-gray-400',
};

export const OrderCard = memo(function OrderCard({ order, onUpdateStatus, onViewDetails, isUpdating }: OrderCardProps) {
  const canUpdate = order.Status === 'Loading Point' || order.Status === 'Material In Process';
  const accent = STATUS_ACCENTS[order.Status] || 'from-gray-400 to-gray-300';
  const actionLabel = order.Status === 'Material In Process' ? '→ Move to Loading Point' : '✓ Mark Loading Done';
  const [copied, setCopied] = useState(false);

  const handleCopyId = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(order['Unique Id']);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      onClick={() => onViewDetails(order)}
      className="cursor-pointer"
    >
      <div className={cn(
        'relative rounded-xl bg-card border shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group'
      )}>
        {/* Top gradient accent */}
        <div className={cn('absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r', accent)} />

        {/* Header: ID + Status */}
        <div className="flex items-center justify-between px-3.5 pt-3.5 pb-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <Hash className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="text-xs font-bold font-mono text-foreground/80 truncate">
              {order['Unique Id']}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-5 w-5 ml-1 rounded hover:bg-muted-foreground/10", copied && "text-green-600")}
              onClick={handleCopyId}
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3 text-muted-foreground hover:text-foreground" />}
            </Button>
          </div>
          <StatusBadge status={order.Status} />
        </div>

        {/* Body: Key info rows */}
        <div className="px-3.5 pb-2 space-y-1.5">
          {/* Company - primary info */}
          <div className="flex items-center gap-2">
            <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="text-sm font-semibold truncate" title={order['COMPANY NAME']}>
              {order['COMPANY NAME'] || 'N/A'}
            </span>
          </div>

          {/* Two-column info grid for density */}
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {/* Product */}
            <div className="flex items-center gap-1.5 col-span-2">
              <Palette className="h-3 w-3 shrink-0" />
              <span className="truncate">{order['PRUDUCT'] || 'N/A'}</span>
            </div>

            {/* Quantity */}
            <div className="flex items-center gap-1.5">
              <Weight className="h-3 w-3 shrink-0" />
              <span className="font-mono font-medium text-foreground">
                {order['Total Order Quantity in Kg'] || '0'} <span className="text-muted-foreground">Kg</span>
              </span>
            </div>

            {/* Color */}
            {order['COLOR'] && (
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-indigo-400 to-violet-400 shrink-0" />
                <span className="truncate">{order['COLOR']}</span>
              </div>
            )}

            {/* Location */}
            {(order['Delivery_Location'] || order['Address']) && (
              <div className="flex items-center gap-1.5 col-span-2">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">{order['Delivery_Location'] || order['Address']}</span>
              </div>
            )}

            {/* Date */}
            {order['order_date'] && (
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3 w-3 shrink-0" />
                <span className="truncate">{order['order_date']}</span>
              </div>
            )}

            {/* Phone */}
            {order.Phone && (
              <div className="flex items-center gap-1.5">
                <Phone className="h-3 w-3 shrink-0" />
                <span className="font-mono truncate">{order.Phone}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer: Action */}
        <div className="px-3.5 pb-3 pt-1.5">
          {canUpdate ? (
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onUpdateStatus(order);
              }}
              disabled={isUpdating}
              className="w-full h-8 text-xs font-semibold bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white shadow-sm"
            >
              {isUpdating ? 'Updating...' : actionLabel}
            </Button>
          ) : (
            <div className="h-8 flex items-center justify-center">
              <span className="text-[10px] text-muted-foreground/40 tracking-wide uppercase">
                Tap for details
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
});

// Optimization: Prevent re-rendering cards unless their specific data changes
OrderCard.displayName = 'OrderCard';

export const MemoizedOrderCard = memo(OrderCard, (prev, next) => {
  return (
    prev.isUpdating === next.isUpdating &&
    prev.order.Status === next.order.Status &&
    prev.order['Unique Id'] === next.order['Unique Id'] &&
    prev.order['Total Order Quantity in Kg'] === next.order['Total Order Quantity in Kg'] &&
    prev.order['Aprox Date'] === next.order['Aprox Date']
  );
});
