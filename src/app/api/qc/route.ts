/**
 * QC API Endpoint
 * GET /api/qc - Get QC records, optionally filtered by orderId
 * POST /api/qc - Add a new QC record
 */

import { NextRequest, NextResponse } from 'next/server';
import { getQcRecords, getQcByOrderId, addQcRecord } from '@/lib/appsheet-qc';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const orderId = searchParams.get('orderId');
        const search = searchParams.get('search');
        const refresh = searchParams.get('refresh');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');

        let records;

        if (orderId) {
            // Filter by specific Order Id
            records = await getQcByOrderId(orderId);
        } else {
            records = await getQcRecords(refresh === 'true');
        }

        // Additional search filter
        if (search) {
            const searchLower = search.toLowerCase();
            records = records.filter(
                (record) =>
                    record['Order Id']?.toLowerCase().includes(searchLower) ||
                    record['Party Name']?.toLowerCase().includes(searchLower) ||
                    record['Qc By']?.toLowerCase().includes(searchLower) ||
                    record['Unique Id']?.toLowerCase().includes(searchLower)
            );
        }

        // Sort by date (newest first)
        records.sort((a, b) => {
            const dateA = a['Date'] ? new Date(a['Date']).getTime() : 0;
            const dateB = b['Date'] ? new Date(b['Date']).getTime() : 0;
            return dateB - dateA;
        });

        // Pagination
        const totalFiltered = records.length;
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedRecords = records.slice(startIndex, endIndex);
        const hasMore = endIndex < totalFiltered;

        return NextResponse.json({
            records: paginatedRecords,
            total: totalFiltered,
            hasMore,
            page,
            totalPages: Math.ceil(totalFiltered / limit),
        });
    } catch (error) {
        console.error('Get QC records error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch QC records from AppSheet' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const result = await addQcRecord(body);

        return NextResponse.json({
            success: true,
            record: result,
        });
    } catch (error) {
        console.error('Add QC record error:', error);
        return NextResponse.json(
            { error: 'Failed to add QC record' },
            { status: 500 }
        );
    }
}
