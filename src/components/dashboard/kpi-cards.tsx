/**
 * KPI Cards Component
 * Displays key performance indicators with animated counters and gradient styling
 */

'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Package, Truck, CheckCircle, XCircle, PauseCircle, Send } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';

interface KPIData {
  totalOrders: number;
  loadingPoint: number;
  loadingDone: number;
  statusBreakdown: Record<string, number>;
}

interface KPICardsProps {
  data: KPIData | null;
  isLoading: boolean;
  onFilterChange?: (filter: string | null) => void;
  activeFilter?: string | null;
}

// Animated counter hook
function useAnimatedCounter(target: number, duration = 800) {
  const [count, setCount] = useState(0);
  const prevTarget = useRef(0);

  useEffect(() => {
    if (target === prevTarget.current) return;
    prevTarget.current = target;

    const start = 0;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(start + (target - start) * eased));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [target, duration]);

  return count;
}

function KPICard({ title, value, icon: Icon, gradient, isActive, onClick }: {
  title: string;
  value: number;
  icon: typeof Package;
  gradient: string;
  isActive?: boolean;
  onClick?: () => void;
}) {
  const animatedValue = useAnimatedCounter(value);

  return (
    <Card
      className={cn(
        'group relative overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5'
      )}
      onClick={onClick}
    >
      {/* Gradient accent bar */}
      <div className={cn('absolute top-0 left-0 right-0 h-1', gradient)} />
      <CardContent className="p-4 md:p-5">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {title}
            </p>
            <p className="text-2xl md:text-3xl font-bold tracking-tight">
              {animatedValue.toLocaleString()}
            </p>
          </div>
          <div className={cn(
            'p-2.5 rounded-xl transition-all duration-300 group-hover:scale-110',
            gradient,
          )}>
            <Icon className="h-5 w-5 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function KPICards({ data, isLoading, onFilterChange, activeFilter }: KPICardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 md:gap-4 mb-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="animate-pulse overflow-hidden">
            <div className="h-1 bg-muted" />
            <CardContent className="p-4 md:p-5">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-3 w-16 bg-muted rounded" />
                  <div className="h-8 w-12 bg-muted rounded" />
                </div>
                <div className="h-10 w-10 bg-muted rounded-xl" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const kpis = [
    {
      title: 'Total Orders',
      value: data?.totalOrders || 0,
      icon: Package,
      gradient: 'bg-gradient-to-br from-indigo-500 to-indigo-600',
      filter: null,
    },
    {
      title: 'Loading Point',
      value: data?.loadingPoint || 0,
      icon: Truck,
      gradient: 'bg-gradient-to-br from-amber-500 to-orange-500',
      filter: 'Loading Point',
    },
    {
      title: 'Loading Done',
      value: data?.loadingDone || 0,
      icon: CheckCircle,
      gradient: 'bg-gradient-to-br from-violet-500 to-purple-600',
      filter: 'Loading Done',
    },
    {
      title: 'Dispatched',
      value: data?.statusBreakdown?.['Dispatched'] || 0,
      icon: Send,
      gradient: 'bg-gradient-to-br from-emerald-500 to-green-600',
      filter: 'Dispatched',
    },
    {
      title: 'On Hold',
      value: data?.statusBreakdown?.['Hold'] || 0,
      icon: PauseCircle,
      gradient: 'bg-gradient-to-br from-rose-500 to-red-600',
      filter: 'Hold',
    },
    {
      title: 'Cancelled',
      value: data?.statusBreakdown?.['Cancel'] || 0,
      icon: XCircle,
      gradient: 'bg-gradient-to-br from-slate-400 to-slate-500',
      filter: 'Cancel',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 md:gap-4 mb-6">
      {kpis.map((kpi) => (
        <KPICard
          key={kpi.title}
          title={kpi.title}
          value={kpi.value}
          icon={kpi.icon}
          gradient={kpi.gradient}
          isActive={activeFilter === kpi.filter}
          onClick={() => onFilterChange?.(kpi.filter)}
        />
      ))}
    </div>
  );
}
