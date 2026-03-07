/**
 * AppSheet Comments API Service
 * Uses the shared AppSheet client factory for caching and fetch dedup.
 */

import { OrderCommentRecord } from '@/types/comments';
import { createAppSheetClient } from './appsheet-client';

if (!process.env.APPSHEET_COMMENTS_API_URL || !process.env.APPSHEET_API_KEY) {
  throw new Error('Missing required env vars: APPSHEET_COMMENTS_API_URL, APPSHEET_API_KEY');
}

const client = createAppSheetClient<OrderCommentRecord>(
  process.env.APPSHEET_COMMENTS_API_URL as string,
  process.env.APPSHEET_API_KEY as string,
);

export const getCommentsRecords = (forceRefresh = false) => client.find(forceRefresh);
export const clearCommentsCache = () => client.clearCache();

export async function getCommentsByOrderId(orderId: string): Promise<OrderCommentRecord[]> {
  const allRecords = await client.find();
  const searchLower = orderId.toLowerCase();
  return allRecords.filter(record =>
    record['Order Id']?.toLowerCase().includes(searchLower) ||
    record['Unique Id']?.toLowerCase() === searchLower
  );
}

export async function addComment(rows: Record<string, unknown>[]): Promise<OrderCommentRecord[]> {
  return client.add(rows as Partial<OrderCommentRecord>[]);
}

export async function updateComment(data: Record<string, unknown>): Promise<OrderCommentRecord[]> {
  const result = await client.edit([data as Partial<OrderCommentRecord>]);
  client.clearCache();
  return result;
}
