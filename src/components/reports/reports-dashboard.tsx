'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Package, Activity, Send, TrendingUp, RefreshCw, ArrowLeft, BarChart3, Users, MapPin, Search } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { Stats, OrderSummary } from '@/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { authedFetch } from '@/lib/api';

// Simple abstract map component for regions
function RegionsMap({ regions }: { regions: Record<string, number> }) {
    if (!regions || Object.keys(regions).length === 0) return null;

    // Filter top 8 regions to render on our abstract map
    const topRegions = Object.entries(regions)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8);

    const maxCount = Math.max(...topRegions.map(r => r[1]));

    // Generate stable but scattered positions for the top regions
    const positions = [
        { top: '25%', left: '35%' },
        { top: '45%', left: '60%' },
        { top: '65%', left: '40%' },
        { top: '30%', left: '75%' },
        { top: '75%', left: '25%' },
        { top: '55%', left: '80%' },
        { top: '80%', left: '65%' },
        { top: '20%', left: '50%' },
    ];

    return (
        <div className="relative w-full h-full min-h-[250px] bg-[#f8fafc] dark:bg-[#0f172a]/50 rounded-xl overflow-hidden border">
            {/* Abstract grid background */}
            <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
                style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)', backgroundSize: '24px 24px' }}
            />

            {topRegions.map(([name, count], index) => {
                const pos = positions[index % positions.length];
                const relativeSize = Math.max(0.4, count / maxCount);
                const size = 12 + (relativeSize * 24); // 12px to 36px

                return (
                    <div
                        key={name}
                        className="absolute transform -translate-x-1/2 -translate-y-1/2 group z-10 hover:z-20 transition-all duration-300"
                        style={{ top: pos.top, left: pos.left }}
                    >
                        {/* Pulse effect for top 3 */}
                        {index < 3 && (
                            <div
                                className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-20"
                                style={{ animationDuration: `${2 + index}s` }}
                            />
                        )}

                        {/* Node */}
                        <div
                            className="bg-blue-600 dark:bg-blue-500 rounded-full shadow-lg shadow-blue-500/20 border border-white dark:border-slate-800 transition-transform group-hover:scale-125"
                            style={{ width: `${size}px`, height: `${size}px` }}
                        />

                        {/* Label tooltip */}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none w-max bg-foreground text-background px-2.5 py-1.5 rounded-lg text-xs font-semibold shadow-xl">
                            {name}
                            <span className="ml-2 px-1.5 py-0.5 rounded bg-background/20 text-[10px]">{count}</span>
                            <div className="absolute -top-1 left-1/2 -translate-x-1/2 border-background border-4 border-t-transparent border-l-transparent border-r-transparent" />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// Simple horizontal bar component for pipeline
function HorizontalBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
    const percentage = total > 0 ? (value / total) * 100 : 0;
    return (
        <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-medium">
                <span className="text-foreground">{label}</span>
                <span className="text-muted-foreground">{value.toLocaleString()}</span>
            </div>
            <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                <div
                    className={cn("h-full rounded-full transition-all duration-700 ease-out", color)}
                    style={{ width: `${Math.max(percentage, 1)}%` }}
                />
            </div>
            <p className="text-[10px] text-muted-foreground">{percentage.toFixed(1)}% of total</p>
        </div>
    );
}

// Donut chart segment
function DonutChart({ data, total }: { data: { label: string; value: number; color: string }[]; total: number }) {
    const segments = data
        .filter(d => d.value > 0)
        .map((d, i, arr) => {
            const percent = (d.value / total) * 100;
            // Best safe implementation for React render context
            let cumulativePercent = 0;
            for (let j = 0; j < i; j++) {
                cumulativePercent += (arr[j].value / total) * 100;
            }
            return { ...d, percent, offset: cumulativePercent };
        });

    return (
        <div className="flex items-center gap-6">
            <div className="relative w-36 h-36 shrink-0">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                    {segments.map((seg, i) => (
                        <circle
                            key={i}
                            cx="18" cy="18" r="14"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="4"
                            strokeDasharray={`${seg.percent * 0.88} ${88 - seg.percent * 0.88}`}
                            strokeDashoffset={`${-seg.offset * 0.88}`}
                            className={seg.color.replace('bg-', 'text-')}
                            strokeLinecap="round"
                        />
                    ))}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                        <p className="text-2xl font-bold">{total.toLocaleString()}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total</p>
                    </div>
                </div>
            </div>
            <div className="space-y-1.5 flex-1 min-w-0">
                {segments.map((seg, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                        <div className={cn("w-2.5 h-2.5 rounded-full shrink-0", seg.color)} />
                        <span className="text-muted-foreground truncate flex-1">{seg.label}</span>
                        <span className="font-bold text-foreground">{seg.value.toLocaleString()}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export function ReportsDashboard() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [orderSummary, setOrderSummary] = useState<OrderSummary | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchData = useCallback(async (showRefresh = false) => {
        if (showRefresh) setIsRefreshing(true);
        try {
            const [statsRes, summaryRes] = await Promise.all([
                authedFetch('/api/stats'),
                authedFetch('/api/orders/summary')
            ]);
            const statsData = await statsRes.json();
            const summaryData = await summaryRes.json();
            setStats(statsData.stats);
            setOrderSummary(summaryData);
        } catch (error) {
            console.error('Failed to fetch reports data', error);
        } finally {
            setIsLoading(false);
            if (showRefresh) setIsRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-muted/30 p-8 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                        <div className="h-16 w-16 rounded-full border-4 border-indigo-200/50"></div>
                        <div className="h-16 w-16 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin absolute top-0 left-0"></div>
                    </div>
                    <p className="text-sm font-medium text-muted-foreground animate-pulse">Gathering intelligence...</p>
                </div>
            </div>
        );
    }

    if (!stats || !orderSummary) {
        return (
            <div className="min-h-screen bg-muted/30 p-8 flex items-center justify-center">
                <div className="text-center space-y-4 max-w-sm">
                    <Search className="h-12 w-12 text-muted-foreground mx-auto" />
                    <h2 className="text-xl font-bold">No Data Available</h2>
                    <p className="text-muted-foreground">We couldn't load the analytics data. Please try again later.</p>
                    <Button onClick={() => window.location.reload()}>Reload Page</Button>
                </div>
            </div>
        );
    }

    const total = stats.totalOrders || 0;
    const statusData = stats.statusBreakdown || {};

    const pipelineStatuses = ['New Order', 'Material In Process', 'Loading Point', 'Loading Done', 'Documents Ready'];
    const specialStatuses = ['Cancel', 'Hold'];

    // Grouping logic for donut & summary
    const activeOrders = pipelineStatuses.reduce((acc, status) => acc + (statusData[status] || 0), 0);
    const completedOrders = statusData['Dispatched'] || 0;
    const completionRate = total > 0 ? ((completedOrders / total) * 100).toFixed(1) : '0';

    // Status config for charts
    const STATUS_CONFIG: Record<string, { color: string, gradient: string, icon: any }> = {
        'New Order': { color: 'bg-blue-500', gradient: 'from-blue-500 to-blue-600', icon: Package },
        'Material In Process': { color: 'bg-indigo-500', gradient: 'from-indigo-500 to-indigo-600', icon: Activity },
        'Loading Point': { color: 'bg-amber-500', gradient: 'from-amber-500 to-amber-600', icon: MapPin },
        'Loading Done': { color: 'bg-orange-500', gradient: 'from-orange-500 to-orange-600', icon: Package },
        'Documents Ready': { color: 'bg-teal-500', gradient: 'from-teal-500 to-teal-600', icon: Activity },
        'Dispatched': { color: 'bg-emerald-500', gradient: 'from-emerald-500 to-emerald-600', icon: Send },
        'Cancel': { color: 'bg-slate-500', gradient: 'from-slate-500 to-slate-600', icon: Activity },
        'Hold': { color: 'bg-rose-500', gradient: 'from-rose-500 to-rose-600', icon: Activity },
    };

    // Donut chart data
    const donutData = [...pipelineStatuses, ...specialStatuses, 'Dispatched']
        .map(s => ({
            label: s,
            value: statusData[s] || 0,
            color: STATUS_CONFIG[s]?.color || 'bg-gray-500',
        }))
        .filter(d => d.value > 0);

    return (
        <div className="min-h-screen bg-muted/30 pb-12">
            {/* Header */}
            <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-xl">
                <div className="flex h-14 items-center px-4 gap-3 max-w-7xl mx-auto">
                    <Link href="/">
                        <Button variant="ghost" size="icon" className="shrink-0">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div className="flex items-center gap-2.5">
                        <div className="p-1.5 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg shadow-sm">
                            <BarChart3 className="h-4 w-4 text-white" />
                        </div>
                        <div>
                            <h1 className="text-base font-bold tracking-tight">Reports & Analytics</h1>
                        </div>
                    </div>
                    <div className="ml-auto">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fetchData(true)}
                            disabled={isRefreshing}
                            className="h-8 text-xs gap-1.5"
                        >
                            <RefreshCw className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")} />
                            Refresh
                        </Button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
                {/* Summary KPI row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                    {[
                        { label: 'Total Orders', value: total, icon: Package, gradient: 'from-indigo-500 to-indigo-600' },
                        { label: 'Active Pipeline', value: activeOrders, icon: Activity, gradient: 'from-violet-500 to-purple-600' },
                        { label: 'Dispatched', value: completedOrders, icon: Send, gradient: 'from-emerald-500 to-green-600' },
                        { label: 'Completion Rate', value: completionRate + '%', icon: TrendingUp, gradient: 'from-amber-500 to-orange-500' },
                    ].map(kpi => (
                        <Card key={kpi.label} className="relative overflow-hidden group">
                            <div className={cn("absolute top-0 left-0 bottom-0 w-1 bg-gradient-to-b", kpi.gradient)} />
                            <CardContent className="p-4 md:p-5 pl-5 md:pl-6">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{kpi.label}</p>
                                        <p className="text-2xl md:text-3xl font-bold tracking-tight text-foreground group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-br transition-all duration-300" style={{ backgroundImage: `var(--tw-gradient-stops)` }}>
                                            {typeof kpi.value === 'number' ? kpi.value.toLocaleString() : kpi.value}
                                        </p>
                                    </div>
                                    <div className={cn("p-2.5 rounded-xl bg-gradient-to-br opacity-80 group-hover:opacity-100 transition-opacity", kpi.gradient)}>
                                        <kpi.icon className="h-5 w-5 text-white" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Charts row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Status Breakdown - Donut */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <BarChart3 className="h-4 w-4 text-primary" />
                                Order Status Distribution
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-2">
                            <DonutChart data={donutData} total={total} />
                        </CardContent>
                    </Card>

                    {/* Pipeline Progress */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <Activity className="h-4 w-4 text-primary" />
                                Pipeline Breakdown
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-2 space-y-4">
                            {pipelineStatuses.map(status => (
                                <HorizontalBar
                                    key={status}
                                    label={status}
                                    value={statusData[status] || 0}
                                    total={total}
                                    color={`bg-gradient-to-r ${STATUS_CONFIG[status]?.gradient || 'from-gray-400 to-gray-500'}`}
                                />
                            ))}
                        </CardContent>
                    </Card>
                </div>

                {/* Detail breakdowns */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Top Customers (Parties) */}
                    {orderSummary?.parties && Object.keys(orderSummary.parties).length > 0 && (
                        <Card className="lg:col-span-2 relative overflow-hidden">
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-600" />
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base font-bold flex items-center gap-2">
                                    <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600">
                                        <Users className="h-4 w-4" />
                                    </div>
                                    Top Customers
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-2">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                                    {Object.entries(orderSummary.parties as Record<string, number>)
                                        .sort((a, b) => b[1] - a[1])
                                        .slice(0, 10)
                                        .map(([name, count]: [string, number], i) => (
                                            <div key={name} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                                                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                                                    {i + 1}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold truncate text-foreground/90">{name}</p>
                                                    <div className="w-full bg-muted h-1.5 mt-1.5 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-blue-500 rounded-full"
                                                            style={{ width: `${Math.max((count / total) * 100, 2)}%` }}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <span className="text-lg font-bold text-blue-700">{count.toLocaleString()}</span>
                                                    <p className="text-[10px] text-muted-foreground uppercase">Orders</p>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Top Regions (Locations) with Map */}
                    {orderSummary?.regions && Object.keys(orderSummary.regions).length > 0 && (
                        <Card className="relative overflow-hidden lg:col-span-2">
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 to-pink-600" />
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base font-bold flex items-center gap-2">
                                    <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600">
                                        <MapPin className="h-4 w-4" />
                                    </div>
                                    Top Regions & Delivery Map
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-2">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        {Object.entries(orderSummary.regions as Record<string, number>)
                                            .sort((a, b) => b[1] - a[1])
                                            .slice(0, 8)
                                            .map(([name, count]: [string, number], i) => (
                                                <div key={name} className="flex items-center justify-between text-sm py-1">
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        <span className="text-xs font-mono text-muted-foreground w-4">{i + 1}.</span>
                                                        <span className="truncate font-medium text-foreground/80">{name}</span>
                                                    </div>
                                                    <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">{count.toLocaleString()}</span>
                                                </div>
                                            ))}
                                    </div>
                                    <div className="relative isolate rounded-xl overflow-hidden shadow-inner border bg-muted/10 h-[300px]">
                                        <RegionsMap regions={orderSummary.regions} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Top Products */}
                    {orderSummary?.products && Object.keys(orderSummary.products).length > 0 && (
                        <Card className="relative overflow-hidden lg:col-span-full">
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 to-purple-600" />
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-bold flex items-center gap-2">
                                    <div className="p-1.5 rounded-lg bg-violet-500/10 text-violet-600">
                                        <Package className="h-4 w-4" />
                                    </div>
                                    Top Products
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-2">
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {Object.entries(orderSummary.products as Record<string, number>)
                                        .sort((a, b) => b[1] - a[1])
                                        .slice(0, 12)
                                        .map(([name, count]: [string, number], i) => (
                                            <div key={name} className="flex items-center justify-between text-sm bg-muted/30 p-2 rounded-lg">
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <span className="text-xs font-mono text-muted-foreground w-4">{i + 1}.</span>
                                                    <span className="truncate font-medium text-foreground/80" title={name}>{name}</span>
                                                </div>
                                                <span className="font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-md">{count.toLocaleString()}</span>
                                            </div>
                                        ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Special statuses */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {specialStatuses.map(status => {
                        const config = STATUS_CONFIG[status];
                        const count = statusData[status] || 0;
                        const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : '0';

                        return (
                            <Card key={status} className="relative overflow-hidden">
                                <div className={cn("absolute top-0 left-0 bottom-0 w-1 bg-gradient-to-b", config.gradient)} />
                                <CardContent className="p-5">
                                    <div className="flex items-center gap-4">
                                        <div className={cn("p-3 rounded-xl bg-gradient-to-br", config.gradient)}>
                                            <config.icon className="h-6 w-6 text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                                {status === 'Cancel' ? 'Cancelled Orders' : 'On Hold'}
                                            </p>
                                            <div className="flex items-baseline gap-2">
                                                <p className="text-3xl font-bold">{count.toLocaleString()}</p>
                                                <p className="text-sm text-muted-foreground">{percentage}% of total</p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </main>
        </div>
    );
}
