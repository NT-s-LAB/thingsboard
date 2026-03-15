'use client';

import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import type { Area } from '../types/area';

interface AreaDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  area: Area | null;
  isLoading?: boolean;
}

export const AreaDeleteDialog: React.FC<AreaDeleteDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  area,
  isLoading = false,
}) => {
  if (!isOpen || !area) return null;

  const deviceCount = area._count?.devices ?? 0;
  const viewCount = area._count?.scadaViews ?? 0;
  const hasRelatedData = deviceCount > 0 || viewCount > 0;

  const handleConfirm = async () => {
    await onConfirm();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Dialog */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Xác nhận xóa</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          <p className="text-gray-600">
            Bạn có chắc chắn muốn xóa khu vực <strong className="text-gray-900">{area.name}</strong>?
          </p>

          {hasRelatedData && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                <strong>Cảnh báo:</strong> Khu vực này đang có:
              </p>
              <ul className="list-disc list-inside text-sm text-yellow-700 mt-1">
                {deviceCount > 0 && <li>{deviceCount} thiết bị</li>}
                {viewCount > 0 && <li>{viewCount} SCADA view</li>}
              </ul>
              <p className="text-sm text-yellow-800 mt-2">
                Vui lòng di chuyển hoặc xóa các thiết bị và SCADA view trước khi xóa khu vực này.
              </p>
            </div>
          )}

          {!hasRelatedData && (
            <p className="text-sm text-gray-500 mt-2">
              Hành động này không thể hoàn tác.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Hủy
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={isLoading || hasRelatedData}
          >
            {isLoading ? 'Đang xóa...' : 'Xóa khu vực'}
          </Button>
        </div>
      </div>
    </div>
  );
};
