/**
 * U.B (Under Billing) Page
 * Protected by AuthGuard
 */

import { AuthGuard } from '@/components/auth-guard';
import { UbDashboard } from '@/components/ub/ub-dashboard';
import { UbAuthGuard } from '@/components/ub/ub-auth-guard';

export default function UbPage() {
    return (
        <AuthGuard>
            <UbAuthGuard>
                <UbDashboard />
            </UbAuthGuard>
        </AuthGuard>
    );
}
