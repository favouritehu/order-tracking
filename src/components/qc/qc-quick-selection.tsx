import { useOrders } from '@/hooks/use-orders';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Hash, Building2, ChevronRight } from 'lucide-react';
import { StatusBadge } from '@/components/dashboard/status-badge';

export function QcQuickSelection({ onSelectOrder }: { onSelectOrder: (orderId: string) => void }) {
    const { orders, isLoading } = useOrders('Loading Done,Loading Point,Documents Ready', '');

    if (isLoading) {
        return (
            <div className="flex justify-center p-8 w-full max-w-2xl mx-auto mt-8">
                <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
            </div>
        );
    }

    if (orders.length === 0) {
        return null;
    }

    return (
        <Card className="w-full max-w-2xl mx-auto mt-8 border-dashed shadow-sm">
            <CardHeader className="pb-3 border-b bg-muted/30">
                <CardTitle className="text-sm font-semibold text-left flex items-center justify-between">
                    <span>Quick Selection - Ready for QC</span>
                    <span className="text-xs font-normal text-muted-foreground bg-background border px-2 py-0.5 rounded-full shadow-sm">{orders.length} orders</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <div className="divide-y max-h-[400px] overflow-auto slim-scrollbar">
                    {orders.map((order) => (
                        <button
                            key={order['Unique Id']}
                            onClick={() => onSelectOrder(order['Unique Id'])}
                            className="w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors flex items-center justify-between group"
                        >
                            <div className="flex flex-col gap-1.5 min-w-0 flex-1 pr-4">
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1 block max-w-[120px]">
                                        <Hash className="h-3.5 w-3.5 text-primary shrink-0 inline mb-0.5" />
                                        <span className="text-sm font-bold font-mono text-foreground/90 truncate inline-block align-middle">
                                            {order['Unique Id']}
                                        </span>
                                    </div>
                                    <StatusBadge status={order.Status} />
                                </div>

                                <div className="flex items-center gap-1.5 text-muted-foreground min-w-0">
                                    <Building2 className="h-3.5 w-3.5 shrink-0" />
                                    <span className="text-xs font-medium truncate" title={`${order['COMPANY NAME']} ${order['Name'] ? `/ ${order['Name']}` : ''}`}>
                                        {order['COMPANY NAME'] || 'N/A'} {order['Name'] ? `/ ${order['Name']}` : ''}
                                    </span>
                                </div>
                            </div>

                            <div className="shrink-0 p-1.5 rounded-full bg-emerald-50 text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                <ChevronRight className="h-4 w-4" />
                            </div>
                        </button>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
