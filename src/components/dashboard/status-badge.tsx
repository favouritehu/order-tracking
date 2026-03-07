/**
 * Status Badge Component
 * Compact status badge with refined color coding
 */

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
}

// Refined color classes
const STATUS_STYLES: Record<string, string> = {
  'New Order': 'bg-blue-500/15 text-blue-700 border-blue-200',
  'Material In Process': 'bg-orange-500/15 text-orange-700 border-orange-200',
  'Loading Point': 'bg-amber-500/15 text-amber-700 border-amber-200',
  'Loading Done': 'bg-violet-500/15 text-violet-700 border-violet-200',
  'Documents Ready': 'bg-teal-500/15 text-teal-700 border-teal-200',
  'Dispatched': 'bg-emerald-500/15 text-emerald-700 border-emerald-200',
  'Hold': 'bg-rose-500/15 text-rose-700 border-rose-200',
  'Cancel': 'bg-slate-500/15 text-slate-700 border-slate-200',
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const styleClass = STATUS_STYLES[status] || 'bg-gray-500/15 text-gray-700 border-gray-200';

  return (
    <Badge
      variant="outline"
      className={cn(
        'font-semibold px-2 py-0.5 text-[10px] tracking-wide uppercase border',
        styleClass
      )}
    >
      {status || 'No Status'}
    </Badge>
  );
}
