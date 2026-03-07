/**
 * Dispatch Dashboard Component
 * Excel-style table with sortable column headers, search, create, and edit
 */

'use client';

import { useState, useMemo } from 'react';
import { useDispatchList } from '@/hooks/use-dispatch-list';
import { DispatchForm } from './dispatch-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { DispatchSummaryRecord } from '@/types/dispatch';
import {
    Search,
    Plus,
    RefreshCw,
    Truck,
    Loader2,
    X,
    ArrowLeft,
    Pencil,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
} from 'lucide-react';
import Link from 'next/link';

type SortDir = 'asc' | 'desc' | null;

export function DispatchDashboard() {
    const [searchInput, setSearchInput] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingRecord, setEditingRecord] = useState<DispatchSummaryRecord | null>(null);
    const [sortCol, setSortCol] = useState<string | null>(null);
    const [sortDir, setSortDir] = useState<SortDir>(null);

    const {
        records, isLoading, total, refresh, createRecord, updateRecord, isCreating, isSaving,
    } = useDispatchList(searchInput);

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
        if (sortDir === 'asc') return <ArrowUp className="h-3 w-3 text-violet-600" />;
        return <ArrowDown className="h-3 w-3 text-violet-600" />;
    };

    const handleClear = () => setSearchInput('');
    const handleRowClick = (record: DispatchSummaryRecord) => { setEditingRecord(record); setShowForm(true); };
    const handleCreate = () => { setEditingRecord(null); setShowForm(true); };
    const handleFormClose = () => { setShowForm(false); setEditingRecord(null); };
    const handleFormSubmit = async (data: Record<string, unknown>): Promise<boolean> => {
        if (editingRecord) return await updateRecord(data);
        return await createRecord(data);
    };

    const columns = [
        { key: 'Order Id', label: 'Order ID' },
        { key: 'Date', label: 'Date' },
        { key: 'Invoice No.', label: 'Invoice No.' },
        { key: 'Vehical No', label: 'Vehicle No.' },
        { key: 'Buyer', label: 'Buyer' },
        { key: 'Consignee', label: 'Consignee' },
        { key: 'Total Roll', label: 'Total Rolls', align: 'right' as const },
        { key: 'Total Wt', label: 'Total Wt (kg)', align: 'right' as const },
        { key: 'Driver/Transport No.', label: 'Driver / No.' },
        { key: 'TRUCK REPORT DATE', label: 'Truck Report' },
        { key: 'TRUCK RELEASED DATE', label: 'Truck Released' },
    ];

    return (
        <div className="flex flex-col h-full bg-background">
            <div className="shrink-0 border-b bg-background px-4 lg:px-6 py-3">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <Link href="/"><Button variant="ghost" size="icon" className="h-8 w-8 shrink-0"><ArrowLeft className="h-4 w-4" /></Button></Link>
                        <div className="p-1.5 bg-violet-500/10 text-violet-600 rounded-lg"><Truck className="h-5 w-5" /></div>
                        <div>
                            <h1 className="text-lg font-black tracking-tight">Dispatch Summary</h1>
                            <p className="text-[10px] text-muted-foreground">{isLoading ? 'Loading...' : `${total} record${total !== 1 ? 's' : ''}`}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                            <Input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Filter by buyer, vehicle, order..." className="pl-8 h-8 text-xs w-40 sm:w-52 rounded-lg" />
                            {searchInput && <Button type="button" variant="ghost" size="sm" className="absolute right-0.5 top-1/2 -translate-y-1/2 h-6 w-6 p-0" onClick={handleClear}><X className="h-3 w-3" /></Button>}
                        </div>
                        <Button variant="outline" size="sm" onClick={refresh} className="h-8 rounded-lg gap-1 text-xs"><RefreshCw className="h-3 w-3" /></Button>
                        <Button size="sm" onClick={handleCreate} className="h-8 rounded-lg gap-1 text-xs bg-violet-600 hover:bg-violet-700"><Plus className="h-3 w-3" />Add</Button>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-auto">
                {isLoading ? (
                    <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
                ) : records.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground"><Truck className="h-12 w-12 mb-3 opacity-30" /><p className="text-sm font-medium">No dispatch records found</p></div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs border-collapse min-w-[1200px]">
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
                                    <tr key={record['_RowNumber'] || idx} onClick={() => handleRowClick(record)} className="border-b hover:bg-muted/30 cursor-pointer transition-colors group">
                                        <td className="px-3 py-2 whitespace-nowrap"><span className="font-mono font-bold text-violet-600">{record['Order Id']}</span></td>
                                        <td className="px-3 py-2 whitespace-nowrap">{record['Date'] || '—'}</td>
                                        <td className="px-3 py-2 whitespace-nowrap">{record['Invoice No.'] || '—'}</td>
                                        <td className="px-3 py-2 whitespace-nowrap font-medium">{record['Vehical No'] || '—'}</td>
                                        <td className="px-3 py-2 whitespace-nowrap max-w-[180px] truncate">{record['Buyer'] || '—'}</td>
                                        <td className="px-3 py-2 whitespace-nowrap max-w-[180px] truncate">{record['Consignee'] || '—'}</td>
                                        <td className="px-3 py-2 whitespace-nowrap text-right font-mono font-bold">{record['Total Roll'] || '0'}</td>
                                        <td className="px-3 py-2 whitespace-nowrap text-right font-mono font-bold">{record['Total Wt'] || '0'}</td>
                                        <td className="px-3 py-2 whitespace-nowrap">{record['Driver/Transport No.'] || '—'}</td>
                                        <td className="px-3 py-2 whitespace-nowrap">{record['TRUCK REPORT DATE'] || '—'}</td>
                                        <td className="px-3 py-2 whitespace-nowrap">{record['TRUCK RELEASED DATE'] || '—'}</td>
                                        <td className="px-3 py-2 text-center"><Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity inline-block" /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <DispatchForm isOpen={showForm} onClose={handleFormClose} onSubmit={handleFormSubmit} isSubmitting={editingRecord ? isSaving : isCreating} editRecord={editingRecord} />
        </div>
    );
}
