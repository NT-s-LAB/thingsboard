'use client';

import React from 'react';
import { FolderTree, MoreVertical, Star, Pencil, Trash2, Eye } from 'lucide-react';

interface ProjectData {
  id: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  tenant?: { id: string; name: string };
  _count?: { sites: number; userProjects: number };
}

interface ProjectCardProps {
  project: ProjectData;
  isFavorite?: boolean;
  onView: (project: ProjectData) => void;
  onEdit: (project: ProjectData) => void;
  onDelete: (project: ProjectData) => void;
  onToggleFavorite: (project: ProjectData) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  isFavorite = false,
  onView,
  onEdit,
  onDelete,
  onToggleFavorite,
}) => {
  const [showMenu, setShowMenu] = React.useState(false);

  return (
    <div
      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer group"
      onClick={() => onView(project)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
            <FolderTree className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
              {project.name}
            </h3>
            <div className="flex items-center space-x-2 mt-1">
              <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${
                project.isActive
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {project.isActive ? 'Hoạt động' : 'Tạm dừng'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onToggleFavorite(project)}
            className="p-1 rounded hover:bg-gray-100 transition-colors"
          >
            <Star className={`w-4 h-4 ${isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`} />
          </button>

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
                    onClick={() => { onView(project); setShowMenu(false); }}
                  >
                    <Eye className="w-4 h-4" />
                    <span>Xem chi tiết</span>
                  </button>
                  <button
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                    onClick={() => { onEdit(project); setShowMenu(false); }}
                  >
                    <Pencil className="w-4 h-4" />
                    <span>Chỉnh sửa</span>
                  </button>
                  <hr className="my-1 border-gray-100" />
                  <button
                    className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                    onClick={() => { onDelete(project); setShowMenu(false); }}
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

      <p className="text-sm text-gray-500 line-clamp-2 mb-3">
        {project.description || 'Chưa có mô tả'}
      </p>

      <div className="flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center space-x-3">
          {project._count && (
            <span>{project._count.sites} sites</span>
          )}
          {project.tenant && (
            <span>{project.tenant.name}</span>
          )}
        </div>
        <span>
          {new Date(project.updatedAt).toLocaleDateString('vi-VN')}
        </span>
      </div>
    </div>
  );
};
