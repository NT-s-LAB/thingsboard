'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, MapPin, Search, Grid, List, RefreshCw } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { LoadingSpinner } from '@/shared/components/ui/LoadingSpinner';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { areaService } from '@/features/projects/services/areaService';
import { siteService } from '@/features/projects/services/siteService';
import { AreaFormModal } from '@/features/projects/components/AreaFormModal';
import { AreaDeleteDialog } from '@/features/projects/components/AreaDeleteDialog';
import { AreaCard } from '@/features/projects/components/AreaCard';
import type { Area } from '@/features/projects/types/area';
import type { Site } from '@/features/projects/types/site';

const AreasPage: React.FC = () => {
  const router = useRouter();
  const { isAuthenticated, token } = useAuthStore();

  // Data state
  const [areas, setAreas] = useState<Area[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [siteFilter, setSiteFilter] = useState<string>('');

  // Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedArea, setSelectedArea] = useState<Area | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 12;

  const fetchAreas = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await areaService.getAreas({
        page,
        pageSize,
        ...(searchQuery ? { search: searchQuery } : {}),
        ...(siteFilter ? { siteId: siteFilter } : {}),
        sortBy: 'name',
        sortOrder: 'asc',
      });

      if (Array.isArray(response)) {
        setAreas(response);
        setTotalElements(response.length);
        setTotalPages(1);
      } else if (response && typeof response === 'object') {
        setAreas(response.data || []);
        setTotalPages(response.pagination?.totalPages || 0);
        setTotalElements(response.pagination?.total || 0);
      }
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách khu vực');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, searchQuery, siteFilter]);

  const fetchSites = useCallback(async () => {
    try {
      const siteList = await siteService.getAllSites();
      setSites(siteList);
    } catch (err) {
      console.error('Failed to load sites:', err);
    }
  }, []);

  // Auth guard + initial fetch
  useEffect(() => {
    if (!isAuthenticated || !token) {
      router.replace('/login');
      return;
    }
    fetchAreas();
    fetchSites();
  }, [isAuthenticated, token, router, fetchAreas, fetchSites]);

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
  const handleCreateArea = async (data: { name: string; description?: string | undefined; siteId: string; isActive?: boolean | undefined }) => {
    try {
      setActionLoading(true);
      await areaService.createArea({
        name: data.name,
        description: data.description || '',
        siteId: data.siteId,
        isActive: data.isActive ?? true,
      });
      setIsCreateModalOpen(false);
      await fetchAreas();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi tạo khu vực');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateArea = async (data: { name: string; description?: string | undefined; siteId: string; isActive?: boolean | undefined }) => {
    if (!selectedArea) return;
    try {
      setActionLoading(true);
      await areaService.updateArea({
        id: selectedArea.id,
        name: data.name,
        description: data.description || '',
        isActive: data.isActive ?? true,
      });
      setIsEditModalOpen(false);
      setSelectedArea(null);
      await fetchAreas();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi cập nhật khu vực');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteArea = async () => {
    if (!selectedArea) return;
    try {
      setActionLoading(true);
      await areaService.deleteArea(selectedArea.id);
      setIsDeleteDialogOpen(false);
      setSelectedArea(null);
      await fetchAreas();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi xóa khu vực');
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewArea = (area: Area) => {
    // Could navigate to area detail page if exists
    // For now, just open edit modal
    setSelectedArea(area);
    setIsEditModalOpen(true);
  };

  const handleEditArea = (area: Area) => {
    setSelectedArea(area);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (area: Area) => {
    setSelectedArea(area);
    setIsDeleteDialogOpen(true);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-none px-6 py-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quản lý khu vực</h1>
            <p className="text-sm text-gray-500">Quản lý các khu vực trong hệ thống</p>
          </div>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Tạo khu vực
          </Button>
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              className="pl-10"
              placeholder="Tìm kiếm khu vực..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>

          {/* Site Filter */}
          <div className="w-64">
            <select
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              value={siteFilter}
              onChange={(e) => {
                setSiteFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Tất cả site</option>
              {sites.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.name}
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
            <Button variant="outline" size="sm" onClick={() => fetchAreas()}>
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
            <Button variant="outline" onClick={() => fetchAreas()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Thử lại
            </Button>
          </div>
        ) : areas.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <MapPin className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có khu vực nào</h3>
            <p className="text-gray-500 mb-4">Bắt đầu bằng cách tạo khu vực đầu tiên</p>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Tạo khu vực
            </Button>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="mb-4 text-sm text-gray-500">
              Hiển thị {areas.length} / {totalElements} khu vực
            </div>

            {/* Grid View */}
            {viewMode === 'grid' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {areas.map((area) => (
                  <AreaCard
                    key={area.id}
                    area={area}
                    onView={handleViewArea}
                    onEdit={handleEditArea}
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
                        Khu vực
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Site
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Thiết bị
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
                    {areas.map((area) => (
                      <tr key={area.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                              <MapPin className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{area.name}</div>
                              {area.description && (
                                <div className="text-sm text-gray-500 truncate max-w-xs">
                                  {area.description}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {area.site?.name || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {area._count?.devices ?? 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              area.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {area.isActive ? 'Hoạt động' : 'Tạm dừng'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(area.updatedAt).toLocaleDateString('vi-VN')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            className="text-primary-600 hover:text-primary-900 mr-3"
                            onClick={() => handleEditArea(area)}
                          >
                            Sửa
                          </button>
                          <button
                            className="text-red-600 hover:text-red-900"
                            onClick={() => handleDeleteClick(area)}
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
      <AreaFormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateArea}
        title="Tạo khu vực mới"
        isLoading={actionLoading}
      />

      <AreaFormModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedArea(null);
        }}
        onSubmit={handleUpdateArea}
        initialData={
          selectedArea
            ? {
                name: selectedArea.name,
                description: selectedArea.description || '',
                siteId: selectedArea.siteId,
                isActive: selectedArea.isActive,
              }
            : undefined
        }
        title="Chỉnh sửa khu vực"
        isLoading={actionLoading}
        isEditMode={true}
      />

      <AreaDeleteDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setSelectedArea(null);
        }}
        onConfirm={handleDeleteArea}
        area={selectedArea}
        isLoading={actionLoading}
      />
    </div>
  );
};

export default AreasPage;
