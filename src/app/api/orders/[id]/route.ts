/**
 * Single Order API Endpoint
 * PATCH /api/orders/[id] - Update order status
 * Allows: "Material In Process" -> "Loading Point" and "Loading Point" -> "Loading Done"
 */

import { NextRequest, NextResponse } from 'next/server';
import { getOrders, updateOrderStatus } from '@/lib/appsheet';
import { isValidStatusTransition, ORDER_STATUSES } from '@/lib/constants';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status: newStatus } = body;

    // Validate new status
    if (!newStatus || !ORDER_STATUSES.includes(newStatus)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    // Get current order
    const orders = await getOrders();
    const order = orders.find((o) => o['Unique Id'] === id);

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    const currentStatus = order.Status || '';

    // Validate status transition
    if (!isValidStatusTransition(currentStatus, newStatus)) {
      return NextResponse.json(
        { error: `Cannot change status from "${currentStatus}" to "${newStatus}". Allowed transitions: "Material In Process" → "Loading Point" and "Loading Point" → "Loading Done".` },
        { status: 400 }
      );
    }

    // Update order in AppSheet
    const updatedOrder = await updateOrderStatus(id, newStatus);

    return NextResponse.json({
      success: true,
      order: updatedOrder,
    });
  } catch (error) {
    console.error('Update order error:', error);
    return NextResponse.json(
      { error: 'Failed to update order in AppSheet' },
      { status: 500 }
    );
  }
}

// GET single order
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const orders = await getOrders();
    const order = orders.find((o) => o['Unique Id'] === id);

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error('Get order error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order from AppSheet' },
      { status: 500 }
    );
  }
}
