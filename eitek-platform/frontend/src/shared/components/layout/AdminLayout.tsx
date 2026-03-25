'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  Home,
  Building2,
  UserCog,
  Settings,
  Bell,
  Shield,
  Menu,
  X,
  User,
  LogOut,
  ChevronDown,
  Image,
  Puzzle,
  Package,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { useAuthStore } from '@/features/auth/stores/authStore';

interface NavItem {
  href: string;
  icon: React.ReactNode;
  label: string;
  description?: string;
}

const navigation: NavItem[] = [
  {
    href: '/admin',
    icon: <Home className="w-5 h-5" />,
    label: 'Home',
    description: 'System overview and statistics',
  },
  {
    href: '/admin/tenants',
    icon: <Building2 className="w-5 h-5" />,
    label: 'Tenants',
    description: 'Manage tenant organizations',
  },
  {
    href: '/admin/tenant-profiles',
    icon: <UserCog className="w-5 h-5" />,
    label: 'Tenant Profiles',
    description: 'Tenant profile templates',
  },
  {
    href: '/admin/resources/images',
    icon: <Image className="w-5 h-5" />,
    label: 'Image Library',
    description: 'System image resources',
  },
  {
    href: '/admin/resources/widgets',
    icon: <Puzzle className="w-5 h-5" />,
    label: 'Widget Library',
    description: 'System widget templates',
  },
  {
    href: '/admin/addons',
    icon: <Package className="w-5 h-5" />,
    label: 'Add-on Catalog',
    description: 'Manage add-on packages and pricing',
  },
  {
    href: '/admin/settings',
    icon: <Settings className="w-5 h-5" />,
    label: 'Settings',
    description: 'System configuration',
  },
  {
    href: '/admin/notifications',
    icon: <Bell className="w-5 h-5" />,
    label: 'Notification Center',
    description: 'System notifications and alerts',
  },
  {
    href: '/admin/security',
    icon: <Shield className="w-5 h-5" />,
    label: 'Security',
    description: 'Security settings and audit logs',
  },
];

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle }) => {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  return (
    <div className={`bg-slate-900 text-white flex flex-col transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    }`}>
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-semibold text-white text-sm">EITEK Admin</span>
                <p className="text-xs text-slate-400">Super Admin</p>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800"
          >
            {isCollapsed ? <Menu className="w-4 h-4" /> : <X className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 overflow-y-auto">
        <ul className="space-y-1">
          {navigation.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive(item.href)
                    ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                } ${isCollapsed ? 'justify-center' : 'justify-start'}`}
                title={isCollapsed ? item.label : undefined}
              >
                <span className={isCollapsed ? '' : 'mr-3'}>{item.icon}</span>
                {!isCollapsed && (
                  <div className="flex-1">
                    <span>{item.label}</span>
                    {item.description && (
                      <p className="text-xs text-slate-400 mt-0.5 font-normal">
                        {item.description}
                      </p>
                    )}
                  </div>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Switch to Tenant View */}
      {!isCollapsed && (
        <div className="p-3 border-t border-slate-700">
          <Link
            href="/"
            className="flex items-center px-3 py-2 rounded-lg text-sm text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <Building2 className="w-4 h-4 mr-2" />
            Switch to Tenant View
          </Link>
        </div>
      )}

      {/* User Profile */}
      <div className="p-3 border-t border-slate-700">
        {!isCollapsed ? (
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-full flex items-center p-2 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 ml-3 text-left min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-slate-400 truncate">{user?.email}</p>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
            </button>
            
            {showUserMenu && (
              <div className="absolute bottom-full left-0 right-0 mb-2 py-1 bg-slate-800 rounded-lg shadow-xl border border-slate-700">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center px-3 py-2 text-sm text-red-400 hover:bg-slate-700 transition-colors"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={handleLogout}
            className="w-full flex justify-center p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-slate-100">
      <Sidebar 
        isCollapsed={isCollapsed} 
        onToggle={() => setIsCollapsed(!isCollapsed)} 
      />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
