/**
 * AppSheet QC API Service
 * Uses the shared AppSheet client factory for caching and fetch dedup.
 */

import { QcRecord } from '@/types';
import { createAppSheetClient } from './appsheet-client';

if (!process.env.APPSHEET_QC_API_URL || !process.env.APPSHEET_API_KEY) {
  if (process.env.NODE_ENV === 'production' && process.env.npm_lifecycle_event !== 'build') {
    console.error('Missing required env vars: APPSHEET_QC_API_URL, APPSHEET_API_KEY');
  }
}

const client = createAppSheetClient<QcRecord>(
  process.env.APPSHEET_QC_API_URL as string,
  process.env.APPSHEET_API_KEY as string,
);

export const getQcRecords = (forceRefresh = false) => client.find(forceRefresh);
export const clearQcCache = () => client.clearCache();

export async function getQcByOrderId(orderId: string): Promise<QcRecord[]> {
  const allRecords = await client.find();
  const searchLower = orderId.toLowerCase();
  return allRecords.filter(record =>
    record['Order Id']?.toLowerCase().includes(searchLower)
  );
}

export async function addQcRecord(data: Partial<QcRecord>): Promise<QcRecord | null> {
  try {
    const result = await client.add([data]);
    return result[0] || null;
  } catch (error) {
    console.error('[AppSheet QC] Failed to add QC record:', error);
    throw error;
  }
}

export async function updateQcRecord(rowNumber: string, data: Partial<QcRecord>): Promise<QcRecord | null> {
  try {
    const result = await client.edit([{ _RowNumber: rowNumber, ...data }]);
    client.clearCache();
    return result[0] || null;
  } catch (error) {
    console.error('[AppSheet QC] Failed to update QC record:', error);
    throw error;
  }
}
