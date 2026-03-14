'use client';

import React, { useState } from 'react';
import { 
  Users,
  Key,
  Lock,
  Activity,
  Search,
  Eye,
  Edit,
  Trash2,
  Plus,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Monitor,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';

// Types
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  tenant: string;
  isActive: boolean;
  lastLogin: string;
  createdAt: string;
}

interface AuditLog {
  id: string;
  action: string;
  user: string;
  resource: string;
  details: string;
  ip: string;
  timestamp: string;
  status: 'success' | 'failed';
}

// Mock data
const mockUsers: User[] = [
  {
    id: '1',
    email: 'admin@eitek.com',
    firstName: 'System',
    lastName: 'Administrator',
    role: 'SUPER_ADMIN',
    tenant: 'EITEK Corporation',
    isActive: true,
    lastLogin: '2024-03-14T10:30:00',
    createdAt: '2024-01-01',
  },
  {
    id: '2',
    email: 'tenant@eitek.com',
    firstName: 'Tenant',
    lastName: 'Admin',
    role: 'TENANT_ADMIN',
    tenant: 'EITEK Corporation',
    isActive: true,
    lastLogin: '2024-03-14T09:15:00',
    createdAt: '2024-01-15',
  },
  {
    id: '3',
    email: 'manager@eitek.com',
    firstName: 'Project',
    lastName: 'Manager',
    role: 'PROJECT_MANAGER',
    tenant: 'EITEK Corporation',
    isActive: true,
    lastLogin: '2024-03-13T16:45:00',
    createdAt: '2024-02-01',
  },
  {
    id: '4',
    email: 'operator@eitek.com',
    firstName: 'System',
    lastName: 'Operator',
    role: 'OPERATOR',
    tenant: 'EITEK Corporation',
    isActive: true,
    lastLogin: '2024-03-14T08:00:00',
    createdAt: '2024-02-15',
  },
  {
    id: '5',
    email: 'viewer@eitek.com',
    firstName: 'Read',
    lastName: 'Only',
    role: 'VIEWER',
    tenant: 'EITEK Corporation',
    isActive: false,
    lastLogin: '2024-03-10T14:30:00',
    createdAt: '2024-03-01',
  },
];

const mockAuditLogs: AuditLog[] = [
  {
    id: '1',
    action: 'LOGIN',
    user: 'admin@eitek.com',
    resource: 'Auth',
    details: 'User logged in successfully',
    ip: '192.168.1.100',
    timestamp: '2024-03-14T10:30:00',
    status: 'success',
  },
  {
    id: '2',
    action: 'CREATE',
    user: 'admin@eitek.com',
    resource: 'Tenant',
    details: 'Created tenant "Acme Corp"',
    ip: '192.168.1.100',
    timestamp: '2024-03-14T10:25:00',
    status: 'success',
  },
  {
    id: '3',
    action: 'LOGIN',
    user: 'unknown@example.com',
    resource: 'Auth',
    details: 'Failed login attempt - invalid credentials',
    ip: '45.33.32.156',
    timestamp: '2024-03-14T10:20:00',
    status: 'failed',
  },
  {
    id: '4',
    action: 'UPDATE',
    user: 'tenant@eitek.com',
    resource: 'Device',
    details: 'Updated device settings for "Sensor-001"',
    ip: '192.168.1.105',
    timestamp: '2024-03-14T09:45:00',
    status: 'success',
  },
];

const roleColors: Record<string, string> = {
  SUPER_ADMIN: 'bg-red-100 text-red-700',
  TENANT_ADMIN: 'bg-blue-100 text-blue-700',
  PROJECT_MANAGER: 'bg-purple-100 text-purple-700',
  OPERATOR: 'bg-green-100 text-green-700',
  VIEWER: 'bg-slate-100 text-slate-700',
};

export default function SecurityPage() {
  const [activeTab, setActiveTab] = useState<'users' | 'audit' | '2fa' | 'sessions'>('users');
  const [searchQuery, setSearchQuery] = useState('');

  const tabs = [
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'audit', label: 'Audit Logs', icon: Activity },
    { id: '2fa', label: 'Two-Factor Auth', icon: Key },
    { id: 'sessions', label: 'Active Sessions', icon: Monitor },
  ];

  const filteredUsers = mockUsers.filter(user =>
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.lastName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Security</h1>
          <p className="text-slate-500 mt-1">User management, audit logs, and security settings</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="border-b border-slate-200">
          <div className="flex">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-red-600 text-red-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-6">
          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="relative w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button className="bg-red-600 hover:bg-red-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add User
                </Button>
              </div>

              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600">User</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600">Role</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600">Tenant</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600">Status</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600">Last Login</th>
                    <th className="text-right px-4 py-3 text-sm font-semibold text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-slate-600">
                              {user.firstName[0]}{user.lastName[0]}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{user.firstName} {user.lastName}</p>
                            <p className="text-sm text-slate-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${roleColors[user.role]}`}>
                          {user.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">{user.tenant}</td>
                      <td className="px-4 py-3">
                        {user.isActive ? (
                          <span className="inline-flex items-center text-green-600 text-sm">
                            <CheckCircle className="w-4 h-4 mr-1" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-slate-500 text-sm">
                            <XCircle className="w-4 h-4 mr-1" /> Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500">
                        {formatTime(user.lastLogin)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="sm"><Edit className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="sm" className="text-red-600"><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Audit Logs Tab */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input placeholder="Search logs..." className="pl-10" />
                </div>
                <select className="px-3 py-2 border border-slate-200 rounded-lg text-sm">
                  <option>All Actions</option>
                  <option>LOGIN</option>
                  <option>CREATE</option>
                  <option>UPDATE</option>
                  <option>DELETE</option>
                </select>
                <select className="px-3 py-2 border border-slate-200 rounded-lg text-sm">
                  <option>Last 24 hours</option>
                  <option>Last 7 days</option>
                  <option>Last 30 days</option>
                </select>
              </div>

              <div className="space-y-2">
                {mockAuditLogs.map((log) => (
                  <div
                    key={log.id}
                    className={`p-4 rounded-lg border ${
                      log.status === 'failed' ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-lg ${
                          log.status === 'failed' ? 'bg-red-100' : 'bg-green-100'
                        }`}>
                          {log.status === 'failed' ? (
                            <AlertTriangle className="w-4 h-4 text-red-600" />
                          ) : (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-900">{log.action}</span>
                            <span className="px-2 py-0.5 bg-slate-100 rounded text-xs text-slate-600">
                              {log.resource}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600 mt-1">{log.details}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                            <span>{log.user}</span>
                            <span>IP: {log.ip}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center text-xs text-slate-400">
                        <Clock className="w-3 h-3 mr-1" />
                        {formatTime(log.timestamp)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2FA Tab */}
          {activeTab === '2fa' && (
            <div className="space-y-6">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-amber-800">Two-Factor Authentication</h3>
                    <p className="text-sm text-amber-700 mt-1">
                      Enforce 2FA for all users to improve security. Currently, 3 out of 5 users have 2FA enabled.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Lock className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="font-medium text-slate-900">Require 2FA for Super Admins</p>
                      <p className="text-sm text-slate-500">Mandatory 2FA for highest privilege accounts</p>
                    </div>
                  </div>
                  <input type="checkbox" className="rounded" defaultChecked />
                </div>

                <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Lock className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="font-medium text-slate-900">Require 2FA for All Users</p>
                      <p className="text-sm text-slate-500">Enforce 2FA platform-wide</p>
                    </div>
                  </div>
                  <input type="checkbox" className="rounded" />
                </div>

                <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Key className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="font-medium text-slate-900">Allow Recovery Codes</p>
                      <p className="text-sm text-slate-500">Generate backup codes for account recovery</p>
                    </div>
                  </div>
                  <input type="checkbox" className="rounded" defaultChecked />
                </div>
              </div>
            </div>
          )}

          {/* Sessions Tab */}
          {activeTab === 'sessions' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">Currently 8 active sessions</p>
                <Button variant="outline" className="text-red-600">
                  Terminate All Sessions
                </Button>
              </div>

              <div className="space-y-2">
                {[
                  { user: 'admin@eitek.com', device: 'Chrome on Windows', ip: '192.168.1.100', location: 'Ho Chi Minh City', current: true },
                  { user: 'tenant@eitek.com', device: 'Firefox on macOS', ip: '192.168.1.105', location: 'Hanoi', current: false },
                  { user: 'operator@eitek.com', device: 'Safari on iOS', ip: '10.0.0.15', location: 'Da Nang', current: false },
                ].map((session, idx) => (
                  <div key={idx} className={`p-4 rounded-lg border ${session.current ? 'bg-green-50 border-green-200' : 'bg-white border-slate-200'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Monitor className="w-5 h-5 text-slate-400" />
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-slate-900">{session.user}</p>
                            {session.current && (
                              <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">Current</span>
                            )}
                          </div>
                          <p className="text-sm text-slate-500">{session.device}</p>
                          <p className="text-xs text-slate-400 mt-1">{session.ip} • {session.location}</p>
                        </div>
                      </div>
                      {!session.current && (
                        <Button variant="outline" size="sm" className="text-red-600">
                          Terminate
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
