/**
 * U.B Create/Edit Form Component
 * Dual-mode form: create new or edit existing U.B records
 * Searchable Order ID dropdown with auto-fill
 *
 * Formulas (verified against FAV-1116):
 *   Per product: GST = UBRate×0.12, INV = Qty×UBRate×1.12, UB = Qty×(AV−UB), TotalPay = INV+UB
 *   Totals: TotalInv = ΣINV + FreightIncGst + Invamt, TotalUB = ΣUB + Camt
 *   GrandTotal = TotalInv + TotalUB, ToPay = ΣTotalPay + FreightIncGst + Invamt + Camt − Discount + Additional
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { authedFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Plus,
    Trash2,
    Loader2,
    Receipt,
    Package,
    Building2,
    Search,
    Check,
    X,
    ChevronDown,
    Wallet,
    FileText,
    Save,
    Pencil,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { UbRecord } from '@/types/ub';

interface UbFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: Record<string, unknown>) => Promise<boolean>;
    isSubmitting: boolean;
    /** If provided, the form enters edit mode and pre-populates with this record */
    editRecord?: UbRecord | null;
    /** If provided in create mode, pre-fills and locks the order selection */
    initialOrder?: { id: string; company: string; product?: string; quantity?: string; name?: string } | null;
}

interface ProductLine {
    name: string;
    quantity: string;
    ubRate: string;
    avRate: string;
}

interface OrderOption {
    id: string;
    company: string;
    product: string;
    quantity: string;
    name: string;
}

const emptyProduct: ProductLine = { name: '', quantity: '', ubRate: '', avRate: '' };

function fmt(n: number): string {
    return '₹' + Math.round(n).toLocaleString('en-IN');
}

export function UbForm({ isOpen, onClose, onSubmit, isSubmitting, editRecord, initialOrder }: UbFormProps) {
    const isEditMode = !!editRecord;
    const isPreFilled = !!initialOrder && !isEditMode;

    // Order search (only used in create mode)
    const [orderSearchInput, setOrderSearchInput] = useState('');
    const [orderOptions, setOrderOptions] = useState<OrderOption[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<OrderOption | null>(initialOrder ? {
        id: initialOrder.id,
        company: initialOrder.company,
        product: initialOrder.product || '',
        quantity: initialOrder.quantity || '',
        name: initialOrder.name || ''
    } : null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Form fields
    const [orderId, setOrderId] = useState(initialOrder ? initialOrder.id : '');
    const [partyName, setPartyName] = useState(initialOrder ? initialOrder.company : '');
    const [invoiceNo, setInvoiceNo] = useState('');
    const [date, setDate] = useState(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    });
    const [fright, setFright] = useState('');
    const [discount, setDiscount] = useState('');
    const [advanceAmount, setAdvanceAmount] = useState('');
    const [outstandingAmount, setOutstandingAmount] = useState('');
    const [additionalAmounts, setAdditionalAmounts] = useState('');
    const [invamt, setInvamt] = useState('');
    const [camt, setCamt] = useState('');
    const [narration, setNarration] = useState('');
    const [bookBalance, setBookBalance] = useState('');
    const [cashBalance, setCashBalance] = useState('');
    const [products, setProducts] = useState<ProductLine[]>([{ ...emptyProduct }]);

    // Pre-populate form in edit mode
    useEffect(() => {
        if (editRecord) {
            setOrderId(editRecord['ORDER ID'] || '');
            setPartyName(editRecord['Party Name'] || '');
            setInvoiceNo(editRecord['Invoice No.'] || '');

            // Format AppSheet date (MM/DD/YYYY) to YYYY-MM-DD for the input
            if (editRecord['Date']) {
                const parts = editRecord['Date'].split('/');
                if (parts.length === 3) {
                    setDate(`${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`);
                } else {
                    setDate(editRecord['Date']);
                }
            } else {
                setDate('');
            }

            setFright(editRecord['Fright'] || '');
            setDiscount(editRecord['Discount'] || '');
            setAdvanceAmount(editRecord['Advance Amount'] || '');
            setOutstandingAmount(editRecord['Outstanding Amount'] || '');
            setAdditionalAmounts(editRecord['Additional Amounts'] || '');
            setInvamt(editRecord['Invamt'] || '');
            setCamt(editRecord['Camt'] || '');
            setNarration(editRecord['Order Narretion'] || '');
            setBookBalance(editRecord['Book Balance'] || '');
            setCashBalance(editRecord['Cash Balance'] || '');

            // Populate products
            const prods: ProductLine[] = [];
            for (let i = 1; i <= 5; i++) {
                const name = editRecord[`${i}.Product Name` as keyof UbRecord] || '';
                if (name.trim()) {
                    prods.push({
                        name,
                        quantity: editRecord[`${i}.Quantity` as keyof UbRecord] || '',
                        ubRate: editRecord[`${i}.U.B RATE` as keyof UbRecord] || '',
                        avRate: editRecord[`${i}.A.VALUE RATE` as keyof UbRecord] || '',
                    });
                }
            }
            setProducts(prods.length > 0 ? prods : [{ ...emptyProduct }]);

            // In edit mode, show as selected
            setSelectedOrder({ id: editRecord['ORDER ID'] || '', company: editRecord['Party Name'] || '', product: '', quantity: '', name: '' });
        }
    }, [editRecord]);

    // Search orders (create mode only)
    useEffect(() => {
        if (isEditMode || isPreFilled || !orderSearchInput.trim() || orderSearchInput.length < 2) {
            setOrderOptions([]);
            return;
        }
        const timer = setTimeout(async () => {
            setIsSearching(true);
            try {
                const res = await authedFetch(`/api/orders?search=${encodeURIComponent(orderSearchInput)}&limit=10`);
                if (res.ok) {
                    const data = await res.json();
                    setOrderOptions((data.orders || []).map((o: Record<string, string>) => ({
                        id: o['Unique Id'] || '',
                        company: o['COMPANY NAME'] || '',
                        product: o['PRUDUCT'] || '',
                        quantity: o['Total Order Quantity in Kg'] || '',
                        name: o['Name'] || '',
                    })));
                }
            } catch { /* ignore */ } finally {
                setIsSearching(false);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [orderSearchInput, isEditMode, isPreFilled]);

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setIsDropdownOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleSelectOrder = useCallback((order: OrderOption) => {
        setSelectedOrder(order);
        setOrderId(order.id);
        setPartyName(order.company);
        setOrderSearchInput(order.id);
        setIsDropdownOpen(false);
    }, []);

    const handleClearOrder = () => {
        if (isEditMode || isPreFilled) return; // Can't clear in edit mode or pre-filled mode
        setSelectedOrder(null);
        setOrderId('');
        setPartyName('');
        setOrderSearchInput('');
    };

    const addProduct = () => {
        if (products.length >= 5) return;
        setProducts([...products, { ...emptyProduct }]);
    };

    const removeProduct = (index: number) => {
        if (products.length <= 1) return;
        setProducts(products.filter((_, i) => i !== index));
    };

    const updateProduct = (index: number, field: keyof ProductLine, value: string) => {
        const updated = [...products];
        updated[index] = { ...updated[index], [field]: value };
        setProducts(updated);
    };

    // ─── Calculations ────────────────────────────────────────────
    const frightIncGst = (parseFloat(fright) || 0) * 1.12;
    const discountVal = parseFloat(discount) || 0;
    const additionalVal = parseFloat(additionalAmounts) || 0;
    const invamtVal = parseFloat(invamt) || 0;
    const camtVal = parseFloat(camt) || 0;

    let sumInvAmt = 0, sumUbAmt = 0, sumTotalPay = 0;

    const productCalcs = products.map((p) => {
        const qty = parseFloat(p.quantity) || 0;
        const ub = parseFloat(p.ubRate) || 0;
        const av = parseFloat(p.avRate) || 0;
        const gst = ub * 0.12;
        const invAmt = qty * ub * 1.12;
        const ubAmt = qty * (av - ub);
        const totalPay = invAmt + ubAmt;
        sumInvAmt += invAmt;
        sumUbAmt += ubAmt;
        sumTotalPay += totalPay;
        return { gst, invAmt, ubAmt, totalPay };
    });

    const totalInvoice = sumInvAmt + frightIncGst + invamtVal;
    const totalUb = sumUbAmt + camtVal;
    const grandTotal = totalInvoice + totalUb;
    const toPay = sumTotalPay + frightIncGst + invamtVal + camtVal - discountVal + additionalVal;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!partyName.trim()) { toast.error('Please select an order first'); return; }

        const record: Record<string, unknown> = {
            'ORDER ID': orderId,
            'Party Name': partyName,
            'Invoice No.': invoiceNo,
            'Date': date,
            'Fright': fright,
            'Discount': discount,
            'Advance Amount': advanceAmount,
            'Outstanding Amount': outstandingAmount,
            'Additional Amounts': additionalAmounts,
            'Invamt': invamt,
            'Camt': camt,
            'Order Narretion': narration,
            'Book Balance': bookBalance,
            'Cash Balance': cashBalance,
        };

        // Include key fields for edit mode
        if (isEditMode && editRecord) {
            record['Row ID'] = editRecord['Row ID'];
            record['Unique ID'] = editRecord['Unique ID'];
            record['_RowNumber'] = editRecord._RowNumber;
        }

        products.forEach((p, i) => {
            const idx = i + 1;
            record[`${idx}.Product Name`] = p.name.trim() ? p.name : '';
            record[`${idx}.Quantity`] = p.name.trim() ? p.quantity : '';
            record[`${idx}.U.B RATE`] = p.name.trim() ? p.ubRate : '';
            record[`${idx}.A.VALUE RATE`] = p.name.trim() ? p.avRate : '';
        });

        // Clear remaining product slots
        for (let i = products.length + 1; i <= 5; i++) {
            record[`${i}.Product Name`] = '';
            record[`${i}.Quantity`] = '';
            record[`${i}.U.B RATE`] = '';
            record[`${i}.A.VALUE RATE`] = '';
        }

        // Run in background and close form immediately
        onSubmit(record).catch(console.error);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-[95vw] lg:max-w-3xl w-full max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-[20px] shadow-2xl border-muted/50 gap-0">
                {/* Header */}
                <DialogHeader className="px-6 py-4 border-b bg-background relative shrink-0">
                    <div className={cn("absolute top-0 left-0 right-0 h-1 bg-gradient-to-r", isEditMode ? "from-blue-500 to-cyan-400" : "from-amber-500 to-orange-400")} />
                    <div className="flex items-center gap-3">
                        <div className={cn("p-2 rounded-xl", isEditMode ? "bg-blue-500/10 text-blue-600" : "bg-amber-500/10 text-amber-600")}>
                            {isEditMode ? <Pencil className="h-5 w-5" /> : <Receipt className="h-5 w-5" />}
                        </div>
                        <DialogTitle className="text-lg font-bold">
                            {isEditMode ? 'Edit U.B Record' : 'Create U.B Record'}
                        </DialogTitle>
                        {isEditMode && editRecord && (
                            <span className="text-xs font-mono font-bold text-blue-700 bg-blue-500/15 px-2 py-0.5 rounded ml-2">
                                {editRecord['Unique ID']}
                            </span>
                        )}
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto slim-scrollbar">
                    <div className="p-6 space-y-6">
                        {/* ─── Order Search (create) or Order Info (edit) ─── */}
                        <div className="space-y-3">
                            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                <Search className="h-3.5 w-3.5" />
                                {isEditMode ? 'Order' : 'Select Order'}
                            </h3>

                            <div ref={dropdownRef} className="relative">
                                {selectedOrder || isEditMode ? (
                                    <div className={cn("flex items-center gap-3 rounded-xl px-4 py-3 border", isEditMode ? "bg-blue-50 border-blue-200" : "bg-amber-50 border-amber-200", isPreFilled && "bg-muted border-muted-foreground/20")}>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className={cn("text-xs font-mono font-bold px-2 py-0.5 rounded", isEditMode ? "text-blue-700 bg-blue-500/15" : "text-amber-700 bg-amber-500/15", isPreFilled && "text-muted-foreground bg-muted-foreground/10")}>
                                                    {orderId || 'No Order ID'}
                                                </span>
                                                <Check className="h-3.5 w-3.5 text-emerald-500" />
                                            </div>
                                            <p className="text-sm font-semibold text-foreground truncate">{partyName}</p>
                                        </div>
                                        {!isEditMode && !isPreFilled && (
                                            <Button type="button" variant="ghost" size="icon" onClick={handleClearOrder} className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive">
                                                <X className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            value={orderSearchInput}
                                            onChange={(e) => { setOrderSearchInput(e.target.value); setIsDropdownOpen(true); }}
                                            onFocus={() => orderSearchInput.length >= 2 && setIsDropdownOpen(true)}
                                            placeholder="Search by Order ID or company name..."
                                            className="pl-10 pr-10 h-11 text-sm border-2 border-dashed border-muted-foreground/20 focus:border-amber-400 rounded-xl bg-muted/30"
                                        />
                                        {isSearching ? <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" /> : <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />}
                                    </div>
                                )}

                                {isDropdownOpen && !selectedOrder && !isEditMode && orderOptions.length > 0 && (
                                    <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-card border rounded-xl shadow-xl overflow-hidden max-h-[240px] overflow-y-auto">
                                        {orderOptions.map((o) => (
                                            <button key={o.id} type="button" className="w-full text-left px-4 py-3 hover:bg-amber-50 transition-colors border-b last:border-0 group" onClick={() => handleSelectOrder(o)}>
                                                <span className="text-xs font-mono font-bold text-amber-700">{o.id}</span>
                                                <p className="text-sm font-semibold truncate group-hover:text-amber-700 transition-colors">{o.company || 'Unknown'}</p>
                                                <div className="flex items-center gap-3 mt-0.5 text-[10px] text-muted-foreground">
                                                    {o.product && <span className="flex items-center gap-1"><Package className="h-2.5 w-2.5" />{o.product}</span>}
                                                    {o.quantity && <span>{o.quantity} Kg</span>}
                                                    {o.name && <span>• {o.name}</span>}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {isDropdownOpen && !selectedOrder && !isEditMode && orderSearchInput.length >= 2 && !isSearching && orderOptions.length === 0 && (
                                    <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-card border rounded-xl shadow-xl p-4 text-center text-sm text-muted-foreground">
                                        No orders found for &quot;{orderSearchInput}&quot;
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ─── Details ─────────────────────────────── */}
                        <div className="space-y-3">
                            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                <Building2 className="h-3.5 w-3.5" /> Details
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-semibold">Party Name *</Label>
                                    <Input value={partyName} readOnly placeholder="Select order" className="h-8 text-xs bg-muted/40 cursor-not-allowed" required />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-semibold">Order ID</Label>
                                    <Input value={orderId} readOnly placeholder="Select order" className="h-8 text-xs bg-muted/40 cursor-not-allowed" />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-semibold">Invoice No.</Label>
                                    <Input value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} placeholder="e.g. FF/0994" className="h-8 text-xs" />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-semibold">Date</Label>
                                    <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-8 text-xs block w-full" />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-semibold">Narration</Label>
                                    <Input value={narration} onChange={(e) => setNarration(e.target.value)} placeholder="Optional note" className="h-8 text-xs" />
                                </div>
                            </div>
                        </div>

                        {/* ─── Products ────────────────────────────── */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                    <Package className="h-3.5 w-3.5" /> Products ({products.length}/5)
                                </h3>
                                {products.length < 5 && (
                                    <Button type="button" variant="outline" size="sm" onClick={addProduct} className="h-8 text-xs gap-1.5 px-3">
                                        <Plus className="h-3.5 w-3.5" /> Add
                                    </Button>
                                )}
                            </div>
                            <div className="space-y-4">
                                {products.map((product, index) => {
                                    const c = productCalcs[index];
                                    const hasValues = product.name && product.quantity && product.ubRate;
                                    return (
                                        <div key={index} className="bg-muted/30 rounded-xl border p-3 sm:p-4 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-bold text-muted-foreground">Product {index + 1}</span>
                                                {products.length > 1 && (
                                                    <Button type="button" variant="ghost" size="icon" onClick={() => removeProduct(index)} className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                                <div className="col-span-2 space-y-0.5">
                                                    <Label className="text-[9px] text-muted-foreground">Product Name</Label>
                                                    <Input value={product.name} onChange={(e) => updateProduct(index, 'name', e.target.value)} placeholder="e.g. White N.Fresh" className="h-7 text-[11px]" />
                                                </div>
                                                <div className="space-y-0.5">
                                                    <Label className="text-[9px] text-muted-foreground">Qty (Kg)</Label>
                                                    <Input type="number" value={product.quantity} onChange={(e) => updateProduct(index, 'quantity', e.target.value)} placeholder="0" className="h-7 text-[11px]" />
                                                </div>
                                                <div className="space-y-0.5">
                                                    <Label className="text-[9px] text-muted-foreground">U.B Rate</Label>
                                                    <Input type="number" value={product.ubRate} onChange={(e) => updateProduct(index, 'ubRate', e.target.value)} placeholder="0" className="h-7 text-[11px]" />
                                                </div>
                                                <div className="space-y-0.5">
                                                    <Label className="text-[9px] text-muted-foreground">A.Value Rate</Label>
                                                    <Input type="number" value={product.avRate} onChange={(e) => updateProduct(index, 'avRate', e.target.value)} placeholder="0" className="h-7 text-[11px]" />
                                                </div>
                                            </div>
                                            {hasValues && (
                                                <div className="grid grid-cols-4 gap-1.5 pt-2 border-t border-border/40">
                                                    <div className="text-center">
                                                        <p className="text-[8px] text-muted-foreground uppercase">GST</p>
                                                        <p className="text-[11px] font-mono font-semibold">{c.gst.toFixed(2)}</p>
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-[8px] text-muted-foreground uppercase">INV Amt</p>
                                                        <p className="text-[11px] font-mono font-semibold text-blue-700">{fmt(c.invAmt)}</p>
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-[8px] text-muted-foreground uppercase">U.B Amt</p>
                                                        <p className="text-[11px] font-mono font-semibold text-orange-700">{fmt(c.ubAmt)}</p>
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-[8px] text-muted-foreground uppercase">Total Pay</p>
                                                        <p className="text-[11px] font-mono font-bold text-emerald-700">{fmt(c.totalPay)}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* ─── Financial Adjustments ───────────────── */}
                        <div className="space-y-3">
                            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                <Wallet className="h-3.5 w-3.5" /> Financial Adjustments
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-semibold">Freight</Label>
                                    <Input type="number" value={fright} onChange={(e) => setFright(e.target.value)} placeholder="0" className="h-8 text-xs" />
                                    {fright && <p className="text-[9px] text-muted-foreground">Inc GST: {fmt(frightIncGst)}</p>}
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-semibold">Discount</Label>
                                    <Input type="number" value={discount} onChange={(e) => setDiscount(e.target.value)} placeholder="0" className="h-8 text-xs" />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-semibold">Additional Amounts</Label>
                                    <Input type="number" value={additionalAmounts} onChange={(e) => setAdditionalAmounts(e.target.value)} placeholder="0" className="h-8 text-xs" />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-semibold">Invamt</Label>
                                    <Input type="number" value={invamt} onChange={(e) => setInvamt(e.target.value)} placeholder="0" className="h-8 text-xs" />
                                    <p className="text-[9px] text-muted-foreground">Added to Invoice Total</p>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-semibold">Camt</Label>
                                    <Input type="number" value={camt} onChange={(e) => setCamt(e.target.value)} placeholder="0" className="h-8 text-xs" />
                                    <p className="text-[9px] text-muted-foreground">Added to U.B Total</p>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-semibold">Advance Amount</Label>
                                    <Input type="number" value={advanceAmount} onChange={(e) => setAdvanceAmount(e.target.value)} placeholder="0" className="h-8 text-xs" />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-semibold">Outstanding</Label>
                                    <Input type="number" value={outstandingAmount} onChange={(e) => setOutstandingAmount(e.target.value)} placeholder="0" className="h-8 text-xs" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-semibold">Book Balance</Label>
                                    <Input value={bookBalance} onChange={(e) => setBookBalance(e.target.value)} placeholder="0" className="h-8 text-xs" />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-semibold">Cash Balance</Label>
                                    <Input value={cashBalance} onChange={(e) => setCashBalance(e.target.value)} placeholder="0" className="h-8 text-xs" />
                                </div>
                            </div>
                        </div>

                        {/* ─── Live Summary ────────────────────────── */}
                        {(sumInvAmt > 0 || frightIncGst > 0) && (
                            <div className="bg-gradient-to-br from-muted/30 to-muted/10 rounded-xl border p-4 space-y-3">
                                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                    <FileText className="h-3.5 w-3.5" /> Live Summary
                                </h3>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    <div className="bg-blue-50/80 border border-blue-200/60 rounded-lg p-2.5 text-center">
                                        <p className="text-[9px] text-blue-600 uppercase font-semibold mb-0.5">Total Invoice</p>
                                        <p className="text-base font-black text-blue-700">{fmt(totalInvoice)}</p>
                                        <p className="text-[8px] text-blue-500 mt-0.5">Σ INV + Freight + Invamt</p>
                                    </div>
                                    <div className="bg-orange-50/80 border border-orange-200/60 rounded-lg p-2.5 text-center">
                                        <p className="text-[9px] text-orange-600 uppercase font-semibold mb-0.5">Total U.B</p>
                                        <p className="text-base font-black text-orange-700">{fmt(totalUb)}</p>
                                        <p className="text-[8px] text-orange-500 mt-0.5">Σ UB + Camt</p>
                                    </div>
                                    <div className="bg-emerald-50/80 border border-emerald-200/60 rounded-lg p-2.5 text-center">
                                        <p className="text-[9px] text-emerald-600 uppercase font-semibold mb-0.5">Grand Total</p>
                                        <p className="text-base font-black text-emerald-700">{fmt(grandTotal)}</p>
                                        <p className="text-[8px] text-emerald-500 mt-0.5">INV + U.B</p>
                                    </div>
                                    <div className="bg-violet-50/80 border border-violet-200/60 rounded-lg p-2.5 text-center">
                                        <p className="text-[9px] text-violet-600 uppercase font-semibold mb-0.5">To Pay</p>
                                        <p className="text-base font-black text-violet-700">{fmt(toPay)}</p>
                                        <p className="text-[8px] text-violet-500 mt-0.5">After disc & adj</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="border-t p-4 flex items-center justify-end gap-3 bg-background sticky bottom-0">
                        <Button type="button" variant="outline" onClick={onClose} className="rounded-xl px-5">Cancel</Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting || !partyName.trim()}
                            className={cn("rounded-xl px-5 text-white gap-2", isEditMode ? "bg-blue-500 hover:bg-blue-600" : "bg-amber-500 hover:bg-amber-600")}
                        >
                            {isSubmitting ? (
                                <><Loader2 className="h-4 w-4 animate-spin" />{isEditMode ? 'Saving...' : 'Creating...'}</>
                            ) : (
                                <>{isEditMode ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}{isEditMode ? 'Save Changes' : 'Create Record'}</>
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
