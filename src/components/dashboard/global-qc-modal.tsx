'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { QcRecord } from '@/types';
import { QcDetailModal } from '@/components/qc/qc-detail-modal';
import { QcForm } from '@/components/qc/qc-form';
import { useQc } from '@/hooks/use-qc';
import { authedFetch } from '@/lib/api';

export function GlobalQcModal() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    const viewQcId = searchParams.get('viewQc');
    const [record, setRecord] = useState<QcRecord | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);

    const { addQcRecord } = useQc();

    useEffect(() => {
        if (!viewQcId) {
            // Let the modal naturally close itself by the isOpen check below
            const timeout = setTimeout(() => setRecord(null), 300); // Wait for exit animation
            return () => clearTimeout(timeout);
        }

        const fetchRecord = async () => {
            try {
                // To fetch a single QC record by ID
                const res = await authedFetch(`/api/qc?search=${encodeURIComponent(viewQcId)}&limit=1`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.records && data.records.length > 0) {
                        setRecord(data.records[0]);
                        setIsOpen(true);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch QC record for global modal", error);
            }
        };

        fetchRecord();
    }, [viewQcId]);

    const handleClose = () => {
        setIsOpen(false);
        const newParams = new URLSearchParams(searchParams.toString());
        newParams.delete('viewQc');

        const queryString = newParams.toString();
        router.push(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
    };

    const handleEdit = (recordToEdit: QcRecord) => {
        setRecord(recordToEdit);
        setIsOpen(false); // Close details
        setIsFormOpen(true); // Open edit form
    };

    const handleFormClose = () => {
        setIsFormOpen(false);
        // If we were just editing an existing view, open it back up
        if (viewQcId) {
            setIsOpen(true);
        }
    };

    return (
        <>
            <QcDetailModal
                record={record}
                isOpen={isOpen && !!viewQcId}
                onClose={handleClose}
                onEdit={handleEdit}
            />

            {/* Standard QA form used for editing */}
            <QcForm
                isOpen={isFormOpen}
                onClose={handleFormClose}
                orderId={record ? record['Order Id'] : ''}
                partyName={record ? record['Party Name'] : ''}
                editRecord={record || undefined}
                onSubmit={async (data) => {
                    // if editing
                    if (record) {
                        return true; // We don't have updateRecord API for QC yet, skipping
                    }
                    return await addQcRecord(data);
                }}
            />
        </>
    );
}
