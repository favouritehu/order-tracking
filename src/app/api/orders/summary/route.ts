/**
 * Orders Summary API Endpoint
 * GET /api/orders/summary
 * Returns aggregated breakdown data for reports
 */

import { NextResponse } from 'next/server';
import { getOrders } from '@/lib/appsheet';

export async function GET() {
    try {
        const orders = await getOrders();

        const products: Record<string, number> = {};
        const salespeople: Record<string, number> = {};
        const parties: Record<string, number> = {};
        const transportTypes: Record<string, number> = {};
        const regions: Record<string, number> = {};

        for (const order of orders) {
            // Products
            const product = order['PRUDUCT']?.trim();
            if (product) {
                products[product] = (products[product] || 0) + 1;
            }

            // Salespeople
            const sales = order['Sale_Name']?.trim();
            if (sales) {
                salespeople[sales] = (salespeople[sales] || 0) + 1;
            }

            // Parties (Company Names)
            const party = order['COMPANY NAME']?.trim();
            if (party) {
                parties[party] = (parties[party] || 0) + 1;
            }

            // Transport
            const transport = order['Transport_Type']?.trim();
            if (transport) {
                transportTypes[transport] = (transportTypes[transport] || 0) + 1;
            }

            // Regions (Delivery Location)
            const location = order['Delivery_Location']?.trim();
            if (location) {
                regions[location] = (regions[location] || 0) + 1;
            }
        }

        return NextResponse.json({
            products,
            salespeople,
            parties,
            transportTypes,
            regions,
        });
    } catch (error) {
        console.error('Get summary error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch order summary' },
            { status: 500 }
        );
    }
}
