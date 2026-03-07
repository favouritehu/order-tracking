/**
 * Confirmation Modal Component
 * Displays a dialog to confirm status update
 */

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2 } from 'lucide-react';

interface Order {
  'Unique Id': string;
  'COMPANY NAME': string;
  'PRUDUCT': string;
  'Total Order Quantity in Kg': string;
  'Status': string;
}

interface ConfirmModalProps {
  order: Order | null;
  isOpen: boolean;
  isUpdating: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  order,
  isOpen,
  isUpdating,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!order) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm Status Update</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>
                Are you sure you want to move this order to{' '}
                <strong>&quot;{order.Status === 'Material In Process' ? 'Loading Point' : 'Loading Done'}&quot;</strong>?
              </p>
              <div className="p-4 bg-muted rounded-lg text-sm space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-muted-foreground">Order ID:</span>
                  <span className="font-medium">{order['Unique Id']}</span>
                  <span className="text-muted-foreground">Company:</span>
                  <span className="font-medium">{order['COMPANY NAME']}</span>
                  <span className="text-muted-foreground">Product:</span>
                  <span className="font-medium">{order['PRUDUCT']}</span>
                  <span className="text-muted-foreground">Quantity:</span>
                  <span className="font-medium">{order['Total Order Quantity in Kg']} Kg</span>
                </div>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isUpdating}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={isUpdating}
          >
            {isUpdating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              'Confirm Update'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
