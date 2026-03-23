'use client';

import React from 'react';
import { MapPin, MoreVertical, Pencil, Trash2, Eye, Monitor, Layout } from 'lucide-react';
import type { Area } from '../types/area';

interface AreaCardProps {
  area: Area;
  onView: (area: Area) => void;
  onEdit: (area: Area) => void;
  onDelete: (area: Area) => void;
}

export const AreaCard: React.FC<AreaCardProps> = ({
  area,
  onView,
  onEdit,
  onDelete,
}) => {
  const [showMenu, setShowMenu] = React.useState(false);

  const deviceCount = area._count?.devices ?? 0;
  const viewCount = area._count?.scadaViews ?? 0;

  return (
    <div
      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer group"
      onClick={() => onView(area)}
    >
      {/* Row 1: icon + status badge + menu */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <MapPin className="w-4 h-4 text-blue-600" />
          </div>
          <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full whitespace-nowrap ${
            area.isActive
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-600'
          }`}>
            {area.isActive ? 'Hoạt động' : 'Tạm dừng'}
          </span>
        </div>

        <div onClick={(e) => e.stopPropagation()}>
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 rounded hover:bg-gray-100 transition-colors"
            >
              <MoreVertical className="w-4 h-4 text-gray-400" />
            </button>

            {showMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
                  <button
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                    onClick={() => { onView(area); setShowMenu(false); }}
                  >
                    <Eye className="w-4 h-4" />
                    <span>Xem chi tiết</span>
                  </button>
                  <button
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                    onClick={() => { onEdit(area); setShowMenu(false); }}
                  >
                    <Pencil className="w-4 h-4" />
                    <span>Chỉnh sửa</span>
                  </button>
                  <hr className="my-1 border-gray-100" />
                  <button
                    className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                    onClick={() => { onDelete(area); setShowMenu(false); }}
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Xóa</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Row 2: Area name (full width) */}
      <h3 className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-1">
        {area.name}
      </h3>

      {/* Row 3: Site name */}
      {area.site && (
        <p className="text-xs text-gray-500 mb-1 truncate">{area.site.name}</p>
      )}

      {/* Description */}
      {area.description && (
        <p className="text-xs text-gray-500 mb-2 line-clamp-2">{area.description}</p>
      )}

      {/* Stats */}
      <div className="flex items-center justify-between text-xs text-gray-500 pt-2 mt-2 border-t border-gray-100">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Monitor className="w-3.5 h-3.5" />
            <span>{deviceCount} thiết bị</span>
          </div>
          <div className="flex items-center gap-1">
            <Layout className="w-3.5 h-3.5" />
            <span>{viewCount} SCADA</span>
          </div>
        </div>
        <span>{new Date(area.updatedAt).toLocaleDateString('vi-VN')}</span>
      </div>
    </div>
  );
};
