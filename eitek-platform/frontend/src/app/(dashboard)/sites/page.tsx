'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Building2, Search, Grid, List, RefreshCw } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { LoadingSpinner } from '@/shared/components/ui/LoadingSpinner';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { siteService } from '@/features/projects/services/siteService';
import { projectService } from '@/features/projects/services/projectService';
import { SiteFormModal } from '@/features/projects/components/SiteFormModal';
import { SiteDeleteDialog } from '@/features/projects/components/SiteDeleteDialog';
import { SiteCard } from '@/features/projects/components/SiteCard';
import type { Site } from '@/features/projects/types/site';

interface ProjectOption {
  id: string;
  name: string;
}

const SitesPage: React.FC = () => {
  const router = useRouter();
  const { isAuthenticated, token } = useAuthStore();

  // Data state
  const [sites, setSites] = useState<Site[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [projectFilter, setProjectFilter] = useState<string>('');

  // Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 12;

  const fetchSites = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await siteService.getSites({
        page,
        pageSize,
        ...(searchQuery ? { search: searchQuery } : {}),
        ...(projectFilter ? { projectId: projectFilter } : {}),
        sortBy: 'name',
        sortOrder: 'asc',
      });

      if (Array.isArray(response)) {
        setSites(response);
        setTotalElements(response.length);
        setTotalPages(1);
      } else if (response && typeof response === 'object') {
        setSites(response.data || []);
        setTotalPages(response.pagination?.totalPages || 0);
        setTotalElements(response.pagination?.total || 0);
      }
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách site');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, searchQuery, projectFilter]);

  const fetchProjects = useCallback(async () => {
    try {
      const response = await projectService.getProjects({ pageSize: 100 });
      if (Array.isArray(response)) {
        setProjects(response.map((p: any) => ({ id: p.id, name: p.name })));
      } else if (response && response.data) {
        setProjects(response.data.map((p: any) => ({ id: p.id, name: p.name })));
      }
    } catch (err) {
      console.error('Failed to load projects:', err);
    }
  }, []);

  // Auth guard + initial fetch
  useEffect(() => {
    if (!isAuthenticated || !token) {
      router.replace('/login');
      return;
    }
    fetchSites();
    fetchProjects();
  }, [isAuthenticated, token, router, fetchSites, fetchProjects]);

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
  const handleCreateSite = async (data: { name: string; description?: string | undefined; projectId: string; address?: string | undefined; isActive?: boolean | undefined }) => {
    try {
      setActionLoading(true);
      await siteService.createSite({
        name: data.name,
        description: data.description || '',
        projectId: data.projectId,
        address: data.address || '',
        isActive: data.isActive ?? true,
      });
      setIsCreateModalOpen(false);
      await fetchSites();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi tạo site');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateSite = async (data: { name: string; description?: string | undefined; projectId: string; address?: string | undefined; isActive?: boolean | undefined }) => {
    if (!selectedSite) return;
    try {
      setActionLoading(true);
      await siteService.updateSite({
        id: selectedSite.id,
        name: data.name,
        description: data.description || '',
        address: data.address || '',
        isActive: data.isActive ?? true,
      });
      setIsEditModalOpen(false);
      setSelectedSite(null);
      await fetchSites();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi cập nhật site');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteSite = async () => {
    if (!selectedSite) return;
    try {
      setActionLoading(true);
      await siteService.deleteSite(selectedSite.id);
      setIsDeleteDialogOpen(false);
      setSelectedSite(null);
      await fetchSites();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi xóa site');
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewSite = (site: Site) => {
    setSelectedSite(site);
    setIsEditModalOpen(true);
  };

  const handleEditSite = (site: Site) => {
    setSelectedSite(site);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (site: Site) => {
    setSelectedSite(site);
    setIsDeleteDialogOpen(true);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-none px-6 py-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quản lý Site</h1>
            <p className="text-sm text-gray-500">Quản lý các site trong hệ thống</p>
          </div>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Tạo site
          </Button>
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              className="pl-10"
              placeholder="Tìm kiếm site..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>

          {/* Project Filter */}
          <div className="w-64">
            <select
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              value={projectFilter}
              onChange={(e) => {
                setProjectFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Tất cả dự án</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode('grid')}
              className={viewMode === 'grid' ? 'bg-gray-100' : ''}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode('list')}
              className={viewMode === 'list' ? 'bg-gray-100' : ''}
            >
              <List className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => fetchSites()}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button variant="outline" onClick={() => fetchSites()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Thử lại
            </Button>
          </div>
        ) : sites.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Building2 className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có site nào</h3>
            <p className="text-gray-500 mb-4">Bắt đầu bằng cách tạo site đầu tiên</p>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Tạo site
            </Button>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="mb-4 text-sm text-gray-500">
              Hiển thị {sites.length} / {totalElements} site
            </div>

            {/* Grid View */}
            {viewMode === 'grid' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {sites.map((site) => (
                  <SiteCard
                    key={site.id}
                    site={site}
                    onView={handleViewSite}
                    onEdit={handleEditSite}
                    onDelete={handleDeleteClick}
                  />
                ))}
              </div>
            )}

            {/* List View */}
            {viewMode === 'list' && (
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Site
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Dự án
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Khu vực
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Trạng thái
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cập nhật
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sites.map((site) => (
                      <tr key={site.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                              <Building2 className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{site.name}</div>
                              {site.address && (
                                <div className="text-sm text-gray-500 truncate max-w-xs">
                                  {site.address}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {site.project?.name || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {site._count?.areas ?? 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              site.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {site.isActive ? 'Hoạt động' : 'Tạm dừng'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(site.updatedAt).toLocaleDateString('vi-VN')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            className="text-primary-600 hover:text-primary-900 mr-3"
                            onClick={() => handleEditSite(site)}
                          >
                            Sửa
                          </button>
                          <button
                            className="text-red-600 hover:text-red-900"
                            onClick={() => handleDeleteClick(site)}
                          >
                            Xóa
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center mt-6 space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  Trước
                </Button>
                <span className="text-sm text-gray-600">
                  Trang {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  Sau
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      <SiteFormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateSite}
        title="Tạo site mới"
        isLoading={actionLoading}
        projects={projects}
      />

      <SiteFormModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedSite(null);
        }}
        onSubmit={handleUpdateSite}
        initialData={
          selectedSite
            ? {
                name: selectedSite.name,
                description: selectedSite.description || '',
                projectId: selectedSite.projectId,
                address: selectedSite.address || '',
                isActive: selectedSite.isActive,
              }
            : undefined
        }
        title="Chỉnh sửa site"
        isLoading={actionLoading}
        isEditMode={true}
        projects={projects}
      />

      <SiteDeleteDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setSelectedSite(null);
        }}
        onConfirm={handleDeleteSite}
        site={selectedSite}
        isLoading={actionLoading}
      />
    </div>
  );
};

export default SitesPage;
