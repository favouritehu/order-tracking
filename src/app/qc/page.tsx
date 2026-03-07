/**
 * QC Page
 * Protected by AuthGuard
 */

import { AuthGuard } from '@/components/auth-guard';
import { QcDashboard } from '@/components/qc/qc-dashboard';

export default function QcPage() {
    return (
        <AuthGuard>
            <QcDashboard />
        </AuthGuard>
    );
}
