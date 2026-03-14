'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { 
  Building2, 
  Users, 
  Activity, 
  Server,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  XCircle,
  Loader2,
  Shield,
  LayoutDashboard,
  Cpu,
  HardDrive,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { 
  adminService, 
  SystemStats, 
  SystemHealth, 
  RecentActivity,
  HealthStatus,
} from '@/features/admin/services/adminService';

// ==================== COMPONENTS ====================

interface StatCardProps {
  title: string;
  value: string | number;
  subValue?: string;
  change?: string | undefined;
  changeType?: 'positive' | 'negative' | 'neutral' | undefined;
  icon: React.ReactNode;
  color: string;
  isLoading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  subValue,
  change, 
  changeType, 
  icon, 
  color,
  isLoading,
}) => (
  <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <p className="text-sm text-slate-500 font-medium">{title}</p>
        {isLoading ? (
          <div className="flex items-center mt-2">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : (
          <>
            <p className="text-3xl font-bold text-slate-900 mt-2">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
            {subValue && (
              <p className="text-sm text-slate-500 mt-1">{subValue}</p>
            )}
            {change && (
              <p className={`text-sm mt-2 flex items-center ${
                changeType === 'positive' ? 'text-green-600' : 
                changeType === 'negative' ? 'text-red-600' : 'text-slate-500'
              }`}>
                {changeType === 'positive' && <TrendingUp className="w-4 h-4 mr-1" />}
                {changeType === 'negative' && <TrendingDown className="w-4 h-4 mr-1" />}
                {change}
              </p>
            )}
          </>
        )}
      </div>
      <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center flex-shrink-0`}>
        {icon}
      </div>
    </div>
  </div>
);

interface SystemStatusProps {
  name: string;
  status: HealthStatus;
  icon: React.ReactNode;
}

const SystemStatusCard: React.FC<SystemStatusProps> = ({ name, status, icon }) => {
  const statusConfig = {
    healthy: { 
      color: 'text-green-600', 
      bg: 'bg-green-50', 
      border: 'border-green-200',
      StatusIcon: CheckCircle,
      label: 'Healthy',
    },
    degraded: { 
      color: 'text-yellow-600', 
      bg: 'bg-yellow-50', 
      border: 'border-yellow-200',
      StatusIcon: AlertTriangle,
      label: 'Degraded',
    },
    unhealthy: { 
      color: 'text-red-600', 
      bg: 'bg-red-50', 
      border: 'border-red-200',
      StatusIcon: XCircle,
      label: 'Unhealthy',
    },
  };
  
  const config = statusConfig[status.status];
  const { StatusIcon } = config;
  
  return (
    <div className={`flex items-center justify-between p-4 ${config.bg} ${config.border} border rounded-lg`}>
      <div className="flex items-center space-x-3">
        <div className="text-slate-600">{icon}</div>
        <div>
          <p className="font-medium text-slate-900">{name}</p>
          <p className="text-sm text-slate-600">{status.message}</p>
          {status.responseTime !== undefined && (
            <p className="text-xs text-slate-500 mt-0.5">
              Response: {status.responseTime}ms
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <StatusIcon className={`w-5 h-5 ${config.color}`} />
        <span className={`text-sm font-medium ${config.color}`}>{config.label}</span>
      </div>
    </div>
  );
};

interface ActivityItemProps {
  activity: RecentActivity;
}

const ActivityItem: React.FC<ActivityItemProps> = ({ activity }) => {
  const actionColors: Record<string, string> = {
    CREATE: 'bg-green-500',
    UPDATE: 'bg-blue-500',
    DELETE: 'bg-red-500',
    LOGIN: 'bg-purple-500',
    LOGOUT: 'bg-slate-500',
    SYNC: 'bg-orange-500',
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="flex items-start space-x-3 py-3 border-b border-slate-100 last:border-0">
      <div className={`w-2 h-2 ${actionColors[activity.action] || 'bg-slate-400'} rounded-full mt-2 flex-shrink-0`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-900 font-medium truncate">
          {activity.action} - {activity.entity}
        </p>
        <p className="text-sm text-slate-500 truncate">
          {activity.userName || activity.userEmail || 'System'} • {activity.tenantName}
        </p>
      </div>
      <div className="flex items-center text-xs text-slate-400 flex-shrink-0">
        <Clock className="w-3 h-3 mr-1" />
        {formatTime(activity.timestamp)}
      </div>
    </div>
  );
};

// ==================== MAIN COMPONENT ====================

export default function AdminHomePage() {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setIsRefreshing(true);
      }
      setError(null);

      const [statsData, healthData, activitiesData] = await Promise.all([
        adminService.getSystemStats(),
        adminService.getSystemHealth(),
        adminService.getRecentActivity(10),
      ]);

      setStats(statsData);
      setHealth(healthData);
      setActivities(activitiesData);
      setLastUpdated(new Date());
    } catch (err: any) {
      console.error('Failed to fetch admin data:', err);
      setError(err.message || 'Failed to load system data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => fetchData(), 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleRefresh = () => {
    fetchData(true);
  };

  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-red-600 mx-auto mb-4" />
          <p className="text-slate-500">Loading system overview...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !stats) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-red-800">Failed to Load Data</h2>
          <p className="text-sm text-red-600 mt-2">{error}</p>
          <Button 
            onClick={() => fetchData()} 
            className="mt-4 bg-red-600 hover:bg-red-700"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">System Overview</h1>
          <p className="text-slate-500 mt-1">
            Welcome to the EITEK Platform Administration
            {lastUpdated && (
              <span className="text-xs ml-2">
                • Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {/* Overall Health Banner */}
      {health && (
        <div className={`rounded-xl p-4 flex items-center justify-between ${
          health.overall === 'healthy' ? 'bg-green-50 border border-green-200' :
          health.overall === 'degraded' ? 'bg-yellow-50 border border-yellow-200' :
          'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-center space-x-3">
            {health.overall === 'healthy' ? (
              <CheckCircle className="w-6 h-6 text-green-600" />
            ) : health.overall === 'degraded' ? (
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
            ) : (
              <XCircle className="w-6 h-6 text-red-600" />
            )}
            <div>
              <p className={`font-semibold ${
                health.overall === 'healthy' ? 'text-green-800' :
                health.overall === 'degraded' ? 'text-yellow-800' :
                'text-red-800'
              }`}>
                System Status: {health.overall.charAt(0).toUpperCase() + health.overall.slice(1)}
              </p>
              <p className="text-sm text-slate-600">
                Uptime: {formatUptime(health.uptime)} • Memory: {health.system.memory.percentage}% • 
                CPU: {health.system.cpu.usage}%
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-sm text-slate-500">
            <Wifi className="w-4 h-4" />
            <span>Node {health.system.nodeVersion}</span>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Tenants"
          value={stats?.tenants.total || 0}
          subValue={`${stats?.tenants.active || 0} active`}
          change={stats?.tenants.newThisMonth ? `+${stats.tenants.newThisMonth} this month` : undefined}
          changeType={stats?.tenants.newThisMonth ? 'positive' : undefined}
          icon={<Building2 className="w-6 h-6 text-white" />}
          color="bg-blue-600"
          isLoading={isLoading}
        />
        <StatCard
          title="Active Users"
          value={stats?.users.total || 0}
          subValue={`${stats?.users.active || 0} active`}
          change={stats?.users.newThisWeek ? `+${stats.users.newThisWeek} this week` : undefined}
          changeType={stats?.users.newThisWeek ? 'positive' : undefined}
          icon={<Users className="w-6 h-6 text-white" />}
          color="bg-green-600"
          isLoading={isLoading}
        />
        <StatCard
          title="Total Devices"
          value={stats?.devices.total || 0}
          subValue={`${stats?.devices.active || 0} online, ${stats?.devices.offline || 0} offline`}
          change={stats?.devices.newThisMonth ? `+${stats.devices.newThisMonth} this month` : undefined}
          changeType={stats?.devices.newThisMonth ? 'positive' : undefined}
          icon={<Server className="w-6 h-6 text-white" />}
          color="bg-purple-600"
          isLoading={isLoading}
        />
        <StatCard
          title="SCADA Dashboards"
          value={stats?.scadaViews.total || 0}
          subValue={`${stats?.projects.total || 0} projects`}
          icon={<LayoutDashboard className="w-6 h-6 text-white" />}
          color="bg-orange-600"
          isLoading={isLoading}
        />
      </div>

      {/* Role Distribution */}
      {stats?.users.byRole && stats.users.byRole.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">User Distribution by Role</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {stats.users.byRole.map((roleData) => (
              <div 
                key={roleData.role} 
                className="bg-slate-50 rounded-lg p-4 text-center"
              >
                <p className="text-2xl font-bold text-slate-900">{roleData.count}</p>
                <p className="text-sm text-slate-500 mt-1">
                  {roleData.role.replace('_', ' ')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Health */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">System Health</h2>
                <p className="text-sm text-slate-500">Real-time service status</p>
              </div>
              <Activity className="w-5 h-5 text-slate-400" />
            </div>
          </div>
          <div className="p-6 space-y-3">
            {health ? (
              <>
                <SystemStatusCard 
                  name="Database (PostgreSQL)" 
                  status={health.services.database}
                  icon={<HardDrive className="w-5 h-5" />}
                />
                <SystemStatusCard 
                  name="Redis Cache" 
                  status={health.services.redis}
                  icon={<Cpu className="w-5 h-5" />}
                />
                <SystemStatusCard 
                  name="ThingsBoard" 
                  status={health.services.thingsboard}
                  icon={<Wifi className="w-5 h-5" />}
                />
                <SystemStatusCard 
                  name="Background Jobs" 
                  status={health.services.backgroundJobs}
                  icon={<RefreshCw className="w-5 h-5" />}
                />
              </>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <WifiOff className="w-10 h-10 mx-auto mb-3 text-slate-400" />
                <p>Unable to fetch health status</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Recent Activity</h2>
                <p className="text-sm text-slate-500">Latest system events</p>
              </div>
              <Clock className="w-5 h-5 text-slate-400" />
            </div>
          </div>
          <div className="p-6">
            {activities.length > 0 ? (
              <div className="space-y-0">
                {activities.map((activity) => (
                  <ActivityItem key={activity.id} activity={activity} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <Activity className="w-10 h-10 mx-auto mb-3 text-slate-400" />
                <p>No recent activity</p>
                <p className="text-xs text-slate-400 mt-1">
                  Activity will appear here as users interact with the system
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* System Info Footer */}
      {health && (
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-slate-500">Platform:</span>
              <span className="ml-2 font-medium text-slate-700 capitalize">
                {health.system.platform}
              </span>
            </div>
            <div>
              <span className="text-slate-500">Node Version:</span>
              <span className="ml-2 font-medium text-slate-700">
                {health.system.nodeVersion}
              </span>
            </div>
            <div>
              <span className="text-slate-500">Memory Usage:</span>
              <span className="ml-2 font-medium text-slate-700">
                {health.system.memory.used}MB / {health.system.memory.total}MB
              </span>
            </div>
            <div>
              <span className="text-slate-500">CPU Usage:</span>
              <span className="ml-2 font-medium text-slate-700">
                {health.system.cpu.usage}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <a
            href="/admin/tenants"
            className="flex flex-col items-center p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors group"
          >
            <Building2 className="w-8 h-8 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-slate-700">Manage Tenants</span>
          </a>
          <a
            href="/admin/security"
            className="flex flex-col items-center p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors group"
          >
            <Shield className="w-8 h-8 text-green-600 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-slate-700">Security</span>
          </a>
          <a
            href="/admin/settings"
            className="flex flex-col items-center p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors group"
          >
            <Server className="w-8 h-8 text-purple-600 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-slate-700">System Config</span>
          </a>
          <a
            href="/admin/notifications"
            className="flex flex-col items-center p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors group"
          >
            <Activity className="w-8 h-8 text-orange-600 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-slate-700">Notifications</span>
          </a>
        </div>
      </div>
    </div>
  );
}
