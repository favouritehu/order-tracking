/**
 * U.B Dashboard Component
 * Excel-style table with sortable column headers, search, detail modal and edit
 */

'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useUb } from '@/hooks/use-ub';
import dynamic from 'next/dynamic';
import { UbRecord } from '@/types/ub';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
    Search,
    X,
    ArrowLeft,
    Receipt,
    RefreshCw,
    Loader2,
    Plus,
    Pencil,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

const UbDetailModal = dynamic(() => import('./ub-detail-modal').then(mod => ({ default: mod.UbDetailModal })), { ssr: false });
const UbForm = dynamic(() => import('./ub-form').then(mod => ({ default: mod.UbForm })), { ssr: false });

function formatCurrency(value: string | number): string {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num) || num === 0) return '—';
    return '₹' + num.toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

type SortDir = 'asc' | 'desc' | null;

export function UbDashboard() {
    const [searchInput, setSearchInput] = useState('');
    const [selectedRecord, setSelectedRecord] = useState<UbRecord | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editRecord, setEditRecord] = useState<UbRecord | null>(null);
    const [sortCol, setSortCol] = useState<string | null>(null);
    const [sortDir, setSortDir] = useState<SortDir>(null);

    const { records, isLoading, isLoadingMore, hasMore, total, loadMore, refresh, createRecord, updateRecord, isCreating, isSaving } = useUb(searchInput);

    const sortedRecords = useMemo(() => {
        if (!sortCol || !sortDir) return records;
        return [...records].sort((a, b) => {
            const aVal = ((a as unknown) as Record<string, string>)[sortCol] || '';
            const bVal = ((b as unknown) as Record<string, string>)[sortCol] || '';
            const aNum = parseFloat(aVal.replace(/[₹,()]/g, ''));
            const bNum = parseFloat(bVal.replace(/[₹,()]/g, ''));
            if (!isNaN(aNum) && !isNaN(bNum)) return sortDir === 'asc' ? aNum - bNum : bNum - aNum;
            return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        });
    }, [records, sortCol, sortDir]);

    const toggleSort = (col: string) => {
        if (sortCol === col) {
            if (sortDir === 'asc') setSortDir('desc');
            else { setSortCol(null); setSortDir(null); }
        } else { setSortCol(col); setSortDir('asc'); }
    };

    const SortIcon = ({ col }: { col: string }) => {
        if (sortCol !== col) return <ArrowUpDown className="h-3 w-3 opacity-0 group-hover/th:opacity-40 transition-opacity" />;
        if (sortDir === 'asc') return <ArrowUp className="h-3 w-3 text-amber-600" />;
        return <ArrowDown className="h-3 w-3 text-amber-600" />;
    };

    // Intersection Observer for infinite scroll
    const sentinelRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!sentinelRef.current) return;
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !isLoadingMore && !isLoading) {
                    loadMore();
                }
            },
            { threshold: 0.1 }
        );
        observer.observe(sentinelRef.current);
        return () => observer.disconnect();
    }, [hasMore, isLoadingMore, isLoading, loadMore]);

    const handleClear = () => setSearchInput('');
    const handleRecordClick = (record: UbRecord) => { setSelectedRecord(record); setIsDetailOpen(true); };
    const handleRefresh = async () => { await refresh(); toast.success('U.B records refreshed'); };
    const handleEditRecord = (record: UbRecord) => { setEditRecord(record); setIsFormOpen(true); };

    const columns = [
        { key: 'Unique ID', label: 'UB ID' },
        { key: 'Date', label: 'Date' },
        { key: 'ORDER ID', label: 'Order ID' },
        { key: 'Party Name', label: 'Party Name' },
        { key: 'Invoice No.', label: 'Invoice No.' },
        { key: 'TOTAL INVOICE AMT', label: 'Invoice Amt', align: 'right' as const },
        { key: 'TOTAL U.B AMOUNT', label: 'U.B Amount', align: 'right' as const },
        { key: 'GRAND TOTAL AMOUNT', label: 'Grand Total', align: 'right' as const },
        { key: 'Total Wt In Kg', label: 'Weight (Kg)', align: 'right' as const },
        { key: 'Approval', label: 'Approval' },
    ];

    return (
        <div className="flex flex-col h-full bg-background">
            <div className="shrink-0 border-b bg-background px-4 lg:px-6 py-3">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <Link href="/"><Button variant="ghost" size="icon" className="h-8 w-8 shrink-0"><ArrowLeft className="h-4 w-4" /></Button></Link>
                        <div className="p-1.5 bg-amber-500/10 text-amber-600 rounded-lg"><Receipt className="h-5 w-5" /></div>
                        <div>
                            <h1 className="text-lg font-black tracking-tight">Under Billing</h1>
                            <p className="text-[10px] text-muted-foreground">{isLoading ? 'Loading...' : `${total} record${total !== 1 ? 's' : ''}`}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                            <Input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Filter by party, order, invoice..." className="pl-8 h-8 text-xs w-40 sm:w-52 rounded-lg" />
                            {searchInput && <Button type="button" variant="ghost" size="sm" className="absolute right-0.5 top-1/2 -translate-y-1/2 h-6 w-6 p-0" onClick={handleClear}><X className="h-3 w-3" /></Button>}
                        </div>
                        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading} className="h-8 rounded-lg gap-1 text-xs"><RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} /></Button>
                        <Button size="sm" onClick={() => setIsFormOpen(true)} className="h-8 rounded-lg gap-1 text-xs bg-amber-500 hover:bg-amber-600"><Plus className="h-3 w-3" />Add</Button>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-auto">
                {isLoading ? (
                    <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
                ) : records.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground"><Receipt className="h-12 w-12 mb-3 opacity-30" /><p className="text-sm font-medium">No U.B records found</p></div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs border-collapse min-w-[1100px]">
                            <thead className="bg-muted/50 sticky top-0 z-10">
                                <tr className="border-b">
                                    {columns.map(col => (
                                        <th key={col.key} onClick={() => toggleSort(col.key)} className={cn('font-bold px-3 py-2.5 whitespace-nowrap text-muted-foreground cursor-pointer select-none hover:bg-muted/80 transition-colors group/th', col.align === 'right' ? 'text-right' : 'text-left')}>
                                            <span className="inline-flex items-center gap-1">{col.label}<SortIcon col={col.key} /></span>
                                        </th>
                                    ))}
                                    <th className="w-10"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedRecords.map((record, idx) => (
                                    <tr key={record['Unique ID'] || record._RowNumber || idx} onClick={() => handleRecordClick(record)} className="border-b hover:bg-muted/30 cursor-pointer transition-colors group">
                                        <td className="px-3 py-2 whitespace-nowrap"><span className="font-mono font-bold text-amber-600">{record['Unique ID']}</span></td>
                                        <td className="px-3 py-2 whitespace-nowrap">{record['Date'] || '—'}</td>
                                        <td className="px-3 py-2 whitespace-nowrap"><span className="font-mono text-xs">{record['ORDER ID'] || '—'}</span></td>
                                        <td className="px-3 py-2 whitespace-nowrap max-w-[200px] truncate font-medium">{record['Party Name'] || '—'}</td>
                                        <td className="px-3 py-2 whitespace-nowrap">{record['Invoice No.'] || '—'}</td>
                                        <td className="px-3 py-2 whitespace-nowrap text-right font-mono text-blue-700">{formatCurrency(record['TOTAL INVOICE AMT'])}</td>
                                        <td className="px-3 py-2 whitespace-nowrap text-right font-mono text-orange-700 font-bold">{formatCurrency(record['TOTAL U.B AMOUNT'])}</td>
                                        <td className="px-3 py-2 whitespace-nowrap text-right font-mono text-emerald-700 font-bold">{formatCurrency(record['GRAND TOTAL AMOUNT'])}</td>
                                        <td className="px-3 py-2 whitespace-nowrap text-right font-mono">{record['Total Wt In Kg'] || '—'}</td>
                                        <td className="px-3 py-2 whitespace-nowrap">{record['Approval'] || '—'}</td>
                                        <td className="px-3 py-2 text-center"><Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity inline-block" /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Sentinel and Load More Loading State */}
                {!isLoading && records.length > 0 && (hasMore || isLoadingMore) && (
                    <div ref={sentinelRef} className="h-16 shrink-0 flex items-center justify-center p-4">
                        {isLoadingMore && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>Loading more records...</span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {isDetailOpen && <UbDetailModal record={selectedRecord} isOpen={isDetailOpen} onClose={() => { setIsDetailOpen(false); setSelectedRecord(null); }} onEdit={handleEditRecord} />}
            {isFormOpen && <UbForm isOpen={isFormOpen} onClose={() => { setIsFormOpen(false); setEditRecord(null); }} onSubmit={editRecord ? updateRecord : createRecord} isSubmitting={editRecord ? isSaving : isCreating} editRecord={editRecord} />}
        </div>
    );
}
