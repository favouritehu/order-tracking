/**
 * Orders API Endpoint
 * GET /api/orders - Get all orders with optional filtering
 * Uses AppSheet API as the data source with caching
 */

import { NextRequest, NextResponse } from 'next/server';
import { getOrders } from '@/lib/appsheet';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const refresh = searchParams.get('refresh');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Fetch orders from AppSheet (with caching)
    const orders = await getOrders(refresh === 'true');

    // Filter by status
    let filteredOrders = orders;
    if (status) {
      const statuses = status.split(',').map(s => s.trim());
      filteredOrders = filteredOrders.filter(
        (order) => statuses.includes(order.Status)
      );
    }

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filteredOrders = filteredOrders.filter(
        (order) =>
          order['Unique Id']?.toLowerCase().includes(searchLower) ||
          order['COMPANY NAME']?.toLowerCase().includes(searchLower) ||
          order['PRUDUCT']?.toLowerCase().includes(searchLower) ||
          order['Name']?.toLowerCase().includes(searchLower)
      );
    }

    // Sort: dispatched by Dispatch Date (newest first), others by order_date (newest first)
    filteredOrders.sort((a, b) => {
      if (status === 'Dispatched') {
        const dateA = a['Dispatch Date'] ? new Date(a['Dispatch Date']).getTime() : 0;
        const dateB = b['Dispatch Date'] ? new Date(b['Dispatch Date']).getTime() : 0;
        return dateB - dateA;
      }
      const dateA = a['order_date'] ? new Date(a['order_date']).getTime() : 0;
      const dateB = b['order_date'] ? new Date(b['order_date']).getTime() : 0;
      return dateB - dateA;
    });

    // Pagination
    const totalFiltered = filteredOrders.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedOrders = filteredOrders.slice(startIndex, endIndex);
    const hasMore = endIndex < totalFiltered;

    return NextResponse.json({
      orders: paginatedOrders,
      total: orders.length,
      filtered: totalFiltered,
      hasMore,
      page,
      totalPages: Math.ceil(totalFiltered / limit)
    });
  } catch (error) {
    console.error('Get orders error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders from AppSheet' },
      { status: 500 }
    );
  }
}
