/**
 * Dashboard Page
 * Protected by AuthGuard
 */

import { AuthGuard } from '@/components/auth-guard';
import { Dashboard } from '@/components/dashboard/dashboard';

export default function Home() {
  return (
    <AuthGuard>
      <Dashboard />
    </AuthGuard>
  );
}
