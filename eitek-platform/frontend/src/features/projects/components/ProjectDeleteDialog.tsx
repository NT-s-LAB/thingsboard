'use client';

import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';

interface ProjectDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  projectName: string;
  isLoading?: boolean | undefined;
}

export const ProjectDeleteDialog: React.FC<ProjectDeleteDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  projectName,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Dialog */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-sm mx-4">
        <div className="px-6 py-4">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Icon */}
          <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-4">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>

          {/* Content */}
          <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
            Xóa dự án
          </h3>
          <p className="text-sm text-gray-600 text-center mb-6">
            Bạn có chắc chắn muốn xóa dự án{' '}
            <span className="font-semibold text-gray-900">"{projectName}"</span>?
            Hành động này không thể hoàn tác.
          </p>

          {/* Actions */}
          <div className="flex items-center justify-center space-x-3">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={onConfirm}
              disabled={isLoading}
            >
              {isLoading ? 'Đang xóa...' : 'Xóa dự án'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
