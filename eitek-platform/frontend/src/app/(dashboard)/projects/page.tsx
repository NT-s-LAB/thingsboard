'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, FolderTree, Search, Grid, List, RefreshCw } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { LoadingSpinner } from '@/shared/components/ui/LoadingSpinner';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { projectService } from '@/features/projects/services/projectService';
import { ProjectFormModal } from '@/features/projects/components/ProjectFormModal';
import { ProjectDeleteDialog } from '@/features/projects/components/ProjectDeleteDialog';
import { ProjectCard } from '@/features/projects/components/ProjectCard';

interface ProjectItem {
  id: string;
  name: string;
  description?: string | null;
  settings?: any;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  tenantId?: string;
  tenant?: { id: string; name: string };
  _count?: { sites: number; userProjects: number };
}

const ProjectsPage: React.FC = () => {
  const router = useRouter();
  const { isAuthenticated, token } = useAuthStore();

  // Data state
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  // Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 12;

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await projectService.getProjects({
        page,
        pageSize,
        ...(searchQuery ? { search: searchQuery } : {}),
        sortBy: 'updatedAt',
        sortOrder: 'DESC',
      });

      // api.ts auto-unwraps paginated → { data, totalElements, totalPages, hasNext }
      if (Array.isArray(response)) {
        setProjects(response as any);
        setTotalElements(response.length);
        setTotalPages(1);
      } else if (response && typeof response === 'object') {
        const r = response as any;
        setProjects(r.data || []);
        setTotalPages(r.totalPages || 0);
        setTotalElements(r.totalElements || 0);
      }
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách dự án');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, searchQuery]);

  const fetchFavorites = useCallback(async () => {
    try {
      const favs = await projectService.getFavoriteProjects();
      if (Array.isArray(favs)) {
        setFavoriteIds(new Set(favs.map((p: any) => p.id)));
      }
    } catch {
      // Favorites are non-critical
    }
  }, []);

  // Auth guard + initial fetch
  useEffect(() => {
    if (!isAuthenticated || !token) {
      router.replace('/login');
      return;
    }
    fetchProjects();
    fetchFavorites();
  }, [isAuthenticated, token, router, fetchProjects, fetchFavorites]);

  // Debounced search
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (searchTimeout) clearTimeout(searchTimeout);
    setSearchTimeout(
      setTimeout(() => {
        setPage(1);
      }, 400),
    );
  };

  // ----- CRUD handlers -----
  const handleCreateProject = async (data: { name: string; description?: string | undefined; isActive?: boolean | undefined }) => {
    try {
      setActionLoading(true);
      await projectService.createProject({
        name: data.name,
        description: data.description || '',
        settings: {},
      } as any);
      setIsCreateModalOpen(false);
      await fetchProjects();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi tạo dự án');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateProject = async (data: { name: string; description?: string | undefined; isActive?: boolean | undefined }) => {
    if (!selectedProject) return;
    try {
      setActionLoading(true);
      await projectService.updateProject({
        id: selectedProject.id,
        name: data.name,
        description: data.description || '',
        isActive: data.isActive,
      } as any);
      setIsEditModalOpen(false);
      setSelectedProject(null);
      await fetchProjects();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi cập nhật dự án');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!selectedProject) return;
    try {
      setActionLoading(true);
      await projectService.deleteProject(selectedProject.id);
      setIsDeleteDialogOpen(false);
      setSelectedProject(null);
      await fetchProjects();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi xóa dự án');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleFavorite = async (project: ProjectItem) => {
    try {
      if (favoriteIds.has(project.id)) {
        await projectService.removeFromFavorites(project.id);
        setFavoriteIds((prev) => {
          const next = new Set(prev);
          next.delete(project.id);
          return next;
        });
      } else {
        await projectService.addToFavorites(project.id);
        setFavoriteIds((prev) => new Set(prev).add(project.id));
      }
    } catch (err: any) {
      console.error('Toggle favorite error:', err);
    }
  };

  const handleViewProject = (project: ProjectItem) => {
    router.push(`/projects/${project.id}`);
  };

  const handleEditProject = (project: ProjectItem) => {
    setSelectedProject(project);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (project: ProjectItem) => {
    setSelectedProject(project);
    setIsDeleteDialogOpen(true);
  };

  // ----- Render -----
  if (loading && projects.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dự án</h1>
            <p className="mt-1 text-sm text-gray-500">
              Quản lý các dự án SCADA &amp; IoT của bạn
            </p>
          </div>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Tạo dự án
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Tìm kiếm dự án..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10 w-72"
              />
            </div>
            <span className="text-sm text-gray-500">{totalElements} dự án</span>
          </div>

          <div className="flex items-center space-x-2">
            <Button size="sm" variant="ghost" onClick={fetchProjects} disabled={loading}>
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <div className="flex items-center bg-gray-100 rounded-md p-0.5">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}
              >
                <Grid className="w-4 h-4 text-gray-600" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}
              >
                <List className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6 bg-gray-50">
        {error ? (
          <div className="flex flex-col items-center justify-center h-64">
            <div className="text-red-500 text-3xl mb-2">⚠️</div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">Lỗi tải dữ liệu</h3>
            <p className="text-sm text-gray-500 mb-4">{error}</p>
            <Button onClick={fetchProjects}>Thử lại</Button>
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64">
            <FolderTree className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">Chưa có dự án</h3>
            <p className="text-sm text-gray-500 mb-4">
              {searchQuery ? 'Không tìm thấy dự án phù hợp' : 'Tạo dự án đầu tiên để bắt đầu'}
            </p>
            {!searchQuery && (
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Tạo dự án
              </Button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                isFavorite={favoriteIds.has(project.id)}
                onView={handleViewProject}
                onEdit={handleEditProject}
                onDelete={handleDeleteClick}
                onToggleFavorite={handleToggleFavorite}
              />
            ))}
          </div>
        ) : (
          /* List view */
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Tên</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Mô tả</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Sites</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Cập nhật</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => (
                  <tr
                    key={project.id}
                    className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleViewProject(project)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary-100 rounded flex items-center justify-center flex-shrink-0">
                          <FolderTree className="w-4 h-4 text-primary-600" />
                        </div>
                        <span className="font-medium text-gray-900">{project.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">
                      {project.description || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                          project.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {project.isActive ? 'Hoạt động' : 'Tạm dừng'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {project._count?.sites ?? 0}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(project.updatedAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end space-x-1">
                        <Button size="sm" variant="ghost" onClick={() => handleEditProject(project)}>
                          Sửa
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDeleteClick(project)}
                        >
                          Xóa
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-gray-500">
              Trang {page} / {totalPages} ({totalElements} dự án)
            </p>
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Trước
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Sau
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <ProjectFormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateProject}
        title="Tạo dự án mới"
        isLoading={actionLoading}
      />

      <ProjectFormModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedProject(null);
        }}
        onSubmit={handleUpdateProject}
        initialData={
          selectedProject
            ? {
                name: selectedProject.name,
                description: selectedProject.description || '',
                isActive: selectedProject.isActive,
              }
            : undefined
        }
        title="Chỉnh sửa dự án"
        isLoading={actionLoading}
      />

      <ProjectDeleteDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setSelectedProject(null);
        }}
        onConfirm={handleDeleteProject}
        projectName={selectedProject?.name || ''}
        isLoading={actionLoading}
      />
    </div>
  );
};

export default ProjectsPage;