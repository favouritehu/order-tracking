/**
 * Single QC Record API Endpoint
 * GET /api/qc/[id] - Get a single QC record by row number
 * PATCH /api/qc/[id] - Update a QC record
 */

import { NextRequest, NextResponse } from 'next/server';
import { getQcRecords, updateQcRecord } from '@/lib/appsheet-qc';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const records = await getQcRecords();
        const record = records.find((r) => r['Unique Id'] === id || r._RowNumber === id);

        if (!record) {
            return NextResponse.json(
                { error: 'QC record not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ record });
    } catch (error) {
        console.error('Get QC record error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch QC record' },
            { status: 500 }
        );
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();

        const result = await updateQcRecord(id, body);

        return NextResponse.json({
            success: true,
            record: result,
        });
    } catch (error) {
        console.error('Update QC record error:', error);
        return NextResponse.json(
            { error: 'Failed to update QC record' },
            { status: 500 }
        );
    }
}
