/**
 * Order Status Constants
 * Based on actual AppSheet data
 */

// Actual statuses from AppSheet data (in workflow order)
export const ORDER_STATUSES = [
  'New Order',
  'Material In Process',
  'Loading Point',
  'Loading Done',
  'Documents Ready',
  'Dispatched',
  'Hold',
  'Cancel',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

// Validate if a status transition is allowed
export function isValidStatusTransition(currentStatus: string, newStatus: string): boolean {
  return (
    (currentStatus === 'Material In Process' && newStatus === 'Loading Point') ||
    (currentStatus === 'Loading Point' && newStatus === 'Loading Done')
  );
}
