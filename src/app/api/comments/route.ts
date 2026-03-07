import { NextRequest, NextResponse } from 'next/server';
import { getCommentsRecords, getCommentsByOrderId, addComment, clearCommentsCache, updateComment } from '@/lib/appsheet-comments';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const orderId = searchParams.get('orderId');
        const search = searchParams.get('search');
        const refresh = searchParams.get('refresh');

        let records;

        if (orderId) {
            records = await getCommentsByOrderId(orderId);
        } else {
            records = await getCommentsRecords(refresh === 'true');
        }

        // Search filter
        if (search) {
            const searchLower = search.toLowerCase();
            records = records.filter(
                (record) =>
                    record['Order Id']?.toLowerCase().includes(searchLower) ||
                    record['Party Name']?.toLowerCase().includes(searchLower) ||
                    record['Comments']?.toLowerCase().includes(searchLower) ||
                    record['Status']?.toLowerCase().includes(searchLower)
            );
        }

        // Sort by Last Update Date (newest first)
        records.sort((a, b) => {
            const dateA = a['Last Update Date'] ? new Date(a['Last Update Date']).getTime() : 0;
            const dateB = b['Last Update Date'] ? new Date(b['Last Update Date']).getTime() : 0;
            return dateB - dateA;
        });

        return NextResponse.json({
            records: records,
            total: records.length,
        });
    } catch (error) {
        console.error('Get Comments records error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch Comments records from AppSheet' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const row: Record<string, unknown> = {
            'Order Id': body['Order Id'] || '',
            'Party Name': body['Party Name'] || '',
            'Balance Left': body['Balance Left'] || '',
            'Status': body['Status'] || '',
            'Comments': body['Comments'] || '',
            'Carry Forward': body['Carry Forward'] || '',
            'Amount To Pay': body['Amount To Pay'] || '',
            'Email': body['Email'] || '',
        };

        const result = await addComment([row]);

        return NextResponse.json({
            success: true,
            record: Array.isArray(result) ? result[0] : result,
        });
    } catch (error) {
        console.error('Create Comment error:', error);
        return NextResponse.json(
            { error: 'Failed to create Comment in AppSheet' },
            { status: 500 }
        );
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const result = await updateComment(body);

        return NextResponse.json({
            success: true,
            record: Array.isArray(result) ? result[0] : result,
        });
    } catch (error) {
        console.error('Update Comment error:', error);
        return NextResponse.json(
            { error: 'Failed to update Comment in AppSheet' },
            { status: 500 }
        );
    }
}
