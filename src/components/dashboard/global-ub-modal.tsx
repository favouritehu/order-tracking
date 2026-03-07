'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { UbRecord } from '@/types/ub';
import { UbDetailModal } from '@/components/ub/ub-detail-modal';
import { UbForm } from '@/components/ub/ub-form';
import { useUb } from '@/hooks/use-ub';
import { authedFetch } from '@/lib/api';

import { UbAuthGuard } from '@/components/ub/ub-auth-guard';

export function GlobalUbModal() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    const viewUbId = searchParams.get('viewUb');
    const [record, setRecord] = useState<UbRecord | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);

    const { updateRecord, isSaving } = useUb('');

    useEffect(() => {
        if (!viewUbId) {
            const timeout = setTimeout(() => setRecord(null), 300); // Wait for exit animation
            return () => clearTimeout(timeout);
        }

        const fetchRecord = async () => {
            try {
                // To fetch a single UB record by ID
                const res = await authedFetch(`/api/ub?search=${encodeURIComponent(viewUbId)}&limit=1`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.records && data.records.length > 0) {
                        setRecord(data.records[0]);
                        setIsOpen(true);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch U.B record for global modal", error);
            }
        };

        fetchRecord();
    }, [viewUbId]);

    const handleClose = () => {
        setIsOpen(false);
        const newParams = new URLSearchParams(searchParams.toString());
        newParams.delete('viewUb');

        const queryString = newParams.toString();
        router.push(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
    };

    const handleEdit = (recordToEdit: UbRecord) => {
        setRecord(recordToEdit);
        setIsOpen(false); // Close details
        setIsFormOpen(true); // Open edit form
    };

    const handleFormClose = () => {
        setIsFormOpen(false);
        // If we were just editing an existing view, open it back up
        if (viewUbId) {
            // setIsOpen(true); // No longer needed, `viewUbId` drives visibility
        }
    };

    if (!viewUbId && !record && !isFormOpen && !isOpen) return null;

    return (
        <UbAuthGuard asModal>
            <UbDetailModal
                record={record}
                isOpen={!!viewUbId && !isFormOpen} // Open if viewUbId is present and form is not open
                onClose={handleClose}
                onEdit={handleEdit}
            />

            <UbForm
                isOpen={isFormOpen}
                onClose={handleFormClose}
                editRecord={record || undefined}
                isSubmitting={isSaving}
                onSubmit={async (data) => {
                    if (record) {
                        return await updateRecord({ ...data, 'Unique ID': record['Row ID'] || record['Unique ID'] || '' });
                    }
                    return false;
                }}
            />
        </UbAuthGuard>
    );
}
