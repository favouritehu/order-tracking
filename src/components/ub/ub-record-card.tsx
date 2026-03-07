/**
 * U.B Record Card Component
 * Compact card showing key U.B billing info
 */

'use client';

import { UbRecord, getProductLines } from '@/types/ub';
import { cn } from '@/lib/utils';
import {
    Receipt,
    Building2,
    Hash,
    Calendar,
    Package,
    TrendingDown,
    ArrowRight,
} from 'lucide-react';

interface UbRecordCardProps {
    record: UbRecord;
    onClick: (record: UbRecord) => void;
}

function formatCurrency(value: string | number): string {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num) || num === 0) return '—';
    return '₹' + num.toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

export function UbRecordCard({ record, onClick }: UbRecordCardProps) {
    const productLines = getProductLines(record);
    const grandTotal = parseFloat(record['GRAND TOTAL AMOUNT'] || '0') || 0;
    const totalInv = parseFloat(record['TOTAL INVOICE AMT'] || '0') || 0;
    const totalUb = parseFloat(record['TOTAL U.B AMOUNT'] || '0') || 0;

    return (
        <div
            className="group relative bg-card rounded-xl border shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden"
            onClick={() => onClick(record)}
        >
            {/* Top accent */}
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-amber-500 to-orange-400" />

            <div className="p-4">
                {/* Header: ID + Party Name */}
                <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="inline-flex items-center gap-1 text-xs font-mono font-bold text-amber-700 bg-amber-500/15 px-2 py-0.5 rounded-md">
                                <Hash className="h-3 w-3" />
                                {record['Unique ID']}
                            </span>
                            {record['ORDER ID'] && (
                                <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                    {record['ORDER ID']}
                                </span>
                            )}
                        </div>
                        <h3 className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">
                            {record['Party Name'] || 'Unknown Party'}
                        </h3>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all shrink-0 mt-1" />
                </div>

                {/* Amount Grid */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="bg-blue-500/5 rounded-lg p-2 text-center">
                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-0.5">Invoice</p>
                        <p className="text-xs font-bold text-blue-700">{formatCurrency(totalInv)}</p>
                    </div>
                    <div className="bg-orange-500/5 rounded-lg p-2 text-center">
                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-0.5">U.B Amt</p>
                        <p className="text-xs font-bold text-orange-700">{formatCurrency(totalUb)}</p>
                    </div>
                    <div className="bg-emerald-500/5 rounded-lg p-2 text-center">
                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-0.5">Grand Total</p>
                        <p className="text-xs font-bold text-emerald-700">{formatCurrency(grandTotal)}</p>
                    </div>
                </div>

                {/* Product Pills */}
                {productLines.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                        {productLines.map((line) => (
                            <span
                                key={line.index}
                                className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground bg-muted/80 px-2 py-0.5 rounded-full"
                            >
                                <Package className="h-2.5 w-2.5" />
                                {line.name}
                            </span>
                        ))}
                    </div>
                )}

                {/* Footer: Date + Weight */}
                <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-2 border-t">
                    <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{record['Date'] || 'No date'}</span>
                    </div>
                    {record['Total Wt In Kg'] && (
                        <span className="font-medium">{record['Total Wt In Kg']} Kg</span>
                    )}
                </div>
            </div>
        </div>
    );
}
