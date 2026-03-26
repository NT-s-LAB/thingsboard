'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  Home, 
  Monitor as Devices,
  FolderTree,
  Settings,
  Layers,
  Bell,
  User,
  Users,
  Search,
  Menu,
  X,
  Puzzle,
  Library,
  ImageIcon,
  ChevronDown,
  ChevronRight,
  Shield,
  MapPin,
  Building2,
  Package,
  ScreenShare,
  CheckCheck,
  Trash2,
  Wifi,
  WifiOff,
  AlertTriangle,
  Info,
  Megaphone,
  Server,
  Wrench,
  UserCheck,
  FolderOpen,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { NotificationContainer } from '@/shared/components/ui/Notification';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { useGlobalStore } from '@/shared/stores/globalStore';
import { useNotifications } from '@/shared/stores/notificationStore';
import type { NotificationType } from '@/shared/services/notificationService';
import { useState, useMemo } from 'react';
import type { UserRoleEnum } from '@/shared/types';

const ROLE_LEVEL: Record<string, number> = {
  VIEWER: 0,
  OPERATOR: 1,
  PROJECT_MANAGER: 2,
  TENANT_ADMIN: 3,
  SUPER_ADMIN: 4,
};

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

interface NavItem {
  href: string;
  icon: React.ReactNode;
  label: string;
  badge?: string | number;
  minRole?: UserRoleEnum;
}

interface NavGroup {
  icon: React.ReactNode;
  label: string;
  children: NavItem[];
  minRole?: UserRoleEnum;
}

type NavEntry = NavItem | NavGroup;

function isNavGroup(entry: NavEntry): entry is NavGroup {
  return 'children' in entry;
}

function hasAccess(userRole: string | undefined, minRole?: UserRoleEnum): boolean {
  if (!minRole) return true;
  const level = ROLE_LEVEL[userRole || ''] ?? -1;
  return level >= (ROLE_LEVEL[minRole] ?? 999);
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle }) => {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({ Library: true });

  const toggleGroup = (label: string) => {
    setExpandedGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const navigation: NavEntry[] = [
    {
      href: '/',
      icon: <Home className="w-5 h-5" />,
      label: 'Dashboard'
    },
    {
      href: '/devices',
      icon: <Devices className="w-5 h-5" />,
      label: 'Devices',
    },
    {
      href: '/profiles',
      icon: <Layers className="w-5 h-5" />,
      label: 'Profiles',
      minRole: 'VIEWER' as UserRoleEnum,
    },
    {
      href: '/projects',
      icon: <FolderTree className="w-5 h-5" />,
      label: 'Projects'
    },
    {
      href: '/sites',
      icon: <Building2 className="w-5 h-5" />,
      label: 'Sites'
    },
    {
      href: '/areas',
      icon: <MapPin className="w-5 h-5" />,
      label: 'Areas'
    },
    // Templates — temporarily hidden
    // {
    //   href: '/templates',
    //   icon: <Template className="w-5 h-5" />,
    //   label: 'Templates',
    //   minRole: 'TENANT_ADMIN' as UserRoleEnum,
    // },
    {
      href: '/device-scada-templates',
      icon: <ScreenShare className="w-5 h-5" />,
      label: 'Device SCADA',
      minRole: 'VIEWER' as UserRoleEnum,
    },
    {
      icon: <Library className="w-5 h-5" />,
      label: 'Library',
      minRole: 'VIEWER' as UserRoleEnum,
      children: [
        {
          href: '/library/widgets',
          icon: <Puzzle className="w-4 h-4" />,
          label: 'Widget Library'
        },
        {
          href: '/library/images',
          icon: <ImageIcon className="w-4 h-4" />,
          label: 'Image Library'
        },
      ],
    },
    {
      href: '/users',
      icon: <Users className="w-5 h-5" />,
      label: 'Users',
      minRole: 'TENANT_ADMIN' as UserRoleEnum,
    },
    {
      href: '/addons',
      icon: <Package className="w-5 h-5" />,
      label: 'Add-ons',
      minRole: 'TENANT_ADMIN' as UserRoleEnum,
    },
    {
      href: '/notifications',
      icon: <Bell className="w-5 h-5" />,
      label: 'Notifications',
    },
    {
      href: '/settings',
      icon: <Settings className="w-5 h-5" />,
      label: 'Settings'
    }
  ];

  const filteredNavigation = useMemo(() => {
    const role = user?.role;
    return navigation.filter((entry) => {
      if (isNavGroup(entry)) {
        return hasAccess(role, entry.minRole);
      }
      return hasAccess(role, entry.minRole);
    });
  }, [user?.role]);

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <div className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    }`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex flex-1 items-center justify-center">
              <a href="/" className="cursor-pointer">
                <img
                  src="/images/logo/logo.png"
                  alt="EITEK Platform"
                  className="h-20 w-auto object-contain"
                />
              </a>
            </div>
          )}
          {isCollapsed && (
            <div className="flex flex-1 items-center justify-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggle}
                className="p-2 w-10 h-10"
                title="Mở rộng menu"
              >
                <Menu className="w-5 h-5 text-gray-600" />
              </Button>
            </div>
          )}
          {!isCollapsed && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="p-1 flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Search (when expanded) */}
      {!isCollapsed && (
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search..."
              className="pl-10 w-full h-8 text-sm"
            />
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4">
        {/* Admin Panel Link for Super Admin */}
        {user?.role === 'SUPER_ADMIN' && !isCollapsed && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <Link
              href="/admin"
              className="flex items-center text-sm font-medium text-red-700 hover:text-red-800"
            >
              <Shield className="w-4 h-4 mr-2" />
              Go to Admin Panel
            </Link>
          </div>
        )}
        <ul className="space-y-1">
          {filteredNavigation.map((entry) => {
            if (isNavGroup(entry)) {
              const groupExpanded = expandedGroups[entry.label] ?? false;
              const childActive = entry.children.some((c) => isActive(c.href));
              return (
                <li key={entry.label}>
                  <button
                    onClick={() => toggleGroup(entry.label)}
                    className={`w-full flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      childActive ? 'text-primary-700' : 'text-gray-700 hover:bg-gray-100'
                    } ${isCollapsed ? 'justify-center' : 'justify-start'}`}
                  >
                    <span className={isCollapsed ? '' : 'mr-3'}>{entry.icon}</span>
                    {!isCollapsed && (
                      <>
                        <span className="flex-1 text-left">{entry.label}</span>
                        {groupExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </>
                    )}
                  </button>
                  {!isCollapsed && groupExpanded && (
                    <ul className="ml-4 mt-1 space-y-1 border-l border-gray-200 pl-2">
                      {entry.children.map((child) => (
                        <li key={child.href}>
                          <Link
                            href={child.href}
                            className={`flex items-center px-3 py-1.5 rounded-md text-sm transition-colors ${
                              isActive(child.href)
                                ? 'bg-primary-50 text-primary-700 font-medium'
                                : 'text-gray-600 hover:bg-gray-100'
                            }`}
                          >
                            <span className="mr-2">{child.icon}</span>
                            <span>{child.label}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            }
            const item = entry;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? 'bg-primary-50 text-primary-700 border border-primary-200'
                      : 'text-gray-700 hover:bg-gray-100'
                  } ${isCollapsed ? 'justify-center' : 'justify-start'}`}
                >
                  <span className={isCollapsed ? '' : 'mr-3'}>{item.icon}</span>
                  {!isCollapsed && (
                    <>
                      <span className="flex-1">{item.label}</span>
                      {item.badge && (
                        <span className="ml-2 px-2 py-1 text-xs bg-red-100 text-red-600 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-200">
        {!isCollapsed ? (
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-gray-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-primary-100 text-primary-700 rounded">
                  {user?.role?.replace('_', ' ')}
                </span>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={logout}
              className="w-full"
            >
              Sign Out
            </Button>
          </div>
        ) : (
          <div className="flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="p-2"
            >
              <User className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

interface HeaderProps {
  title?: string;
  actions?: React.ReactNode;
}

const NOTIFICATION_ICON: Record<NotificationType, React.ReactNode> = {
  DEVICE_OFFLINE: <WifiOff className="w-4 h-4 text-red-500" />,
  DEVICE_ONLINE: <Wifi className="w-4 h-4 text-green-500" />,
  DEVICE_ALARM: <AlertTriangle className="w-4 h-4 text-yellow-500" />,
  SYSTEM_UPDATE: <Server className="w-4 h-4 text-blue-500" />,
  SYSTEM_MAINTENANCE: <Wrench className="w-4 h-4 text-orange-500" />,
  ADMIN_MESSAGE: <Megaphone className="w-4 h-4 text-purple-500" />,
  ACCOUNT_ACTIVITY: <UserCheck className="w-4 h-4 text-teal-500" />,
  PROJECT_UPDATE: <FolderOpen className="w-4 h-4 text-indigo-500" />,
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Vừa xong';
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  return `${days} ngày trước`;
}

const Header: React.FC<HeaderProps> = ({ title, actions }) => {
  const { user } = useAuthStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  const displayNotifications = notifications.slice(0, 10);

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          {title && (
            <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
          )}
        </div>

        <div className="flex items-center space-x-4">
          {actions}
          
          {/* Notifications */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 relative"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white px-1">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Button>

            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">
                    Thông báo
                    {unreadCount > 0 && (
                      <span className="ml-2 text-xs font-normal text-gray-500">
                        ({unreadCount} chưa đọc)
                      </span>
                    )}
                  </h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      Đọc tất cả
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto">
                  {loading && notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-gray-400">
                      Đang tải...
                    </div>
                  ) : displayNotifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-gray-400">
                      Không có thông báo
                    </div>
                  ) : (
                    displayNotifications.map((n) => (
                      <div
                        key={n.id}
                        className={`px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0 ${
                          !n.isRead ? 'bg-blue-50/50' : ''
                        }`}
                        onClick={() => !n.isRead && markAsRead(n.id)}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="mt-0.5 flex-shrink-0">
                            {NOTIFICATION_ICON[n.type] || <Info className="w-4 h-4 text-gray-400" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className={`text-sm truncate ${!n.isRead ? 'font-medium text-gray-900' : 'text-gray-700'}`}>
                                {n.title}
                              </p>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteNotification(n.id);
                                }}
                                className="text-gray-400 hover:text-red-500 ml-2 flex-shrink-0"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                            <p className="text-[11px] text-gray-400 mt-1">{timeAgo(n.createdAt)}</p>
                          </div>
                          {!n.isRead && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="px-4 py-2 border-t border-gray-100">
                  <Link
                    href="/notifications"
                    onClick={() => setShowNotifications(false)}
                    className="block w-full text-center text-sm text-blue-600 hover:text-blue-800 py-1"
                  >
                    Xem tất cả thông báo
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* User Profile */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-gray-600" />
            </div>
            <span className="text-sm font-medium text-gray-700 hidden sm:block">
              {user?.firstName}
            </span>
          </div>
        </div>
      </div>

      {/* Backdrop for notifications */}
      {showNotifications && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowNotifications(false)}
        />
      )}
    </header>
  );
};

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  headerActions?: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  title,
  headerActions
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const pathname = usePathname();
  const { notifications, removeNotification } = useGlobalStore();

  // SCADA viewer/editor gets a full-screen layout (no sidebar, no header)
  const isScadaFullscreen = /^\/scada\/[^/]+/.test(pathname);
  if (isScadaFullscreen) {
    return (
      <div className="h-screen">
        {children}
        <NotificationContainer notifications={notifications} onDismiss={removeNotification} />
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-gray-50">
      <Sidebar 
        isCollapsed={sidebarCollapsed} 
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={title || 'Dashboard'} actions={headerActions} />
        
        <main className="flex-1 overflow-auto min-h-0">
          {children}
        </main>
      </div>

      <NotificationContainer notifications={notifications} onDismiss={removeNotification} />
    </div>
  );
};