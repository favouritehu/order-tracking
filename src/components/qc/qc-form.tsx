/**
 * QC Form Component
 * Form to add a new QC inspection record
 * Supports both standalone mode (with order search) and order-specific mode
 */

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { QcRecord } from '@/types';
import { Loader2, ClipboardCheck, X, Camera, ImagePlus, Search, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { authedFetch } from '@/lib/api';

interface QcFormProps {
    isOpen: boolean;
    onClose: () => void;
    orderId?: string;
    partyName?: string;
    phone?: string;
    email?: string;
    onSubmit?: (data: Partial<QcRecord>) => Promise<boolean>;
    editRecord?: QcRecord;
}

interface OrderOption {
    id: string;
    company: string;
}

const TRANSPORT_METHODS = [
    'Part Load',
    'Pickup',
    'Transport',
    '14ft Truck',
];

const LOADING_BY_OPTIONS = [
    'Ranjeet Team',
    'Factory Labour',
];

const QC_BY_OPTIONS = [
    'Sanjay',
    'Pramod',
];

const QC_CHECK_OPTIONS = ['Ok', 'Not Ok', 'N/A'];
const HOOK_STICKER_OPTIONS = ['Y', 'N'];
const DAMAGE_OPTIONS = ['No', 'Yes'];

function QuickSelect({
    options,
    value,
    onChange,
    displayMap
}: {
    options: string[],
    value: string,
    onChange: (val: string) => void,
    displayMap?: Record<string, string>
}) {
    return (
        <div className="flex flex-wrap gap-2 mt-1.5">
            {options.map(o => (
                <button
                    key={o}
                    type="button"
                    onClick={() => onChange(o)}
                    className={cn(
                        "px-4 py-2 rounded-lg text-xs font-semibold transition-all border outline-none select-none",
                        value === o
                            ? "bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm ring-1 ring-emerald-500/50"
                            : "bg-muted/50 border-transparent hover:bg-muted text-muted-foreground hover:text-foreground active:scale-95"
                    )}
                >
                    {displayMap ? displayMap[o] || o : o}
                </button>
            ))}
        </div>
    );
}

// Convert file to base64 data URI
function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

export function QcForm({ isOpen, onClose, orderId: propOrderId, partyName: propPartyName, phone, email, onSubmit, editRecord }: QcFormProps) {
    // Determine if we're in "standalone" mode (no orderId provided upfront)
    const isStandalone = !propOrderId;

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [materialImage, setMaterialImage] = useState<File | null>(null);
    const [kataParchiImage, setKataParchiImage] = useState<File | null>(null);
    const [materialPreview, setMaterialPreview] = useState<string | null>(null);
    const [kataParchiPreview, setKataParchiPreview] = useState<string | null>(null);
    const materialInputRef = useRef<HTMLInputElement>(null);
    const kataParchiInputRef = useRef<HTMLInputElement>(null);

    // Order search state (for standalone mode)
    const [selectedOrderId, setSelectedOrderId] = useState('');
    const [selectedPartyName, setSelectedPartyName] = useState('');
    const [orderSearchInput, setOrderSearchInput] = useState('');
    const [orderOptions, setOrderOptions] = useState<OrderOption[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const [formData, setFormData] = useState({
        'Date': new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }),
        'Loading By': '',
        'Tranasport Methode': '',
        'Core': '',
        'Packaging': '',
        'Counting': '',
        'Sticker': '',
        'No  Hook Sticker': '',
        'If Any Damage': '',
        'Net wt': '',
        'Gross wt': '',
        'Truck Wt': '',
        'Qc By': '',
    });

    // Reset form when opened
    useEffect(() => {
        if (isOpen) {
            setSelectedOrderId(propOrderId || '');
            setSelectedPartyName(propPartyName || '');
            setOrderSearchInput('');
            setFormData({
                'Date': new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }),
                'Loading By': '',
                'Tranasport Methode': '',
                'Core': '',
                'Packaging': '',
                'Counting': '',
                'Sticker': '',
                'No  Hook Sticker': '',
                'If Any Damage': '',
                'Net wt': '',
                'Gross wt': '',
                'Truck Wt': '',
                'Qc By': '',
            });
            setMaterialImage(null);
            setKataParchiImage(null);
            setMaterialPreview(null);
            setKataParchiPreview(null);
        }
    }, [isOpen, propOrderId, propPartyName]);

    // Order search debounce (standalone mode)
    useEffect(() => {
        if (!isStandalone || !orderSearchInput.trim() || orderSearchInput.length < 2) {
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
    }, [orderSearchInput, isStandalone]);

    // Click outside dropdown
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
        setSelectedOrderId(option.id);
        setSelectedPartyName(option.company);
        setOrderSearchInput(option.id);
        setIsDropdownOpen(false);
    };

    const updateField = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleFileChange = (file: File | null, type: 'material' | 'kataParchi') => {
        if (!file) return;
        if (type === 'material') {
            setMaterialImage(file);
            setMaterialPreview(URL.createObjectURL(file));
        } else {
            setKataParchiImage(file);
            setKataParchiPreview(URL.createObjectURL(file));
        }
    };

    const removeFile = (type: 'material' | 'kataParchi') => {
        if (type === 'material') {
            setMaterialImage(null);
            setMaterialPreview(null);
            if (materialInputRef.current) materialInputRef.current.value = '';
        } else {
            setKataParchiImage(null);
            setKataParchiPreview(null);
            if (kataParchiInputRef.current) kataParchiInputRef.current.value = '';
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData['Qc By'] || !selectedOrderId) return;
        if (!onSubmit) return;

        // Close form instantly to unblock UI
        onClose();

        // Process file encoding and actual submission in the background
        const processSubmit = async () => {
            try {
                const submitData: Record<string, unknown> = {
                    ...formData,
                    'Order Id': selectedOrderId,
                    'Party Name': selectedPartyName,
                    'Phone no': phone || '',
                    'Email': email || '',
                };

                if (materialImage) {
                    submitData['Material Image (With Truck)'] = await fileToBase64(materialImage);
                }
                if (kataParchiImage) {
                    submitData['Kata Parchi Image'] = await fileToBase64(kataParchiImage);
                }

                await onSubmit(submitData as Partial<QcRecord>);
            } catch (error) {
                console.error('Error preparing QC data:', error);
            }
        };

        processSubmit();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-[95vw] lg:max-w-3xl w-full max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-[20px] shadow-2xl border-muted/50 gap-0">
                <DialogHeader className="px-6 py-4 border-b bg-background relative shrink-0">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400" />
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
                            <ClipboardCheck className="h-5 w-5" />
                        </div>
                        <DialogTitle className="text-lg font-bold">
                            New QC Inspection
                        </DialogTitle>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto slim-scrollbar">
                    <div className="p-6 space-y-6">
                        {/* Order Info */}
                        {isStandalone ? (
                            /* Standalone mode: Order search */
                            <div className="space-y-1.5" ref={dropdownRef}>
                                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Order ID *</Label>
                                {selectedOrderId ? (
                                    <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                                        <Check className="h-4 w-4 text-emerald-600" />
                                        <span className="font-mono font-bold text-emerald-700 flex-1">{selectedOrderId}</span>
                                        <span className="text-xs text-muted-foreground">{selectedPartyName}</span>
                                        <Button type="button" variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => { setSelectedOrderId(''); setSelectedPartyName(''); setOrderSearchInput(''); }}>
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input value={orderSearchInput} onChange={(e) => setOrderSearchInput(e.target.value)} placeholder="Search order..." className="pl-9 rounded-lg" />
                                        {isSearching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
                                        {isDropdownOpen && orderOptions.length > 0 && (
                                            <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                                                {orderOptions.map((opt) => (
                                                    <button key={opt.id} type="button" onClick={() => selectOrder(opt)} className="w-full px-3 py-2 text-left hover:bg-muted text-sm flex justify-between items-center">
                                                        <span className="font-mono font-bold">{opt.id}</span>
                                                        <span className="text-xs text-muted-foreground truncate ml-2">{opt.company}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* Order-specific mode: Read-only display */
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <Label className="text-xs text-muted-foreground">Order ID</Label>
                                    <Input value={selectedOrderId} disabled className="mt-1 bg-muted/50 text-xs font-mono" />
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">Party Name</Label>
                                    <Input value={selectedPartyName} disabled className="mt-1 bg-muted/50 text-xs" />
                                </div>
                            </div>
                        )}

                        {/* QC Inspector & Transport */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <Label className="text-xs text-muted-foreground">
                                    QC By <span className="text-destructive">*</span>
                                </Label>
                                <QuickSelect
                                    options={QC_BY_OPTIONS}
                                    value={formData['Qc By']}
                                    onChange={(val) => updateField('Qc By', val)}
                                />
                            </div>
                            <div>
                                <Label className="text-xs text-muted-foreground">Loading By</Label>
                                <QuickSelect
                                    options={LOADING_BY_OPTIONS}
                                    value={formData['Loading By']}
                                    onChange={(val) => updateField('Loading By', val)}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <Label className="text-xs text-muted-foreground">Transport Method</Label>
                                <QuickSelect
                                    options={TRANSPORT_METHODS}
                                    value={formData['Tranasport Methode']}
                                    onChange={(val) => updateField('Tranasport Methode', val)}
                                />
                            </div>
                        </div>

                        {/* QC Checks */}
                        <div>
                            <h4 className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground mb-3">
                                Quality Checks
                            </h4>
                            <div className="grid grid-cols-1 gap-2.5">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between border rounded-xl p-3 bg-muted/10 transition-colors hover:bg-muted/20">
                                    <Label className="text-xs text-muted-foreground font-medium sm:w-28 shrink-0 mb-1 sm:mb-0">Core</Label>
                                    <QuickSelect options={QC_CHECK_OPTIONS} value={formData['Core']} onChange={(val) => updateField('Core', val)} />
                                </div>
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between border rounded-xl p-3 bg-muted/10 transition-colors hover:bg-muted/20">
                                    <Label className="text-xs text-muted-foreground font-medium sm:w-28 shrink-0 mb-1 sm:mb-0">Packaging</Label>
                                    <QuickSelect options={QC_CHECK_OPTIONS} value={formData['Packaging']} onChange={(val) => updateField('Packaging', val)} />
                                </div>
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between border rounded-xl p-3 bg-muted/10 transition-colors hover:bg-muted/20">
                                    <Label className="text-xs text-muted-foreground font-medium sm:w-28 shrink-0 mb-1 sm:mb-0">Sticker</Label>
                                    <QuickSelect options={QC_CHECK_OPTIONS} value={formData['Sticker']} onChange={(val) => updateField('Sticker', val)} />
                                </div>
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between border rounded-xl p-3 bg-muted/10 transition-colors hover:bg-muted/20">
                                    <Label className="text-xs text-muted-foreground font-medium sm:w-28 shrink-0 mb-1 sm:mb-0">Hook Sticker</Label>
                                    <QuickSelect options={HOOK_STICKER_OPTIONS} value={formData['No  Hook Sticker']} onChange={(val) => updateField('No  Hook Sticker', val)} displayMap={{ 'Y': 'Yes', 'N': 'No' }} />
                                </div>
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between border rounded-xl p-3 bg-muted/10 transition-colors hover:bg-muted/20">
                                    <Label className="text-xs text-muted-foreground font-medium sm:w-28 shrink-0 mb-1 sm:mb-0">Any Damage?</Label>
                                    <QuickSelect options={DAMAGE_OPTIONS} value={formData['If Any Damage']} onChange={(val) => updateField('If Any Damage', val)} />
                                </div>
                            </div>
                        </div>

                        {/* Weight & Count */}
                        <div>
                            <h4 className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground mb-3">
                                Measurements
                            </h4>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <div>
                                    <Label className="text-xs text-muted-foreground">Counting</Label>
                                    <Input
                                        type="number"
                                        value={formData['Counting']}
                                        onChange={(e) => updateField('Counting', e.target.value)}
                                        placeholder="0"
                                        className="mt-1 text-xs"
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">Net Weight (kg)</Label>
                                    <Input
                                        type="number"
                                        step="0.1"
                                        value={formData['Net wt']}
                                        onChange={(e) => updateField('Net wt', e.target.value)}
                                        placeholder="0.0"
                                        className="mt-1 text-xs"
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">Gross Weight (kg)</Label>
                                    <Input
                                        type="number"
                                        step="0.1"
                                        value={formData['Gross wt']}
                                        onChange={(e) => updateField('Gross wt', e.target.value)}
                                        placeholder="0.0"
                                        className="mt-1 text-xs"
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">Truck Weight (kg)</Label>
                                    <Input
                                        type="number"
                                        step="0.1"
                                        value={formData['Truck Wt']}
                                        onChange={(e) => updateField('Truck Wt', e.target.value)}
                                        placeholder="0.0"
                                        className="mt-1 text-xs"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Image Uploads */}
                        <div>
                            <h4 className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground mb-3">
                                Photo Uploads
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Material Image */}
                                <div>
                                    <Label className="text-xs text-muted-foreground">Material Image (With Truck)</Label>
                                    <input
                                        ref={materialInputRef}
                                        type="file"
                                        accept="image/*"
                                        capture="environment"
                                        className="hidden"
                                        onChange={(e) => handleFileChange(e.target.files?.[0] || null, 'material')}
                                    />
                                    {materialPreview ? (
                                        <div className="mt-1 relative rounded-lg overflow-hidden border bg-muted/30">
                                            <img src={materialPreview} alt="Material" className="w-full h-32 object-cover" />
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="icon"
                                                className="absolute top-1.5 right-1.5 h-6 w-6"
                                                onClick={() => removeFile('material')}
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="mt-1 w-full h-24 flex flex-col gap-1.5 border-dashed"
                                            onClick={() => materialInputRef.current?.click()}
                                        >
                                            <Camera className="h-5 w-5 text-muted-foreground" />
                                            <span className="text-[10px] text-muted-foreground">Tap to capture or upload</span>
                                        </Button>
                                    )}
                                </div>

                                {/* Kata Parchi Image */}
                                <div>
                                    <Label className="text-xs text-muted-foreground">Kata Parchi Image</Label>
                                    <input
                                        ref={kataParchiInputRef}
                                        type="file"
                                        accept="image/*"
                                        capture="environment"
                                        className="hidden"
                                        onChange={(e) => handleFileChange(e.target.files?.[0] || null, 'kataParchi')}
                                    />
                                    {kataParchiPreview ? (
                                        <div className="mt-1 relative rounded-lg overflow-hidden border bg-muted/30">
                                            <img src={kataParchiPreview} alt="Kata Parchi" className="w-full h-32 object-cover" />
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="icon"
                                                className="absolute top-1.5 right-1.5 h-6 w-6"
                                                onClick={() => removeFile('kataParchi')}
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="mt-1 w-full h-24 flex flex-col gap-1.5 border-dashed"
                                            onClick={() => kataParchiInputRef.current?.click()}
                                        >
                                            <ImagePlus className="h-5 w-5 text-muted-foreground" />
                                            <span className="text-[10px] text-muted-foreground">Tap to capture or upload</span>
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Submit */}
                        <div className="border-t p-4 flex items-center justify-end gap-3 bg-background sticky bottom-0 mt-6">
                            <Button type="button" variant="outline" onClick={onClose} className="rounded-xl px-5 text-sm">
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting || !formData['Qc By'] || !selectedOrderId}
                                className="rounded-xl px-5 gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-sm"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        <ClipboardCheck className="h-3 w-3" />
                                        Submit QC Report
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
