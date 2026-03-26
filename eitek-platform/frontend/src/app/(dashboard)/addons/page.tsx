'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Package,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Hash,
  Zap,
  X,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { Card, CardContent } from '@/shared/components/ui/Card';
import {
  addonCatalogService,
  tenantAddonService,
} from '@/features/addons/services/addonService';
import { tenantProfileService, type TenantProfile } from '@/features/admin/services/tenantProfileService';
import type { AddonCatalog, TenantQuotaInfo } from '@/shared/types';
import { Crown, Users, Monitor, FolderOpen, LayoutDashboard, Star } from 'lucide-react';

// ==================== CONSTANTS ====================

const RESOURCE_LABELS: Record<string, { label: string; icon: React.ReactNode }> = {
  DEVICES: { label: 'Thiết bị', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 0 0 2.25-2.25V6.75a2.25 2.25 0 0 0-2.25-2.25H6.75A2.25 2.25 0 0 0 4.5 6.75v10.5a2.25 2.25 0 0 0 2.25 2.25Zm.75-12h9v9h-9v-9Z" /></svg> },
  USERS: { label: 'Users', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" /></svg> },
  PROJECTS: { label: 'Dự án', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v8.25m19.5 0v.75A2.25 2.25 0 0 1 19.5 17.25h-15A2.25 2.25 0 0 1 2.25 15.75v-.75m19.5 0h-19.5" /></svg> },
  DASHBOARDS: { label: 'Dashboard', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" /></svg> },
  API_CALLS: { label: 'API Calls', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" /></svg> },
  STORAGE: { label: 'Storage', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" /></svg> },
};

// ==================== USAGE BAR ====================

function UsageBar({ label, icon, used, limit, addon }: {
  label: string;
  icon: React.ReactNode;
  used: number;
  limit: number | null;
  addon: number;
}) {
  const pct = limit != null && limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const barColor = pct >= 95 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-blue-500';

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 text-slate-500 font-medium">
          <span className="w-3.5 h-3.5 flex items-center justify-center">{icon}</span> {label}
        </span>
        <span className="font-semibold text-slate-700 tabular-nums">
          {used} / {limit != null ? limit : '∞'}
          {addon > 0 && <span className="text-emerald-600 ml-1 text-[10px]">+{addon}</span>}
        </span>
      </div>
      {limit != null ? (
        <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${pct}%` }} />
        </div>
      ) : (
        <div className="h-1.5 rounded-full bg-emerald-100" />
      )}
    </div>
  );
}

// ==================== PURCHASE MODAL ====================

interface PurchaseModalProps {
  isOpen: boolean;
  addon: AddonCatalog | null;
  onClose: () => void;
  onSuccess: () => void;
}

function PurchaseModal({ isOpen, addon, onClose, onSuccess }: PurchaseModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setQuantity(1);
    setNote('');
    setError(null);
  }, [addon, isOpen]);

  const handleSubmit = async () => {
    if (!addon) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await tenantAddonService.purchase(addon.id, quantity, note || undefined);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to purchase add-on');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !addon) return null;
  const isQuota = addon.type === 'QUOTA';
  const total = addon.priceMonthly * quantity;
  const resource = addon.resourceType ? RESOURCE_LABELS[addon.resourceType] : null;

  const formatPrice = (price: number) => {
    if (price === 0) return 'Miễn phí';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-semibold text-slate-900">Mua Add-on</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Addon info */}
          <div className="p-4 bg-slate-50 rounded-lg">
            <div className="flex items-start gap-3">
              <div className={`p-2.5 rounded-lg ${isQuota ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                {isQuota ? <Hash className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">{addon.name}</h3>
                {addon.description && <p className="text-sm text-slate-500 mt-0.5">{addon.description}</p>}
                {isQuota && addon.quantityPerUnit && resource && (
                  <p className="text-sm text-blue-600 mt-1">
                    +{addon.quantityPerUnit} {resource.icon} {resource.label} / unit
                  </p>
                )}
                {!isQuota && addon.featureFlag && (
                  <p className="text-sm text-purple-600 mt-1">
                    Unlock: <code className="bg-purple-50 px-1 rounded">{addon.featureFlag}</code>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Quantity */}
          {isQuota && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Số lượng</label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2 rounded-lg border border-slate-300 hover:bg-slate-50 transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-xl font-bold text-slate-900 w-12 text-center">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-2 rounded-lg border border-slate-300 hover:bg-slate-50 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {addon.quantityPerUnit && resource && (
                <p className="text-xs text-slate-500 mt-1.5">
                  Tổng: +{addon.quantityPerUnit * quantity} {resource.label}
                </p>
              )}
            </div>
          )}

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Ghi chú (tùy chọn)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ghi chú..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              rows={2}
            />
          </div>

          {/* Total */}
          <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg border border-emerald-200">
            <span className="text-sm font-medium text-slate-700">Tổng / tháng</span>
            <span className="text-lg font-bold text-emerald-700">{formatPrice(total)}</span>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting} className="flex-1">
              Hủy
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting} className="flex-1 bg-blue-600 hover:bg-blue-700">
              {isSubmitting ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Đang xử lý...</>
              ) : (
                <><ShoppingCart className="w-4 h-4 mr-2" />Mua ngay</>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== MAIN PAGE ====================

export default function AddonsStorePage() {
  const [quota, setQuota] = useState<TenantQuotaInfo | null>(null);
  const [catalog, setCatalog] = useState<AddonCatalog[]>([]);
  const [commercialProfiles, setCommercialProfiles] = useState<TenantProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Purchase modal
  const [purchaseAddon, setPurchaseAddon] = useState<AddonCatalog | null>(null);

  // Remove loading
  const [removingId, setRemovingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [quotaRes, catalogRes, profilesRes] = await Promise.all([
        tenantAddonService.getMyQuota(),
        addonCatalogService.getActive(),
        tenantProfileService.getCommercialProfiles(),
      ]);
      setQuota(quotaRes);
      setCatalog(catalogRes);
      setCommercialProfiles(profilesRes);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRemoveAddon = async (tenantAddonId: string) => {
    if (!confirm('Bạn có chắc muốn xóa add-on này?')) return;
    setRemovingId(tenantAddonId);
    try {
      await tenantAddonService.removeAddon(tenantAddonId);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Không thể xóa add-on');
    } finally {
      setRemovingId(null);
    }
  };

  const formatPrice = (price: number) => {
    if (price === 0) return 'Miễn phí';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <AlertTriangle className="w-5 h-5" />
          {error}
          <Button variant="outline" size="sm" className="ml-auto" onClick={fetchData}>
            <RefreshCw className="w-4 h-4 mr-1" /> Retry
          </Button>
        </div>
      </div>
    );
  }

  const myAddons = quota?.addons ?? [];

  // Addons not yet purchased
  const purchasedIds = new Set(myAddons.map((a) => a.addonId));
  const availableAddons = catalog.filter((a) => !purchasedIds.has(a.id));

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Add-ons</h1>
          <p className="text-slate-500 mt-1">
            Mua thêm thiết bị, tài nguyên hoặc tính năng cho gói <strong>{quota?.profileName}</strong>
          </p>
        </div>
        <Button variant="outline" onClick={fetchData}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Current Quota Summary */}
      {quota && (
        <Card className="border border-blue-200/60 bg-gradient-to-r from-blue-50/50 to-white">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-100 text-blue-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Gói hiện tại</p>
                <p className="text-lg font-bold text-blue-700">{quota.profileName}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <UsageBar label="Users" icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" /></svg>} used={quota.usage.users} limit={quota.effectiveLimits.maxUsers} addon={quota.addonExtras.users} />
              <UsageBar label="Thiết bị" icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 0 0 2.25-2.25V6.75a2.25 2.25 0 0 0-2.25-2.25H6.75A2.25 2.25 0 0 0 4.5 6.75v10.5a2.25 2.25 0 0 0 2.25 2.25Zm.75-12h9v9h-9v-9Z" /></svg>} used={quota.usage.devices} limit={quota.effectiveLimits.maxDevices} addon={quota.addonExtras.devices} />
              <UsageBar label="Dự án" icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v8.25m19.5 0v.75A2.25 2.25 0 0 1 19.5 17.25h-15A2.25 2.25 0 0 1 2.25 15.75v-.75m19.5 0h-19.5" /></svg>} used={quota.usage.projects} limit={quota.effectiveLimits.maxProjects} addon={quota.addonExtras.projects} />
              <UsageBar label="Dashboard" icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" /></svg>} used={quota.usage.dashboards} limit={quota.effectiveLimits.maxDashboards} addon={quota.addonExtras.dashboards} />
            </div>
            {(quota.features.length > 0 || quota.addonFeatures.length > 0) && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {quota.features.map((f) => (
                  <span key={f} className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-100/60 text-blue-700">
                    <CheckCircle className="w-3 h-3" /> {f}
                  </span>
                ))}
                {quota.addonFeatures.map((f) => (
                  <span key={f} className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-purple-100/60 text-purple-700">
                    <Zap className="w-3 h-3" /> {f}
                  </span>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Commercial Profiles / Upgrade Plans */}
      {commercialProfiles.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Crown className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-semibold text-slate-900">Gói dịch vụ</h2>
          </div>
          <p className="text-sm text-slate-500 mb-4">
            Nâng cấp gói dịch vụ để mở rộng tài nguyên và tính năng cho tổ chức của bạn.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {commercialProfiles.map((profile) => {
              const isCurrent = quota?.profileName === profile.name;
              const isFree = profile.price === 0;

              return (
                <div
                  key={profile.id}
                  className={`relative bg-white rounded-xl border-2 p-5 transition-all ${
                    isCurrent
                      ? 'border-blue-400 shadow-md ring-1 ring-blue-200'
                      : 'border-slate-200 hover:border-amber-300 hover:shadow-sm'
                  }`}
                >
                  {isCurrent && (
                    <span className="absolute -top-2.5 left-4 inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white">
                      <Star className="w-3 h-3" /> Gói hiện tại
                    </span>
                  )}

                  {/* Header */}
                  <div className="mb-3 pt-1">
                    <h3 className="font-bold text-slate-900 text-base">{profile.name}</h3>
                    {profile.description && (
                      <p className="text-sm text-slate-500 mt-0.5 line-clamp-2">{profile.description}</p>
                    )}
                  </div>

                  {/* Price */}
                  <div className="mb-4">
                    {isFree ? (
                      <span className="text-2xl font-bold text-emerald-600">Miễn phí</span>
                    ) : (
                      <div>
                        <span className="text-2xl font-bold text-slate-900">
                          {new Intl.NumberFormat('vi-VN').format(profile.price)}
                        </span>
                        <span className="text-sm text-slate-500 ml-1">đ/tháng</span>
                      </div>
                    )}
                  </div>

                  {/* Limits */}
                  <div className="space-y-2 text-sm text-slate-600 mb-4">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-slate-400" />
                      <span>{profile.maxUsers} Users</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Monitor className="w-4 h-4 text-slate-400" />
                      <span>{profile.maxDevices} Thiết bị</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FolderOpen className="w-4 h-4 text-slate-400" />
                      <span>{profile.maxProjects} Dự án</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <LayoutDashboard className="w-4 h-4 text-slate-400" />
                      <span>{profile.maxDashboards} Dashboard</span>
                    </div>
                    {profile.maxApiCalls != null && (
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-slate-400" />
                        <span>{profile.maxApiCalls.toLocaleString()} API Calls</span>
                      </div>
                    )}
                  </div>

                  {/* Features */}
                  {profile.features.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {profile.features.map((f) => (
                        <span
                          key={f}
                          className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700"
                        >
                          <CheckCircle className="w-3 h-3" /> {f}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Addon eligible badge */}
                  {profile.addonEligible && (
                    <p className="text-xs text-blue-600 mb-3">
                      <Package className="w-3 h-3 inline mr-1" />
                      Hỗ trợ mua thêm Add-on
                    </p>
                  )}

                  {/* CTA */}
                  {isCurrent ? (
                    <Button variant="outline" size="sm" className="w-full" disabled>
                      Đang sử dụng
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      className="w-full bg-amber-500 hover:bg-amber-600 text-white"
                      onClick={() => window.open(`mailto:support@eitek.vn?subject=Nâng cấp gói ${profile.name}`, '_blank')}
                    >
                      Liên hệ nâng cấp
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* My Addons */}
      {myAddons.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-3">Add-on đã mua</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myAddons.map((ta) => {
              const isQuota = ta.addon.type === 'QUOTA';
              const resource = ta.addon.resourceType ? RESOURCE_LABELS[ta.addon.resourceType] : null;

              return (
                <div key={ta.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2 rounded-lg ${isQuota ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                        {isQuota ? <Hash className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900 text-sm">{ta.addon.name}</h3>
                        <p className="text-xs text-slate-400">{ta.addon.code}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveAddon(ta.id)}
                      disabled={removingId === ta.id}
                      className="text-slate-400 hover:text-red-500 transition-colors p-1"
                      title="Remove"
                    >
                      {removingId === ta.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  <div className="text-sm text-slate-600 space-y-1">
                    {isQuota && ta.addon.quantityPerUnit && resource && (
                      <p>
                        {ta.quantity} unit × +{ta.addon.quantityPerUnit} = <strong>+{ta.quantity * ta.addon.quantityPerUnit} {resource.label}</strong>
                      </p>
                    )}
                    {!isQuota && ta.addon.featureFlag && (
                      <p className="text-purple-600 flex items-center gap-1">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3 h-3 flex-shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
                        <code className="bg-purple-50 px-1 rounded text-xs">{ta.addon.featureFlag}</code>
                      </p>
                    )}
                    <p className="text-emerald-600 font-medium">
                      {formatPrice(ta.addon.priceMonthly * ta.quantity)}/tháng
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Available Add-ons Store */}
      {availableAddons.length > 0 ? (
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-3">Mua thêm</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableAddons.map((addon) => {
                const isQuota = addon.type === 'QUOTA';
                const resource = addon.resourceType ? RESOURCE_LABELS[addon.resourceType] : null;

                return (
                  <div
                    key={addon.id}
                    className="bg-white rounded-xl border-2 border-dashed border-slate-200 hover:border-blue-300 p-5 transition-all hover:shadow-sm group"
                  >
                    {/* Badge */}
                    <div className="flex items-center justify-between mb-3">
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded ${
                        isQuota ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                      }`}>
                        {isQuota ? <Hash className="w-3 h-3" /> : <Zap className="w-3 h-3" />}
                        {isQuota ? 'Quota' : 'Feature'}
                      </span>
                      <span className="text-sm font-bold text-emerald-600">{formatPrice(addon.priceMonthly)}/th</span>
                    </div>

                    <h3 className="font-semibold text-slate-900 mb-1">{addon.name}</h3>
                    {addon.description && <p className="text-sm text-slate-500 mb-3 line-clamp-2">{addon.description}</p>}

                    {isQuota && addon.quantityPerUnit && resource && (
                      <p className="text-sm text-blue-600 mb-3">+{addon.quantityPerUnit} {resource.icon} {resource.label} / unit</p>
                    )}
                    {!isQuota && addon.featureFlag && (
                      <p className="text-sm text-purple-600 mb-3">Unlock: <code className="bg-purple-50 px-1 rounded text-xs">{addon.featureFlag}</code></p>
                    )}

                    <Button
                      size="sm"
                      className="w-full bg-blue-600 hover:bg-blue-700 opacity-80 group-hover:opacity-100 transition-opacity"
                      onClick={() => setPurchaseAddon(addon)}
                    >
                      <ShoppingCart className="w-4 h-4 mr-1.5" />
                      Mua
                    </Button>
                  </div>
                );
              })}
          </div>
        </div>
      ) : myAddons.length > 0 ? (
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-3">Mua thêm</h2>
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center">
            <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="text-emerald-700 font-medium">Bạn đã kích hoạt tất cả add-on có sẵn!</p>
          </div>
        </div>
      ) : null}

      {/* Empty state if nothing at all */}
      {catalog.length === 0 && myAddons.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">Chưa có add-on nào trong hệ thống.</p>
        </div>
      )}

      {/* Purchase Modal */}
      <PurchaseModal
        isOpen={!!purchaseAddon}
        addon={purchaseAddon}
        onClose={() => setPurchaseAddon(null)}
        onSuccess={fetchData}
      />
    </div>
  );
}
