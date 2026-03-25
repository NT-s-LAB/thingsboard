'use client';

import { useEffect, useState } from 'react';
import { tenantAddonService } from '@/features/addons/services/addonService';
import type { TenantQuotaInfo } from '@/shared/types';

type QuotaResource = 'devices' | 'users' | 'projects' | 'dashboards';

interface QuotaState {
  quota: TenantQuotaInfo | null;
  loading: boolean;
  /** Whether the given resource has reached its limit */
  isAtLimit: (resource: QuotaResource) => boolean;
  /** e.g. "5 / 10" */
  usageText: (resource: QuotaResource) => string;
  /** Current count for resource */
  current: (resource: QuotaResource) => number;
  /** Max allowed for resource (null = unlimited) */
  max: (resource: QuotaResource) => number | null;
  /** Refresh quota data */
  refresh: () => void;
}

export function useQuota(): QuotaState {
  const [quota, setQuota] = useState<TenantQuotaInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    tenantAddonService
      .getMyQuota()
      .then(setQuota)
      .catch(() => setQuota(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const getUsage = (resource: QuotaResource) => quota?.usage[resource] ?? 0;

  const getMax = (resource: QuotaResource): number | null => {
    if (!quota) return null;
    const key = `max${resource.charAt(0).toUpperCase()}${resource.slice(1)}` as keyof typeof quota.effectiveLimits;
    return quota.effectiveLimits[key] ?? null;
  };

  return {
    quota,
    loading,
    isAtLimit: (resource) => {
      const m = getMax(resource);
      if (m === null) return false; // unlimited
      return getUsage(resource) >= m;
    },
    usageText: (resource) => {
      const m = getMax(resource);
      return `${getUsage(resource)} / ${m === null ? '∞' : m}`;
    },
    current: getUsage,
    max: getMax,
    refresh: load,
  };
}
