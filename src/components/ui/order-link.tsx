import Link from 'next/link';
import { ExternalLink, Hash } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePathname, useSearchParams } from 'next/navigation';

interface OrderLinkProps {
    orderId: string;
    className?: string;
    showIcon?: boolean;
}

export function OrderLink({ orderId, className, showIcon = true }: OrderLinkProps) {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Prevent passing the parameter down if already inside the order details modal context
    // However, the GlobalOrderModal intercepts the viewOrder token on any route.
    const currentParams = new URLSearchParams(searchParams.toString());
    currentParams.set('viewOrder', orderId);

    return (
        <Link
            href={`${pathname}?${currentParams.toString()}`}
            shallow={true}
            scroll={false}
            className={cn(
                "inline-flex items-center gap-1.5 font-mono text-blue-600 hover:text-blue-800 transition-colors group",
                className
            )}
            title={`View details for ${orderId}`}
            onClick={(e) => {
                // Prevent row click handlers from firing if this link is clicked within a table row
                e.stopPropagation();
            }}
        >
            <span className="font-semibold bg-blue-50/50 group-hover:bg-blue-100 px-1.5 py-0.5 rounded transition-colors border border-blue-100/50 group-hover:border-blue-200">
                {orderId}
            </span>
            {showIcon && (
                <ExternalLink className="h-3 w-3 opacity-50 group-hover:opacity-100 transition-opacity" />
            )}
        </Link>
    );
}
