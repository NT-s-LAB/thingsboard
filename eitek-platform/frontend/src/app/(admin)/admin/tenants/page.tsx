'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Building2, 
  Plus, 
  Search, 
  Edit,
  Trash2,
  Users,
  Server,
  CheckCircle,
  XCircle,
  Loader2,
  AlertTriangle,
  X,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import {
  tenantService,
  Tenant,
  CreateTenantDto,
  UpdateTenantDto,
  PaginationInfo,
  TenantProfile,
} from '@/features/admin/services/tenantService';
import { tenantProfileService } from '@/features/admin/services/tenantProfileService';

// ==================== MODALS ====================

interface CreateTenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateTenantModal: React.FC<CreateTenantModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState<CreateTenantDto>({
    name: '',
    code: '',
    description: '',
    profileId: '',
    isActive: true,
  });
  const [profiles, setProfiles] = useState<TenantProfile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch profiles when modal opens
  useEffect(() => {
    if (isOpen) {
      const fetchProfiles = async () => {
        setLoadingProfiles(true);
        try {
          const profiles = await tenantProfileService.getProfilesSimple();
          setProfiles(profiles || []);
          // Set default profile
          const defaultProfile = profiles?.find((p: TenantProfile) => p.isDefault);
          if (defaultProfile) {
            setFormData(prev => ({ ...prev, profileId: defaultProfile.id }));
          }
        } catch (err) {
          console.error('Failed to fetch profiles:', err);
        } finally {
          setLoadingProfiles(false);
        }
      };
      fetchProfiles();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // Validate
      if (!formData.name.trim()) {
        throw new Error('Tenant name is required');
      }
      if (!formData.code.trim()) {
        throw new Error('Tenant code is required');
      }
      if (!/^[a-zA-Z0-9_-]+$/.test(formData.code)) {
        throw new Error('Tenant code can only contain letters, numbers, underscore, and hyphen');
      }

      const createData: CreateTenantDto = {
        name: formData.name,
        code: formData.code.toLowerCase(),
        isActive: formData.isActive ?? true,
      };
      if (formData.description) createData.description = formData.description;
      if (formData.profileId) createData.profileId = formData.profileId;

      await tenantService.createTenant(createData);
      
      onSuccess();
      onClose();
      resetForm();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to create tenant');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', code: '', description: '', profileId: '', isActive: true });
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">Create New Tenant</h2>
          <button onClick={handleClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Tenant Name <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., EITEK Corporation"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Tenant Code <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toLowerCase() })}
              placeholder="e.g., eitek"
              disabled={isSubmitting}
            />
            <p className="text-xs text-slate-500 mt-1">
              Unique identifier. Only letters, numbers, underscore, and hyphen.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Tenant Profile
            </label>
            {loadingProfiles ? (
              <div className="flex items-center space-x-2 py-2">
                <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                <span className="text-sm text-slate-500">Loading profiles...</span>
              </div>
            ) : (
              <select
                value={formData.profileId || ''}
                onChange={(e) => setFormData({ ...formData, profileId: e.target.value })}
                disabled={isSubmitting}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white"
              >
                <option value="">No profile (use defaults)</option>
                {profiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.name} {profile.isDefault ? '(Default)' : ''} - Max {profile.maxUsers} users, {profile.maxDevices} devices
                  </option>
                ))}
              </select>
            )}
            <p className="text-xs text-slate-500 mt-1">
              Profile defines resource limits and features for this tenant.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Description
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of this tenant..."
              rows={3}
              disabled={isSubmitting}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-slate-700">Active Status</label>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
              disabled={isSubmitting}
              className="flex items-center space-x-2"
            >
              {formData.isActive ? (
                <ToggleRight className="w-10 h-6 text-green-500" />
              ) : (
                <ToggleLeft className="w-10 h-6 text-slate-400" />
              )}
              <span className={`text-sm ${formData.isActive ? 'text-green-600' : 'text-slate-500'}`}>
                {formData.isActive ? 'Active' : 'Inactive'}
              </span>
            </button>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" className="bg-red-600 hover:bg-red-700" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Tenant
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface EditTenantModalProps {
  tenant: Tenant | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const EditTenantModal: React.FC<EditTenantModalProps> = ({ tenant, isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState<UpdateTenantDto>({});
  const [profiles, setProfiles] = useState<TenantProfile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch profiles when modal opens
  useEffect(() => {
    if (isOpen) {
      const fetchProfiles = async () => {
        setLoadingProfiles(true);
        try {
          const profiles = await tenantProfileService.getProfilesSimple();
          setProfiles(profiles || []);
        } catch (err) {
          console.error('Failed to fetch profiles:', err);
        } finally {
          setLoadingProfiles(false);
        }
      };
      fetchProfiles();
    }
  }, [isOpen]);

  useEffect(() => {
    if (tenant) {
      setFormData({
        name: tenant.name,
        code: tenant.code,
        description: tenant.description || '',
        profileId: tenant.profileId || '',
        isActive: tenant.isActive,
      });
    }
  }, [tenant]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant) return;
    
    setError(null);
    setIsSubmitting(true);

    try {
      if (!formData.name?.trim()) {
        throw new Error('Tenant name is required');
      }
      if (!formData.code?.trim()) {
        throw new Error('Tenant code is required');
      }
      if (!/^[a-zA-Z0-9_-]+$/.test(formData.code)) {
        throw new Error('Tenant code can only contain letters, numbers, underscore, and hyphen');
      }

      const updateData: UpdateTenantDto = {
        name: formData.name,
        code: formData.code?.toLowerCase(),
        isActive: formData.isActive ?? true,
        profileId: formData.profileId || null, // null to clear profile
      };
      if (formData.description) updateData.description = formData.description;

      await tenantService.updateTenant(tenant.id, updateData);
      
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to update tenant');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !tenant) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">Edit Tenant</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Tenant Name <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Tenant Code <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              value={formData.code || ''}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toLowerCase() })}
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Tenant Profile
            </label>
            {loadingProfiles ? (
              <div className="flex items-center space-x-2 py-2">
                <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                <span className="text-sm text-slate-500">Loading profiles...</span>
              </div>
            ) : (
              <select
                value={formData.profileId || ''}
                onChange={(e) => setFormData({ ...formData, profileId: e.target.value })}
                disabled={isSubmitting}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white"
              >
                <option value="">No profile (use defaults)</option>
                {profiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.name} {profile.isDefault ? '(Default)' : ''} - Max {profile.maxUsers} users, {profile.maxDevices} devices
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Description
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              disabled={isSubmitting}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-slate-700">Active Status</label>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
              disabled={isSubmitting}
              className="flex items-center space-x-2"
            >
              {formData.isActive ? (
                <ToggleRight className="w-10 h-6 text-green-500" />
              ) : (
                <ToggleLeft className="w-10 h-6 text-slate-400" />
              )}
              <span className={`text-sm ${formData.isActive ? 'text-green-600' : 'text-slate-500'}`}>
                {formData.isActive ? 'Active' : 'Inactive'}
              </span>
            </button>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" className="bg-red-600 hover:bg-red-700" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Edit className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface DeleteTenantModalProps {
  tenant: Tenant | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const DeleteTenantModal: React.FC<DeleteTenantModalProps> = ({ tenant, isOpen, onClose, onSuccess }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmText, setConfirmText] = useState('');

  const handleDelete = async () => {
    if (!tenant) return;
    
    setError(null);
    setIsDeleting(true);

    try {
      await tenantService.deleteTenant(tenant.id);
      onSuccess();
      onClose();
      setConfirmText('');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to delete tenant');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    setConfirmText('');
    setError(null);
    onClose();
  };

  if (!isOpen || !tenant) return null;

  const canDelete = confirmText === tenant.code;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Delete Tenant</h2>
              <p className="text-sm text-slate-500">This action cannot be undone</p>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="bg-slate-50 rounded-lg p-4 mb-4">
            <p className="text-sm text-slate-600 mb-2">
              You are about to delete <strong>{tenant.name}</strong> ({tenant.code}).
            </p>
            <p className="text-sm text-slate-600">
              This will permanently remove the tenant and all associated data:
            </p>
            <ul className="text-sm text-slate-600 mt-2 space-y-1">
              <li>• {tenant.usersCount} user{tenant.usersCount !== 1 ? 's' : ''}</li>
              <li>• {tenant.projectsCount} project{tenant.projectsCount !== 1 ? 's' : ''}</li>
              <li>• {tenant.devicesCount} device{tenant.devicesCount !== 1 ? 's' : ''}</li>
            </ul>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Type <code className="bg-slate-100 px-1.5 py-0.5 rounded">{tenant.code}</code> to confirm
            </label>
            <Input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Enter tenant code"
              disabled={isDeleting}
            />
          </div>

          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={handleClose} disabled={isDeleting}>
              Cancel
            </Button>
            <Button 
              className="bg-red-600 hover:bg-red-700" 
              onClick={handleDelete}
              disabled={isDeleting || !canDelete}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Tenant
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== MAIN PAGE ====================

export default function TenantsPage() {
  const router = useRouter();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchTenants = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await tenantService.getTenants({
        page: currentPage,
        limit: pageSize,
        search: debouncedSearch || undefined,
        isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
      });

      setTenants(response.data);
      setPagination(response.pagination);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to load tenants');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, debouncedSearch, statusFilter]);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  const handleView = (tenant: Tenant) => {
    router.push(`/admin/tenants/${tenant.id}`);
  };

  const handleEdit = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setShowEditModal(true);
  };

  const handleDelete = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setShowDeleteModal(true);
  };

  const handleToggleActive = async (tenant: Tenant) => {
    const action = tenant.isActive ? 'vô hiệu hóa' : 'kích hoạt';
    if (!confirm(`Bạn có chắc muốn ${action} tenant "${tenant.name}"?`)) return;
    try {
      await tenantService.updateTenant(tenant.id, { isActive: !tenant.isActive });
      fetchTenants();
    } catch (err: any) {
      alert(err.message || `Không thể ${action} tenant`);
    }
  };

  const handleSuccess = () => {
    fetchTenants();
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value as 'all' | 'active' | 'inactive');
    setCurrentPage(1);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tenants</h1>
          <p className="text-slate-500 mt-1">
            Manage tenant organizations
            {pagination && (
              <span className="text-xs ml-2">• {pagination.total} total</span>
            )}
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="bg-red-600 hover:bg-red-700">
          <Plus className="w-4 h-4 mr-2" />
          Create Tenant
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search by name or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <select 
            value={statusFilter}
            onChange={(e) => handleStatusFilterChange(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <Button variant="outline" onClick={fetchTenants} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchTenants}>
            Retry
          </Button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-10 h-10 animate-spin text-red-600 mx-auto mb-4" />
            <p className="text-slate-500">Loading tenants...</p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && tenants.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No tenants found</h3>
          <p className="text-sm text-slate-500 mb-4">
            {debouncedSearch || statusFilter !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Get started by creating your first tenant'}
          </p>
          {!debouncedSearch && statusFilter === 'all' && (
            <Button onClick={() => setShowCreateModal(true)} className="bg-red-600 hover:bg-red-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Tenant
            </Button>
          )}
        </div>
      )}

      {/* Tenants Table */}
      {!isLoading && !error && tenants.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600">Tenant</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600">Email</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600">Code</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600">Profile</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600">Status</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600">Users</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600">Devices</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600">Created</th>
                <th className="text-right px-4 py-3 text-sm font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {tenants.map((tenant) => (
                <tr key={tenant.id} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => handleView(tenant)}>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                        <Building2 className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900 truncate">{tenant.name}</p>
                        <p className="text-xs text-slate-500 truncate">
                          {tenant.description || '-'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {tenant.adminEmail ? (
                      <span className="text-sm text-slate-600 truncate block max-w-[200px]">{tenant.adminEmail}</span>
                    ) : (
                      <span className="text-sm text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <code className="px-1.5 py-0.5 bg-slate-100 rounded text-xs text-slate-700">
                      {tenant.code}
                    </code>
                  </td>
                  <td className="px-4 py-3">
                    {tenant.profile ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                        {tenant.profile.name}
                      </span>
                    ) : (
                      <span className="text-sm text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                      tenant.isActive 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {tenant.isActive ? (
                        <><CheckCircle className="w-3 h-3 mr-1" /> Active</>
                      ) : (
                        <><XCircle className="w-3 h-3 mr-1" /> Inactive</>
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center text-sm text-slate-600">
                      <Users className="w-3.5 h-3.5 mr-1 text-slate-400" />
                      {tenant.usersCount}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center text-sm text-slate-600">
                      <Server className="w-3.5 h-3.5 mr-1 text-slate-400" />
                      {tenant.devicesCount}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500 whitespace-nowrap">
                    {new Date(tenant.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end space-x-1" onClick={(e) => e.stopPropagation()}>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        title={tenant.isActive ? 'Vô hiệu hóa' : 'Kích hoạt'}
                        className={tenant.isActive ? 'text-amber-600 hover:text-amber-700 hover:bg-amber-50' : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'}
                        onClick={() => handleToggleActive(tenant)}
                      >
                        {tenant.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        title="Edit"
                        onClick={() => handleEdit(tenant)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-600 hover:text-red-700 hover:bg-red-50" 
                        title="Delete"
                        onClick={() => handleDelete(tenant)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
              <p className="text-sm text-slate-500">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} tenants
              </p>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={!pagination.hasPrev}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-slate-600">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={!pagination.hasNext}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <CreateTenantModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleSuccess}
      />
      <EditTenantModal
        tenant={selectedTenant}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSuccess={handleSuccess}
      />
      <DeleteTenantModal
        tenant={selectedTenant}
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
