/**
 * Orders Statistics API Endpoint
 * GET /api/orders/stats
 * Returns KPI data for the dashboard from cached AppSheet data
 */

import { NextResponse } from 'next/server';
import { getOrders } from '@/lib/appsheet';

export async function GET() {
  try {
    // Use cached orders (won't make a new API call if data is fresh)
    const orders = await getOrders();

    const stats = {
      totalOrders: orders.length,
      loadingPoint: 0,
      loadingDone: 0,
      statusBreakdown: {} as Record<string, number>,
    };

    // Calculate status breakdown in a single pass
    for (const order of orders) {
      const status = order.Status || 'No Status';
      stats.statusBreakdown[status] = (stats.statusBreakdown[status] || 0) + 1;

      if (status === 'Loading Point') {
        stats.loadingPoint++;
      }
      if (status === 'Loading Done') {
        stats.loadingDone++;
      }
    }

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Get stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats from AppSheet' },
      { status: 500 }
    );
  }
}
