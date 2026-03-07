/**
 * AppSheet U.B (Under Billing) API Service
 * Uses the shared AppSheet client factory for caching and fetch dedup.
 */

import { UbRecord } from '@/types/ub';
import { createAppSheetClient } from './appsheet-client';

if (!process.env.APPSHEET_UB_API_URL || !process.env.APPSHEET_API_KEY) {
  if (process.env.NODE_ENV === 'production' && process.env.npm_lifecycle_event !== 'build') {
    console.error('Missing required env vars: APPSHEET_UB_API_URL, APPSHEET_API_KEY');
  }
}

const client = createAppSheetClient<UbRecord>(
  process.env.APPSHEET_UB_API_URL as string,
  process.env.APPSHEET_API_KEY as string,
);

export const getUbRecords = (forceRefresh = false) => client.find(forceRefresh);
export const clearUbCache = () => client.clearCache();

export async function getUbByOrderId(orderId: string): Promise<UbRecord[]> {
  const allRecords = await client.find();
  const searchLower = orderId.toLowerCase();
  return allRecords.filter(record =>
    record['ORDER ID']?.toLowerCase().includes(searchLower)
  );
}

export async function searchUbRecords(query: string): Promise<UbRecord[]> {
  const allRecords = await client.find();
  const searchLower = query.toLowerCase();
  return allRecords.filter(record =>
    record['Party Name']?.toLowerCase().includes(searchLower) ||
    record['Unique ID']?.toLowerCase().includes(searchLower) ||
    record['ORDER ID']?.toLowerCase().includes(searchLower) ||
    record['Invoice No.']?.toLowerCase().includes(searchLower)
  );
}

export async function addUbRecord(data: Record<string, unknown>): Promise<unknown> {
  try {
    const result = await client.add([data as Partial<UbRecord>]);
    return result[0] || null;
  } catch (error) {
    console.error('[AppSheet U.B] Failed to add U.B record:', error);
    throw error;
  }
}

export async function updateUbRecord(data: Record<string, unknown>): Promise<unknown> {
  try {
    const result = await client.edit([data as Partial<UbRecord>]);
    client.clearCache();
    return result[0] || null;
  } catch (error) {
    console.error('[AppSheet U.B] Failed to update U.B record:', error);
    throw error;
  }
}
