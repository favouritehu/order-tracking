/**
 * QC Detail Modal Component
 * Full detail view for a QC (Quality Control) record
 */

'use client';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { QcRecord } from '@/types';
import { cn } from '@/lib/utils';
import {
    Hash,
    Building2,
    Calendar,
    Package,
    ClipboardCheck,
    CreditCard,
    Truck,
    FileText,
    ExternalLink,
    Weight,
    CheckCircle2,
    XCircle,
    Pencil,
    Scale,
    ImageIcon
} from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

interface QcDetailModalProps {
    record: QcRecord | null;
    isOpen: boolean;
    onClose: () => void;
    onEdit?: (record: QcRecord) => void;
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

// QC check result display
function QcCheckItem({ label, value }: { label: string; value: string | undefined }) {
    if (!value) return null;

    const isOk = value.toLowerCase().includes('ok') || value.toLowerCase() === 'y' || value.toLowerCase() === 'no';
    const isBad = value.toLowerCase().includes('damage') || value.toLowerCase().includes('fail') || value.toLowerCase().includes('bad');

    return (
        <div className="flex items-center justify-between py-2.5 border-b last:border-0 hover:bg-muted/30 px-3 transition-colors rounded">
            <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
            <span className={cn(
                'text-sm font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm border',
                isOk && 'bg-emerald-500/15 text-emerald-700 border-emerald-200',
                isBad && 'bg-red-500/15 text-red-700 border-red-200',
                !isOk && !isBad && 'bg-blue-500/15 text-blue-700 border-blue-200'
            )}>
                {isOk && <CheckCircle2 className="h-4 w-4" />}
                {isBad && <XCircle className="h-4 w-4" />}
                {value}
            </span>
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

export function QcDetailModal({ record, isOpen, onClose, onEdit }: QcDetailModalProps) {
    if (!record) return null;

    const hasImages = record['Material Image (With Truck)'] || record['Kata Parchi Image'] || record['Material Images_1'];

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-[95vw] lg:max-w-5xl w-full h-[100dvh] sm:h-[90vh] flex flex-col p-0 overflow-hidden rounded-none sm:rounded-[20px] shadow-2xl border-muted/50 gap-0 bg-background">
                {/* Header */}
                <DialogHeader className="px-4 lg:px-8 py-3 lg:py-4 border-b bg-background relative shrink-0 z-10">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400" />
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 lg:gap-6 relative z-10 w-full">
                        <div className="space-y-2 lg:space-y-3">
                            <div className="flex items-start lg:items-center gap-3 lg:gap-4">
                                <div className="p-2 lg:p-3 bg-emerald-500/10 text-emerald-600 rounded-xl lg:rounded-2xl shrink-0 hidden sm:block">
                                    <ClipboardCheck className="h-6 w-6 lg:h-8 lg:w-8" />
                                </div>
                                <div className="text-left w-full">
                                    <DialogTitle className="text-xl lg:text-3xl font-black tracking-tight mb-1.5 lg:mb-2 break-words leading-tight">
                                        {record['Party Name'] || 'QC Record'}
                                    </DialogTitle>
                                    <div className="flex flex-wrap items-center gap-2 lg:gap-3">
                                        <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-500/15 px-2 py-0.5 lg:px-3 lg:py-1 rounded-md lg:rounded-lg text-xs lg:text-sm font-mono font-bold">
                                            <Hash className="h-3 w-3 lg:h-4 lg:w-4" />
                                            {record['Unique Id']}
                                        </div>
                                        {record['Order Id'] && (
                                            <div className="flex items-center gap-1.5 text-muted-foreground bg-muted px-2 py-0.5 lg:px-3 lg:py-1 rounded-md lg:rounded-lg border text-xs lg:text-sm">
                                                <Package className="h-3 w-3 lg:h-4 lg:w-4" />
                                                <span className="font-mono font-bold text-foreground">{record['Order Id']}</span>
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
                    </div>
                </DialogHeader>

                {/* Main Content */}
                <div className="flex-1 overflow-y-auto bg-background relative slim-scrollbar">
                    <div className="p-3 sm:p-4 lg:p-8">

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6 mb-6">
                            {/* Inspection Checks */}
                            <SectionCard title="Inspection Checklist" icon={ClipboardCheck} gradientClass="from-emerald-500 to-teal-400">
                                <div className="flex flex-col gap-0 px-2">
                                    <QcCheckItem label="Core Quality" value={record['Core']} />
                                    <QcCheckItem label="Packaging Presentation" value={record['Packaging']} />
                                    <QcCheckItem label="Sticker Placement" value={record['Sticker']} />
                                    <QcCheckItem label="Hook Sticker" value={record['No  Hook Sticker']} />
                                    <QcCheckItem label="Reported Damage" value={record['If Any Damage']} />
                                </div>
                            </SectionCard>

                            {/* Weight & Transport Details */}
                            <div className="space-y-6">
                                <SectionCard title="Weight Details" icon={Scale} gradientClass="from-blue-500 to-cyan-400">
                                    <div className="grid grid-cols-2 gap-4 my-2 px-2">
                                        <div className="bg-muted/30 border rounded-lg p-3 text-center">
                                            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Net Weight</div>
                                            <div className="text-lg font-bold">{record['Net wt'] ? `${record['Net wt']} kg` : '—'}</div>
                                        </div>
                                        <div className="bg-muted/30 border rounded-lg p-3 text-center">
                                            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Gross Weight</div>
                                            <div className="text-lg font-bold">{record['Gross wt'] ? `${record['Gross wt']} kg` : '—'}</div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-0">
                                        <DetailField icon={Truck} label="Truck Weight" value={record['Truck Wt'] ? `${record['Truck Wt']} kg` : undefined} highlight />
                                        <DetailField icon={Package} label="Total Count" value={record['Counting']} mono />
                                    </div>
                                </SectionCard>

                                <SectionCard title="Logistics & Compliance" icon={FileText} gradientClass="from-violet-500 to-purple-400">
                                    <div className="flex flex-col gap-0">
                                        <DetailField icon={Truck} label="Transport Method" value={record['Tranasport Methode']} />
                                        <DetailField icon={FileText} label="Loading By" value={record['Loading By']} />
                                        <DetailField icon={FileText} label="QC Supervisor" value={record['Qc By']} />
                                        <DetailField icon={ClipboardCheck} label="Audit Status" value={record['Audit']} />
                                    </div>
                                </SectionCard>
                            </div>
                        </div>

                        {/* Images Gallery */}
                        {hasImages && (
                            <SectionCard title="Inspection Imagery" icon={ImageIcon} gradientClass="from-rose-500 to-pink-400">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-2">
                                    {[
                                        { url: record['Material Image (With Truck)'], title: 'Material with Truck' },
                                        { url: record['Kata Parchi Image'], title: 'Kata Parchi' },
                                        { url: record['Material Images_1'], title: 'Material Detail' }
                                    ].map((img, i) => img.url ? (
                                        <a
                                            key={i}
                                            href={img.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="group block relative aspect-video bg-muted rounded-xl overflow-hidden border shadow-sm hover:shadow-md transition-all"
                                        >
                                            {/* We use external img tag for appsheet drive urls since they dont play well with next/image unless domain is configured */}
                                            <img
                                                src={img.url}
                                                alt={img.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-8">
                                                <p className="text-white text-sm font-medium flex items-center gap-1.5">
                                                    <ExternalLink className="h-3 w-3" />
                                                    {img.title}
                                                </p>
                                            </div>
                                        </a>
                                    ) : null)}
                                </div>
                            </SectionCard>
                        )}

                    </div>
                </div>

                <div className="shrink-0 border-t bg-background px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between z-40 pb-safe">
                    {onEdit ? (
                        <Button
                            variant="outline"
                            onClick={() => { onClose(); onEdit(record); }}
                            className="rounded-xl px-4 sm:px-5 gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 text-sm"
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
