'use client';

import React from 'react';
import { Building2, MoreVertical, Pencil, Trash2, Eye, MapPin } from 'lucide-react';
import type { Site } from '../types/site';

interface SiteCardProps {
  site: Site;
  onView: (site: Site) => void;
  onEdit: (site: Site) => void;
  onDelete: (site: Site) => void;
}

export const SiteCard: React.FC<SiteCardProps> = ({
  site,
  onView,
  onEdit,
  onDelete,
}) => {
  const [showMenu, setShowMenu] = React.useState(false);

  const areaCount = site._count?.areas ?? 0;

  return (
    <div
      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer group"
      onClick={() => onView(site)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <Building2 className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
              {site.name}
            </h3>
            <div className="flex items-center space-x-2 mt-1">
              <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${
                site.isActive
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {site.isActive ? 'Hoạt động' : 'Tạm dừng'}
              </span>
              {site.project && (
                <span className="text-xs text-gray-500">
                  {site.project.name}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
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
                    onClick={() => { onView(site); setShowMenu(false); }}
                  >
                    <Eye className="w-4 h-4" />
                    <span>Xem chi tiết</span>
                  </button>
                  <button
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                    onClick={() => { onEdit(site); setShowMenu(false); }}
                  >
                    <Pencil className="w-4 h-4" />
                    <span>Chỉnh sửa</span>
                  </button>
                  <hr className="my-1 border-gray-100" />
                  <button
                    className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                    onClick={() => { onDelete(site); setShowMenu(false); }}
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

      {/* Address */}
      {site.address && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2 flex items-start gap-1">
          <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400" />
          {site.address}
        </p>
      )}

      {/* Description */}
      {site.description && (
        <p className="text-sm text-gray-500 mb-3 line-clamp-2">{site.description}</p>
      )}

      {/* Stats */}
      <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
        <div className="flex items-center space-x-1">
          <MapPin className="w-3.5 h-3.5" />
          <span>{areaCount} khu vực</span>
        </div>
        <span>
          {new Date(site.updatedAt).toLocaleDateString('vi-VN')}
        </span>
      </div>
    </div>
  );
};
