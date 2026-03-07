/**
 * QC Record Card Component
 * Displays a QC inspection record with all inspection details
 */

'use client';

import { QcRecord } from '@/types';
import { cn } from '@/lib/utils';
import { CheckCircle2, XCircle, User, Calendar, Truck, Package, Scale, ClipboardCheck, Shield } from 'lucide-react';
import { OrderLink } from '@/components/ui/order-link';

interface QcRecordCardProps {
    record: QcRecord;
}

// QC check result display
function QcCheckItem({ label, value }: { label: string; value: string }) {
    if (!value) return null;

    const isOk = value.toLowerCase().includes('ok') || value.toLowerCase() === 'y' || value.toLowerCase() === 'no';
    const isBad = value.toLowerCase().includes('damage') || value.toLowerCase().includes('fail') || value.toLowerCase().includes('bad');

    return (
        <div className="flex items-center justify-between py-1.5">
            <span className="text-xs text-muted-foreground">{label}</span>
            <span className={cn(
                'text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1',
                isOk && 'bg-emerald-500/10 text-emerald-700',
                isBad && 'bg-red-500/10 text-red-600',
                !isOk && !isBad && 'bg-blue-500/10 text-blue-700'
            )}>
                {isOk && <CheckCircle2 className="h-3 w-3" />}
                {isBad && <XCircle className="h-3 w-3" />}
                {value}
            </span>
        </div>
    );
}

export function QcRecordCard({ record }: QcRecordCardProps) {
    return (
        <div className="rounded-xl border bg-card overflow-hidden hover:shadow-md transition-all duration-200">
            {/* Top accent */}
            <div className="h-[3px] bg-gradient-to-r from-emerald-500 to-teal-400" />

            {/* Header */}
            <div className="px-4 pt-3 pb-2 flex items-center justify-between">
                <div className="flex items-center gap-1.5 min-w-0">
                    <OrderLink orderId={record['Order Id']} />
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>{record['Date'] || 'No date'}</span>
                </div>
            </div>

            {/* Party Name */}
            <div className="px-4 pb-2">
                <p className="text-sm font-semibold truncate">{record['Party Name']}</p>
            </div>

            {/* QC Checks */}
            <div className="px-4 pb-2 space-y-0 divide-y divide-border/50">
                <QcCheckItem label="Core" value={record['Core']} />
                <QcCheckItem label="Packaging" value={record['Packaging']} />
                <QcCheckItem label="Sticker" value={record['Sticker']} />
                <QcCheckItem label="Hook Sticker" value={record['No  Hook Sticker']} />
                <QcCheckItem label="Damage" value={record['If Any Damage']} />
            </div>

            {/* Details Grid */}
            <div className="px-4 py-2 bg-muted/30 border-t">
                <div className="grid grid-cols-2 gap-2 text-xs">
                    {record['Counting'] && (
                        <div className="flex items-center gap-1.5">
                            <Package className="h-3 w-3 text-muted-foreground" />
                            <span className="text-muted-foreground">Count:</span>
                            <span className="font-semibold">{record['Counting']}</span>
                        </div>
                    )}
                    {record['Net wt'] && (
                        <div className="flex items-center gap-1.5">
                            <Scale className="h-3 w-3 text-muted-foreground" />
                            <span className="text-muted-foreground">Net:</span>
                            <span className="font-semibold">{record['Net wt']} kg</span>
                        </div>
                    )}
                    {record['Gross wt'] && (
                        <div className="flex items-center gap-1.5">
                            <Scale className="h-3 w-3 text-muted-foreground" />
                            <span className="text-muted-foreground">Gross:</span>
                            <span className="font-semibold">{record['Gross wt']} kg</span>
                        </div>
                    )}
                    {record['Truck Wt'] && (
                        <div className="flex items-center gap-1.5">
                            <Truck className="h-3 w-3 text-muted-foreground" />
                            <span className="text-muted-foreground">Truck:</span>
                            <span className="font-semibold">{record['Truck Wt']} kg</span>
                        </div>
                    )}
                    {record['Tranasport Methode'] && (
                        <div className="flex items-center gap-1.5 col-span-2">
                            <Truck className="h-3 w-3 text-muted-foreground" />
                            <span className="text-muted-foreground">Transport:</span>
                            <span className="font-semibold">{record['Tranasport Methode']}</span>
                        </div>
                    )}
                    {record['Loading By'] && (
                        <div className="flex items-center gap-1.5 col-span-2">
                            <User className="h-3 w-3 text-muted-foreground" />
                            <span className="text-muted-foreground">Loading By:</span>
                            <span className="font-semibold">{record['Loading By']}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer: QC By & Audit */}
            <div className="px-4 py-2.5 border-t flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs">
                    <ClipboardCheck className="h-3 w-3 text-emerald-500" />
                    <span className="text-muted-foreground">QC By:</span>
                    <span className="font-semibold">{record['Qc By'] || 'N/A'}</span>
                </div>
                {record['Audit'] && (
                    <div className="flex items-center gap-1.5 text-xs">
                        <Shield className="h-3 w-3 text-violet-500" />
                        <span className="text-muted-foreground">Audit:</span>
                        <span className="font-semibold">{record['Audit']}</span>
                    </div>
                )}
            </div>
        </div>
    );
}
