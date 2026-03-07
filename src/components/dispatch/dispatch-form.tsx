/**
 * Dispatch Form Component
 * Wide dialog form optimized for big screens – compact layout with multi-column grids
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { authedFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DispatchSummaryRecord } from '@/types/dispatch';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, Truck, Search, Check, X, Plus, Trash2 } from 'lucide-react';

interface DispatchFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: Record<string, unknown>) => Promise<boolean>;
    isSubmitting: boolean;
    editRecord?: DispatchSummaryRecord | null;
}

interface OrderOption {
    id: string;
    company: string;
}

interface RollLine {
    noOfRolls: string;
    desOfGoods: string;
    color: string;
    qty: string;
    size: string;
    gsm: string;
}

const emptyLine = (): RollLine => ({ noOfRolls: '', desOfGoods: '', color: '', qty: '', size: '', gsm: '' });

export function DispatchForm({ isOpen, onClose, onSubmit, isSubmitting, editRecord }: DispatchFormProps) {
    const isEditMode = !!editRecord;
    const [orderId, setOrderId] = useState('');
    const [date, setDate] = useState('');
    const [invoiceNo, setInvoiceNo] = useState('');
    const [vehicleNo, setVehicleNo] = useState('');
    const [buyer, setBuyer] = useState('');
    const [consignee, setConsignee] = useState('');
    const [driverNo, setDriverNo] = useState('');
    const [truckReportDate, setTruckReportDate] = useState('');
    const [truckReleasedDate, setTruckReleasedDate] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [rollLines, setRollLines] = useState<RollLine[]>([emptyLine()]);

    // Order search
    const [orderSearchInput, setOrderSearchInput] = useState('');
    const [orderOptions, setOrderOptions] = useState<OrderOption[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Reset/populate on open
    useEffect(() => {
        if (isOpen) {
            if (editRecord) {
                setOrderId(editRecord['Order Id'] || '');
                setDate(editRecord['Date'] || '');
                setInvoiceNo(editRecord['Invoice No.'] || '');
                setVehicleNo(editRecord['Vehical No'] || '');
                setBuyer(editRecord['Buyer'] || '');
                setConsignee(editRecord['Consignee'] || '');
                setDriverNo(editRecord['Driver/Transport No.'] || '');
                setTruckReportDate(editRecord['TRUCK REPORT DATE'] || '');
                setTruckReleasedDate(editRecord['TRUCK RELEASED DATE'] || '');
                setEmail(editRecord['Email'] || '');
                setPhone(editRecord['Phone'] || '');
                setOrderSearchInput(editRecord['Order Id'] || '');
                const lines: RollLine[] = [];
                for (let i = 1; i <= 6; i++) {
                    const rolls = editRecord[`${i}.No.of Rolls` as keyof DispatchSummaryRecord] as string;
                    const qty = editRecord[`${i}.Qty` as keyof DispatchSummaryRecord] as string;
                    const desOfGoods = (editRecord[`${i}.Des.Of Goods` as keyof DispatchSummaryRecord] as string) || '';
                    const color = (editRecord[`${i}.Color` as keyof DispatchSummaryRecord] as string) || '';
                    const size = (editRecord[`${i}.size` as keyof DispatchSummaryRecord] as string) || '';
                    const gsm = (editRecord[`${i}.Gsm` as keyof DispatchSummaryRecord] as string) || '';
                    if (rolls || qty || desOfGoods || color) {
                        lines.push({ noOfRolls: rolls || '', desOfGoods, color, qty: qty || '', size, gsm });
                    }
                }
                setRollLines(lines.length > 0 ? lines : [emptyLine()]);
            } else {
                setOrderId('');
                const nd = new Date();
                setDate(`${nd.getFullYear()}-${String(nd.getMonth() + 1).padStart(2, '0')}-${String(nd.getDate()).padStart(2, '0')}`);
                setInvoiceNo('');
                setVehicleNo('');
                setBuyer('');
                setConsignee('');
                setDriverNo('');
                setTruckReportDate('');
                setTruckReleasedDate('');
                setEmail('');
                setPhone('');
                setRollLines([emptyLine()]);
                setOrderSearchInput('');
            }
        }
    }, [isOpen, editRecord]);

    // Order search debounce
    useEffect(() => {
        if (!orderSearchInput.trim() || orderSearchInput.length < 2) { setOrderOptions([]); return; }
        const timeoutId = setTimeout(async () => {
            setIsSearching(true);
            try {
                const res = await authedFetch(`/api/orders?search=${encodeURIComponent(orderSearchInput)}&limit=5`);
                if (res.ok) {
                    const data = await res.json();
                    setOrderOptions((data.orders || []).map((o: Record<string, string>) => ({
                        id: o['Unique Id'],
                        company: o['Company Name'] || o['Party Name'] || o['COMPANY NAME'] || '',
                    })));
                    setIsDropdownOpen(true);
                }
            } catch { /* ignore */ } finally { setIsSearching(false); }
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [orderSearchInput]);

    // Click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsDropdownOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectOrder = (option: OrderOption) => { setOrderId(option.id); setBuyer(option.company); setOrderSearchInput(option.id); setIsDropdownOpen(false); };
    const addRollLine = () => { if (rollLines.length < 6) setRollLines([...rollLines, emptyLine()]); };
    const removeRollLine = (idx: number) => { setRollLines(rollLines.filter((_, i) => i !== idx)); };
    const updateRollLine = (idx: number, field: keyof RollLine, value: string) => { const updated = [...rollLines]; updated[idx][field] = value; setRollLines(updated); };
    const totalRolls = rollLines.reduce((sum, l) => sum + (parseInt(l.noOfRolls) || 0), 0);
    const totalQty = rollLines.reduce((sum, l) => sum + (parseFloat(l.qty) || 0), 0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!orderId.trim()) return;

        const data: Record<string, unknown> = {
            'Order Id': orderId, 'Date': date, 'Invoice No.': invoiceNo, 'Vehical No': vehicleNo,
            'Buyer': buyer, 'Consignee': consignee, 'Total Roll': totalRolls.toString(), 'Total Wt': totalQty.toFixed(2),
            'Driver/Transport No.': driverNo, 'TRUCK REPORT DATE': truckReportDate, 'TRUCK RELEASED DATE': truckReleasedDate,
            'Email': email, 'Phone': phone,
        };
        if (editRecord) data['Unique ID'] = editRecord['Unique ID'];

        rollLines.forEach((line, i) => {
            if (line.noOfRolls || line.qty || line.desOfGoods || line.color) {
                data[`${i + 1}.No.of Rolls`] = line.noOfRolls;
                data[`${i + 1}.Des.Of Goods`] = line.desOfGoods;
                data[`${i + 1}.Color`] = line.color;
                data[`${i + 1}.Qty`] = line.qty;
                data[`${i + 1}.size`] = line.size;
                data[`${i + 1}.Gsm`] = line.gsm;
            }
        });

        const success = await onSubmit(data);
        if (success) onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-5xl w-full p-0 overflow-hidden rounded-2xl shadow-2xl border-muted/50 gap-0">
                <DialogHeader className="px-6 py-3 border-b bg-background relative shrink-0">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 to-purple-400" />
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-violet-500/10 text-violet-600 rounded-xl">
                            <Truck className="h-5 w-5" />
                        </div>
                        <DialogTitle className="text-lg font-bold">{isEditMode ? 'Edit Dispatch Record' : 'Add Dispatch Record'}</DialogTitle>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="p-5 space-y-3 max-h-[85vh] overflow-y-auto">
                    {/* Row 1: Order ID + Date + Invoice + Vehicle (4 cols) */}
                    <div className="grid grid-cols-4 gap-3">
                        <div className="space-y-1" ref={dropdownRef}>
                            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Order ID *</Label>
                            {orderId ? (
                                <div className="flex items-center gap-1.5 bg-violet-50 border border-violet-200 rounded-lg px-2.5 py-1.5 h-9">
                                    <Check className="h-3.5 w-3.5 text-violet-600 shrink-0" />
                                    <span className="font-mono font-bold text-violet-700 text-sm truncate flex-1">{orderId}</span>
                                    <Button type="button" variant="ghost" size="sm" className="h-5 w-5 p-0 shrink-0" onClick={() => { setOrderId(''); setBuyer(''); setOrderSearchInput(''); }}>
                                        <X className="h-3 w-3" />
                                    </Button>
                                </div>
                            ) : (
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                    <Input value={orderSearchInput} onChange={(e) => setOrderSearchInput(e.target.value)} placeholder="Search order..." className="pl-8 h-9 text-sm rounded-lg" />
                                    {isSearching && <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-muted-foreground" />}
                                    {isDropdownOpen && orderOptions.length > 0 && (
                                        <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-lg shadow-lg z-50 max-h-40 overflow-y-auto">
                                            {orderOptions.map((opt) => (
                                                <button key={opt.id} type="button" onClick={() => selectOrder(opt)} className="w-full px-3 py-1.5 text-left hover:bg-muted text-sm flex justify-between items-center">
                                                    <span className="font-mono font-bold">{opt.id}</span>
                                                    <span className="text-xs text-muted-foreground truncate ml-2">{opt.company}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="space-y-1">
                            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Date</Label>
                            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-9 text-sm rounded-lg" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Invoice No.</Label>
                            <Input value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} placeholder="INV-001" className="h-9 text-sm rounded-lg" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Vehicle No.</Label>
                            <Input value={vehicleNo} onChange={(e) => setVehicleNo(e.target.value)} placeholder="UP80FT6151" className="h-9 text-sm rounded-lg" />
                        </div>
                    </div>

                    {/* Row 2: Buyer + Consignee (2 cols) */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Buyer</Label>
                            <Input value={buyer} onChange={(e) => setBuyer(e.target.value)} placeholder="Buyer name" className="h-9 text-sm rounded-lg" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Consignee</Label>
                            <Input value={consignee} onChange={(e) => setConsignee(e.target.value)} placeholder="Consignee name" className="h-9 text-sm rounded-lg" />
                        </div>
                    </div>

                    {/* Row 3: Driver + Phone + Email + Truck Report + Truck Released (5 cols) */}
                    <div className="grid grid-cols-5 gap-3">
                        <div className="space-y-1">
                            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Driver / No.</Label>
                            <Input value={driverNo} onChange={(e) => setDriverNo(e.target.value)} placeholder="9368455354" className="h-9 text-sm rounded-lg" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Phone</Label>
                            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" className="h-9 text-sm rounded-lg" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Email</Label>
                            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" className="h-9 text-sm rounded-lg" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Truck Report Date</Label>
                            <Input type="date" value={truckReportDate} onChange={(e) => setTruckReportDate(e.target.value)} className="h-9 text-sm rounded-lg" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Truck Released Date</Label>
                            <Input type="date" value={truckReleasedDate} onChange={(e) => setTruckReleasedDate(e.target.value)} className="h-9 text-sm rounded-lg" />
                        </div>
                    </div>

                    {/* Roll Lines – inline table style */}
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Roll / Item Details</Label>
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] font-bold text-muted-foreground">Rolls: {totalRolls} · Wt: {totalQty.toFixed(2)} kg</span>
                                {rollLines.length < 6 && (
                                    <Button type="button" variant="ghost" size="sm" onClick={addRollLine} className="h-6 text-[10px] gap-1 text-violet-600 px-2">
                                        <Plus className="h-3 w-3" /> Add
                                    </Button>
                                )}
                            </div>
                        </div>
                        {/* Header row */}
                        <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase text-muted-foreground px-5">
                            <span className="w-14">Rolls</span>
                            <span className="flex-1">Desc. of Goods</span>
                            <span className="w-20">Color</span>
                            <span className="w-20">Qty (kg)</span>
                            <span className="w-16">Size</span>
                            <span className="w-14">GSM</span>
                            <span className="w-8"></span>
                        </div>
                        <div className="space-y-1">
                            {rollLines.map((line, i) => (
                                <div key={i} className="flex items-center gap-1.5">
                                    <span className="text-[10px] text-muted-foreground w-4 shrink-0 text-right">{i + 1}.</span>
                                    <Input value={line.noOfRolls} onChange={(e) => updateRollLine(i, 'noOfRolls', e.target.value)} placeholder="0" className="rounded-lg w-14 h-8 text-sm" />
                                    <Input value={line.desOfGoods} onChange={(e) => updateRollLine(i, 'desOfGoods', e.target.value)} placeholder="NON WOVEN FABRIC" className="rounded-lg flex-1 h-8 text-sm" />
                                    <Input value={line.color} onChange={(e) => updateRollLine(i, 'color', e.target.value)} placeholder="Color" className="rounded-lg w-20 h-8 text-sm" />
                                    <Input value={line.qty} onChange={(e) => updateRollLine(i, 'qty', e.target.value)} placeholder="0.00" className="rounded-lg w-20 h-8 text-sm" />
                                    <Input value={line.size} onChange={(e) => updateRollLine(i, 'size', e.target.value)} placeholder="Size" className="rounded-lg w-16 h-8 text-sm" />
                                    <Input value={line.gsm} onChange={(e) => updateRollLine(i, 'gsm', e.target.value)} placeholder="GSM" className="rounded-lg w-14 h-8 text-sm" />
                                    {rollLines.length > 1 ? (
                                        <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500 shrink-0" onClick={() => removeRollLine(i)}>
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    ) : <span className="w-8 shrink-0" />}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-2 pt-1">
                        <Button type="button" variant="outline" onClick={onClose} className="rounded-xl px-5 h-9">Cancel</Button>
                        <Button type="submit" disabled={isSubmitting || !orderId.trim()} className="rounded-xl px-6 h-9 bg-violet-600 hover:bg-violet-700">
                            {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />{isEditMode ? 'Saving...' : 'Adding...'}</> : isEditMode ? 'Save Changes' : 'Add Dispatch'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
