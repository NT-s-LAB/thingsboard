'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Star,
  Settings,
  Calendar,
  Clock,
  Building2,
  FolderTree,
  Monitor,
  Plus,
  Search,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { LoadingSpinner } from '@/shared/components/ui/LoadingSpinner';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { projectService } from '@/features/projects/services/projectService';
import { ProjectFormModal } from '@/features/projects/components/ProjectFormModal';
import { ProjectDeleteDialog } from '@/features/projects/components/ProjectDeleteDialog';
import { scadaService } from '@/features/scada/services/scadaService';
import { ScadaFormModal } from '@/features/scada/components/ScadaFormModal';
import { ScadaDeleteDialog } from '@/features/scada/components/ScadaDeleteDialog';
import { ScadaCard } from '@/features/scada/components/ScadaCard';
import { useQuota } from '@/shared/hooks/useQuota';
import { QuotaBadge } from '@/shared/components/ui/QuotaBadge';

interface ProjectDetail {
  id: string;
  name: string;
  description?: string | null;
  settings?: any;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  tenantId: string;
  tenant?: { id: string; name: string };
  _count?: { sites: number; userProjects: number };
  sites?: Array<{ id: string; name: string; isActive: boolean }>;
}

const ProjectDetailPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  const { isAuthenticated, token } = useAuthStore();

  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);

  // Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // SCADA state
  const [scadaViews, setScadaViews] = useState<any[]>([]);
  const [scadaLoading, setScadaLoading] = useState(false);
  const [scadaSearch, setScadaSearch] = useState('');
  const [isScadaCreateOpen, setIsScadaCreateOpen] = useState(false);
  const [isScadaEditOpen, setIsScadaEditOpen] = useState(false);
  const [isScadaDeleteOpen, setIsScadaDeleteOpen] = useState(false);
  const [selectedScada, setSelectedScada] = useState<any | null>(null);
  const [scadaActionLoading, setScadaActionLoading] = useState(false);
  const { isAtLimit, current: quotaCurrent, max: quotaMax, refresh: refreshQuota } = useQuota();

  const fetchProject = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await projectService.getProject(projectId);
      setProject(data as any);
    } catch (err: any) {
      setError(err.message || 'Không thể tải thông tin dự án');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const fetchFavoriteStatus = useCallback(async () => {
    try {
      const favs = await projectService.getFavoriteProjects();
      if (Array.isArray(favs)) {
        setIsFavorite(favs.some((p: any) => p.id === projectId));
      }
    } catch {
      // non-critical
    }
  }, [projectId]);

  const fetchScadaViews = useCallback(async () => {
    try {
      setScadaLoading(true);
      const result = await scadaService.getDashboards({
        projectId,
        ...(scadaSearch ? { search: scadaSearch } : {}),
        pageSize: 50,
      });
      // result may be { data: [...] } or an array
      if (Array.isArray(result)) {
        setScadaViews(result);
      } else if (result && Array.isArray(result.data)) {
        setScadaViews(result.data);
      } else {
        setScadaViews([]);
      }
    } catch (err) {
      console.error('Failed to load SCADA views:', err);
      setScadaViews([]);
    } finally {
      setScadaLoading(false);
    }
  }, [projectId, scadaSearch]);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      router.replace('/login');
      return;
    }
    fetchProject();
    fetchFavoriteStatus();
    fetchScadaViews();
  }, [isAuthenticated, token, router, fetchProject, fetchFavoriteStatus, fetchScadaViews]);

  const handleUpdate = async (data: { name: string; description?: string | undefined; isActive?: boolean | undefined }) => {
    if (!project) return;
    try {
      setActionLoading(true);
      await projectService.updateProject({
        id: project.id,
        name: data.name,
        description: data.description || '',
        isActive: data.isActive,
      } as any);
      setIsEditModalOpen(false);
      await fetchProject();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi cập nhật dự án');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!project) return;
    try {
      setActionLoading(true);
      await projectService.deleteProject(project.id);
      router.push('/projects');
    } catch (err: any) {
      alert(err.message || 'Lỗi khi xóa dự án');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!project) return;
    try {
      if (isFavorite) {
        await projectService.removeFromFavorites(project.id);
      } else {
        await projectService.addToFavorites(project.id);
      }
      setIsFavorite(!isFavorite);
    } catch (err: any) {
      console.error('Toggle favorite error:', err);
    }
  };

  // SCADA handlers
  const handleCreateScada = async (data: {
    name: string;
    description?: string | undefined;
    icon?: string | undefined;
    canvasSize?: { width: number; height: number } | undefined;
  }) => {
    try {
      setScadaActionLoading(true);
      await scadaService.createDashboard({
        name: data.name,
        ...(data.description ? { description: data.description } : {}),
        ...(data.icon ? { icon: data.icon } : {}),
        projectId,
        ...(data.canvasSize ? { canvasSize: data.canvasSize } : {}),
      });
      setIsScadaCreateOpen(false);
      await fetchScadaViews();
      refreshQuota();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi tạo SCADA dashboard');
    } finally {
      setScadaActionLoading(false);
    }
  };

  const handleEditScada = async (data: {
    name: string;
    description?: string | undefined;
    icon?: string | undefined;
    canvasSize?: { width: number; height: number } | undefined;
  }) => {
    if (!selectedScada) return;
    try {
      setScadaActionLoading(true);
      await scadaService.updateDashboard({
        id: selectedScada.id,
        name: data.name,
        ...(data.description ? { description: data.description } : {}),
        ...(data.icon ? { icon: data.icon } : {}),
      });
      setIsScadaEditOpen(false);
      setSelectedScada(null);
      await fetchScadaViews();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi cập nhật SCADA dashboard');
    } finally {
      setScadaActionLoading(false);
    }
  };

  const handleDeleteScada = async () => {
    if (!selectedScada) return;
    try {
      setScadaActionLoading(true);
      await scadaService.deleteDashboard(selectedScada.id);
      setIsScadaDeleteOpen(false);
      setSelectedScada(null);
      await fetchScadaViews();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi xóa SCADA dashboard');
    } finally {
      setScadaActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="h-full flex flex-col">
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <Button variant="ghost" onClick={() => router.push('/projects')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại
          </Button>
        </div>
        <div className="flex flex-col items-center justify-center flex-1">
          <div className="text-red-500 text-3xl mb-2">⚠️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            {error || 'Không tìm thấy dự án'}
          </h3>
          <Button className="mt-4" onClick={() => router.push('/projects')}>
            Về danh sách dự án
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={() => router.push('/projects')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Quay lại
            </Button>
            <div className="h-6 w-px bg-gray-300" />
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                <FolderTree className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{project.name}</h1>
                <div className="flex items-center space-x-2 mt-0.5">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${
                      project.isActive
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {project.isActive ? 'Hoạt động' : 'Tạm dừng'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" onClick={handleToggleFavorite}>
              <Star
                className={`w-4 h-4 ${
                  isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'
                }`}
              />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setIsEditModalOpen(true)}>
              <Pencil className="w-4 h-4 mr-2" />
              Sửa
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 border-red-200 hover:bg-red-50"
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Xóa
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6 bg-gray-50">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Overview Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Tổng quan</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Mô tả</label>
                  <p className="mt-1 text-gray-900">
                    {project.description || 'Chưa có mô tả'}
                  </p>
                </div>

                {project.tenant && (
                  <div className="flex items-center space-x-2">
                    <Building2 className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-500">Tổ chức:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {project.tenant.name}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-500">Ngày tạo:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {new Date(project.createdAt).toLocaleDateString('vi-VN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-500">Cập nhật:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {new Date(project.updatedAt).toLocaleDateString('vi-VN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Settings Card */}
          {project.settings && Object.keys(project.settings).length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Settings className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">Cài đặt</h2>
              </div>
              <pre className="bg-gray-50 p-4 rounded-md text-sm text-gray-700 overflow-auto">
                {JSON.stringify(project.settings, null, 2)}
              </pre>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-sm text-gray-500">Sites</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {project._count?.sites ?? 0}
              </p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-sm text-gray-500">Thành viên</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {project._count?.userProjects ?? 0}
              </p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-sm text-gray-500">Trạng thái</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {project.isActive ? '🟢 Active' : '⏸️ Paused'}
              </p>
            </div>
          </div>

          {/* Sites list (if available) */}
          {project.sites && project.sites.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Sites ({project.sites.length})
              </h2>
              <div className="space-y-2">
                {project.sites.map((site) => (
                  <div
                    key={site.id}
                    className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-md"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                        <Building2 className="w-4 h-4 text-blue-600" />
                      </div>
                      <span className="font-medium text-gray-900">{site.name}</span>
                    </div>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${
                        site.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {site.isActive ? 'Hoạt động' : 'Tạm dừng'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SCADA Dashboards Section */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Monitor className="w-5 h-5 text-primary-600" />
                <h2 className="text-lg font-semibold text-gray-900">
                  SCADA Dashboards ({scadaViews.length})
                </h2>
                <QuotaBadge label="Dashboard" current={quotaCurrent('dashboards')} max={quotaMax('dashboards')} />
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fetchScadaViews()}
                  disabled={scadaLoading}
                  title="Làm mới"
                >
                  <RefreshCw className={`w-4 h-4 ${scadaLoading ? 'animate-spin' : ''}`} />
                </Button>
                <Button size="sm" onClick={() => setIsScadaCreateOpen(true)} disabled={isAtLimit('dashboards')} title={isAtLimit('dashboards') ? 'Đã đạt giới hạn dashboard' : undefined}>
                  <Plus className="w-4 h-4 mr-1" />
                  Tạo SCADA
                </Button>
              </div>
            </div>

            {/* Search bar */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Tìm kiếm dashboard..."
                value={scadaSearch}
                onChange={(e) => setScadaSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* SCADA Grid */}
            {scadaLoading ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner size="md" />
              </div>
            ) : scadaViews.length === 0 ? (
              <div className="text-center py-12">
                <Monitor className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-sm font-medium text-gray-900 mb-1">
                  {scadaSearch
                    ? 'Không tìm thấy dashboard'
                    : 'Chưa có SCADA Dashboard'}
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  {scadaSearch
                    ? 'Thử tìm kiếm với từ khóa khác'
                    : 'Tạo dashboard SCADA đầu tiên cho dự án này'}
                </p>
                {!scadaSearch && (
                  <Button size="sm" onClick={() => setIsScadaCreateOpen(true)} disabled={isAtLimit('dashboards')} title={isAtLimit('dashboards') ? 'Đã đạt giới hạn dashboard' : undefined}>
                    <Plus className="w-4 h-4 mr-1" />
                    Tạo Dashboard
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {scadaViews.map((scada) => (
                  <ScadaCard
                    key={scada.id}
                    scada={scada}
                    onEdit={(s) => {
                      setSelectedScada(s);
                      setIsScadaEditOpen(true);
                    }}
                    onDelete={(s) => {
                      setSelectedScada(s);
                      setIsScadaDeleteOpen(true);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <ProjectFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleUpdate}
        initialData={{
          name: project.name,
          description: project.description || '',
          isActive: project.isActive,
        }}
        title="Chỉnh sửa dự án"
        isLoading={actionLoading}
      />

      <ProjectDeleteDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        projectName={project.name}
        isLoading={actionLoading}
      />

      {/* SCADA Modals */}
      <ScadaFormModal
        isOpen={isScadaCreateOpen}
        onClose={() => setIsScadaCreateOpen(false)}
        onSubmit={handleCreateScada}
        title="Tạo SCADA Dashboard"
        isLoading={scadaActionLoading}
      />

      <ScadaFormModal
        isOpen={isScadaEditOpen}
        onClose={() => {
          setIsScadaEditOpen(false);
          setSelectedScada(null);
        }}
        onSubmit={handleEditScada}
        initialData={
          selectedScada
            ? {
                name: selectedScada.name,
                description: selectedScada.description || '',
                icon: selectedScada.icon || '',
                canvasWidth: (selectedScada.canvasSize as any)?.width || 1920,
                canvasHeight: (selectedScada.canvasSize as any)?.height || 1080,
              }
            : undefined
        }
        title="Chỉnh sửa SCADA Dashboard"
        isLoading={scadaActionLoading}
      />

      <ScadaDeleteDialog
        isOpen={isScadaDeleteOpen}
        onClose={() => {
          setIsScadaDeleteOpen(false);
          setSelectedScada(null);
        }}
        onConfirm={handleDeleteScada}
        scadaName={selectedScada?.name || ''}
        isLoading={scadaActionLoading}
      />
    </div>
  );
};

export default ProjectDetailPage;
