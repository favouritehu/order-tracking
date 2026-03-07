/**
 * Reports Page
 * Protected by AuthGuard
 */

import { AuthGuard } from '@/components/auth-guard';
import { ReportsDashboard } from '@/components/reports/reports-dashboard';

export default function ReportsPage() {
    return (
        <AuthGuard>
            <ReportsDashboard />
        </AuthGuard>
    );
}
