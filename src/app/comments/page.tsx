/**
 * Comments Page
 * Protected by AuthGuard
 */

import { AuthGuard } from '@/components/auth-guard';
import { CommentsDashboard } from '@/components/comments/comments-dashboard';

export default function CommentsPage() {
    return (
        <AuthGuard>
            <CommentsDashboard />
        </AuthGuard>
    );
}
