'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Loader2,
  AlertTriangle,
  X,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Package,
  Zap,
  Hash,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { addonCatalogService } from '@/features/addons/services/addonService';
import type { AddonCatalog, AddonType, AddonResourceType } from '@/shared/types';

// ==================== CONSTANTS ====================

const ADDON_TYPES: { value: AddonType; label: string; color: string }[] = [
  { value: 'QUOTA', label: 'Quota', color: 'bg-blue-100 text-blue-700' },
  { value: 'FEATURE', label: 'Feature', color: 'bg-purple-100 text-purple-700' },
];

const RESOURCE_TYPES: { value: AddonResourceType; label: string; icon: string }[] = [
  { value: 'DEVICES', label: 'Thiết bị', icon: '📟' },
  { value: 'USERS', label: 'Users', icon: '👥' },
  { value: 'PROJECTS', label: 'Dự án', icon: '📁' },
  { value: 'DASHBOARDS', label: 'Dashboard', icon: '📊' },
  { value: 'API_CALLS', label: 'API Calls', icon: '⚡' },
  { value: 'STORAGE', label: 'Storage', icon: '💾' },
];

// ==================== FORM MODAL ====================

interface AddonFormData {
  code: string;
  name: string;
  description: string;
  type: AddonType;
  resourceType: AddonResourceType | '';
  quantityPerUnit: number | '';
  featureFlag: string;
  priceMonthly: number;
  isActive: boolean;
  sortOrder: number;
}

const defaultForm: AddonFormData = {
  code: '',
  name: '',
  description: '',
  type: 'QUOTA',
  resourceType: '',
  quantityPerUnit: '',
  featureFlag: '',
  priceMonthly: 0,
  isActive: true,
  sortOrder: 0,
};

interface AddonFormModalProps {
  isOpen: boolean;
  addon: AddonCatalog | null; // null = create mode
  onClose: () => void;
  onSuccess: () => void;
}

function AddonFormModal({ isOpen, addon, onClose, onSuccess }: AddonFormModalProps) {
  const isEdit = !!addon;
  const [form, setForm] = useState<AddonFormData>(defaultForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (addon) {
      setForm({
        code: addon.code,
        name: addon.name,
        description: addon.description || '',
        type: addon.type,
        resourceType: addon.resourceType || '',
        quantityPerUnit: addon.quantityPerUnit ?? '',
        featureFlag: addon.featureFlag || '',
        priceMonthly: addon.priceMonthly,
        isActive: addon.isActive,
        sortOrder: addon.sortOrder,
      });
    } else {
      setForm(defaultForm);
    }
    setError(null);
  }, [addon, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const payload: Record<string, unknown> = {
      code: form.code,
      name: form.name,
      description: form.description || undefined,
      type: form.type,
      priceMonthly: form.priceMonthly,
      isActive: form.isActive,
      sortOrder: form.sortOrder,
    };

    if (form.type === 'QUOTA') {
      payload.resourceType = form.resourceType || undefined;
      payload.quantityPerUnit = form.quantityPerUnit || undefined;
      payload.featureFlag = undefined;
    } else {
      payload.featureFlag = form.featureFlag || undefined;
      payload.resourceType = undefined;
      payload.quantityPerUnit = undefined;
    }

    try {
      if (isEdit) {
        await addonCatalogService.update(addon.id, payload);
      } else {
        await addonCatalogService.create(payload);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || `Failed to ${isEdit ? 'update' : 'create'} add-on`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-slate-900">
            {isEdit ? 'Edit Add-on' : 'Create Add-on'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Code + Name */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Code <span className="text-red-500">*</span>
              </label>
              <Input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '') })}
                placeholder="EXTRA_DEVICES_50"
                required
                disabled={isEdit}
              />
              <p className="text-xs text-slate-400 mt-1">Unique code, uppercase + underscore</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Extra 50 Devices"
                required
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Mô tả add-on..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              rows={2}
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Type <span className="text-red-500">*</span></label>
            <div className="flex gap-3">
              {ADDON_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setForm({ ...form, type: t.value })}
                  className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium border-2 transition-all ${
                    form.type === t.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {t.value === 'QUOTA' ? <Hash className="w-4 h-4 inline mr-1.5" /> : <Zap className="w-4 h-4 inline mr-1.5" />}
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* QUOTA-specific fields */}
          {form.type === 'QUOTA' && (
            <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50/50 rounded-lg border border-blue-100">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Resource Type</label>
                <select
                  value={form.resourceType}
                  onChange={(e) => setForm({ ...form, resourceType: e.target.value as AddonResourceType })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
                >
                  <option value="">-- Select --</option>
                  {RESOURCE_TYPES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.icon} {r.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Quantity / Unit</label>
                <Input
                  type="number"
                  min={1}
                  value={form.quantityPerUnit}
                  onChange={(e) => setForm({ ...form, quantityPerUnit: e.target.value ? parseInt(e.target.value) : '' })}
                  placeholder="50"
                />
                <p className="text-xs text-slate-400 mt-1">Mỗi unit tăng thêm bao nhiêu</p>
              </div>
            </div>
          )}

          {/* FEATURE-specific fields */}
          {form.type === 'FEATURE' && (
            <div className="p-4 bg-purple-50/50 rounded-lg border border-purple-100">
              <label className="block text-sm font-medium text-slate-700 mb-1">Feature Flag</label>
              <Input
                value={form.featureFlag}
                onChange={(e) => setForm({ ...form, featureFlag: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                placeholder="scada_editor"
              />
              <p className="text-xs text-slate-400 mt-1">Feature flag name (lowercase + underscore)</p>
            </div>
          )}

          {/* Price + SortOrder */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Giá / tháng (VND)</label>
              <Input
                type="number"
                min={0}
                step={1000}
                value={form.priceMonthly}
                onChange={(e) => setForm({ ...form, priceMonthly: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Sort Order</label>
              <Input
                type="number"
                min={0}
                value={form.sortOrder}
                onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          {/* Active toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-slate-700">Active</span>
          </label>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-red-600 hover:bg-red-700">
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isEdit ? 'Saving...' : 'Creating...'}
                </>
              ) : (
                <>
                  {isEdit ? <Edit className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                  {isEdit ? 'Save Changes' : 'Create Add-on'}
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

interface DeleteAddonModalProps {
  isOpen: boolean;
  addon: AddonCatalog | null;
  onClose: () => void;
  onSuccess: () => void;
}

function DeleteAddonModal({ isOpen, addon, onClose, onSuccess }: DeleteAddonModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!addon) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await addonCatalogService.delete(addon.id);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to delete add-on');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !addon) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-4">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 text-center mb-2">Delete Add-on</h2>
          <p className="text-slate-500 text-center mb-4">
            Xóa <strong>{addon.name}</strong> ({addon.code})? Thao tác này không thể hoàn tác.
          </p>
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
            <Button onClick={handleDelete} disabled={isSubmitting} className="bg-red-600 hover:bg-red-700">
              {isSubmitting ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Deleting...</>
              ) : (
                <><Trash2 className="w-4 h-4 mr-2" />Delete</>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== MAIN PAGE ====================

export default function AddonCatalogPage() {
  const [addons, setAddons] = useState<AddonCatalog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedAddon, setSelectedAddon] = useState<AddonCatalog | null>(null);

  const fetchAddons = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await addonCatalogService.getAll({
        page: currentPage,
        limit: 12,
        ...(searchQuery ? { search: searchQuery } : {}),
      });
      setAddons(res.data);
      setTotalPages(res.pagination?.totalPages ?? 1);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch add-ons');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchQuery]);

  useEffect(() => {
    fetchAddons();
  }, [fetchAddons]);

  const handleEdit = (addon: AddonCatalog) => {
    setSelectedAddon(addon);
    setIsFormOpen(true);
  };

  const handleDelete = (addon: AddonCatalog) => {
    setSelectedAddon(addon);
    setIsDeleteOpen(true);
  };

  const handleCreate = () => {
    setSelectedAddon(null);
    setIsFormOpen(true);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchAddons();
  };

  const formatPrice = (price: number) => {
    if (price === 0) return 'Free';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Add-on Catalog</h1>
          <p className="text-slate-500 mt-1">Quản lý các gói add-on mà tenant có thể mua thêm</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchAddons} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button className="bg-red-600 hover:bg-red-700" onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Create Add-on
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
              placeholder="Search add-ons..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button type="submit" variant="outline">Search</Button>
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

      {/* Grid */}
      {!isLoading && addons.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {addons.map((addon) => {
            const isQuota = addon.type === 'QUOTA';
            const resource = RESOURCE_TYPES.find((r) => r.value === addon.resourceType);

            return (
              <div
                key={addon.id}
                className={`bg-white rounded-xl shadow-sm border-2 overflow-hidden transition-all hover:shadow-md ${
                  addon.isActive ? 'border-slate-200' : 'border-slate-200 opacity-60'
                }`}
              >
                {/* Type badge header */}
                <div className={`px-4 py-2 text-xs font-semibold flex items-center justify-between ${
                  isQuota ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
                }`}>
                  <span className="flex items-center gap-1.5">
                    {isQuota ? <Hash className="w-3.5 h-3.5" /> : <Zap className="w-3.5 h-3.5" />}
                    {isQuota ? 'QUOTA' : 'FEATURE'}
                    {resource && <span className="ml-1">· {resource.icon} {resource.label}</span>}
                  </span>
                  {!addon.isActive && (
                    <span className="px-1.5 py-0.5 bg-slate-200 text-slate-500 rounded text-[10px]">Inactive</span>
                  )}
                </div>

                <div className="p-5">
                  {/* Name + Code */}
                  <div className="mb-3">
                    <h3 className="font-semibold text-slate-900 text-lg">{addon.name}</h3>
                    <p className="text-xs text-slate-400 font-mono">{addon.code}</p>
                  </div>

                  {addon.description && (
                    <p className="text-sm text-slate-600 mb-4 line-clamp-2">{addon.description}</p>
                  )}

                  {/* Details */}
                  <div className="space-y-2 mb-4">
                    {isQuota && addon.quantityPerUnit && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">Quantity / Unit</span>
                        <span className="font-semibold text-slate-700">+{addon.quantityPerUnit}</span>
                      </div>
                    )}
                    {!isQuota && addon.featureFlag && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">Feature Flag</span>
                        <code className="text-xs bg-slate-100 px-2 py-0.5 rounded font-mono">{addon.featureFlag}</code>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Giá / tháng</span>
                      <span className="font-bold text-emerald-600">{formatPrice(addon.priceMonthly)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-3 border-t border-slate-200">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEdit(addon)}>
                      <Edit className="w-4 h-4 mr-1.5" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleDelete(addon)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty */}
      {!isLoading && addons.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 mb-4">Chưa có add-on nào</p>
          <Button className="bg-red-600 hover:bg-red-700" onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Create First Add-on
          </Button>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setCurrentPage((p) => p - 1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-slate-600 px-2">
            Page {currentPage} of {totalPages}
          </span>
          <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setCurrentPage((p) => p + 1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Modals */}
      <AddonFormModal
        isOpen={isFormOpen}
        addon={selectedAddon}
        onClose={() => { setIsFormOpen(false); setSelectedAddon(null); }}
        onSuccess={fetchAddons}
      />
      <DeleteAddonModal
        isOpen={isDeleteOpen}
        addon={selectedAddon}
        onClose={() => { setIsDeleteOpen(false); setSelectedAddon(null); }}
        onSuccess={fetchAddons}
      />
    </div>
  );
}
