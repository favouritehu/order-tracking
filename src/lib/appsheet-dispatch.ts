/**
 * AppSheet Dispatch API Service
 * Uses the shared AppSheet client factory for caching and fetch dedup.
 */

import { DispatchSummaryRecord } from '@/types/dispatch';
import { createAppSheetClient } from './appsheet-client';

if (!process.env.APPSHEET_DISPATCH_API_URL || !process.env.APPSHEET_API_KEY) {
  throw new Error('Missing required env vars: APPSHEET_DISPATCH_API_URL, APPSHEET_API_KEY');
}

const client = createAppSheetClient<DispatchSummaryRecord>(
  process.env.APPSHEET_DISPATCH_API_URL as string,
  process.env.APPSHEET_API_KEY as string,
);

export const getDispatchRecords = (forceRefresh = false) => client.find(forceRefresh);
export const clearDispatchCache = () => client.clearCache();

export async function getDispatchByOrderId(orderId: string): Promise<DispatchSummaryRecord[]> {
  const allRecords = await client.find();
  const searchLower = orderId.toLowerCase();
  return allRecords.filter(record =>
    record['Order Id']?.toLowerCase().includes(searchLower) ||
    record['Unique ID']?.toLowerCase() === searchLower
  );
}

export async function addDispatch(rows: Record<string, unknown>[]): Promise<DispatchSummaryRecord[]> {
  return client.add(rows as Partial<DispatchSummaryRecord>[]);
}

export async function updateDispatch(data: Record<string, unknown>): Promise<DispatchSummaryRecord[]> {
  const result = await client.edit([data as Partial<DispatchSummaryRecord>]);
  client.clearCache();
  return result;
}
