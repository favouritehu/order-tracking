/**
 * Navbar Component
 * Premium top navigation bar with gradient branding
 */

'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RefreshCw, Search, Menu, Package, X, BarChart3, LogOut, ClipboardCheck, Receipt, MessageCircle, Truck, SearchCheck } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useDebounce } from 'use-debounce';
import { useState, useEffect, useRef } from 'react';

interface NavbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  onMenuToggle: () => void;
}

function LogoutButton() {
  const { logout } = useAuth();
  const router = useRouter();

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => { logout(); router.replace('/login'); }}
      title="Sign out"
      className="h-9 w-9 text-muted-foreground hover:text-red-500"
    >
      <LogOut className="h-3.5 w-3.5" />
    </Button>
  );
}

export function Navbar({
  searchQuery,
  onSearchChange,
  onRefresh,
  isRefreshing,
  onMenuToggle,
}: NavbarProps) {
  // Local state for immediate typing feedback
  const [localQuery, setLocalQuery] = useState(searchQuery);
  // Debounce the typed value by 300ms
  const [debouncedQuery] = useDebounce(localQuery, 300);

  // When debounced value changes, tell the parent
  useEffect(() => {
    onSearchChange(debouncedQuery);
  }, [debouncedQuery, onSearchChange]);

  // Keep local state in sync if parent clears the search externally
  useEffect(() => {
    setLocalQuery(searchQuery);
  }, [searchQuery]);

  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut Cmd/Ctrl + K to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-4 gap-3">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden shrink-0"
          onClick={onMenuToggle}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Logo and Title */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="p-1.5 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg shadow-sm">
            <Package className="h-4.5 w-4.5 text-white" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-base font-bold tracking-tight">
              Order<span className="text-gradient">Tracker</span>
            </h1>
          </div>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-sm ml-auto mr-2">
          <div className="relative group">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              ref={inputRef}
              placeholder="Search orders..."
              value={localQuery}
              onChange={(e) => setLocalQuery(e.target.value)}
              className="pl-8 pr-12 h-9 text-sm bg-muted/50 border-transparent focus:border-primary/30 focus:bg-background transition-colors"
            />
            {!localQuery && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
                <span className="text-xs">⌘</span>K
              </div>
            )}
            {localQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0.5 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => setLocalQuery('')}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="hidden lg:flex items-center gap-1.5">
            <Link href="/search">
              <Button variant="outline" size="sm" className="h-9 text-xs gap-1.5 border-indigo-200 text-indigo-600 hover:bg-indigo-50">
                <SearchCheck className="h-3.5 w-3.5" />
                <span>Search</span>
              </Button>
            </Link>
            <Link href="/qc">
              <Button variant="outline" size="sm" className="h-9 text-xs gap-1.5">
                <ClipboardCheck className="h-3.5 w-3.5" />
                <span>QC</span>
              </Button>
            </Link>
            <Link href="/ub">
              <Button variant="outline" size="sm" className="h-9 text-xs gap-1.5">
                <Receipt className="h-3.5 w-3.5" />
                <span>U.B</span>
              </Button>
            </Link>
            <Link href="/comments">
              <Button variant="outline" size="sm" className="h-9 text-xs gap-1.5">
                <MessageCircle className="h-3.5 w-3.5" />
                <span>Comments</span>
              </Button>
            </Link>
            <Link href="/dispatch">
              <Button variant="outline" size="sm" className="h-9 text-xs gap-1.5">
                <Truck className="h-3.5 w-3.5" />
                <span>Dispatch</span>
              </Button>
            </Link>
            <Link href="/reports">
              <Button variant="outline" size="sm" className="h-9 text-xs gap-1.5">
                <BarChart3 className="h-3.5 w-3.5" />
                <span>Reports</span>
              </Button>
            </Link>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Refresh orders"
            className="h-9 w-9"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
