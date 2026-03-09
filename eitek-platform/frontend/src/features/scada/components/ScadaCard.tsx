'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  Monitor,
  Pencil,
  Trash2,
  ExternalLink,
  Layers,
  Clock,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';

interface ScadaCardItem {
  id: string;
  name: string;
  description?: string | null;
  canvasSize?: { width?: number; height?: number } | null;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  _count?: { scadaWidgets?: number };
}

interface ScadaCardProps {
  scada: ScadaCardItem;
  onEdit: (scada: ScadaCardItem) => void;
  onDelete: (scada: ScadaCardItem) => void;
}

export const ScadaCard: React.FC<ScadaCardProps> = ({ scada, onEdit, onDelete }) => {
  const router = useRouter();

  const widgetCount = scada._count?.scadaWidgets ?? 0;
  const canvasW = (scada.canvasSize as any)?.width ?? 1920;
  const canvasH = (scada.canvasSize as any)?.height ?? 1080;

  const handleOpen = () => {
    router.push(`/scada/${scada.id}`);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow group">
      {/* Preview area */}
      <div
        className="relative h-40 bg-gradient-to-br from-gray-50 to-gray-100 rounded-t-lg flex items-center justify-center cursor-pointer overflow-hidden"
        onClick={handleOpen}
      >
        <div className="text-center">
          <Monitor className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <span className="text-xs text-gray-400">
            {canvasW} × {canvasH}
          </span>
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-primary-600/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="flex items-center space-x-2 text-white">
            <ExternalLink className="w-5 h-5" />
            <span className="font-medium text-sm">Xem Dashboard</span>
          </div>
        </div>

        {/* Status badge */}
        <div className="absolute top-2 right-2">
          <span
            className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${
              scada.isActive !== false
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {scada.isActive !== false ? 'Hoạt động' : 'Tạm dừng'}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <h3
              className="font-semibold text-gray-900 truncate cursor-pointer hover:text-primary-600"
              onClick={handleOpen}
            >
              {scada.name}
            </h3>
            {scada.description && (
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                {scada.description}
              </p>
            )}
          </div>
        </div>

        {/* Meta */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center space-x-3 text-xs text-gray-400">
            <span className="flex items-center space-x-1">
              <Layers className="w-3.5 h-3.5" />
              <span>{widgetCount} widgets</span>
            </span>
            {scada.updatedAt && (
              <span className="flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5" />
                <span>
                  {new Date(scada.updatedAt).toLocaleDateString('vi-VN', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })}
                </span>
              </span>
            )}
          </div>

          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(scada);
              }}
              title="Chỉnh sửa"
            >
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(scada);
              }}
              title="Xóa"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
