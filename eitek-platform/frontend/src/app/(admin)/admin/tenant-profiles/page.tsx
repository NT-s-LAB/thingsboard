'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { 
  UserCog, 
  Plus, 
  Search, 
  Edit,
  Trash2,
  Copy,
  CheckCircle,
  Server,
  Users,
  Settings,
  Star,
  Loader2,
  AlertTriangle,
  X,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  FolderKanban,
  Gauge,
  DollarSign,
  ShoppingBag,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import {
  tenantProfileService,
  TenantProfile,
  CreateTenantProfileDto,
  UpdateTenantProfileDto,
  PaginationInfo,
} from '@/features/admin/services/tenantProfileService';

// ==================== FEATURE LIST ====================
const AVAILABLE_FEATURES = [
  'SCADA Editor',
  'Advanced Analytics',
  'White-label',
  'API Access',
  'Priority Support',
  'Dashboard Builder',
  'Custom Widgets',
  'Data Export',
  'Multi-language',
  'SSO Integration',
  'Audit Logs',
  'Alerts & Notifications',
];

// ==================== CREATE MODAL ====================
interface CreateProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function CreateProfileModal({ isOpen, onClose, onSuccess }: CreateProfileModalProps) {
  const [formData, setFormData] = useState<CreateTenantProfileDto>({
    name: '',
    description: '',
    maxUsers: 10,
    maxDevices: 100,
    maxProjects: 5,
    maxDashboards: 10,
    features: [],
    isDefault: false,
    isActive: true,
    price: 0,
    isCommercial: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await tenantProfileService.createProfile(formData);
      onSuccess();
      onClose();
      resetForm();
    } catch (err: any) {
      setError(err.message || 'Failed to create profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      maxUsers: 10,
      maxDevices: 100,
      maxProjects: 5,
      maxDashboards: 10,
      features: [],
      isDefault: false,
      isActive: true,
      price: 0,
      isCommercial: false,
    });
    setError(null);
  };

  const toggleFeature = (feature: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features?.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...(prev.features || []), feature],
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-slate-900">Create Tenant Profile</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <AlertTriangle className="w-4 h-4" />
              {error}
            </div>
          )}

          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Profile Name <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enterprise"
                required
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Full-featured plan for enterprise customers"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={2}
              />
            </div>
          </div>

          {/* Limits */}
          <div>
            <h3 className="text-sm font-medium text-slate-700 mb-3">Resource Limits</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Max Users</label>
                <Input
                  type="number"
                  min={1}
                  value={formData.maxUsers || ''}
                  onChange={(e) => setFormData({ ...formData, maxUsers: parseInt(e.target.value) || 10 })}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Max Devices</label>
                <Input
                  type="number"
                  min={1}
                  value={formData.maxDevices || ''}
                  onChange={(e) => setFormData({ ...formData, maxDevices: parseInt(e.target.value) || 100 })}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Max Projects</label>
                <Input
                  type="number"
                  min={1}
                  value={formData.maxProjects || ''}
                  onChange={(e) => setFormData({ ...formData, maxProjects: parseInt(e.target.value) || 5 })}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Max Dashboards</label>
                <Input
                  type="number"
                  min={1}
                  value={formData.maxDashboards || ''}
                  onChange={(e) => setFormData({ ...formData, maxDashboards: parseInt(e.target.value) || 10 })}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs text-slate-500 mb-1">Max API Calls/Month (empty = unlimited)</label>
                <Input
                  type="number"
                  min={0}
                  value={formData.maxApiCalls || ''}
                  onChange={(e) => setFormData({ ...formData, maxApiCalls: e.target.value ? parseInt(e.target.value) : undefined })}
                  placeholder="Unlimited"
                />
              </div>
            </div>
          </div>

          {/* Features */}
          <div>
            <h3 className="text-sm font-medium text-slate-700 mb-3">Enabled Features</h3>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_FEATURES.map((feature) => (
                <button
                  key={feature}
                  type="button"
                  onClick={() => toggleFeature(feature)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                    formData.features?.includes(feature)
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {formData.features?.includes(feature) && (
                    <CheckCircle className="w-3 h-3 inline mr-1" />
                  )}
                  {feature}
                </button>
              ))}
            </div>
          </div>

          {/* Pricing */}
          <div>
            <h3 className="text-sm font-medium text-slate-700 mb-3">Pricing</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Giá hàng tháng (0 = Miễn phí)</label>
                <Input
                  type="number"
                  min={0}
                  step="any"
                  value={formData.price ?? 0}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                />
                {(formData.price ?? 0) === 0 && (
                  <p className="text-xs text-emerald-600 mt-1">✓ Gói miễn phí</p>
                )}
              </div>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isCommercial ?? false}
                    onChange={(e) => setFormData({ ...formData, isCommercial: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-700">Gói thương mại</span>
                </label>
              </div>
            </div>
            {formData.isCommercial && (
              <p className="text-xs text-blue-600 mt-2">
                ℹ Gói này sẽ hiển thị trong trang Add-on của tenant để họ có thể lựa chọn mua.
              </p>
            )}
          </div>

          {/* Options */}
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isDefault}
                onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-slate-700">Set as default profile</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive !== false}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-slate-700">Active</span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-red-600 hover:bg-red-700">
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Profile
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==================== EDIT MODAL ====================
interface EditProfileModalProps {
  isOpen: boolean;
  profile: TenantProfile | null;
  onClose: () => void;
  onSuccess: () => void;
}

function EditProfileModal({ isOpen, profile, onClose, onSuccess }: EditProfileModalProps) {
  const [formData, setFormData] = useState<UpdateTenantProfileDto>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name,
        description: profile.description || '',
        maxUsers: profile.maxUsers,
        maxDevices: profile.maxDevices,
        maxProjects: profile.maxProjects,
        maxDashboards: profile.maxDashboards,
        maxApiCalls: profile.maxApiCalls || undefined,
        features: profile.features,
        isDefault: profile.isDefault,
        isActive: profile.isActive,
        price: profile.price ?? 0,
        isCommercial: profile.isCommercial ?? false,
      });
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await tenantProfileService.updateProfile(profile.id, formData);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleFeature = (feature: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features?.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...(prev.features || []), feature],
    }));
  };

  if (!isOpen || !profile) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-slate-900">Edit Tenant Profile</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <AlertTriangle className="w-4 h-4" />
              {error}
            </div>
          )}

          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Profile Name <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enterprise"
                required
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Full-featured plan for enterprise customers"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={2}
              />
            </div>
          </div>

          {/* Limits */}
          <div>
            <h3 className="text-sm font-medium text-slate-700 mb-3">Resource Limits</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Max Users</label>
                <Input
                  type="number"
                  min={1}
                  value={formData.maxUsers || ''}
                  onChange={(e) => setFormData({ ...formData, maxUsers: parseInt(e.target.value) || 10 })}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Max Devices</label>
                <Input
                  type="number"
                  min={1}
                  value={formData.maxDevices || ''}
                  onChange={(e) => setFormData({ ...formData, maxDevices: parseInt(e.target.value) || 100 })}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Max Projects</label>
                <Input
                  type="number"
                  min={1}
                  value={formData.maxProjects || ''}
                  onChange={(e) => setFormData({ ...formData, maxProjects: parseInt(e.target.value) || 5 })}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Max Dashboards</label>
                <Input
                  type="number"
                  min={1}
                  value={formData.maxDashboards || ''}
                  onChange={(e) => setFormData({ ...formData, maxDashboards: parseInt(e.target.value) || 10 })}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs text-slate-500 mb-1">Max API Calls/Month (empty = unlimited)</label>
                <Input
                  type="number"
                  min={0}
                  value={formData.maxApiCalls || ''}
                  onChange={(e) => setFormData({ ...formData, maxApiCalls: e.target.value ? parseInt(e.target.value) : undefined })}
                  placeholder="Unlimited"
                />
              </div>
            </div>
          </div>

          {/* Features */}
          <div>
            <h3 className="text-sm font-medium text-slate-700 mb-3">Enabled Features</h3>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_FEATURES.map((feature) => (
                <button
                  key={feature}
                  type="button"
                  onClick={() => toggleFeature(feature)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                    formData.features?.includes(feature)
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {formData.features?.includes(feature) && (
                    <CheckCircle className="w-3 h-3 inline mr-1" />
                  )}
                  {feature}
                </button>
              ))}
            </div>
          </div>

          {/* Pricing */}
          <div>
            <h3 className="text-sm font-medium text-slate-700 mb-3">Pricing</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Giá hàng tháng (0 = Miễn phí)</label>
                <Input
                  type="number"
                  min={0}
                  step="any"
                  value={formData.price ?? 0}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                />
                {(formData.price ?? 0) === 0 && (
                  <p className="text-xs text-emerald-600 mt-1">✓ Gói miễn phí</p>
                )}
              </div>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isCommercial ?? false}
                    onChange={(e) => setFormData({ ...formData, isCommercial: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-700">Gói thương mại</span>
                </label>
              </div>
            </div>
            {formData.isCommercial && (
              <p className="text-xs text-blue-600 mt-2">
                ℹ Gói này sẽ hiển thị trong trang Add-on của tenant để họ có thể lựa chọn mua.
              </p>
            )}
          </div>

          {/* Options */}
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isDefault}
                onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-slate-700">Set as default profile</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive !== false}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-slate-700">Active</span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
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
}

// ==================== DELETE MODAL ====================
interface DeleteProfileModalProps {
  isOpen: boolean;
  profile: TenantProfile | null;
  onClose: () => void;
  onSuccess: () => void;
}

function DeleteProfileModal({ isOpen, profile, onClose, onSuccess }: DeleteProfileModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!profile) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await tenantProfileService.deleteProfile(profile.id);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to delete profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !profile) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-4">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 text-center mb-2">Delete Profile</h2>
          <p className="text-slate-500 text-center mb-4">
            Are you sure you want to delete <strong>{profile.name}</strong>? This action cannot be undone.
          </p>

          {profile.tenantsCount > 0 && (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 text-sm mb-4">
              <AlertTriangle className="w-4 h-4" />
              This profile has {profile.tenantsCount} tenant(s) assigned. You must reassign them first.
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm mb-4">
              <AlertTriangle className="w-4 h-4" />
              {error}
            </div>
          )}

          <div className="flex justify-center gap-3">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={isSubmitting || profile.tenantsCount > 0}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== MAIN PAGE ====================
export default function TenantProfilesPage() {
  const [profiles, setProfiles] = useState<TenantProfile[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<TenantProfile | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchProfiles = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await tenantProfileService.getProfiles({
        page: currentPage,
        limit: 12,
        search: searchQuery || undefined,
      });

      setProfiles(response.data);
      setPagination(response.pagination);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch profiles');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchQuery]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  const handleSetDefault = async (profile: TenantProfile) => {
    if (profile.isDefault) return;

    setActionLoading(profile.id);
    try {
      await tenantProfileService.setAsDefault(profile.id);
      fetchProfiles();
    } catch (err: any) {
      alert(err.message || 'Failed to set as default');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDuplicate = async (profile: TenantProfile) => {
    setActionLoading(`dup-${profile.id}`);
    try {
      await tenantProfileService.duplicateProfile(profile.id);
      fetchProfiles();
    } catch (err: any) {
      alert(err.message || 'Failed to duplicate profile');
    } finally {
      setActionLoading(null);
    }
  };

  const handleEdit = (profile: TenantProfile) => {
    setSelectedProfile(profile);
    setIsEditModalOpen(true);
  };

  const handleDelete = (profile: TenantProfile) => {
    setSelectedProfile(profile);
    setIsDeleteModalOpen(true);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchProfiles();
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tenant Profiles</h1>
          <p className="text-slate-500 mt-1">Configure tenant profile templates and limits</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchProfiles} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button className="bg-red-600 hover:bg-red-700" onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Profile
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <form onSubmit={handleSearch} className="flex gap-2 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search profiles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button type="submit" variant="outline">
            Search
          </Button>
        </form>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <AlertTriangle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
        </div>
      )}

      {/* Profiles Grid */}
      {!isLoading && profiles.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {profiles.map((profile) => (
            <div 
              key={profile.id} 
              className={`bg-white rounded-xl shadow-sm border-2 overflow-hidden transition-all hover:shadow-md ${
                profile.isDefault ? 'border-blue-500' : 'border-slate-200'
              } ${!profile.isActive ? 'opacity-60' : ''}`}
            >
              {profile.isDefault && (
                <div className="bg-blue-500 text-white text-xs font-medium py-1 px-3 text-center flex items-center justify-center gap-1">
                  <Star className="w-3 h-3" />
                  Default Profile
                </div>
              )}
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
                      <UserCog className="w-6 h-6 text-slate-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{profile.name}</h3>
                      <p className="text-sm text-slate-500">{profile.tenantsCount} tenant(s)</p>
                    </div>
                  </div>
                  {!profile.isDefault && (
                    <button
                      onClick={() => handleSetDefault(profile)}
                      disabled={actionLoading === profile.id}
                      className="text-slate-400 hover:text-yellow-500 transition-colors"
                      title="Set as default"
                    >
                      {actionLoading === profile.id ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Star className="w-5 h-5" />
                      )}
                    </button>
                  )}
                </div>

                <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                  {profile.description || 'No description'}
                </p>

                {/* Price & Commercial Badge */}
                <div className="flex items-center gap-2 mb-4">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                    (profile.price ?? 0) === 0
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    <DollarSign className="w-3 h-3" />
                    {(profile.price ?? 0) === 0 ? 'Miễn phí' : `${profile.price?.toLocaleString()}đ/tháng`}
                  </span>
                  {profile.isCommercial && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
                      <ShoppingBag className="w-3 h-3" />
                      Thương mại
                    </span>
                  )}
                </div>

                {/* Limits */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500 flex items-center">
                      <Users className="w-4 h-4 mr-1.5" /> Max Users
                    </span>
                    <span className="font-medium text-slate-700">{profile.maxUsers.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500 flex items-center">
                      <Server className="w-4 h-4 mr-1.5" /> Max Devices
                    </span>
                    <span className="font-medium text-slate-700">{profile.maxDevices.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500 flex items-center">
                      <FolderKanban className="w-4 h-4 mr-1.5" /> Max Projects
                    </span>
                    <span className="font-medium text-slate-700">{profile.maxProjects.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500 flex items-center">
                      <Gauge className="w-4 h-4 mr-1.5" /> Max Dashboards
                    </span>
                    <span className="font-medium text-slate-700">{profile.maxDashboards.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500 flex items-center">
                      <Settings className="w-4 h-4 mr-1.5" /> API Calls/Month
                    </span>
                    <span className="font-medium text-slate-700">
                      {profile.maxApiCalls ? profile.maxApiCalls.toLocaleString() : 'Unlimited'}
                    </span>
                  </div>
                </div>

                {/* Features */}
                {profile.features.length > 0 && (
                  <div className="border-t border-slate-200 pt-4">
                    <p className="text-xs font-medium text-slate-500 mb-2">Features</p>
                    <div className="flex flex-wrap gap-1.5">
                      {profile.features.slice(0, 3).map((feature, idx) => (
                        <span 
                          key={idx}
                          className="inline-flex items-center px-2 py-0.5 bg-slate-100 rounded text-xs text-slate-600"
                        >
                          <CheckCircle className="w-3 h-3 mr-1 text-green-500" />
                          {feature}
                        </span>
                      ))}
                      {profile.features.length > 3 && (
                        <span className="text-xs text-slate-400">
                          +{profile.features.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-200">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEdit(profile)}>
                    <Edit className="w-4 h-4 mr-1.5" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDuplicate(profile)}
                    disabled={actionLoading === `dup-${profile.id}`}
                  >
                    {actionLoading === `dup-${profile.id}` ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => handleDelete(profile)}
                    disabled={profile.isDefault}
                    title={profile.isDefault ? 'Cannot delete default profile' : 'Delete'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && profiles.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <UserCog className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 mb-4">No tenant profiles found</p>
          <Button className="bg-red-600 hover:bg-red-700" onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create First Profile
          </Button>
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <p className="text-sm text-slate-500">
            Showing {((currentPage - 1) * pagination.limit) + 1} to {Math.min(currentPage * pagination.limit, pagination.total)} of {pagination.total} profiles
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-slate-600 px-2">
              Page {currentPage} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= pagination.totalPages}
              onClick={() => setCurrentPage(prev => prev + 1)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Modals */}
      <CreateProfileModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={fetchProfiles}
      />
      <EditProfileModal
        isOpen={isEditModalOpen}
        profile={selectedProfile}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedProfile(null);
        }}
        onSuccess={fetchProfiles}
      />
      <DeleteProfileModal
        isOpen={isDeleteModalOpen}
        profile={selectedProfile}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedProfile(null);
        }}
        onSuccess={fetchProfiles}
      />
    </div>
  );
}
