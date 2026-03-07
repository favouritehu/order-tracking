/**
 * U.B (Under Billing) API Route
 * GET /api/ub — Fetch U.B records with search, filter, pagination, sorted by latest date
 * POST /api/ub — Create a new U.B record
 * PATCH /api/ub — Update an existing U.B record
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getUbRecords, searchUbRecords, getUbByOrderId, addUbRecord, updateUbRecord } from '@/lib/appsheet-ub';

function parseDate(dateStr: string): number {
    if (!dateStr) return 0;

    // Handle YYYY-MM-DD
    if (dateStr.includes('-')) {
        const time = new Date(dateStr).getTime();
        return isNaN(time) ? 0 : time;
    }

    // AppSheet typically returns MM/DD/YYYY in the en-US locale
    const parts = dateStr.split('/');
    if (parts.length === 3) {
        const [p1, p2, p3] = parts;
        // If it's MM/DD/YYYY, new Date('MM/DD/YYYY') works in JS
        const time = new Date(`${p1}/${p2}/${p3}`).getTime();
        if (!isNaN(time)) return time;

        // Fallback if it's DD/MM/YYYY
        const fallbackTime = new Date(`${p2}/${p1}/${p3}`).getTime();
        return isNaN(fallbackTime) ? 0 : fallbackTime;
    }

    return 0;
}

export async function GET(request: NextRequest) {
    try {
        const cookieStore = await cookies();
        if (!cookieStore.has('ub-token')) {
            return NextResponse.json({ error: 'UB_AUTH_REQUIRED', message: 'U.B access requires authentication' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';
        const orderId = searchParams.get('orderId') || '';
        const page = parseInt(searchParams.get('page') || '1', 10);
        const limit = parseInt(searchParams.get('limit') || '50', 10); // Changed default limit from 20 to 50
        const refresh = searchParams.get('refresh') === 'true';

        let records;

        if (orderId) {
            records = await getUbByOrderId(orderId);
        } else if (search) {
            records = await searchUbRecords(search);
        } else {
            records = await getUbRecords(refresh);
        }

        // Sort by date — latest first
        records.sort((a, b) => {
            const dateA = parseDate(a['Date']);
            const dateB = parseDate(b['Date']);
            return dateB - dateA;
        });

        // Pagination
        const total = records.length;
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedRecords = records.slice(startIndex, endIndex);

        return NextResponse.json({
            records: paginatedRecords,
            total,
            hasMore: endIndex < total,
            page,
        });
    } catch (error) {
        console.error('U.B API error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch U.B records from AppSheet' },
            { status: 500 }
        );
    }
}

/**
 * Prepare a U.B record payload for AppSheet:
 * - Convert DD/MM/YYYY date to MM/DD/YYYY (AppSheet en-US locale)
 * - Fill required fields with defaults
 */
function prepareUbPayload(body: Record<string, unknown>): Record<string, unknown> {
    const data = { ...body };

    // The frontend now sends YYYY-MM-DD from the HTML5 date input.
    // AppSheet (en-US locale) expects MM/DD/YYYY.
    if (typeof data['Date'] === 'string') {
        const dateStr = data['Date'] as string;
        if (dateStr.includes('-')) {
            // YYYY-MM-DD
            const [year, month, day] = dateStr.split('-');
            if (year.length === 4) {
                data['Date'] = `${month}/${day}/${year}`;
            }
        } else if (dateStr.includes('/')) {
            // Fallback: If it's already MM/DD/YYYY or DD/MM/YYYY
            const parts = dateStr.split('/');
            if (parts.length === 3) {
                const p0 = parseInt(parts[0], 10);
                // If first part is > 12, it must be DD/MM/YYYY, so we swap format to MM/DD/YYYY
                if (p0 > 12) {
                    data['Date'] = `${parts[1]}/${parts[0]}/${parts[2]}`;
                }
                // Else it's likely already MM/DD/YYYY (or ambiguous day/month both <= 12). Leave as is.
            }
        }
    }

    // Ensure required fields have defaults
    const defaultFields: Record<string, string> = {
        'Book Balance': '0',
        'Cash Balance': '0',
        'Discount': '0',
        'Advance Amount': '0',
        'Outstanding Amount': '0',
        'Additional Amounts': '0',
        'Invamt': '0',
        'Camt': '0',
        'Fright': '0',
        'UNIT': 'KGS',
        'GST': '0.12',
    };

    for (const [key, defaultVal] of Object.entries(defaultFields)) {
        if (!data[key] || data[key] === '') {
            data[key] = defaultVal;
        }
    }

    return data;
}

export async function POST(request: NextRequest) {
    try {
        const cookieStore = cookies();
        if (!cookieStore.has('ub-token')) {
            return NextResponse.json({ error: 'UB_AUTH_REQUIRED', message: 'U.B access requires authentication' }, { status: 403 });
        }

        const body = await request.json();
        const payload = prepareUbPayload(body);
        const result = await addUbRecord(payload);
        return NextResponse.json({ success: true, record: result });
    } catch (error) {
        console.error('U.B create error:', error);
        return NextResponse.json(
            { error: 'Failed to create U.B record' },
            { status: 500 }
        );
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const payload = prepareUbPayload(body);
        const result = await updateUbRecord(payload);
        return NextResponse.json({ success: true, record: result });
    } catch (error) {
        console.error('U.B update error:', error);
        return NextResponse.json(
            { error: 'Failed to update U.B record' },
            { status: 500 }
        );
    }
}

