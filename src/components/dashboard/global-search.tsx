/**
 * Global Search Page
 * Fast unified search across Orders, QC, UB, Comments, and Dispatch
 */

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { authedFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Search,
    ArrowLeft,
    Loader2,
    Package,
    ClipboardCheck,
    Receipt,
    MessageCircle,
    Truck,
    X,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface SearchResult {
    id: string;
    type: 'order' | 'qc' | 'ub' | 'comment' | 'dispatch';
    title: string;
    subtitle: string;
    extra?: string;
}

const TYPE_CONFIG = {
    order: { icon: Package, color: 'text-indigo-600 bg-indigo-500/10', label: 'Order', href: (id: string) => `/?viewOrder=${id}` },
    qc: { icon: ClipboardCheck, color: 'text-emerald-600 bg-emerald-500/10', label: 'QC', href: () => '/qc' },
    ub: { icon: Receipt, color: 'text-amber-600 bg-amber-500/10', label: 'U.B', href: () => '/ub' },
    comment: { icon: MessageCircle, color: 'text-blue-600 bg-blue-500/10', label: 'Comment', href: () => '/comments' },
    dispatch: { icon: Truck, color: 'text-violet-600 bg-violet-500/10', label: 'Dispatch', href: () => '/dispatch' },
};

export function GlobalSearch() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const doSearch = useCallback(async (searchQuery: string) => {
        if (!searchQuery.trim()) {
            setResults([]);
            setHasSearched(false);
            return;
        }
        setIsSearching(true);
        setHasSearched(true);

        try {
            // Fire all 5 API calls in parallel
            const [ordersRes, qcRes, ubRes, commentsRes, dispatchRes] = await Promise.all([
                authedFetch(`/api/orders?search=${encodeURIComponent(searchQuery)}&limit=5`).catch(() => null),
                authedFetch(`/api/qc?search=${encodeURIComponent(searchQuery)}&limit=5`).catch(() => null),
                authedFetch(`/api/ub?search=${encodeURIComponent(searchQuery)}&limit=5`).catch(() => null),
                authedFetch(`/api/comments?search=${encodeURIComponent(searchQuery)}&limit=5`).catch(() => null),
                authedFetch(`/api/dispatch?search=${encodeURIComponent(searchQuery)}&limit=5`).catch(() => null),
            ]);

            const allResults: SearchResult[] = [];

            // Orders
            if (ordersRes?.ok) {
                const data = await ordersRes.json();
                (data.orders || []).slice(0, 5).forEach((o: Record<string, string>) => {
                    allResults.push({
                        id: o['Unique Id'],
                        type: 'order',
                        title: o['Unique Id'],
                        subtitle: o['COMPANY NAME'] || o['Name'] || '',
                        extra: o['Status'],
                    });
                });
            }

            // QC
            if (qcRes?.ok) {
                const data = await qcRes.json();
                (data.records || []).slice(0, 5).forEach((r: Record<string, string>) => {
                    allResults.push({
                        id: r['Unique Id'] || r['_RowNumber'],
                        type: 'qc',
                        title: r['Order Id'],
                        subtitle: r['Party Name'] || '',
                        extra: r['Date'],
                    });
                });
            }

            // UB
            if (ubRes?.ok) {
                const data = await ubRes.json();
                (data.records || []).slice(0, 5).forEach((r: Record<string, string>) => {
                    allResults.push({
                        id: r['Unique ID'] || r['_RowNumber'],
                        type: 'ub',
                        title: r['Unique ID'],
                        subtitle: r['Party Name'] || '',
                        extra: r['GRAND TOTAL AMOUNT'] ? `₹${r['GRAND TOTAL AMOUNT']}` : '',
                    });
                });
            }

            // Comments
            if (commentsRes?.ok) {
                const data = await commentsRes.json();
                (data.records || []).slice(0, 5).forEach((r: Record<string, string>) => {
                    allResults.push({
                        id: r['Unique Id'] || r['_RowNumber'],
                        type: 'comment',
                        title: r['Order Id'],
                        subtitle: r['Party Name'] || '',
                        extra: r['Status'],
                    });
                });
            }

            // Dispatch
            if (dispatchRes?.ok) {
                const data = await dispatchRes.json();
                (data.records || []).slice(0, 5).forEach((r: Record<string, string>) => {
                    allResults.push({
                        id: r['Unique ID'] || r['_RowNumber'],
                        type: 'dispatch',
                        title: r['Order Id'],
                        subtitle: r['Buyer'] || '',
                        extra: r['Date'],
                    });
                });
            }

            setResults(allResults);
        } catch (error) {
            console.error('Global search error:', error);
        } finally {
            setIsSearching(false);
        }
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        doSearch(query);
    };

    const handleClear = () => {
        setQuery('');
        setResults([]);
        setHasSearched(false);
        inputRef.current?.focus();
    };

    const handleResultClick = (result: SearchResult) => {
        const config = TYPE_CONFIG[result.type];
        router.push(config.href(result.id));
    };

    // Group results by type
    const grouped = results.reduce((acc, r) => {
        if (!acc[r.type]) acc[r.type] = [];
        acc[r.type].push(r);
        return acc;
    }, {} as Record<string, SearchResult[]>);

    return (
        <div className="flex flex-col h-full bg-background">
            {/* Header */}
            <div className="shrink-0 border-b bg-background px-4 lg:px-6 py-3">
                <div className="flex items-center gap-3">
                    <Link href="/">
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div className="p-1.5 bg-indigo-500/10 text-indigo-600 rounded-lg">
                        <Search className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                        <h1 className="text-lg font-black tracking-tight">Global Search</h1>
                        <p className="text-[10px] text-muted-foreground">Search across Orders, QC, U.B, Comments, Dispatch</p>
                    </div>
                </div>

                <form onSubmit={handleSearch} className="mt-3 flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            ref={inputRef}
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Type Order ID, party name, or any keyword..."
                            className="pl-10 h-10 text-sm rounded-lg"
                        />
                        {query && (
                            <Button type="button" variant="ghost" size="sm" className="absolute right-12 top-1/2 -translate-y-1/2 h-7 w-7 p-0" onClick={handleClear}>
                                <X className="h-3.5 w-3.5" />
                            </Button>
                        )}
                    </div>
                    <Button type="submit" disabled={!query.trim() || isSearching} className="h-10 px-5 rounded-lg bg-indigo-600 hover:bg-indigo-700">
                        {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
                    </Button>
                </form>
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto p-4 lg:p-6">
                {isSearching && (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                )}

                {!isSearching && hasSearched && results.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                        <Search className="h-12 w-12 mb-3 opacity-30" />
                        <p className="text-sm font-medium">No results found</p>
                        <p className="text-xs mt-1">Try a different search term</p>
                    </div>
                )}

                {!isSearching && results.length > 0 && (
                    <div className="space-y-6 max-w-3xl mx-auto">
                        {(Object.keys(grouped) as Array<keyof typeof TYPE_CONFIG>).map((type) => {
                            const config = TYPE_CONFIG[type];
                            const Icon = config.icon;
                            const items = grouped[type];

                            return (
                                <div key={type}>
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className={`p-1 rounded-md ${config.color}`}>
                                            <Icon className="h-3.5 w-3.5" />
                                        </div>
                                        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                            {config.label} ({items.length})
                                        </h2>
                                    </div>
                                    <div className="space-y-1">
                                        {items.map((result, idx) => (
                                            <div
                                                key={`${result.type}-${result.id}-${idx}`}
                                                onClick={() => handleResultClick(result)}
                                                className="flex items-center gap-3 px-3 py-2.5 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors group"
                                            >
                                                <span className="font-mono font-bold text-xs min-w-[80px]">{result.title}</span>
                                                <span className="text-xs text-muted-foreground flex-1 truncate">{result.subtitle}</span>
                                                {result.extra && (
                                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted font-medium shrink-0">{result.extra}</span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {!isSearching && !hasSearched && (
                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                        <Search className="h-12 w-12 mb-3 opacity-20" />
                        <p className="text-sm font-medium">Search all tables at once</p>
                        <p className="text-xs mt-1">Results from Orders, QC, U.B, Comments, and Dispatch</p>
                    </div>
                )}
            </div>
        </div>
    );
}
