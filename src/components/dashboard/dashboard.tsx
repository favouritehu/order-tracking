/**
 * Dashboard Component
 * Main dashboard container with all features integrated
 */

'use client';

import { useState, useEffect } from 'react';
import { Navbar } from './navbar';
import { Sidebar } from './sidebar';
import { MobileNav } from './mobile-nav';
import { OrdersList } from './orders-list';
import dynamic from 'next/dynamic';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

// Lazy load the heavy modal component since it's only needed on click
const OrderDetailsModal = dynamic(
  () => import('./order-details-modal').then(mod => ({ default: mod.OrderDetailsModal })),
  { ssr: false }
);
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Package, Truck, PauseCircle, XCircle, SearchCheck, ClipboardCheck, Receipt, MessageCircle, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { Order } from '@/types';
import { useOrders } from '@/hooks/use-orders';
import { toast } from 'sonner';

export function Dashboard() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // UI State
  const urlFilter = searchParams.get('filter');
  const defaultFilter = urlFilter !== null ? urlFilter : 'Loading Point';

  const [searchQuery, setSearchQuery] = useState('');
  const [detailsOrder, setDetailsOrder] = useState<Order | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Derive the active filter exclusively from the URL filter to avoid sync issues.
  // When urlFilter is literally missing, use defaultFilter. 
  // Otherwise, use whatever is in the URL (which handles 'All Orders' via an empty string).
  const currentFilter = urlFilter === null ? defaultFilter : (urlFilter || null);

  // Data Hook
  const {
    orders,
    stats,
    isLoading,
    isRefreshing,
    updatingId,
    refreshAll,
    updateOrderStatus,
    isLoadingMore,
    hasMore,
    loadMore
  } = useOrders(currentFilter, searchQuery);

  // Handle filter change
  const handleFilterChange = (filter: string | null) => {
    setSearchQuery('');

    // Update URL
    const params = new URLSearchParams(searchParams.toString());
    if (filter) {
      params.set('filter', filter);
    } else {
      params.delete('filter');
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  // Background status update with toast notification
  const handleUpdateStatus = (order: Order) => {
    const targetStatus = order.Status === 'Material In Process' ? 'Loading Point' : 'Loading Done';

    toast.promise(
      updateOrderStatus(order['Unique Id'], targetStatus).then(success => {
        if (!success) throw new Error('Update failed');
        return success;
      }),
      {
        loading: `Moving ${order['Unique Id']} → ${targetStatus}...`,
        success: `${order['Unique Id']} moved to "${targetStatus}"`,
        error: `Failed to update ${order['Unique Id']}`,
      }
    );
  };

  // View details handler
  const handleViewDetails = (order: Order) => {
    setDetailsOrder(order);
    setIsDetailsOpen(true);
  };

  const quickFilters = [
    { id: null, label: 'All', icon: LayoutDashboard },
    { id: 'Loading Point', label: 'Loading', icon: Truck },
    { id: 'Loading Done', label: 'Done', icon: Package },
    { id: 'Hold', label: 'Hold', icon: PauseCircle },
    { id: 'Cancel', label: 'Cancel', icon: XCircle },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      {/* Navbar */}
      <Navbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onRefresh={refreshAll}
        isRefreshing={isRefreshing}
        onMenuToggle={() => setMobileMenuOpen(true)}
      />

      <div className="flex flex-1">
        {/* Desktop Sidebar */}
        <Sidebar
          activeFilter={currentFilter}
          onFilterChange={handleFilterChange}
          orderCounts={stats?.statusBreakdown || {}}
        />

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-5 pb-24 lg:pb-5 overflow-auto">

          {/* Active Filter + Count */}
          {!isLoading && (
            <div className="mb-4 flex items-center gap-3">
              <span className="text-sm font-medium text-foreground">
                {orders.length.toLocaleString()} orders
              </span>
              {searchQuery && (
                <span className="text-xs text-muted-foreground">
                  matching &quot;{searchQuery}&quot;
                </span>
              )}
              {currentFilter && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleFilterChange(null)}
                  className="h-6 text-xs px-2.5 gap-1.5"
                >
                  {currentFilter}
                  <span className="text-muted-foreground">×</span>
                </Button>
              )}
            </div>
          )}

          {/* Orders List */}
          <OrdersList
            orders={orders}
            isLoading={isLoading}
            isLoadingMore={isLoadingMore}
            hasMore={hasMore}
            updatingId={updatingId}
            onUpdateStatus={handleUpdateStatus}
            onViewDetails={handleViewDetails}
            onLoadMore={loadMore}
          />
        </main>
      </div>

      {/* Mobile Navigation */}
      <MobileNav
        activeFilter={currentFilter}
        onFilterChange={handleFilterChange}
        orderCounts={stats?.statusBreakdown || {}}
      />

      {/* Mobile Menu Sheet */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-72">
          <SheetHeader>
            <SheetTitle>Menu</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-6 overflow-y-auto max-h-[calc(100vh-100px)] pb-6 pr-2">
            {/* Global Search */}
            <div>
              <Link href="/search" onClick={() => setMobileMenuOpen(false)}>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 h-10 text-sm font-medium border border-dashed border-indigo-200 hover:bg-indigo-50 text-indigo-600"
                >
                  <SearchCheck className="h-4 w-4" />
                  <span className="flex-1 text-left">Search All Orders</span>
                </Button>
              </Link>
            </div>

            {/* Quick Filters */}
            <div>
              <h3 className="text-[10px] font-bold text-muted-foreground mb-2 uppercase tracking-[0.15em]">Pipeline Filters</h3>
              <nav className="space-y-1">
                {quickFilters.map((filter) => (
                  <Button
                    key={filter.id ?? 'all'}
                    variant={currentFilter === filter.id ? 'secondary' : 'ghost'}
                    className={cn(
                      'w-full justify-start gap-3 h-10',
                      currentFilter === filter.id && 'bg-primary/10 text-primary font-semibold'
                    )}
                    onClick={() => {
                      handleFilterChange(filter.id);
                      setMobileMenuOpen(false);
                    }}
                  >
                    <filter.icon className="h-4.5 w-4.5" />
                    {filter.label}
                    {filter.id && stats?.statusBreakdown[filter.id] !== undefined && (
                      <span className="ml-auto text-xs font-bold text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                        {stats.statusBreakdown[filter.id].toLocaleString()}
                      </span>
                    )}
                  </Button>
                ))}
              </nav>
            </div>

            {/* Quality */}
            <div>
              <h3 className="text-[10px] font-bold text-muted-foreground mb-2 uppercase tracking-[0.15em]">Quality</h3>
              <nav>
                <Link href="/qc" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start gap-3 h-10 text-sm font-medium">
                    <ClipboardCheck className="h-4.5 w-4.5 text-emerald-500" />
                    <span className="flex-1 text-left">QC Inspection</span>
                  </Button>
                </Link>
              </nav>
            </div>

            {/* Billing */}
            <div>
              <h3 className="text-[10px] font-bold text-muted-foreground mb-2 uppercase tracking-[0.15em]">Billing</h3>
              <nav>
                <Link href="/ub" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start gap-3 h-10 text-sm font-medium">
                    <Receipt className="h-4.5 w-4.5 text-amber-500" />
                    <span className="flex-1 text-left">U.B Records</span>
                  </Button>
                </Link>
              </nav>
            </div>

            {/* Operations */}
            <div>
              <h3 className="text-[10px] font-bold text-muted-foreground mb-2 uppercase tracking-[0.15em]">Operations</h3>
              <nav className="space-y-1">
                <Link href="/comments" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start gap-3 h-10 text-sm font-medium">
                    <MessageCircle className="h-4.5 w-4.5 text-blue-500" />
                    <span className="flex-1 text-left">Order Comments</span>
                  </Button>
                </Link>
                <Link href="/dispatch" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start gap-3 h-10 text-sm font-medium">
                    <Truck className="h-4.5 w-4.5 text-violet-500" />
                    <span className="flex-1 text-left">Dispatch Summary</span>
                  </Button>
                </Link>
              </nav>
            </div>

            {/* Analytics */}
            <div>
              <h3 className="text-[10px] font-bold text-muted-foreground mb-2 uppercase tracking-[0.15em]">Analytics</h3>
              <nav>
                <Link href="/reports" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start gap-3 h-10 text-sm font-medium">
                    <BarChart3 className="h-4.5 w-4.5 text-indigo-500" />
                    <span className="flex-1 text-left">Reports Dashboard</span>
                  </Button>
                </Link>
              </nav>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Details Modal (Lazy Loaded) */}
      {isDetailsOpen && (
        <OrderDetailsModal
          order={detailsOrder}
          isOpen={isDetailsOpen}
          onClose={() => {
            setIsDetailsOpen(false);
            setDetailsOrder(null);
          }}
        />
      )}
    </div>
  );
}
