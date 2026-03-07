/**
 * Global Search Page
 * Protected by AuthGuard
 */

import { AuthGuard } from '@/components/auth-guard';
import { GlobalSearch } from '@/components/dashboard/global-search';

export default function SearchPage() {
    return (
        <AuthGuard>
            <GlobalSearch />
        </AuthGuard>
    );
}
