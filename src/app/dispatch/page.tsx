/**
 * Dispatch Page
 * Protected by AuthGuard
 */

import { AuthGuard } from '@/components/auth-guard';
import { DispatchDashboard } from '@/components/dispatch/dispatch-dashboard';

export default function DispatchPage() {
    return (
        <AuthGuard>
            <DispatchDashboard />
        </AuthGuard>
    );
}
