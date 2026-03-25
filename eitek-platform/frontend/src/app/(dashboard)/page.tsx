'use client';

import React, { useEffect, useMemo, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { LoadingSpinner } from '@/shared/components/ui/LoadingSpinner';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { useAuthGuard } from '@/features/auth/hooks/useAuthGuard';
import { ROLE_HIERARCHY, UserRoleType } from '@/features/auth/hooks/useRoleGuard';
import { useProjectStore } from '@/features/projects/stores/projectStore';
import { useDeviceStore } from '@/features/devices/stores/deviceStore';
import { formatDistanceToNow } from '@/shared/utils/date';
import { tenantAddonService } from '@/features/addons/services/addonService';
import type { TenantQuotaInfo } from '@/shared/types';

// ─── Icons (inline SVG for zero-dependency) ─────────────────────────────────

const Icons = {
  folder: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
    </svg>
  ),
  cpu: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 0 0 2.25-2.25V6.75a2.25 2.25 0 0 0-2.25-2.25H6.75A2.25 2.25 0 0 0 4.5 6.75v10.5a2.25 2.25 0 0 0 2.25 2.25Zm.75-12h9v9h-9v-9Z" />
    </svg>
  ),
  signal: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.348 14.652a3.75 3.75 0 0 1 0-5.304m5.304 0a3.75 3.75 0 0 1 0 5.304m-7.425 2.121a6.75 6.75 0 0 1 0-9.546m9.546 0a6.75 6.75 0 0 1 0 9.546M5.106 18.894c-3.808-3.807-3.808-9.98 0-13.788m13.788 0c3.808 3.807 3.808 9.98 0 13.788M12 12h.008v.008H12V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
    </svg>
  ),
  bell: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
    </svg>
  ),
  plus: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  ),
  arrowRight: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
    </svg>
  ),
  layout: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
    </svg>
  ),
  trendUp: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
    </svg>
  ),
  clock: (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  ),
  star: (
    <svg className="w-3.5 h-3.5 fill-amber-400 text-amber-400" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
    </svg>
  ),
};

// ─── Stat Card ───────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  accent: string; // tailwind color class, e.g. "blue"
  subtitle?: string;
  subtitleColor?: string;
  trend?: number; // percentage change
}

function StatCard({ label, value, icon, accent, subtitle, subtitleColor, trend }: StatCardProps) {
  const bgMap: Record<string, string> = {
    blue: 'bg-blue-50 dark:bg-blue-950/40',
    green: 'bg-emerald-50 dark:bg-emerald-950/40',
    cyan: 'bg-cyan-50 dark:bg-cyan-950/40',
    red: 'bg-red-50 dark:bg-red-950/40',
    amber: 'bg-amber-50 dark:bg-amber-950/40',
    gray: 'bg-gray-50 dark:bg-gray-800/40',
  };
  const iconBgMap: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/60 dark:text-blue-400',
    green: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/60 dark:text-emerald-400',
    cyan: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/60 dark:text-cyan-400',
    red: 'bg-red-100 text-red-600 dark:bg-red-900/60 dark:text-red-400',
    amber: 'bg-amber-100 text-amber-600 dark:bg-amber-900/60 dark:text-amber-400',
    gray: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
  };
  const borderMap: Record<string, string> = {
    blue: 'border-blue-200/60 dark:border-blue-800/40',
    green: 'border-emerald-200/60 dark:border-emerald-800/40',
    cyan: 'border-cyan-200/60 dark:border-cyan-800/40',
    red: 'border-red-200/60 dark:border-red-800/40',
    amber: 'border-amber-200/60 dark:border-amber-800/40',
    gray: 'border-gray-200/60 dark:border-gray-700/40',
  };
  return (
    <Card className={`relative overflow-hidden border ${borderMap[accent] ?? ''} ${bgMap[accent] ?? ''}`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            {subtitle && (
              <p className={`text-xs font-medium ${subtitleColor ?? 'text-muted-foreground'}`}>{subtitle}</p>
            )}
            {trend !== undefined && (
              <div className={`flex items-center gap-1 text-xs font-medium ${trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                {Icons.trendUp}
                <span>{trend >= 0 ? '+' : ''}{trend}%</span>
              </div>
            )}
          </div>
          <div className={`p-2.5 rounded-xl ${iconBgMap[accent] ?? ''}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Device Health Ring ──────────────────────────────────────────────────────

function HealthRing({ online, total }: { online: number; total: number }) {
  const pct = total > 0 ? Math.round((online / total) * 100) : 0;
  const r = 36;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;

  return (
    <div className="relative flex items-center justify-center">
      <svg width={88} height={88} className="-rotate-90">
        <circle cx={44} cy={44} r={r} fill="none" stroke="currentColor" className="text-muted/30" strokeWidth={7} />
        <circle
          cx={44} cy={44} r={r} fill="none"
          stroke="url(#healthGrad)"
          strokeWidth={7}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
        <defs>
          <linearGradient id="healthGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute text-center">
        <span className="text-lg font-bold">{pct}%</span>
      </div>
    </div>
  );
}

// ─── Main Dashboard ──────────────────────────────────────────────────────────

// ─── Usage Bar ───────────────────────────────────────────────────────────────

function UsageBar({ label, icon, used, limit, addon }: {
  label: string;
  icon: string;
  used: number;
  limit: number | null;
  addon: number;
}) {
  const effective = limit;
  const pct = effective != null && effective > 0 ? Math.min(100, Math.round((used / effective) * 100)) : 0;
  const isWarning = pct >= 80 && pct < 95;
  const isDanger = pct >= 95;

  const barColor = isDanger
    ? 'bg-red-500'
    : isWarning
    ? 'bg-amber-500'
    : 'bg-blue-500';

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 text-muted-foreground font-medium">
          <span>{icon}</span>
          {label}
        </span>
        <span className="font-semibold tabular-nums">
          {used} / {effective != null ? effective : '∞'}
          {addon > 0 && (
            <span className="text-emerald-600 dark:text-emerald-400 ml-1 text-[10px]">+{addon}</span>
          )}
        </span>
      </div>
      {effective != null ? (
        <div className="h-2 rounded-full bg-muted/50 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      ) : (
        <div className="h-2 rounded-full bg-emerald-100 dark:bg-emerald-950/30" />
      )}
    </div>
  );
}

// ─── Quota Card ──────────────────────────────────────────────────────────────

function QuotaCard({ quota }: { quota: TenantQuotaInfo }) {
  const allFeatures = [...quota.features, ...quota.addonFeatures];

  return (
    <Card className="border border-blue-200/60 dark:border-blue-800/40 bg-gradient-to-r from-blue-50/50 to-white dark:from-blue-950/20 dark:to-background">
      <CardContent className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/60 dark:text-blue-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Gói dịch vụ</p>
              <p className="text-lg font-bold text-blue-700 dark:text-blue-400">{quota.profileName}</p>
            </div>
          </div>

          {quota.addons.length > 0 && (
            <span className="text-xs font-medium px-2 py-1 rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
              {quota.addons.length} add-on{quota.addons.length > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Usage Bars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <UsageBar label="Users" icon="👥" used={quota.usage.users} limit={quota.effectiveLimits.maxUsers} addon={quota.addonExtras.users} />
          <UsageBar label="Thiết bị" icon="📟" used={quota.usage.devices} limit={quota.effectiveLimits.maxDevices} addon={quota.addonExtras.devices} />
          <UsageBar label="Dự án" icon="📁" used={quota.usage.projects} limit={quota.effectiveLimits.maxProjects} addon={quota.addonExtras.projects} />
          <UsageBar label="Dashboard" icon="📊" used={quota.usage.dashboards} limit={quota.effectiveLimits.maxDashboards} addon={quota.addonExtras.dashboards} />
        </div>

        {/* Features */}
        {allFeatures.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {allFeatures.map((f) => (
              <span
                key={f}
                className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-100/60 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
              >
                ✓ {f}
              </span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const DashboardPage: React.FC = () => {
  const router = useRouter();
  const { user } = useAuthStore();
  const { isReady, isAuthenticated } = useAuthGuard();
  const {
    recentProjects,
    favoriteProjects,
    fetchRecentProjects,
    fetchFavorites,
    loading: projectLoading,
  } = useProjectStore();
  const {
    devices,
    pagination,
    fetchDevices,
    loading: deviceLoading,
  } = useDeviceStore();

  const [quota, setQuota] = useState<TenantQuotaInfo | null>(null);

  useEffect(() => {
    // Only fetch data when auth is ready and authenticated
    if (!isReady || !isAuthenticated) {
      return;
    }
    fetchRecentProjects();
    fetchFavorites();
    fetchDevices({ pageSize: 10 });
    tenantAddonService.getMyQuota().then(setQuota).catch(() => {});
  }, [isReady, isAuthenticated, fetchRecentProjects, fetchFavorites, fetchDevices]);

  const stats = useMemo(() => {
    const totalDevices = pagination.totalElements;
    const onlineDevices = devices.filter((d) => d.isOnline).length;
    const offlineDevices = devices.filter((d) => !d.isOnline && d.isActive).length;
    return {
      totalProjects: recentProjects.length + favoriteProjects.length,
      totalDevices,
      onlineDevices,
      offlineDevices,
      activeAlarms: 0,
    };
  }, [recentProjects, favoriteProjects, devices, pagination]);

  const userRole = (user?.role as UserRoleType) || 'VIEWER';
  const roleLevel = ROLE_HIERARCHY[userRole] ?? 0;
  const canCreate = roleLevel >= ROLE_HIERARCHY.PROJECT_MANAGER;   // PM+
  const canManageTemplates = roleLevel >= ROLE_HIERARCHY.TENANT_ADMIN; // TA+
  const canOperate = roleLevel >= ROLE_HIERARCHY.OPERATOR;         // Operator+

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const roleSubtitle = useMemo(() => {
    switch (userRole) {
      case 'TENANT_ADMIN': return 'Full access — manage users, devices, projects, and SCADA views.';
      case 'PROJECT_MANAGER': return 'Manage projects, sites, areas, and devices.';
      case 'OPERATOR': return 'Monitor devices, send commands, and manage alarms.';
      case 'VIEWER': return 'View dashboards, devices, and project data.';
      default: return 'Monitor your IoT infrastructure from one place.';
    }
  }, [userRole]);

  const navigate = useCallback((path: string) => () => router.push(path), [router]);

  // Show loading while auth hydration is pending or data is loading
  const isLoading = !isReady || projectLoading || deviceLoading;

  // If auth is ready but not authenticated, show minimal loading while redirecting
  if (isReady && !isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-80px)]">
        <div className="text-center space-y-3">
          <LoadingSpinner size="lg" />
          <p className="text-sm text-muted-foreground animate-pulse">Redirecting to login…</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-80px)]">
        <div className="text-center space-y-3">
          <LoadingSpinner size="lg" />
          <p className="text-sm text-muted-foreground animate-pulse">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">

      {/* ── Hero Header ─────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-6 md:p-8 text-white">
        {/* Decorative grid pattern */}
        <div className="absolute inset-0 opacity-[0.07]" style={{
          backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }} />
        {/* Glow */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-cyan-500/15 rounded-full blur-3xl" />

        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <p className="text-blue-300 text-sm font-medium">{greeting},</p>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              {user?.firstName || 'User'} {user?.lastName || ''}
            </h1>
            <p className="text-slate-400 text-sm max-w-md">
              {roleSubtitle}
            </p>
          </div>
          {canCreate && (
            <div className="flex items-center gap-3">
              <Button
                size="sm"
                onClick={navigate('/projects')}
                className="bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm"
              >
                {Icons.plus}
                <span className="ml-1.5">New Project</span>
              </Button>
              <Button
                size="sm"
                onClick={navigate('/scada/new')}
                className="bg-blue-500 hover:bg-blue-600 text-white border-0"
              >
                {Icons.layout}
                <span className="ml-1.5">New SCADA</span>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* ── KPI Cards ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Projects"
          value={stats.totalProjects}
          icon={Icons.folder}
          accent="blue"
          subtitle={`${favoriteProjects.length} favorites`}
        />
        <StatCard
          label="Total Devices"
          value={stats.totalDevices}
          icon={Icons.cpu}
          accent="cyan"
        />
        <StatCard
          label="Online"
          value={stats.onlineDevices}
          icon={Icons.signal}
          accent="green"
          subtitle={stats.totalDevices > 0 ? `${Math.round((stats.onlineDevices / stats.totalDevices) * 100)}% connectivity` : 'No devices'}
          subtitleColor="text-emerald-600 dark:text-emerald-400"
        />
        <StatCard
          label="Alarms"
          value={stats.activeAlarms}
          icon={Icons.bell}
          accent={stats.activeAlarms > 0 ? 'red' : 'gray'}
          subtitle={stats.activeAlarms === 0 ? 'All systems normal' : `${stats.activeAlarms} active`}
          subtitleColor={stats.activeAlarms === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}
        />
      </div>

      {/* ── Tenant Quota & Plan Info ───────────────────────────────── */}
      {quota ? (
        <QuotaCard quota={quota} />
      ) : user?.tenant?.profile && (
        <Card className="border border-blue-200/60 dark:border-blue-800/40 bg-gradient-to-r from-blue-50/50 to-white dark:from-blue-950/20 dark:to-background">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/60 dark:text-blue-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Gói dịch vụ</p>
                <p className="text-lg font-bold text-blue-700 dark:text-blue-400">{user.tenant.profile.name}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Main grid ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Device health ring + breakdown ─────────────────────── */}
        <Card className="lg:col-span-1">
          <CardContent className="p-5 space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Device Health</h2>
            <div className="flex items-center justify-center py-2">
              <HealthRing online={stats.onlineDevices} total={stats.totalDevices} />
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 p-2">
                <p className="text-lg font-bold text-emerald-600">{stats.onlineDevices}</p>
                <p className="text-muted-foreground">Online</p>
              </div>
              <div className="rounded-lg bg-red-50 dark:bg-red-950/30 p-2">
                <p className="text-lg font-bold text-red-500">{stats.offlineDevices}</p>
                <p className="text-muted-foreground">Offline</p>
              </div>
              <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 p-2">
                <p className="text-lg font-bold text-amber-600">{devices.filter((d) => !d.isActive).length}</p>
                <p className="text-muted-foreground">Inactive</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={navigate('/devices')}
            >
              View all devices
              <span className="ml-auto">{Icons.arrowRight}</span>
            </Button>
          </CardContent>
        </Card>

        {/* ── Recent Projects ────────────────────────────────────── */}
        <Card className="lg:col-span-2">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Recent Projects</h2>
              <Button variant="ghost" size="sm" onClick={navigate('/projects')} className="text-xs gap-1">
                View all {Icons.arrowRight}
              </Button>
            </div>

            {recentProjects.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                  {Icons.folder}
                </div>
                <p className="text-sm text-muted-foreground">No projects yet. Create your first project to get started.</p>
                <Button size="sm" onClick={navigate('/projects')}>{Icons.plus}<span className="ml-1.5">Create Project</span></Button>
              </div>
            ) : (
              <div className="space-y-2">
                {recentProjects.slice(0, 5).map((project) => (
                  <div
                    key={project.id}
                    onClick={navigate(`/projects/${project.id}`)}
                    className="flex items-center gap-3 p-3 rounded-xl border border-transparent hover:border-border hover:bg-accent/50 transition-all cursor-pointer group"
                  >
                    {/* Color accent bar */}
                    <div className={`w-1 h-10 rounded-full shrink-0 ${
                      project.status === 'Active' ? 'bg-emerald-500' :
                      project.status === 'Inactive' ? 'bg-gray-300 dark:bg-gray-600' :
                      'bg-amber-400'
                    }`} />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
                          {project.name}
                        </p>
                        {favoriteProjects.some((f) => f.id === project.id) && Icons.star}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {project.deviceCount ?? 0} devices · {project.dashboardCount ?? 0} dashboards
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide ${
                        project.status === 'Active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' :
                        project.status === 'Inactive' ? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' :
                        'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
                      }`}>
                        {project.status || 'Active'}
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        {Icons.clock}
                        <span>{formatDistanceToNow(new Date(project.updatedTime || Date.now()))}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Devices + Quick Actions row ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Device List ────────────────────────────────────────── */}
        <Card className="lg:col-span-2">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Device Monitor</h2>
              <Button variant="ghost" size="sm" onClick={navigate('/devices')} className="text-xs gap-1">
                View all {Icons.arrowRight}
              </Button>
            </div>

            {devices.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                  {Icons.cpu}
                </div>
                <p className="text-sm text-muted-foreground">No devices registered. Add your first IoT device.</p>
                <Button size="sm" onClick={navigate('/devices')}>{Icons.plus}<span className="ml-1.5">Add Device</span></Button>
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="text-left py-2.5 px-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Device</th>
                      <th className="text-left py-2.5 px-3 font-medium text-muted-foreground text-xs uppercase tracking-wider hidden md:table-cell">Type</th>
                      <th className="text-left py-2.5 px-3 font-medium text-muted-foreground text-xs uppercase tracking-wider hidden sm:table-cell">Area</th>
                      <th className="text-center py-2.5 px-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Status</th>
                      <th className="text-right py-2.5 px-3 font-medium text-muted-foreground text-xs uppercase tracking-wider hidden md:table-cell">Last Seen</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {devices.slice(0, 6).map((device) => (
                      <tr
                        key={device.id}
                        className="hover:bg-accent/30 transition-colors cursor-pointer"
                        onClick={navigate(`/devices`)}
                      >
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full shrink-0 ${
                              device.isOnline ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]' :
                              !device.isActive ? 'bg-amber-400' :
                              'bg-red-500'
                            }`} />
                            <span className="font-medium truncate">{device.name}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-muted-foreground hidden md:table-cell">
                          {device.deviceType?.name || device.deviceType?.category || '—'}
                        </td>
                        <td className="py-2.5 px-3 text-muted-foreground hidden sm:table-cell">
                          {device.area?.name || '—'}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide ${
                            device.isOnline
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                              : !device.isActive
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
                              : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
                          }`}>
                            {device.isOnline ? 'Online' : !device.isActive ? 'Inactive' : 'Offline'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-xs text-muted-foreground text-right hidden md:table-cell">
                          {device.lastSeen ? formatDistanceToNow(new Date(device.lastSeen)) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Quick Actions ──────────────────────────────────────── */}
        <Card className="lg:col-span-1">
          <CardContent className="p-5 space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-1">Quick Actions</h2>

            {/* View projects — all roles */}
            <button
              onClick={navigate('/projects')}
              className="w-full flex items-center gap-3 p-3 rounded-xl border border-dashed border-blue-300 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20 hover:bg-blue-100/70 dark:hover:bg-blue-950/40 transition-colors text-left group"
            >
              <div className="p-2 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/60 dark:text-blue-400 group-hover:scale-110 transition-transform">
                {Icons.folder}
              </div>
              <div>
                <p className="text-sm font-semibold">{canCreate ? 'Create Project' : 'View Projects'}</p>
                <p className="text-xs text-muted-foreground">{canCreate ? 'Start a new IoT project' : 'Browse your projects'}</p>
              </div>
            </button>

            {/* Devices — all roles can view, operator+ can operate */}
            <button
              onClick={navigate('/devices')}
              className="w-full flex items-center gap-3 p-3 rounded-xl border border-dashed border-cyan-300 dark:border-cyan-800 bg-cyan-50/50 dark:bg-cyan-950/20 hover:bg-cyan-100/70 dark:hover:bg-cyan-950/40 transition-colors text-left group"
            >
              <div className="p-2 rounded-lg bg-cyan-100 text-cyan-600 dark:bg-cyan-900/60 dark:text-cyan-400 group-hover:scale-110 transition-transform">
                {Icons.cpu}
              </div>
              <div>
                <p className="text-sm font-semibold">{canCreate ? 'Add Device' : canOperate ? 'Manage Devices' : 'View Devices'}</p>
                <p className="text-xs text-muted-foreground">{canCreate ? 'Register an IoT device' : 'Monitor device status'}</p>
              </div>
            </button>

            {/* SCADA — PM+ can create */}
            {canCreate && (
              <button
                onClick={navigate('/scada/new')}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-dashed border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 hover:bg-emerald-100/70 dark:hover:bg-emerald-950/40 transition-colors text-left group"
              >
                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/60 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                  {Icons.layout}
                </div>
                <div>
                  <p className="text-sm font-semibold">New SCADA Dashboard</p>
                  <p className="text-xs text-muted-foreground">Build a monitoring screen</p>
                </div>
              </button>
            )}

            {/* Templates — TA+ only */}
            {canManageTemplates && (
              <button
                onClick={navigate('/templates')}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-dashed border-purple-300 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/20 hover:bg-purple-100/70 dark:hover:bg-purple-950/40 transition-colors text-left group"
              >
                <div className="p-2 rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-900/60 dark:text-purple-400 group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.098 19.902a3.75 3.75 0 0 0 5.304 0l6.401-6.402M6.75 21A3.75 3.75 0 0 1 3 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125V6.75c0 .621.504 1.125 1.125 1.125H14.25c.621 0 1.125.504 1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125h2.625c.621 0 1.125.504 1.125 1.125v5.25A3.75 3.75 0 0 1 17.25 21H6.75Z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold">Templates</p>
                  <p className="text-xs text-muted-foreground">Manage widget & device templates</p>
                </div>
              </button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Footer info ─────────────────────────────────────────────── */}
      <div className="flex flex-col items-center justify-center text-xs text-muted-foreground pt-2 pb-4 gap-0.5">
        <span className="font-medium text-gray-600">EITEK IoT Platform v1.0</span>
        <span>© {new Date().getFullYear()} EITEK Corporation. All rights reserved.</span>
      </div>
    </div>
  );
};

export default DashboardPage;