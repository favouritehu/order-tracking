/**
 * Sidebar Component
 * Premium desktop navigation sidebar with glassmorphism and color-coded badges
 */

'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LayoutDashboard, Package, Truck, PauseCircle, XCircle, FileText, Settings, Loader2, CheckCircle, Send, ClipboardCheck, Receipt, MessageCircle, SearchCheck } from 'lucide-react';
import Link from 'next/link';
import { ORDER_STATUSES } from '@/lib/constants';

interface SidebarProps {
  activeFilter: string | null;
  onFilterChange: (filter: string | null) => void;
  orderCounts: Record<string, number>;
}

// Status config
const STATUS_CONFIG: Record<string, { icon: typeof Package; dot: string; badge: string }> = {
  'New Order': { icon: FileText, dot: 'bg-blue-500', badge: 'bg-blue-500/15 text-blue-700' },
  'Material In Process': { icon: Settings, dot: 'bg-orange-500', badge: 'bg-orange-500/15 text-orange-700' },
  'Loading Point': { icon: Truck, dot: 'bg-amber-500', badge: 'bg-amber-500/15 text-amber-700' },
  'Loading Done': { icon: Loader2, dot: 'bg-violet-500', badge: 'bg-violet-500/15 text-violet-700' },
  'Documents Ready': { icon: FileText, dot: 'bg-teal-500', badge: 'bg-teal-500/15 text-teal-700' },
  'Dispatched': { icon: Send, dot: 'bg-emerald-500', badge: 'bg-emerald-500/15 text-emerald-700' },
  'Hold': { icon: PauseCircle, dot: 'bg-rose-500', badge: 'bg-rose-500/15 text-rose-700' },
  'Cancel': { icon: XCircle, dot: 'bg-slate-500', badge: 'bg-slate-500/15 text-slate-700' },
};

// Main workflow statuses (excluding special ones)
const mainStatuses = ORDER_STATUSES.filter(s => s !== 'Hold' && s !== 'Cancel');

export function Sidebar({ activeFilter, onFilterChange, orderCounts }: SidebarProps) {
  const totalOrders = Object.values(orderCounts).reduce((a, b) => a + b, 0);

  return (
    <aside className="hidden lg:flex w-56 flex-col border-r bg-muted/20">
      <ScrollArea className="flex-1 py-3 px-2.5">
        {/* All Orders */}
        <nav className="space-y-0.5 mb-4">
          <Button
            variant={activeFilter === null ? 'secondary' : 'ghost'}
            className={cn(
              'w-full justify-start gap-2.5 h-9 text-sm',
              activeFilter === null && 'bg-primary/10 text-primary font-semibold'
            )}
            onClick={() => onFilterChange(null)}
          >
            <LayoutDashboard className="h-4 w-4" />
            <span className="flex-1 text-left">All Orders</span>
            {totalOrders > 0 && (
              <span className="text-[10px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                {totalOrders.toLocaleString()}
              </span>
            )}
          </Button>
        </nav>

        {/* Global Search */}
        <nav className="mb-4">
          <Link href="/search">
            <Button
              variant="ghost"
              className="w-full justify-start gap-2.5 h-9 text-sm font-medium border border-dashed border-indigo-200 hover:bg-indigo-50 text-indigo-600"
            >
              <SearchCheck className="h-4 w-4" />
              <span className="flex-1 text-left">Search All</span>
              <span className="text-[10px] bg-indigo-50 text-indigo-500 px-1.5 py-0.5 rounded font-mono">⌘K</span>
            </Button>
          </Link>
        </nav>

        {/* Order Status */}
        <div className="mb-4">
          <h3 className="text-[10px] font-bold text-muted-foreground mb-1.5 px-3 uppercase tracking-[0.15em]">
            Pipeline
          </h3>
          <nav className="space-y-0.5">
            {mainStatuses.map((status) => {
              const config = STATUS_CONFIG[status];
              const count = orderCounts[status] || 0;
              const isActive = activeFilter === status;

              return (
                <Button
                  key={status}
                  variant={isActive ? 'secondary' : 'ghost'}
                  className={cn(
                    'w-full justify-start gap-2.5 h-8 text-xs font-medium',
                    isActive && 'bg-primary/10 text-primary font-semibold'
                  )}
                  onClick={() => onFilterChange(status)}
                >
                  <span className={cn('w-2 h-2 rounded-full shrink-0', config.dot)} />
                  <span className="flex-1 text-left truncate">{status}</span>
                  {count > 0 && (
                    <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center', config.badge)}>
                      {count.toLocaleString()}
                    </span>
                  )}
                </Button>
              );
            })}
          </nav>
        </div>

        {/* Special */}
        <div>
          <h3 className="text-[10px] font-bold text-muted-foreground mb-1.5 px-3 uppercase tracking-[0.15em]">
            Special
          </h3>
          <nav className="space-y-0.5">
            {(['Hold', 'Cancel'] as const).map((status) => {
              const config = STATUS_CONFIG[status];
              const count = orderCounts[status] || 0;
              const isActive = activeFilter === status;

              return (
                <Button
                  key={status}
                  variant={isActive ? 'secondary' : 'ghost'}
                  className={cn(
                    'w-full justify-start gap-2.5 h-8 text-xs font-medium',
                    isActive && 'bg-primary/10 text-primary font-semibold'
                  )}
                  onClick={() => onFilterChange(status)}
                >
                  <config.icon className={cn('h-3.5 w-3.5', status === 'Hold' ? 'text-rose-500' : 'text-slate-500')} />
                  <span className="flex-1 text-left">{status === 'Cancel' ? 'Cancelled' : status}</span>
                  {count > 0 && (
                    <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center', config.badge)}>
                      {count.toLocaleString()}
                    </span>
                  )}
                </Button>
              );
            })}
          </nav>
        </div>

        {/* QC Section */}
        <div className="mt-4 pt-4 border-t">
          <h3 className="text-[10px] font-bold text-muted-foreground mb-1.5 px-3 uppercase tracking-[0.15em]">
            Quality
          </h3>
          <nav>
            <Link href="/qc">
              <Button
                variant="ghost"
                className="w-full justify-start gap-2.5 h-8 text-xs font-medium"
              >
                <ClipboardCheck className="h-3.5 w-3.5 text-emerald-500" />
                <span className="flex-1 text-left">QC Inspection</span>
              </Button>
            </Link>
          </nav>
        </div>

        {/* U.B Section */}
        <div className="mt-4 pt-4 border-t">
          <h3 className="text-[10px] font-bold text-muted-foreground mb-1.5 px-3 uppercase tracking-[0.15em]">
            Billing
          </h3>
          <nav>
            <Link href="/ub">
              <Button
                variant="ghost"
                className="w-full justify-start gap-2.5 h-8 text-xs font-medium"
              >
                <Receipt className="h-3.5 w-3.5 text-amber-500" />
                <span className="flex-1 text-left">U.B Records</span>
              </Button>
            </Link>
          </nav>
        </div>

        {/* Operations Section */}
        <div className="mt-4 pt-4 border-t">
          <h3 className="text-[10px] font-bold text-muted-foreground mb-1.5 px-3 uppercase tracking-[0.15em]">
            Operations
          </h3>
          <nav className="space-y-0.5">
            <Link href="/comments">
              <Button
                variant="ghost"
                className="w-full justify-start gap-2.5 h-8 text-xs font-medium"
              >
                <MessageCircle className="h-3.5 w-3.5 text-blue-500" />
                <span className="flex-1 text-left">Order Comments</span>
              </Button>
            </Link>
            <Link href="/dispatch">
              <Button
                variant="ghost"
                className="w-full justify-start gap-2.5 h-8 text-xs font-medium"
              >
                <Truck className="h-3.5 w-3.5 text-violet-500" />
                <span className="flex-1 text-left">Dispatch Summary</span>
              </Button>
            </Link>
          </nav>
        </div>
      </ScrollArea>
    </aside>
  );
}
