import { NextRequest, NextResponse } from 'next/server';
import { getDispatchRecords, getDispatchByOrderId, addDispatch, clearDispatchCache, updateDispatch } from '@/lib/appsheet-dispatch';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const orderId = searchParams.get('orderId');
        const search = searchParams.get('search');
        const refresh = searchParams.get('refresh');

        let records;

        if (orderId) {
            records = await getDispatchByOrderId(orderId);
        } else {
            records = await getDispatchRecords(refresh === 'true');
        }

        // Search filter
        if (search) {
            const searchLower = search.toLowerCase();
            records = records.filter(
                (record) =>
                    record['Order Id']?.toLowerCase().includes(searchLower) ||
                    record['Buyer']?.toLowerCase().includes(searchLower) ||
                    record['Consignee']?.toLowerCase().includes(searchLower) ||
                    record['Vehical No']?.toLowerCase().includes(searchLower) ||
                    record['Invoice No.']?.toLowerCase().includes(searchLower)
            );
        }

        // Sort by Date (newest first)
        records.sort((a, b) => {
            const dateA = a['Date'] ? new Date(a['Date']).getTime() : 0;
            const dateB = b['Date'] ? new Date(b['Date']).getTime() : 0;
            return dateB - dateA;
        });

        return NextResponse.json({
            records: records,
            total: records.length,
        });
    } catch (error) {
        console.error('Get Dispatch records error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch Dispatch records from AppSheet' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const row: Record<string, unknown> = {
            'Order Id': body['Order Id'] || '',
            'Date': body['Date'] || '',
            'Invoice No.': body['Invoice No.'] || '',
            'Vehical No': body['Vehical No'] || '',
            'Buyer': body['Buyer'] || '',
            'Consignee': body['Consignee'] || '',
            'Total Roll': body['Total Roll'] || '',
            'Total Wt': body['Total Wt'] || '',
            'Driver/Transport No.': body['Driver/Transport No.'] || '',
            'TRUCK REPORT DATE': body['TRUCK REPORT DATE'] || '',
            'TRUCK RELEASED DATE': body['TRUCK RELEASED DATE'] || '',
            'Email': body['Email'] || '',
            'Phone': body['Phone'] || '',
        };

        // Add roll/item line details
        for (let i = 1; i <= 6; i++) {
            if (body[`${i}.No.of Rolls`]) row[`${i}.No.of Rolls`] = body[`${i}.No.of Rolls`];
            if (body[`${i}.Des.Of Goods`]) row[`${i}.Des.Of Goods`] = body[`${i}.Des.Of Goods`];
            if (body[`${i}.Color`]) row[`${i}.Color`] = body[`${i}.Color`];
            if (body[`${i}.Qty`]) row[`${i}.Qty`] = body[`${i}.Qty`];
            if (body[`${i}.size`]) row[`${i}.size`] = body[`${i}.size`];
            if (body[`${i}.Gsm`]) row[`${i}.Gsm`] = body[`${i}.Gsm`];
        }

        const result = await addDispatch([row]);

        return NextResponse.json({
            success: true,
            record: Array.isArray(result) ? result[0] : result,
        });
    } catch (error) {
        console.error('Create Dispatch error:', error);
        return NextResponse.json(
            { error: 'Failed to create Dispatch record in AppSheet' },
            { status: 500 }
        );
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const result = await updateDispatch(body);

        return NextResponse.json({
            success: true,
            record: Array.isArray(result) ? result[0] : result,
        });
    } catch (error) {
        console.error('Update Dispatch error:', error);
        return NextResponse.json(
            { error: 'Failed to update Dispatch record in AppSheet' },
            { status: 500 }
        );
    }
}
