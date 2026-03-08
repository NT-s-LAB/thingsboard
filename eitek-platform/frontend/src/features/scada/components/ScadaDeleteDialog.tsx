'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/shared/components/ui/Dialog';
import { Button } from '@/shared/components/ui/Button';
import { LoadingSpinner } from '@/shared/components/ui/LoadingSpinner';

interface ScadaDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  scadaName: string;
  isLoading?: boolean;
}

export const ScadaDeleteDialog: React.FC<ScadaDeleteDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  scadaName,
  isLoading = false,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-red-600">Xóa SCADA Dashboard</DialogTitle>
          <DialogDescription className="mt-2">
            Bạn có chắc chắn muốn xóa dashboard{' '}
            <strong className="text-gray-900">&quot;{scadaName}&quot;</strong>?
            <br />
            <span className="text-red-500">
              Hành động này không thể hoàn tác. Tất cả widget trong dashboard sẽ bị xóa.
            </span>
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 pt-4">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Hủy
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Đang xóa...
              </>
            ) : (
              'Xóa Dashboard'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
