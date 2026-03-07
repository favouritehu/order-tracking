'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lock, Loader2, ArrowRight, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { authedFetch } from '@/lib/api';

interface UbAuthGuardProps {
    children: React.ReactNode;
    asModal?: boolean;
}

export function UbAuthGuard({ children, asModal = false }: UbAuthGuardProps) {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const [password, setPassword] = useState('');
    const [isChecking, setIsChecking] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const res = await authedFetch('/api/auth/ub');
            if (res.ok) {
                const data = await res.json();
                setIsAuthenticated(data.authenticated);
            } else {
                setIsAuthenticated(false);
            }
        } catch (error) {
            console.error('Failed to check UB auth status', error);
            setIsAuthenticated(false);
        } finally {
            setIsChecking(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!password.trim()) return;

        setIsSubmitting(true);
        try {
            const res = await authedFetch('/api/auth/ub', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });

            // Parse response safely
            let data: any = {};
            try {
                data = await res.json();
            } catch (e) {
                console.error("Failed to parse JSON response");
            }

            if (res.ok && data.success) {
                setIsAuthenticated(true);
                toast.success('U.B Access Granted', {
                    description: 'Your session is active for 24 hours.'
                });
            } else {
                toast.error('Access Denied', {
                    description: data.error || 'Incorrect password'
                });
            }
        } catch (error) {
            toast.error('Authentication Error', {
                description: 'Failed to verify password. Please try again.'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isChecking) {
        if (asModal) {
            return (
                <div className="flex h-64 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
                </div>
            );
        }
        return (
            <div className="flex min-h-[50vh] flex-col items-center justify-center p-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary/50 mb-4" />
                <p className="text-sm text-muted-foreground animate-pulse">Verifying secure session...</p>
            </div>
        );
    }

    if (isAuthenticated) {
        return <>{children}</>;
    }

    const AuthContent = () => (
        <form onSubmit={handleSubmit} className="flex flex-col items-center text-center">
            <div className="mb-6 rounded-full bg-amber-500/10 p-4 ring-1 ring-amber-500/20">
                <ShieldCheck className="h-10 w-10 text-amber-500" />
            </div>

            <h2 className="mb-2 text-2xl font-bold tracking-tight">Protected Area</h2>
            <p className="mb-8 text-sm text-muted-foreground max-w-sm">
                The Under Billing (U.B) section contains sensitive financial data. Please enter the master password to unlock access.
            </p>

            <div className="w-full max-w-sm space-y-4">
                <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        type="password"
                        placeholder="Enter U.B Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 h-12 text-center text-lg tracking-widest bg-muted/50 focus-visible:ring-amber-500"
                        autoFocus
                        disabled={isSubmitting}
                    />
                </div>

                <Button
                    type="submit"
                    disabled={!password.trim() || isSubmitting}
                    className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-white font-semibold text-lg gap-2 rounded-xl transition-all"
                >
                    {isSubmitting ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                        <>Unlock Access <ArrowRight className="h-4 w-4" /></>
                    )}
                </Button>
            </div>
        </form>
    );

    if (asModal) {
        return (
            <div className="px-6 py-12 flex flex-col items-center">
                <AuthContent />
            </div>
        );
    }

    return (
        <div className="flex min-h-[calc(100vh-140px)] items-center justify-center p-4 sm:p-8">
            <div className="w-full max-w-md overflow-hidden rounded-[24px] border border-white/20 bg-white/40 p-8 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-black/40 relative">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-400" />
                <AuthContent />
            </div>
        </div>
    );
}
