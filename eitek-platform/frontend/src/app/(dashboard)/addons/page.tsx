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
  Lock,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { Card, CardContent } from '@/shared/components/ui/Card';
import {
  addonCatalogService,
  tenantAddonService,
} from '@/features/addons/services/addonService';
import type { AddonCatalog, TenantQuotaInfo } from '@/shared/types';

// ==================== CONSTANTS ====================

const RESOURCE_LABELS: Record<string, { label: string; icon: string }> = {
  DEVICES: { label: 'Thiết bị', icon: '📟' },
  USERS: { label: 'Users', icon: '👥' },
  PROJECTS: { label: 'Dự án', icon: '📁' },
  DASHBOARDS: { label: 'Dashboard', icon: '📊' },
  API_CALLS: { label: 'API Calls', icon: '⚡' },
  STORAGE: { label: 'Storage', icon: '💾' },
};

// ==================== USAGE BAR ====================

function UsageBar({ label, icon, used, limit, addon }: {
  label: string;
  icon: string;
  used: number;
  limit: number | null;
  addon: number;
}) {
  const pct = limit != null && limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const barColor = pct >= 95 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-blue-500';

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1 text-slate-500 font-medium">
          <span>{icon}</span> {label}
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
      const [quotaRes, catalogRes] = await Promise.all([
        tenantAddonService.getMyQuota(),
        addonCatalogService.getActive(),
      ]);
      setQuota(quotaRes);
      setCatalog(catalogRes);
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

  const isEligible = quota?.addonEligible ?? false;
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
              <UsageBar label="Users" icon="👥" used={quota.usage.users} limit={quota.effectiveLimits.maxUsers} addon={quota.addonExtras.users} />
              <UsageBar label="Thiết bị" icon="📟" used={quota.usage.devices} limit={quota.effectiveLimits.maxDevices} addon={quota.addonExtras.devices} />
              <UsageBar label="Dự án" icon="📁" used={quota.usage.projects} limit={quota.effectiveLimits.maxProjects} addon={quota.addonExtras.projects} />
              <UsageBar label="Dashboard" icon="📊" used={quota.usage.dashboards} limit={quota.effectiveLimits.maxDashboards} addon={quota.addonExtras.dashboards} />
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

      {/* Not eligible warning */}
      {!isEligible && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800">
          <Lock className="w-5 h-5 shrink-0" />
          <div>
            <p className="font-medium">Gói hiện tại không hỗ trợ add-on</p>
            <p className="text-sm text-amber-700 mt-0.5">
              Vui lòng nâng cấp gói dịch vụ để có thể mua thêm tài nguyên và tính năng.
            </p>
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
                      <p className="text-purple-600">
                        ✓ <code className="bg-purple-50 px-1 rounded text-xs">{ta.addon.featureFlag}</code>
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
      {isEligible && (
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-3">
            {availableAddons.length > 0 ? 'Mua thêm' : 'Tất cả add-on đã được kích hoạt'}
          </h2>

          {availableAddons.length > 0 ? (
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
          ) : myAddons.length > 0 ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center">
              <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-emerald-700 font-medium">Bạn đã kích hoạt tất cả add-on có sẵn!</p>
            </div>
          ) : null}
        </div>
      )}

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
