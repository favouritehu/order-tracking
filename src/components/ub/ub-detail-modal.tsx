/**
 * U.B Detail Modal Component
 * Full detail view for a U.B (Under Billing) record
 */

'use client';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { UbRecord, getProductLines } from '@/types/ub';
import { cn } from '@/lib/utils';
import {
    Hash,
    Building2,
    Calendar,
    Package,
    Receipt,
    CreditCard,
    Truck,
    FileText,
    ExternalLink,
    Weight,
    Banknote,
    TrendingDown,
    Pencil,
} from 'lucide-react';

interface UbDetailModalProps {
    record: UbRecord | null;
    isOpen: boolean;
    onClose: () => void;
    onEdit?: (record: UbRecord) => void;
}

function formatCurrency(value: string | number): string {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '—';
    return '₹' + num.toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

function DetailField({ icon: Icon, label, value, mono, highlight }: {
    icon: typeof Hash;
    label: string;
    value: string | undefined;
    mono?: boolean;
    highlight?: boolean;
}) {
    if (!value) return null;

    return (
        <div className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-muted/50 transition-colors group">
            <Icon className="h-4 w-4 text-muted-foreground shrink-0 group-hover:text-primary transition-colors" />
            <div className="min-w-0 flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4">
                <span className="text-xs font-medium text-muted-foreground/80 uppercase tracking-wider shrink-0">{label}</span>
                <span className={cn(
                    "text-sm text-foreground text-left sm:text-right break-words",
                    mono ? "font-mono font-medium" : "font-semibold",
                    highlight && "text-primary font-bold",
                )}>
                    {value}
                </span>
            </div>
        </div>
    );
}

function SectionCard({ title, icon: Icon, children, gradientClass }: {
    title: string;
    icon: typeof Hash;
    children: React.ReactNode;
    gradientClass?: string;
}) {
    return (
        <div className="relative rounded-xl bg-card border shadow-sm overflow-hidden mb-6 group hover:shadow-md transition-all duration-200">
            <div className={cn('absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r', gradientClass || 'from-gray-400 to-gray-300')} />
            <div className="flex items-center gap-2.5 px-4 lg:px-5 py-3.5 border-b bg-muted/10">
                <Icon className="h-4 w-4 text-foreground/70" />
                <h3 className="text-sm font-bold tracking-tight text-foreground/90">{title}</h3>
            </div>
            <div className="p-2 lg:p-3 space-y-0.5">
                {children}
            </div>
        </div>
    );
}

export function UbDetailModal({ record, isOpen, onClose, onEdit }: UbDetailModalProps) {
    if (!record) return null;

    const productLines = getProductLines(record);
    const grandTotal = parseFloat(record['GRAND TOTAL AMOUNT'] || '0') || 0;
    const totalInv = parseFloat(record['TOTAL INVOICE AMT'] || '0') || 0;
    const totalUb = parseFloat(record['TOTAL U.B AMOUNT'] || '0') || 0;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-[95vw] lg:max-w-5xl w-full h-[100dvh] sm:h-[90vh] flex flex-col p-0 overflow-hidden sm:rounded-[20px] rounded-none shadow-2xl border-muted/50 gap-0 bg-background">
                {/* Header */}
                <DialogHeader className="px-4 lg:px-8 py-3 lg:py-5 border-b bg-background relative shrink-0 z-10">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-400" />
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 lg:gap-6 relative z-10 w-full">
                        <div className="space-y-2 lg:space-y-3">
                            <div className="flex items-start lg:items-center gap-3 lg:gap-4">
                                <div className="p-2 lg:p-3 bg-amber-500/10 text-amber-600 rounded-xl lg:rounded-2xl shrink-0 hidden sm:block">
                                    <Receipt className="h-6 w-6 lg:h-8 lg:w-8" />
                                </div>
                                <div className="text-left w-full">
                                    <DialogTitle className="text-xl lg:text-3xl font-black tracking-tight mb-1.5 lg:mb-2 break-words leading-tight">
                                        {record['Party Name'] || 'U.B Record'}
                                    </DialogTitle>
                                    <div className="flex flex-wrap items-center gap-2 lg:gap-3">
                                        <div className="flex items-center gap-1.5 text-amber-700 bg-amber-500/15 px-2 py-0.5 lg:px-3 lg:py-1 rounded-md lg:rounded-lg text-xs lg:text-sm font-mono font-bold">
                                            <Hash className="h-3 w-3 lg:h-4 lg:w-4" />
                                            {record['Unique ID']}
                                        </div>
                                        {record['ORDER ID'] && (
                                            <div className="flex items-center gap-1.5 text-muted-foreground bg-muted px-2 py-0.5 lg:px-3 lg:py-1 rounded-md lg:rounded-lg border text-xs lg:text-sm">
                                                <Package className="h-3 w-3 lg:h-4 lg:w-4" />
                                                <span className="font-mono font-bold text-foreground">{record['ORDER ID']}</span>
                                            </div>
                                        )}
                                        {record['Date'] && (
                                            <div className="flex items-center gap-1.5 text-muted-foreground bg-muted/50 px-2 py-0.5 lg:px-3 lg:py-1 rounded-md lg:rounded-lg border text-xs lg:text-sm">
                                                <Calendar className="h-3 w-3 lg:h-4 lg:w-4" />
                                                <span className="font-semibold text-foreground">{record['Date']}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* File Link */}
                        {record['File Link'] && (
                            <div className="shrink-0 flex items-center self-start lg:self-center">
                                <Button
                                    className="gap-1.5 lg:gap-2 bg-amber-500 hover:bg-amber-600 text-white shadow-sm rounded-lg lg:rounded-xl px-4 lg:px-6 h-10 lg:h-12 text-sm lg:text-base"
                                    onClick={() => window.open(record['File Link'], '_blank')}
                                >
                                    <ExternalLink className="h-4 w-4 lg:h-5 lg:w-5" />
                                    <span className="font-bold">View File</span>
                                </Button>
                            </div>
                        )}
                    </div>
                </DialogHeader>

                {/* Main Content */}
                <div className="flex-1 overflow-y-auto bg-background relative slim-scrollbar">
                    <div className="p-4 lg:p-8">
                        {/* Grand Total Summary Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                            <div className="bg-blue-500/5 border border-blue-200/50 rounded-xl p-4 text-center">
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Total Invoice</p>
                                <p className="text-xl lg:text-2xl font-black text-blue-700">{formatCurrency(totalInv)}</p>
                            </div>
                            <div className="bg-orange-500/5 border border-orange-200/50 rounded-xl p-4 text-center">
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">U.B Amount</p>
                                <p className="text-xl lg:text-2xl font-black text-orange-700">{formatCurrency(totalUb)}</p>
                            </div>
                            <div className="bg-emerald-500/5 border border-emerald-200/50 rounded-xl p-4 text-center">
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Grand Total</p>
                                <p className="text-xl lg:text-2xl font-black text-emerald-700">{formatCurrency(grandTotal)}</p>
                            </div>
                        </div>

                        {/* Products Table */}
                        {productLines.length > 0 && (
                            <SectionCard title="Product Breakdown" icon={Package} gradientClass="from-violet-500 to-purple-400">
                                <div className="overflow-x-auto -mx-2 lg:-mx-3">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b text-[10px] uppercase tracking-wider text-muted-foreground">
                                                <th className="text-left px-3 py-2.5 font-bold">#</th>
                                                <th className="text-left px-3 py-2.5 font-bold">Product</th>
                                                <th className="text-right px-3 py-2.5 font-bold">Qty</th>
                                                <th className="text-right px-3 py-2.5 font-bold">U.B Rate</th>
                                                <th className="text-right px-3 py-2.5 font-bold">A.V. Rate</th>
                                                <th className="text-right px-3 py-2.5 font-bold">GST</th>
                                                <th className="text-right px-3 py-2.5 font-bold">INV Amt</th>
                                                <th className="text-right px-3 py-2.5 font-bold">U.B Amt</th>
                                                <th className="text-right px-3 py-2.5 font-bold">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {productLines.map((line) => (
                                                <tr key={line.index} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                                                    <td className="px-3 py-2.5 text-muted-foreground font-medium">{line.index}</td>
                                                    <td className="px-3 py-2.5 font-semibold text-foreground max-w-[200px] truncate">{line.name}</td>
                                                    <td className="px-3 py-2.5 text-right font-mono">{line.quantity}</td>
                                                    <td className="px-3 py-2.5 text-right font-mono">{line.ubRate}</td>
                                                    <td className="px-3 py-2.5 text-right font-mono">{line.avRate || '—'}</td>
                                                    <td className="px-3 py-2.5 text-right font-mono">{line.gst}</td>
                                                    <td className="px-3 py-2.5 text-right font-mono text-blue-700">{formatCurrency(line.invAmt)}</td>
                                                    <td className="px-3 py-2.5 text-right font-mono text-orange-700">{formatCurrency(line.ubAmt)}</td>
                                                    <td className="px-3 py-2.5 text-right font-mono font-bold text-emerald-700">{formatCurrency(line.totalPay)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </SectionCard>
                        )}

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Financial Details */}
                            <SectionCard title="Financial Details" icon={CreditCard} gradientClass="from-amber-500 to-yellow-400">
                                <div className="flex flex-col gap-0">
                                    <DetailField icon={Truck} label="Freight" value={record['Fright'] ? `₹${record['Fright']}` : undefined} />
                                    <DetailField icon={Truck} label="Freight (Inc. GST)" value={record['Fright Inc Gst'] && record['Fright Inc Gst'] !== '0' ? `₹${record['Fright Inc Gst']}` : undefined} />
                                    <DetailField icon={Banknote} label="Advance Amount" value={record['Advance Amount'] ? `₹${record['Advance Amount']}` : undefined} highlight />
                                    <DetailField icon={Banknote} label="Outstanding Amount" value={record['Outstanding Amount'] ? `₹${record['Outstanding Amount']}` : undefined} />
                                    <DetailField icon={CreditCard} label="To Pay Amount" value={record['To Pay Amount'] ? `₹${record['To Pay Amount']}` : undefined} highlight />
                                    <DetailField icon={Banknote} label="Book Balance" value={record['Book Balance'] ? `₹${record['Book Balance']}` : undefined} />
                                    <DetailField icon={Banknote} label="Cash Balance" value={record['Cash Balance'] ? `₹${record['Cash Balance']}` : undefined} />
                                    <DetailField icon={Banknote} label="Additional Amounts" value={record['Additional Amounts'] ? `₹${record['Additional Amounts']}` : undefined} />
                                    <DetailField icon={Banknote} label="Discount" value={record['Discount'] ? `₹${record['Discount']}` : undefined} />
                                </div>
                            </SectionCard>

                            {/* Other Details */}
                            <SectionCard title="Record Details" icon={FileText} gradientClass="from-blue-500 to-blue-400">
                                <div className="flex flex-col gap-0">
                                    <DetailField icon={Receipt} label="Invoice No." value={record['Invoice No.']} mono />
                                    <DetailField icon={Weight} label="Total Weight" value={record['Total Wt In Kg'] ? `${record['Total Wt In Kg']} Kg` : undefined} />
                                    <DetailField icon={FileText} label="Approval" value={record['Approval']} />
                                    <DetailField icon={FileText} label="Unit" value={record['UNIT']} />
                                    <DetailField icon={FileText} label="GST Type" value={record['GST']} />
                                    <DetailField icon={FileText} label="Narration" value={record['Order Narretion']} />
                                </div>
                            </SectionCard>
                        </div>
                    </div>
                </div>

                <div className="shrink-0 border-t bg-background px-6 lg:px-8 py-4 flex items-center justify-between z-40">
                    {onEdit ? (
                        <Button
                            variant="outline"
                            onClick={() => { onClose(); onEdit(record); }}
                            className="rounded-xl px-5 gap-2 border-blue-200 text-blue-700 hover:bg-blue-50"
                        >
                            <Pencil className="h-4 w-4" />
                            Edit Record
                        </Button>
                    ) : <div />}
                    <Button variant="outline" onClick={onClose} className="rounded-xl px-6">
                        Close
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
