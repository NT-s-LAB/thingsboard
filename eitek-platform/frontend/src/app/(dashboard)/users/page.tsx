'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Users,
  Plus,
  Search,
  Trash2,
  Edit,
  CheckCircle,
  XCircle,
  Loader2,
  X,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { useAuthGuard } from '@/features/auth/hooks/useAuthGuard';
import { useRoleGuard } from '@/features/auth/hooks/useRoleGuard';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { useGlobalStore } from '@/shared/stores/globalStore';
import { LoadingSpinner } from '@/shared/components/ui/LoadingSpinner';
import { QuotaBadge } from '@/shared/components/ui/QuotaBadge';
import { useQuota } from '@/shared/hooks/useQuota';
import {
  userService,
  ManagedUser,
  CreateUserDto,
  UpdateUserDto,
  UsersQueryParams,
} from '@/features/users/services/userService';
import type { UserRoleEnum } from '@/shared/types';

// Role options for the dropdown (TENANT_ADMIN can only assign lower roles)
const ASSIGNABLE_ROLES: { value: UserRoleEnum; label: string }[] = [
  { value: 'PROJECT_MANAGER', label: 'Project Manager' },
  { value: 'OPERATOR', label: 'Operator' },
  { value: 'VIEWER', label: 'Viewer' },
];

const ROLE_BADGE_COLORS: Record<string, string> = {
  SUPER_ADMIN: 'bg-red-100 text-red-700',
  TENANT_ADMIN: 'bg-purple-100 text-purple-700',
  PROJECT_MANAGER: 'bg-blue-100 text-blue-700',
  OPERATOR: 'bg-green-100 text-green-700',
  VIEWER: 'bg-gray-100 text-gray-700',
};

// ==================== ADD/EDIT USER MODAL ====================

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editUser?: ManagedUser | null;
}

const UserModal: React.FC<UserModalProps> = ({ isOpen, onClose, onSuccess, editUser }) => {
  const isEdit = !!editUser;
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    username: '',
    phone: '',
    password: '',
    role: 'OPERATOR' as UserRoleEnum,
    isActive: true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (editUser) {
      setFormData({
        email: editUser.email,
        firstName: editUser.firstName,
        lastName: editUser.lastName,
        username: editUser.username || '',
        phone: editUser.phone || '',
        password: '',
        role: editUser.role,
        isActive: editUser.isActive,
      });
    } else {
      setFormData({
        email: '',
        firstName: '',
        lastName: '',
        username: '',
        phone: '',
        password: '',
        role: 'OPERATOR',
        isActive: true,
      });
    }
    setError('');
  }, [editUser, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      if (isEdit && editUser) {
        const updateData: UpdateUserDto = {
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          role: formData.role,
          isActive: formData.isActive,
          ...(formData.username ? { username: formData.username } : {}),
          ...(formData.phone ? { phone: formData.phone } : {}),
        };
        await userService.updateUser(editUser.id, updateData);
      } else {
        if (!formData.password || formData.password.length < 6) {
          setError('Password must be at least 6 characters');
          setSaving(false);
          return;
        }
        const createData: CreateUserDto = {
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          password: formData.password,
          role: formData.role,
          isActive: formData.isActive,
          ...(formData.username ? { username: formData.username } : {}),
          ...(formData.phone ? { phone: formData.phone } : {}),
        };
        await userService.createUser(createData);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEdit ? 'Edit User' : 'Add New User'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
              <Input
                value={formData.firstName}
                onChange={(e) => setFormData((prev) => ({ ...prev, firstName: e.target.value }))}
                required
                placeholder="John"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
              <Input
                value={formData.lastName}
                onChange={(e) => setFormData((prev) => ({ ...prev, lastName: e.target.value }))}
                required
                placeholder="Doe"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
              required
              placeholder="user@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <Input
              value={formData.username}
              onChange={(e) => setFormData((prev) => ({ ...prev, username: e.target.value }))}
              placeholder="username (optional)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <Input
              value={formData.phone}
              onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
              placeholder="+84..."
            />
          </div>

          {!isEdit && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                  required
                  placeholder="Minimum 6 characters"
                  minLength={6}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData((prev) => ({ ...prev, role: e.target.value as UserRoleEnum }))}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            >
              {ASSIGNABLE_ROLES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData((prev) => ({ ...prev, isActive: e.target.checked }))}
              className="rounded border-gray-300"
            />
            <label htmlFor="isActive" className="text-sm text-gray-700">Active</label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {isEdit ? 'Save Changes' : 'Create User'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==================== DELETE CONFIRM MODAL ====================

interface DeleteModalProps {
  isOpen: boolean;
  user: ManagedUser | null;
  onClose: () => void;
  onConfirm: () => void;
  deleting: boolean;
}

const DeleteModal: React.FC<DeleteModalProps> = ({ isOpen, user, onClose, onConfirm, deleting }) => {
  if (!isOpen || !user) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Delete User</h2>
        <p className="text-sm text-gray-600 mb-6">
          Are you sure you want to delete <strong>{user.firstName} {user.lastName}</strong> ({user.email})?
          This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={deleting}>Cancel</Button>
          <Button variant="destructive" onClick={onConfirm} disabled={deleting}>
            {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
};

// ==================== MAIN PAGE ====================

export default function UsersPage() {
  const { isReady, isAuthenticated } = useAuthGuard();
  const { hasAccess } = useRoleGuard({ requiredRole: 'TENANT_ADMIN', redirectTo: '/' });
  const currentUser = useAuthStore((s) => s.user);
  const { addNotification } = useGlobalStore();

  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0, hasNext: false, hasPrev: false });
  const [sortBy] = useState('createdAt');
  const [sortOrder] = useState<'asc' | 'desc'>('desc');

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [deletingUser, setDeletingUser] = useState<ManagedUser | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Quota
  const { isAtLimit, current: quotaCurrent, max: quotaMax } = useQuota();
  const userLimitReached = isAtLimit('users');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params: UsersQueryParams = {
        page,
        limit: 20,
        sortBy,
        sortOrder,
      };
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }
      const res = await userService.getUsers(params);
      setUsers(res.data);
      setPagination({
        total: res.totalElements,
        totalPages: res.totalPages,
        hasNext: res.hasNext,
        hasPrev: res.hasPrev,
      });
    } catch (err: any) {
      addNotification({ type: 'error', title: 'Error', message: err.message || 'Failed to load users' });
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery, sortBy, sortOrder, addNotification]);

  useEffect(() => {
    if (isReady && isAuthenticated && hasAccess) {
      fetchUsers();
    }
  }, [isReady, isAuthenticated, hasAccess, fetchUsers]);

  const handleDelete = async () => {
    if (!deletingUser) return;
    setDeleteLoading(true);
    try {
      await userService.deleteUser(deletingUser.id);
      addNotification({ type: 'success', title: 'Success', message: 'User deleted successfully' });
      setDeletingUser(null);
      fetchUsers();
    } catch (err: any) {
      addNotification({ type: 'error', title: 'Error', message: err.message || 'Failed to delete user' });
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  if (!isReady || !hasAccess) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-80px)]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Users className="w-7 h-7 text-blue-600" />
            User Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage users in your organization</p>
        </div>
        <div className="flex items-center gap-3">
          <QuotaBadge current={quotaCurrent('users')} max={quotaMax('users')} label="Users" />
          <Button onClick={() => { if (!userLimitReached) { setEditingUser(null); setShowAddModal(true); } else { alert('Đã đạt giới hạn user. Vui lòng nâng gói hoặc mua thêm add-on.'); } }}>
            <Plus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, or username..."
              className="pl-10"
            />
          </div>
          <Button type="submit" variant="outline">Search</Button>
        </form>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-20">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Last Login</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm">
                          {u.firstName?.[0]}{u.lastName?.[0]}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{u.firstName} {u.lastName}</p>
                          <p className="text-xs text-gray-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${ROLE_BADGE_COLORS[u.role] || 'bg-gray-100 text-gray-700'}`}>
                        {u.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {u.isActive ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700">
                          <CheckCircle className="w-3.5 h-3.5" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600">
                          <XCircle className="w-3.5 h-3.5" /> Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {u.id !== currentUser?.id && (
                          <>
                            <button
                              onClick={() => { setEditingUser(u); setShowAddModal(true); }}
                              className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-blue-600 transition-colors"
                              title="Edit user"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeletingUser(u)}
                              className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-red-600 transition-colors"
                              title="Delete user"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {u.id === currentUser?.id && (
                          <span className="text-xs text-gray-400 italic">You</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
            <p className="text-sm text-gray-600">
              {pagination.total} user{pagination.total !== 1 ? 's' : ''} total
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!pagination.hasPrev}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-gray-700">
                Page {page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={!pagination.hasNext}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <UserModal
        isOpen={showAddModal}
        onClose={() => { setShowAddModal(false); setEditingUser(null); }}
        onSuccess={() => {
          addNotification({
            type: 'success',
            title: 'Success',
            message: editingUser ? 'User updated successfully' : 'User created successfully',
          });
          fetchUsers();
        }}
        editUser={editingUser}
      />
      <DeleteModal
        isOpen={!!deletingUser}
        user={deletingUser}
        onClose={() => setDeletingUser(null)}
        onConfirm={handleDelete}
        deleting={deleteLoading}
      />
    </div>
  );
}
