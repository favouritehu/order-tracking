/**
 * QC Dashboard Component
 * Excel-style table with sortable column headers, search, create, and back button
 */

'use client';

import { useState, useMemo } from 'react';
import { useQcList } from '@/hooks/use-qc-list';
import { QcForm } from './qc-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { QcRecord } from '@/types';
import {
    Search,
    Plus,
    RefreshCw,
    ClipboardCheck,
    Loader2,
    X,
    ArrowLeft,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
} from 'lucide-react';
import Link from 'next/link';

type SortDir = 'asc' | 'desc' | null;

export function QcDashboard() {
    const [searchInput, setSearchInput] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [sortCol, setSortCol] = useState<string | null>(null);
    const [sortDir, setSortDir] = useState<SortDir>(null);

    const { records, isLoading, total, refresh, createRecord, isCreating } = useQcList(searchInput);

    const sortedRecords = useMemo(() => {
        if (!sortCol || !sortDir) return records;
        return [...records].sort((a, b) => {
            const aVal = (a as Record<string, string>)[sortCol] || '';
            const bVal = (b as Record<string, string>)[sortCol] || '';
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
        if (sortDir === 'asc') return <ArrowUp className="h-3 w-3 text-emerald-600" />;
        return <ArrowDown className="h-3 w-3 text-emerald-600" />;
    };

    const handleClear = () => setSearchInput('');
    const handleCreate = () => setShowForm(true);
    const handleFormClose = () => setShowForm(false);
    const handleFormSubmit = async (data: Partial<QcRecord>): Promise<boolean> => {
        return await createRecord(data as Record<string, unknown>);
    };

    const columns = [
        { key: 'Order Id', label: 'Order ID' },
        { key: 'Party Name', label: 'Party Name' },
        { key: 'Date', label: 'Date' },
        { key: 'Loading By', label: 'Loading By' },
        { key: 'Tranasport Methode', label: 'Transport' },
        { key: 'Core', label: 'Core' },
        { key: 'Packaging', label: 'Packaging' },
        { key: 'Counting', label: 'Counting' },
        { key: 'Sticker', label: 'Sticker' },
        { key: 'Net wt', label: 'Net Wt', align: 'right' as const },
        { key: 'Gross wt', label: 'Gross Wt', align: 'right' as const },
        { key: 'Truck Wt', label: 'Truck Wt', align: 'right' as const },
        { key: 'Qc By', label: 'QC By' },
        { key: 'If Any Damage', label: 'Damage' },
    ];

    return (
        <div className="flex flex-col h-full bg-background">
            <div className="shrink-0 border-b bg-background px-4 lg:px-6 py-3">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <Link href="/"><Button variant="ghost" size="icon" className="h-8 w-8 shrink-0"><ArrowLeft className="h-4 w-4" /></Button></Link>
                        <div className="p-1.5 bg-emerald-500/10 text-emerald-600 rounded-lg"><ClipboardCheck className="h-5 w-5" /></div>
                        <div>
                            <h1 className="text-lg font-black tracking-tight">Quality Control</h1>
                            <p className="text-[10px] text-muted-foreground">{isLoading ? 'Loading...' : `${total} record${total !== 1 ? 's' : ''}`}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                            <Input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Filter by order, party, QC..." className="pl-8 h-8 text-xs w-40 sm:w-52 rounded-lg" />
                            {searchInput && <Button type="button" variant="ghost" size="sm" className="absolute right-0.5 top-1/2 -translate-y-1/2 h-6 w-6 p-0" onClick={handleClear}><X className="h-3 w-3" /></Button>}
                        </div>
                        <Button variant="outline" size="sm" onClick={refresh} className="h-8 rounded-lg gap-1 text-xs"><RefreshCw className="h-3 w-3" /></Button>
                        <Button size="sm" onClick={handleCreate} className="h-8 rounded-lg gap-1 text-xs bg-emerald-600 hover:bg-emerald-700"><Plus className="h-3 w-3" />Add</Button>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-auto">
                {isLoading ? (
                    <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
                ) : records.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground"><ClipboardCheck className="h-12 w-12 mb-3 opacity-30" /><p className="text-sm font-medium">No QC records found</p></div>
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
                                </tr>
                            </thead>
                            <tbody>
                                {sortedRecords.map((record, idx) => (
                                    <tr key={record._RowNumber || idx} className="border-b hover:bg-muted/30 transition-colors">
                                        <td className="px-3 py-2 whitespace-nowrap"><span className="font-mono font-bold text-emerald-600">{record['Order Id']}</span></td>
                                        <td className="px-3 py-2 whitespace-nowrap max-w-[180px] truncate">{record['Party Name'] || '—'}</td>
                                        <td className="px-3 py-2 whitespace-nowrap">{record['Date'] || '—'}</td>
                                        <td className="px-3 py-2 whitespace-nowrap">{record['Loading By'] || '—'}</td>
                                        <td className="px-3 py-2 whitespace-nowrap">{record['Tranasport Methode'] || '—'}</td>
                                        <td className="px-3 py-2 whitespace-nowrap">{record['Core'] || '—'}</td>
                                        <td className="px-3 py-2 whitespace-nowrap">{record['Packaging'] || '—'}</td>
                                        <td className="px-3 py-2 whitespace-nowrap">{record['Counting'] || '—'}</td>
                                        <td className="px-3 py-2 whitespace-nowrap">{record['Sticker'] || '—'}</td>
                                        <td className="px-3 py-2 whitespace-nowrap text-right font-mono">{record['Net wt'] || '—'}</td>
                                        <td className="px-3 py-2 whitespace-nowrap text-right font-mono">{record['Gross wt'] || '—'}</td>
                                        <td className="px-3 py-2 whitespace-nowrap text-right font-mono">{record['Truck Wt'] || '—'}</td>
                                        <td className="px-3 py-2 whitespace-nowrap">{record['Qc By'] || '—'}</td>
                                        <td className="px-3 py-2 whitespace-nowrap max-w-[150px] truncate">{record['If Any Damage'] || '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {showForm && <QcForm isOpen={showForm} onClose={handleFormClose} onSubmit={handleFormSubmit} />}
        </div>
    );
}
