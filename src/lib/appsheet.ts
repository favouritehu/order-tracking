/**
 * AppSheet Orders API Service
 * Uses the shared AppSheet client factory for caching and fetch dedup.
 */

import { createAppSheetClient } from './appsheet-client';

if (!process.env.APPSHEET_API_URL || !process.env.APPSHEET_API_KEY) {
  if (process.env.NODE_ENV === 'production' && process.env.npm_lifecycle_event !== 'build') {
    console.error('Missing required env vars: APPSHEET_API_URL, APPSHEET_API_KEY');
  }
}

/**
 * Order type matching actual AppSheet data structure
 */
export interface AppSheetOrder {
  _RowNumber: string;
  'Unique Id': string;
  'Name': string;
  'Email': string;
  'Phone': string;
  'TOKEN AMOUNT': string;
  'COMPANY NAME': string;
  'GST NO. / ADHAR CARD NO': string;
  'Address': string;
  'PRUDUCT': string;
  'Roll Size-Gsm With Quantity Of Product': string;
  'COLOR': string;
  'Total Order Quantity in Kg': string;
  'EXTRA NOTE:': string;
  'Status': string;
  'Aprox Date': string;
  'Token Amount Confirmed': string;
  'Balance payment': string;
  'Invoice': string;
  'Roll List': string;
  'Bilty': string;
  'Driver No/Bilty No.': string;
  'Note': string;
  'PI': string;
  'order_date': string;
  'Sale_Name': string;
  'ORDER DESIGN': string;
  'Transport_Type': string;
  'Transporter_Name': string;
  'Billing_Type': string;
  'Delivery_Location': string;
  'Whatsapp': string;
  'Dispatch summarys': string;
  'Summary': string;
  'Order Comments': string;
  'Related Qcs': string;
  'Dispatch Date': string;
}

const client = createAppSheetClient<AppSheetOrder>(
  process.env.APPSHEET_API_URL as string,
  process.env.APPSHEET_API_KEY as string,
);

export const getOrders = (forceRefresh = false) => client.find(forceRefresh);
export const clearCache = () => client.clearCache();

/**
 * Update an order status in AppSheet with optimistic cache update.
 */
export async function updateOrderStatus(uniqueId: string, newStatus: string): Promise<AppSheetOrder | null> {
  try {
    const result = await client.edit([{ 'Unique Id': uniqueId, 'Status': newStatus }]);
    return result[0] || null;
  } catch (error) {
    console.error('[AppSheet] Failed to update order:', error);
    throw error;
  }
}
