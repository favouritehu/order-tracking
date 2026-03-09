/**
 * Comment Form Component
 * Wide dialog form optimized for big screens – all fields visible without scrolling
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { authedFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { OrderCommentRecord } from '@/types/comments';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, MessageCircle, Search, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CommentFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: Record<string, unknown>) => Promise<boolean>;
    isSubmitting: boolean;
    initialOrderId?: string;
    initialPartyName?: string;
    editRecord?: OrderCommentRecord | null;
}

interface OrderOption {
    id: string;
    company: string;
}

const STATUS_OPTIONS = ['Follow Up', 'Pending', 'Resolved', 'Cancelled', 'Carry forward'];

export function CommentForm({ isOpen, onClose, onSubmit, isSubmitting, initialOrderId, initialPartyName, editRecord }: CommentFormProps) {
    const isEditMode = !!editRecord;
    const [orderId, setOrderId] = useState('');
    const [partyName, setPartyName] = useState('');
    const [balanceLeft, setBalanceLeft] = useState('');
    const [status, setStatus] = useState('Follow Up');
    const [comments, setComments] = useState('');
    const [carryForward, setCarryForward] = useState('');
    const [amountToPay, setAmountToPay] = useState('');
    const [email, setEmail] = useState('');

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
                setPartyName(editRecord['Party Name'] || '');
                setBalanceLeft(editRecord['Balance Left'] || '');
                setStatus(editRecord['Status'] || 'Follow Up');
                setComments(editRecord['Comments'] || '');
                setCarryForward(editRecord['Carry Forward'] || '');
                setAmountToPay(editRecord['Amount To Pay'] || '');
                setEmail(editRecord['Email'] || '');
            } else {
                setOrderId(initialOrderId || '');
                setPartyName(initialPartyName || '');
                setBalanceLeft('');
                setStatus('Follow Up');
                setComments('');
                setCarryForward('');
                setAmountToPay('');
                setEmail('');
            }
            setOrderSearchInput('');
        }
    }, [isOpen, initialOrderId, initialPartyName, editRecord]);

    // Order search debounce
    useEffect(() => {
        if (!orderSearchInput.trim() || orderSearchInput.length < 2) {
            setOrderOptions([]);
            return;
        }
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
            } catch { /* ignore */ } finally {
                setIsSearching(false);
            }
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [orderSearchInput]);

    // Click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectOrder = (option: OrderOption) => {
        setOrderId(option.id);
        setPartyName(option.company);
        setOrderSearchInput(option.id);
        setIsDropdownOpen(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!orderId.trim() || !comments.trim()) return;

        const data: Record<string, unknown> = {
            'Order Id': orderId,
            'Party Name': partyName,
            'Balance Left': balanceLeft,
            'Status': status,
            'Comments': comments,
            'Carry Forward': carryForward,
            'Amount To Pay': amountToPay,
            'Email': email,
        };

        if (editRecord) {
            data['Unique Id'] = editRecord['Unique Id'];
        }

        const success = await onSubmit(data);
        if (success) onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-3xl w-full p-0 overflow-hidden sm:rounded-2xl rounded-none sm:h-auto h-[100dvh] shadow-2xl border-muted/50 gap-0">
                <DialogHeader className="px-6 py-3 border-b bg-background relative shrink-0">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-400" />
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 text-blue-600 rounded-xl">
                            <MessageCircle className="h-5 w-5" />
                        </div>
                        <DialogTitle className="text-lg font-bold">{isEditMode ? 'Edit Comment' : 'Add Comment'}</DialogTitle>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3 sm:space-y-4 overflow-y-auto">
                    {/* Row 1: Order ID + Party Name + Email */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                        <div className="space-y-1" ref={dropdownRef}>
                            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Order ID *</Label>
                            {orderId ? (
                                <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-1.5 h-9">
                                    <Check className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                                    <span className="font-mono font-bold text-blue-700 text-sm truncate flex-1">{orderId}</span>
                                    <Button type="button" variant="ghost" size="sm" className="h-5 w-5 p-0 shrink-0" onClick={() => { setOrderId(''); setPartyName(''); setOrderSearchInput(''); }}>
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
                            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Party Name</Label>
                            <Input value={partyName} onChange={(e) => setPartyName(e.target.value)} placeholder="Party name" className="h-9 text-sm rounded-lg" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Email</Label>
                            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" className="h-9 text-sm rounded-lg" />
                        </div>
                    </div>

                    {/* Row 2: Status + Amounts side by side */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Status */}
                        <div className="space-y-1">
                            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Status</Label>
                            <div className="flex flex-wrap gap-1">
                                {STATUS_OPTIONS.map(s => (
                                    <button
                                        key={s}
                                        type="button"
                                        onClick={() => setStatus(s)}
                                        className={cn(
                                            "px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all border",
                                            status === s
                                                ? "bg-blue-50 border-blue-200 text-blue-700 ring-1 ring-blue-500/50"
                                                : "bg-muted/50 border-transparent hover:bg-muted text-muted-foreground"
                                        )}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Balance + Carry Forward + Amount */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                            <div className="space-y-1">
                                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Balance Left</Label>
                                <Input value={balanceLeft} onChange={(e) => setBalanceLeft(e.target.value)} placeholder="₹0" className="h-9 text-sm rounded-lg" />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Carry Forward</Label>
                                <Input value={carryForward} onChange={(e) => setCarryForward(e.target.value)} placeholder="₹0" className="h-9 text-sm rounded-lg" />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Amount To Pay</Label>
                                <Input value={amountToPay} onChange={(e) => setAmountToPay(e.target.value)} placeholder="₹0" className="h-9 text-sm rounded-lg" />
                            </div>
                        </div>
                    </div>

                    {/* Row 3: Comments */}
                    <div className="space-y-1">
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Comment *</Label>
                        <Textarea value={comments} onChange={(e) => setComments(e.target.value)} placeholder="Write your comment here..." rows={3} className="rounded-lg resize-none text-sm" />
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-2 pt-2 pb-4 sm:pb-0">
                        <Button type="button" variant="outline" onClick={onClose} className="rounded-xl px-5 h-9">Cancel</Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting || !orderId.trim() || !comments.trim()}
                            className="rounded-xl px-6 h-9 bg-blue-600 hover:bg-blue-700"
                        >
                            {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />{isEditMode ? 'Saving...' : 'Adding...'}</> : isEditMode ? 'Save Changes' : 'Add Comment'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
