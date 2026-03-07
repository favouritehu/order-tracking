import { useState, useEffect } from "react";
import { authedFetch } from '@/lib/api';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Order, QcRecord, Stats } from "@/types";
import { UbRecord } from "@/types/ub";
import { StatusBadge } from "./status-badge";
import { Button } from "@/components/ui/button";
import { QcForm } from "@/components/qc/qc-form";
import { UbForm } from "@/components/ub/ub-form";
import { useComments } from "@/hooks/use-comments";
import { useDispatch } from "@/hooks/use-dispatch";
import {
    Plus,
    User,
    MapPin,
    Phone,
    Mail,
    FileText,
    Truck,
    Calendar,
    Package,
    Hash,
    Palette,
    CreditCard,
    Building2,
    Send,
    StickyNote,
    ClipboardList,
    Receipt,
    Weight,
    Ruler,
    MessageCircle, // For WhatsApp
    ChevronDown,
    ChevronUp,
    ScanLine,
    Search,
    FileCheck2,
    Banknote,
    Loader2,
    Copy,
    Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { OrderLink } from '@/components/ui/order-link';

interface OrderDetailsModalProps {
    order: Order | null;
    isOpen: boolean;
    onClose: () => void;
}

function DetailField({ icon: Icon, label, value, mono, highlight, isLink, linkHref }: {
    icon: typeof User;
    label: string;
    value: string | undefined;
    mono?: boolean;
    highlight?: boolean;
    isLink?: boolean;
    linkHref?: string;
}) {
    if (!value) return null;

    return (
        <div className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-muted/50 transition-colors group">
            <Icon className="h-4 w-4 text-muted-foreground shrink-0 group-hover:text-primary transition-colors" />
            <div className="min-w-0 flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4">
                <span className="text-xs font-medium text-muted-foreground/80 uppercase tracking-wider shrink-0">{label}</span>
                {isLink ? (
                    <a href={linkHref} target="_blank" rel="noopener noreferrer"
                        className="text-sm font-semibold text-primary hover:text-primary/80 hover:underline transition-colors truncate text-right">
                        {value}
                    </a>
                ) : (
                    <span className={cn(
                        "text-sm text-foreground text-left sm:text-right break-words",
                        mono ? "font-mono font-medium" : "font-semibold",
                        highlight && "text-primary font-bold",
                    )}>
                        {value}
                    </span>
                )}
            </div>
        </div>
    );
}

function SectionCard({ title, icon: Icon, children, gradientClass }: {
    title: string;
    icon: typeof User;
    children: React.ReactNode;
    gradientClass?: string;
}) {
    return (
        <div className="relative rounded-xl bg-card border shadow-sm overflow-hidden mb-6 group hover:shadow-md transition-all duration-200">
            {/* Top gradient accent matching OrderCard */}
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

export function OrderDetailsModal({ order, isOpen, onClose }: OrderDetailsModalProps) {
    const router = useRouter();

    const formatWhatsAppNumber = (num: string) => {
        const cleaned = num.replace(/\D/g, '');
        if (cleaned.length === 10) return `91${cleaned}`;
        return cleaned;
    };

    // Grab the accent gradient from the main order card logic if possible, or fallback
    const STATUS_ACCENTS: Record<string, string> = {
        'New Order': 'from-blue-500 to-blue-400',
        'Material In Process': 'from-orange-500 to-amber-400',
        'Loading Point': 'from-amber-500 to-yellow-400',
        'Loading Done': 'from-violet-500 to-purple-400',
        'Documents Ready': 'from-teal-500 to-cyan-400',
        'Dispatched': 'from-emerald-500 to-green-400',
        'Hold': 'from-rose-500 to-red-400',
        'Cancel': 'from-slate-500 to-gray-400',
    };
    const mainAccent = order ? STATUS_ACCENTS[order.Status] || 'from-gray-400 to-gray-300' : 'from-gray-400 to-gray-300';

    const [qcRecords, setQcRecords] = useState<QcRecord[]>([]);
    const [ubRecords, setUbRecords] = useState<UbRecord[]>([]);
    const [isLoadingQc, setIsLoadingQc] = useState(false);
    const [isLoadingUb, setIsLoadingUb] = useState(false);
    const [copied, setCopied] = useState(false);

    // New hooks for Comments & Dispatch
    const { records: commentsRecords, isLoading: isLoadingComments, fetchCommentsByOrder } = useComments();
    const { records: dispatchRecords, isLoading: isLoadingDispatch, fetchDispatchByOrder } = useDispatch();

    // Form states
    const [showQcForm, setShowQcForm] = useState(false);
    const [showUbForm, setShowUbForm] = useState(false);
    const [isSubmittingForm, setIsSubmittingForm] = useState(false);

    const handleCopyId = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (order) {
            navigator.clipboard.writeText(order['Unique Id']);
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    useEffect(() => {
        if (!order || !isOpen) return;

        const fetchRelatedRecords = async () => {
            setIsLoadingQc(true);
            setIsLoadingUb(true);

            try {
                // Fetch QC records
                const qcRes = await authedFetch(`/api/qc?orderId=${encodeURIComponent(order['Unique Id'])}`);
                if (qcRes.ok) {
                    const data = await qcRes.json();
                    setQcRecords(data.records || []);
                }
            } catch (error) {
                console.error("Failed to fetch related QC records:", error);
            } finally {
                setIsLoadingQc(false);
            }

            try {
                // Fetch UB records
                const ubRes = await authedFetch(`/api/ub?orderId=${encodeURIComponent(order['Unique Id'])}`);
                if (ubRes.ok) {
                    const data = await ubRes.json();
                    setUbRecords(data.records || []);
                }
            } catch (error) {
                console.error("Failed to fetch related U.B records:", error);
            } finally {
                setIsLoadingUb(false);
            }

            try {
                // Fetch Comments
                await fetchCommentsByOrder(order['Unique Id']);
            } catch (error) {
                console.error("Failed to fetch related Comments records:", error);
            }

            try {
                // Fetch Dispatch
                await fetchDispatchByOrder(order['Unique Id']);
            } catch (error) {
                console.error("Failed to fetch related Dispatch records:", error);
            }
        };

        fetchRelatedRecords();
        // Use order ID directly as dependency instead of the entire order object
    }, [order?.['Unique Id'], isOpen, fetchCommentsByOrder, fetchDispatchByOrder]);

    const handleCreateQc = async (data: Partial<QcRecord>) => {
        setIsSubmittingForm(true);
        try {
            const res = await authedFetch('/api/qc', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed to create QC record');
            toast.success('QC Record created successfully');

            if (!order) return false;
            // Refresh QC list
            const refreshRes = await authedFetch(`/api/qc?orderId=${encodeURIComponent(order['Unique Id'])}`);
            if (refreshRes.ok) {
                const refreshData = await refreshRes.json();
                setQcRecords(refreshData.records || []);
            }
            setShowQcForm(false);
            return true;
        } catch (error) {
            console.error(error);
            toast.error('Failed to create QC Record');
            return false;
        } finally {
            setIsSubmittingForm(false);
        }
    };

    const handleCreateUb = async (data: Record<string, unknown>) => {
        setIsSubmittingForm(true);
        try {
            const res = await authedFetch('/api/ub', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed to create U.B record');
            toast.success('U.B Record created successfully');

            if (!order) return false;
            // Refresh U.B list
            const refreshRes = await authedFetch(`/api/ub?orderId=${encodeURIComponent(order['Unique Id'])}`);
            if (refreshRes.ok) {
                const refreshData = await refreshRes.json();
                setUbRecords(refreshData.records || []);
            }
            setShowUbForm(false);
            return true;
        } catch (error) {
            console.error(error);
            toast.error('Failed to create U.B Record');
            return false;
        } finally {
            setIsSubmittingForm(false);
        }
    };

    // Guard against null order at the very beginning of render
    if (!order) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent
                aria-describedby="order-details-description"
                className="max-w-[95vw] lg:max-w-7xl w-full h-[95vh] flex flex-col p-0 overflow-hidden rounded-[20px] shadow-2xl border-muted/50 gap-0 bg-background"
            >
                {/* Hidden description for accessibility */}
                <span id="order-details-description" className="sr-only">
                    Details and records related to order {order['Unique Id']}
                </span>

                {/* Header matching dashboard navbar style */}
                <DialogHeader className="px-4 lg:px-8 py-3 lg:py-5 border-b bg-background relative shrink-0 z-10">
                    <div className={cn('absolute top-0 left-0 right-0 h-1 bg-gradient-to-r', mainAccent)} />
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 lg:gap-6 relative z-10 w-full">
                        <div className="space-y-2 lg:space-y-3">
                            <div className="flex items-start lg:items-center gap-3 lg:gap-4">
                                <div className="p-2 lg:p-3 bg-primary/10 text-primary rounded-xl lg:rounded-2xl shrink-0 hidden sm:block">
                                    <Package className="h-6 w-6 lg:h-8 lg:w-8" />
                                </div>
                                <div className="text-left w-full">
                                    <DialogTitle className="text-xl lg:text-4xl font-black tracking-tight mb-1.5 lg:mb-2 break-words leading-tight">
                                        {order ? order['COMPANY NAME'] || 'Order Details' : ''}
                                    </DialogTitle>
                                    <div className="flex flex-wrap items-center gap-2 lg:gap-3">
                                        <div className="flex items-center gap-1.5 text-muted-foreground bg-muted px-2 py-0.5 lg:px-3 lg:py-1 rounded-md lg:rounded-lg border text-xs lg:text-sm">
                                            <Hash className="h-3 w-3 lg:h-4 lg:w-4" />
                                            <span className="font-mono font-bold text-foreground">
                                                {order ? order['Unique Id'] : ''}
                                            </span>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className={cn("h-6 w-6 ml-0.5 rounded-md hover:bg-muted-foreground/10", copied && "text-green-600")}
                                                onClick={handleCopyId}
                                            >
                                                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />}
                                            </Button>
                                        </div>
                                        {order && <StatusBadge status={order.Status} />}
                                        <div className="flex items-center gap-1.5 text-muted-foreground bg-muted/50 px-2 py-0.5 lg:px-3 lg:py-1 rounded-md lg:rounded-lg border text-xs lg:text-sm">
                                            <Calendar className="h-3 w-3 lg:h-4 lg:w-4" />
                                            <span className="font-semibold text-foreground">
                                                {order ? order['order_date'] || 'No Date' : ''}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="shrink-0 flex items-center gap-3 self-start lg:self-center w-full lg:w-auto">
                            <Button
                                className="gap-1.5 lg:gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm rounded-lg lg:rounded-xl px-4 lg:px-6 h-10 lg:h-12 w-full lg:w-auto text-sm lg:text-base"
                                onClick={() => window.open(`https://www.appsheet.com/start/fd753d2f-bcb4-49ae-a8ad-9a333bba0d97`, '_blank')}
                            >
                                <ScanLine className="h-4 w-4 lg:h-5 lg:w-5" />
                                <span className="font-bold">Scan AppSheet</span>
                            </Button>
                            {order && order['Whatsapp'] && (
                                <Button
                                    className="gap-1.5 lg:gap-2 bg-[#25D366] hover:bg-[#1DA851] text-white shadow-sm rounded-lg lg:rounded-xl px-4 lg:px-6 h-10 lg:h-12 w-full lg:w-auto text-sm lg:text-base"
                                    onClick={() => window.open(`https://wa.me/${formatWhatsAppNumber(order['Whatsapp'])}`, '_blank')}
                                >
                                    <MessageCircle className="h-4 w-4 lg:h-5 lg:w-5" />
                                    <span className="font-bold">Chat</span>
                                </Button>
                            )}
                        </div>
                    </div>
                </DialogHeader>

                {/* Main Content Area - Split Layout */}
                <div className="flex-1 overflow-y-auto bg-background relative slim-scrollbar">
                    <div className="p-4 lg:p-8">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                            {/* Left Main Pillar (2/3 width) - Product, Shipping, Notes */}
                            <div className="lg:col-span-2 space-y-6">
                                {/* Product Specs Grid */}
                                <SectionCard title="Product Specifications" icon={Package} gradientClass="from-violet-500 to-purple-400">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-0">
                                        {order && (
                                            <>
                                                <DetailField icon={Package} label="Product" value={order['PRUDUCT']} highlight />
                                                <DetailField icon={Weight} label="Total Quantity" value={order['Total Order Quantity in Kg'] ? `${order['Total Order Quantity in Kg']} Kg` : undefined} />
                                                <DetailField icon={Ruler} label="Roll Size/GSM/Qty" value={order['Roll Size-Gsm With Quantity Of Product']} />
                                                <DetailField icon={Palette} label="Color" value={order['COLOR']} />
                                                <DetailField icon={FileText} label="Order Design" value={order['ORDER DESIGN']} />
                                                <DetailField icon={Calendar} label="Approx Delivery" value={order['Aprox Date']} />
                                                <DetailField icon={User} label="Salesperson" value={order['Sale_Name']} />
                                            </>
                                        )}
                                    </div>
                                </SectionCard>

                                {/* Notes - Full Width internally */}
                                {order && Boolean(order['Note'] || order['EXTRA NOTE:'] || order['Order Comments'] || order['Summary'] || order['Related Qcs']) && (
                                    <SectionCard title="Notes & Remarks" icon={StickyNote} gradientClass="from-rose-500 to-red-400">
                                        <div className="flex flex-col gap-0">
                                            {order['Note'] && <DetailField icon={StickyNote} label="General Note" value={order['Note']} />}
                                            {order['EXTRA NOTE:'] && <DetailField icon={FileText} label="Extra Note" value={order['EXTRA NOTE:']} />}
                                            {order['Order Comments'] && <DetailField icon={ClipboardList} label="Order Comments" value={order['Order Comments']} />}
                                            {order['Summary'] && <DetailField icon={FileText} label="Order Summary" value={order['Summary']} />}
                                            {order['Related Qcs'] && <DetailField icon={FileText} label="Related QCs" value={order['Related Qcs']} />}
                                        </div>
                                    </SectionCard>
                                )}

                                {/* Shipping Details */}
                                <SectionCard title="Logistics & Dispatch" icon={Truck} gradientClass="from-emerald-500 to-green-400">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-0">
                                        {order && (
                                            <>
                                                <DetailField icon={Truck} label="Transport Type" value={order['Transport_Type']} />
                                                <DetailField icon={Truck} label="Transporter Name" value={order['Transporter_Name']} />
                                                <DetailField icon={Hash} label="Driver No/Bilty No" value={order['Driver No/Bilty No.']} mono />
                                                <DetailField icon={FileText} label="Bilty" value={order['Bilty']} />
                                                <DetailField icon={Send} label="Dispatch Date" value={order['Dispatch Date']} />
                                                <DetailField icon={ClipboardList} label="Dispatch Summary" value={order['Dispatch summarys']} />
                                            </>
                                        )}
                                    </div>
                                </SectionCard>
                            </div>

                            {/* Right Sidebar Pillar (1/3 width) - Contact, Finance */}
                            <div className="lg:col-span-1 space-y-6">
                                {/* Customer Contact Area */}
                                <SectionCard title="Customer Information" icon={User} gradientClass="from-blue-500 to-blue-400">
                                    <div className="flex flex-col gap-0">
                                        {order && (
                                            <>
                                                <DetailField icon={Building2} label="Company Name" value={order['COMPANY NAME']} highlight />
                                                <DetailField icon={User} label="Contact Person" value={order['Name']} />
                                                <DetailField icon={Phone} label="Phone" value={order['Phone']} mono isLink linkHref={`tel:${order['Phone']}`} />
                                                <DetailField icon={Mail} label="Email" value={order['Email']} isLink linkHref={`mailto:${order['Email']}`} />
                                                <DetailField icon={MapPin} label="Address" value={order['Address']} />
                                                <DetailField icon={MapPin} label="Delivery Location" value={order['Delivery_Location']} />
                                                <DetailField icon={Hash} label="GST/Aadhaar" value={order['GST NO. / ADHAR CARD NO']} mono />
                                            </>
                                        )}
                                    </div>
                                </SectionCard>

                                {/* Financial Details */}
                                <SectionCard title="Finance & Billing" icon={CreditCard} gradientClass="from-amber-500 to-yellow-400">
                                    <div className="flex flex-col gap-0">
                                        {order && (
                                            <>
                                                <DetailField icon={CreditCard} label="Billing Type" value={order['Billing_Type']} />
                                                <DetailField icon={CreditCard} label="Token Amount" value={order['TOKEN AMOUNT']} mono highlight />
                                                <DetailField icon={CreditCard} label="Token Confirmed" value={order['Token Amount Confirmed']} />
                                                <DetailField icon={CreditCard} label="Balance Payment" value={order['Balance payment']} mono highlight />
                                                <DetailField icon={Receipt} label="Invoice" value={order['Invoice']} />
                                                <DetailField icon={FileText} label="PI" value={order['PI']} />
                                                <DetailField icon={FileText} label="Roll List" value={order['Roll List']} />
                                            </>
                                        )}
                                    </div>
                                </SectionCard>
                            </div>
                        </div>

                        {/* Related Records Section */}
                        <div className="mt-8 space-y-6 lg:space-y-8">
                            <h2 className="text-xl lg:text-2xl font-bold tracking-tight px-1 flex items-center gap-2">
                                Related Records
                            </h2>

                            <div className="w-full relative">
                                {/* Inline Forms - Overlays */}
                                {order && (
                                    <QcForm
                                        isOpen={showQcForm}
                                        onClose={() => setShowQcForm(false)}
                                        orderId={order['Unique Id']}
                                        partyName={order['COMPANY NAME'] || ''}
                                        phone={order['Phone'] || ''}
                                        email={order['Email'] || ''}
                                        onSubmit={handleCreateQc}
                                    />
                                )}

                                <Tabs defaultValue="qc" className="w-full">
                                    <TabsList className="grid w-full h-auto grid-cols-2 lg:grid-cols-4 mb-6">
                                        <TabsTrigger value="qc" className="flex items-center gap-2 py-2">
                                            <FileCheck2 className="h-4 w-4" />
                                            <span className="hidden sm:inline">Quality Control</span>
                                            <span className="inline sm:hidden">QC</span>
                                        </TabsTrigger>
                                        <TabsTrigger value="ub" className="flex items-center gap-2 py-2">
                                            <Banknote className="h-4 w-4" />
                                            <span className="hidden sm:inline">U.B Records</span>
                                            <span className="inline sm:hidden">U.B</span>
                                        </TabsTrigger>
                                        <TabsTrigger value="comments" className="flex items-center gap-2 py-2">
                                            <MessageCircle className="h-4 w-4" />
                                            <span className="hidden sm:inline">Order Comments</span>
                                            <span className="inline sm:hidden">Comments</span>
                                        </TabsTrigger>
                                        <TabsTrigger value="dispatch" className="flex items-center gap-2 py-2">
                                            <Truck className="h-4 w-4" />
                                            <span className="hidden sm:inline">Dispatch Summary</span>
                                            <span className="inline sm:hidden">Dispatch</span>
                                        </TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="qc" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                                        {/* QC Records */}
                                        <SectionCard
                                            title={`Quality Control (${qcRecords.length})`}
                                            icon={FileCheck2}
                                            gradientClass="from-blue-500 to-cyan-400"
                                        >
                                            <div className="absolute top-2 right-2 z-20">
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    className="h-7 text-xs gap-1 opacity-80 hover:opacity-100"
                                                    onClick={() => setShowQcForm(true)}
                                                    disabled={showQcForm}
                                                >
                                                    <Plus className="h-3 w-3" /> Add QC
                                                </Button>
                                            </div>
                                            <div className="max-h-[350px] overflow-y-auto slim-scrollbar pr-2">
                                                {isLoadingQc ? (
                                                    <div className="flex items-center justify-center p-8 text-muted-foreground">
                                                        <Loader2 className="h-6 w-6 animate-spin mr-2" />
                                                        <span>Loading QC records...</span>
                                                    </div>
                                                ) : qcRecords.length > 0 ? (
                                                    <div className="space-y-3">
                                                        {qcRecords.map((qc, idx) => (
                                                            <div
                                                                key={qc['_RowNumber'] || idx}
                                                                onClick={() => {
                                                                    const currentParams = new URLSearchParams(window.location.search);
                                                                    let currentPath = window.location.pathname;

                                                                    currentParams.set('viewQc', qc['Unique Id']);
                                                                    router.push(`${currentPath}?${currentParams.toString()}`, { scroll: false });
                                                                }}
                                                                className="bg-background border rounded-lg p-4 cursor-pointer hover:shadow-md hover:border-emerald-300 transition-all group"
                                                            >
                                                                <div className="flex justify-between items-start mb-2">
                                                                    <div className="font-semibold text-base group-hover:text-blue-600 transition-colors">{qc['Date']}</div>
                                                                    <div className="text-xs font-mono bg-muted px-2 py-0.5 rounded text-muted-foreground">{qc['Unique Id']}</div>
                                                                </div>
                                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-3 pt-3 border-t">
                                                                    <div><span className="text-muted-foreground text-xs uppercase block mb-0.5">QC By</span> <span className="font-medium">{qc['Qc By'] || '-'}</span></div>
                                                                    <div><span className="text-muted-foreground text-xs uppercase block mb-0.5">Loading By</span> <span className="font-medium">{qc['Loading By'] || '-'}</span></div>
                                                                    <div><span className="text-muted-foreground text-xs uppercase block mb-0.5">Net Wt</span> <span className="font-medium">{qc['Net wt'] || '-'}</span></div>
                                                                    <div><span className="text-muted-foreground text-xs uppercase block mb-0.5">Gross Wt</span> <span className="font-medium">{qc['Gross wt'] || '-'}</span></div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center p-8 text-center bg-muted/30 rounded-lg border border-dashed">
                                                        <Search className="h-8 w-8 text-muted-foreground mb-2" />
                                                        <p className="text-sm font-medium text-foreground">No QC Records Found</p>
                                                        <p className="text-xs text-muted-foreground">There are no quality control checks linked to this order yet.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </SectionCard>
                                    </TabsContent>

                                    <TabsContent value="ub" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                                        {/* U.B Records */}
                                        <SectionCard title={`Under Billing (${ubRecords.length})`} icon={Banknote} gradientClass="from-emerald-500 to-teal-400">
                                            <div className="absolute top-2 right-2 z-20">
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    className="h-7 text-xs gap-1 opacity-80 hover:opacity-100"
                                                    onClick={() => setShowUbForm(true)}
                                                    disabled={showUbForm}
                                                >
                                                    <Plus className="h-3 w-3" /> Add U.B
                                                </Button>
                                            </div>
                                            <div className="max-h-[350px] overflow-y-auto slim-scrollbar pr-2">
                                                {isLoadingUb ? (
                                                    <div className="flex items-center justify-center p-8 text-muted-foreground">
                                                        <Loader2 className="h-6 w-6 animate-spin mr-2" />
                                                        <span>Loading U.B records...</span>
                                                    </div>
                                                ) : ubRecords.length > 0 ? (
                                                    <div className="space-y-3">
                                                        {ubRecords.map((ub, idx) => (
                                                            <div
                                                                key={ub['_RowNumber'] || idx}
                                                                onClick={() => {
                                                                    const currentParams = new URLSearchParams(window.location.search);
                                                                    let currentPath = window.location.pathname;

                                                                    currentParams.set('viewUb', ub['Unique ID'] || ub['Row ID'] || '');
                                                                    router.push(`${currentPath}?${currentParams.toString()}`, { scroll: false });
                                                                }}
                                                                className="bg-background border rounded-lg p-4 cursor-pointer hover:shadow-md hover:border-amber-300 transition-all group"
                                                            >
                                                                <div className="flex justify-between items-start mb-2">
                                                                    <div className="font-semibold text-base flex items-center gap-2 group-hover:text-emerald-700 transition-colors">
                                                                        <Receipt className="h-5 w-5 text-emerald-500" />
                                                                        {ub['Invoice No.'] || 'No Invoice'}
                                                                    </div>
                                                                    <div className="text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-md border border-emerald-200">
                                                                        ₹{ub['GRAND TOTAL AMOUNT'] || '0'}
                                                                    </div>
                                                                </div>
                                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-3 pt-3 border-t">
                                                                    <div><span className="text-muted-foreground text-xs uppercase block mb-0.5">Date</span> <span className="font-medium">{ub['Date'] || '-'}</span></div>
                                                                    <div><span className="text-muted-foreground text-xs uppercase block mb-0.5">Party Name</span> <span className="truncate block font-medium">{ub['Party Name'] || '-'}</span></div>
                                                                    <div><span className="text-muted-foreground text-xs uppercase block mb-0.5">Approval</span> <span className="font-medium">{ub['Approval'] || '-'}</span></div>
                                                                    <div><span className="text-muted-foreground text-xs uppercase block mb-0.5">Total U.B</span> <span className="font-medium text-emerald-600">₹{ub['TOTAL U.B AMOUNT'] || '0'}</span></div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center p-8 text-center bg-muted/30 rounded-lg border border-dashed">
                                                        <Receipt className="h-8 w-8 text-muted-foreground mb-2" />
                                                        <p className="text-sm font-medium text-foreground">No U.B Records Found</p>
                                                        <p className="text-xs text-muted-foreground">There are no billing records linked to this order yet.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </SectionCard>
                                    </TabsContent>

                                    <TabsContent value="comments" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                                        {/* Order Comments */}
                                        <SectionCard title={`Order Comments (${commentsRecords.length})`} icon={MessageCircle} gradientClass="from-indigo-500 to-indigo-400">
                                            <div className="max-h-[350px] overflow-y-auto slim-scrollbar pr-2">
                                                {isLoadingComments ? (
                                                    <div className="flex items-center justify-center p-8 text-muted-foreground">
                                                        <Loader2 className="h-6 w-6 animate-spin mr-2" />
                                                        <span>Loading Comments...</span>
                                                    </div>
                                                ) : commentsRecords.length > 0 ? (
                                                    <div className="space-y-3">
                                                        {commentsRecords.map((comment, idx) => (
                                                            <div
                                                                key={comment['_RowNumber'] || idx}
                                                                className="bg-background border rounded-lg p-4 hover:shadow-md hover:border-indigo-300 transition-all cursor-default group"
                                                            >
                                                                <div className="flex justify-between items-start mb-2">
                                                                    <div className="font-semibold text-base group-hover:text-indigo-600 transition-colors">
                                                                        <OrderLink orderId={comment['Order Id'] || (order ? order['Unique Id'] : '')} showIcon={false} />
                                                                    </div>
                                                                    <div className="text-xs font-medium text-muted-foreground px-2 py-0.5 bg-muted rounded border">{comment['Last Update Date'] || '-'}</div>
                                                                </div>
                                                                <div className="text-sm text-foreground bg-muted/30 p-3 rounded-md border mt-2 mb-3">
                                                                    {comment['Comments'] || 'No additional comments.'}
                                                                </div>
                                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-3 pt-3 border-t">
                                                                    <div className="col-span-2"><span className="text-muted-foreground text-xs uppercase block mb-0.5">Party Name</span> <span className="font-medium truncate block">{comment['Party Name'] || '-'}</span></div>
                                                                    <div><span className="text-muted-foreground text-xs uppercase block mb-0.5">Status</span> <span className="font-medium">{comment['Status'] || '-'}</span></div>
                                                                    <div><span className="text-muted-foreground text-xs uppercase block mb-0.5">Balance Left</span> <span className="font-medium">{comment['Balance Left'] || '-'}</span></div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center p-8 text-center bg-muted/30 rounded-lg border border-dashed">
                                                        <MessageCircle className="h-8 w-8 text-muted-foreground mb-2" />
                                                        <p className="text-sm font-medium text-foreground">No Comments Found</p>
                                                        <p className="text-xs text-muted-foreground">There are no additional comments linked to this order yet.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </SectionCard>
                                    </TabsContent>

                                    <TabsContent value="dispatch" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                                        {/* Dispatch Summary */}
                                        <SectionCard title={`Dispatch Summary (${dispatchRecords.length})`} icon={Truck} gradientClass="from-amber-500 to-orange-400">
                                            <div className="max-h-[350px] overflow-y-auto slim-scrollbar pr-2">
                                                {isLoadingDispatch ? (
                                                    <div className="flex items-center justify-center p-8 text-muted-foreground">
                                                        <Loader2 className="h-6 w-6 animate-spin mr-2" />
                                                        <span>Loading Dispatch records...</span>
                                                    </div>
                                                ) : dispatchRecords.length > 0 ? (
                                                    <div className="space-y-3">
                                                        {dispatchRecords.map((dispatch, idx) => (
                                                            <div
                                                                key={dispatch['_RowNumber'] || idx}
                                                                className="bg-background border rounded-lg p-4 hover:shadow-md hover:border-amber-300 transition-all cursor-default group"
                                                            >
                                                                <div className="flex justify-between items-start mb-2">
                                                                    <div className="font-semibold text-base flex items-center gap-2 group-hover:text-amber-600 transition-colors">
                                                                        <Receipt className="h-5 w-5 text-amber-500" />
                                                                        {dispatch['Invoice No.'] || 'No Invoice'}
                                                                    </div>
                                                                    <div className="text-sm font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-md border border-amber-200 shadow-sm flex items-center gap-2">
                                                                        <Weight className="h-4 w-4" />
                                                                        {dispatch['Total Wt'] ? `${dispatch['Total Wt']} Kg` : '0 Kg'}
                                                                    </div>
                                                                </div>
                                                                <div className="mt-1 mb-3">
                                                                    <OrderLink orderId={dispatch['Order Id'] || (order ? order['Unique Id'] : '')} showIcon={false} className="text-sm text-muted-foreground" />
                                                                </div>

                                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-3 pt-3 border-t">
                                                                    <div><span className="text-muted-foreground text-xs uppercase block mb-0.5">Date</span> <span className="font-medium">{dispatch['Date'] || '-'}</span></div>
                                                                    <div><span className="text-muted-foreground text-xs uppercase block mb-0.5">Vehicle No</span> <span className="font-medium uppercase">{dispatch['Vehical No'] || '-'}</span></div>
                                                                    <div className="col-span-2"><span className="text-muted-foreground text-xs uppercase block mb-0.5">Buyer</span> <span className="font-medium truncate block">{dispatch['Buyer'] || '-'}</span></div>
                                                                </div>

                                                                <div className="mt-4 bg-muted/30 rounded-lg p-3 border">
                                                                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Roll Details (Total: {dispatch['Total Roll'] || 0})</div>
                                                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                                                                        {[1, 2, 3, 4, 5, 6].map((i) => {
                                                                            const rolls = dispatch[`${i}.No.of Rolls` as keyof typeof dispatch] as string;
                                                                            const qty = dispatch[`${i}.Qty` as keyof typeof dispatch] as string;
                                                                            if (!rolls && !qty) return null;

                                                                            return (
                                                                                <div key={`${dispatch['_RowNumber']}-roll-${i}`} className="text-xs bg-background p-1.5 rounded border shadow-sm">
                                                                                    <div className="font-medium text-foreground">{rolls || 0} Rolls</div>
                                                                                    <div className="text-muted-foreground">{qty || 0} Kg</div>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center p-8 text-center bg-muted/30 rounded-lg border border-dashed">
                                                        <Truck className="h-8 w-8 text-muted-foreground mb-2" />
                                                        <p className="text-sm font-medium text-foreground">No Dispatch Records Found</p>
                                                        <p className="text-xs text-muted-foreground">There are no dispatch summaries linked to this order yet.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </SectionCard>
                                    </TabsContent>

                                </Tabs>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Render U.B Form Dialog externally so it can pop over properly since it uses its own Dialog */}
                {order && (
                    <UbForm
                        isOpen={showUbForm}
                        onClose={() => setShowUbForm(false)}
                        onSubmit={handleCreateUb}
                        isSubmitting={isSubmittingForm}
                        initialOrder={{
                            id: order['Unique Id'],
                            company: order['COMPANY NAME'] || '',
                            product: order['PRUDUCT'],
                            quantity: order['Total Order Quantity in Kg'],
                            name: order['Name']
                        }}
                    />
                )}

                {/* Sticky Footer */}
                <div className="shrink-0 border-t bg-background px-6 lg:px-8 py-4 flex items-center justify-end z-40">
                    <Button variant="outline" onClick={onClose} className="rounded-xl px-6">
                        Close
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
