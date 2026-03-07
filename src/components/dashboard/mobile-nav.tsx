/**
 * Mobile Navigation Component
 * Glassmorphism bottom sticky navigation for mobile devices
 */

'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, FileText, Settings, Truck, Package } from 'lucide-react';

interface MobileNavProps {
  activeFilter: string | null;
  onFilterChange: (filter: string | null) => void;
  orderCounts: Record<string, number>;
}

const quickFilters = [
  { id: null, label: 'All', icon: LayoutDashboard },
  { id: 'New Order', label: 'New', icon: FileText },
  { id: 'Material In Process', label: 'Process', icon: Settings },
  { id: 'Loading Point', label: 'Loading', icon: Truck },
  { id: 'Loading Done', label: 'Done', icon: Package },
];

export function MobileNav({ activeFilter, onFilterChange, orderCounts }: MobileNavProps) {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 safe-area-inset-bottom">
      <div className="flex items-center justify-around h-14 px-1">
        {quickFilters.map((filter) => {
          const count = filter.id ? orderCounts[filter.id] || 0 : 0;
          const isActive = activeFilter === filter.id;

          return (
            <Button
              key={filter.id ?? 'all'}
              variant="ghost"
              className={cn(
                'flex flex-col items-center gap-0.5 h-12 px-2 min-w-[52px] rounded-lg transition-all',
                isActive && 'text-primary bg-primary/10'
              )}
              onClick={() => onFilterChange(filter.id)}
            >
              <div className="relative">
                <filter.icon className={cn('h-4.5 w-4.5', isActive && 'text-primary')} />
                {filter.id && count > 0 && (
                  <span className="absolute -top-1.5 -right-2 h-3.5 min-w-3.5 flex items-center justify-center text-[8px] font-bold bg-primary text-primary-foreground rounded-full px-0.5">
                    {count > 99 ? '99+' : count}
                  </span>
                )}
              </div>
              <span className={cn(
                'text-[9px] font-medium',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}>
                {filter.label}
              </span>
            </Button>
          );
        })}
      </div>
    </nav>
  );
}
