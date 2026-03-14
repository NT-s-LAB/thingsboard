'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Building2, 
  Users, 
  ArrowLeft,
  Plus, 
  Search, 
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  Loader2,
  AlertTriangle,
  X,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Key,
  Clock,
  ToggleLeft,
  ToggleRight,
  Copy,
  Check,
  Send,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { tenantService, Tenant } from '@/features/admin/services/tenantService';
import {
  tenantUserService,
  TenantUser,
  CreateTenantUserDto,
  ActivationMethod,
  PaginationInfo,
} from '@/features/admin/services/tenantUserService';

// ==================== ADD USER MODAL ====================

interface AddUserModalProps {
  tenantId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AddUserModal: React.FC<AddUserModalProps> = ({ tenantId, isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState<CreateTenantUserDto>({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    description: '',
    activationMethod: ActivationMethod.ACTIVATION_LINK,
    password: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdUser, setCreatedUser] = useState<TenantUser | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (!formData.email.trim()) {
        throw new Error('Email is required');
      }
      if (!formData.firstName.trim()) {
        throw new Error('First name is required');
      }
      if (!formData.lastName.trim()) {
        throw new Error('Last name is required');
      }
      if (formData.activationMethod === ActivationMethod.SET_PASSWORD && (!formData.password || formData.password.length < 6)) {
        throw new Error('Password must be at least 6 characters');
      }

      // Note: Role is always TENANT_ADMIN for users created by Super Admin
      const user = await tenantUserService.createUser(tenantId, {
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone || undefined,
        description: formData.description || undefined,
        activationMethod: formData.activationMethod,
        password: formData.password || undefined,
      });
      
      setCreatedUser(user);
      
      if (formData.activationMethod === ActivationMethod.SET_PASSWORD) {
        onSuccess();
        handleClose();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to create user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyLink = async () => {
    if (createdUser?.activationLink) {
      await navigator.clipboard.writeText(createdUser.activationLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setFormData({
      email: '',
      firstName: '',
      lastName: '',
      phone: '',
      description: '',
      activationMethod: ActivationMethod.ACTIVATION_LINK,
      password: '',
    });
    setError(null);
    setCreatedUser(null);
    setCopied(false);
    onClose();
  };

  const handleDone = () => {
    onSuccess();
    handleClose();
  };

  if (!isOpen) return null;

  // Show activation link after user is created
  if (createdUser?.activationLink) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4">
          <div className="flex items-center justify-between p-6 border-b border-slate-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900">User Created</h2>
            </div>
            <button onClick={handleClose} className="text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-sm text-slate-600 mb-2">
                User <strong>{createdUser.firstName} {createdUser.lastName}</strong> has been created.
              </p>
              <p className="text-sm text-slate-500">
                Share the activation link below with the user to set their password.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Activation Link
              </label>
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-slate-100 rounded-lg p-3 text-sm text-slate-600 break-all">
                  {createdUser.activationLink}
                </div>
                <Button 
                  variant="outline" 
                  onClick={handleCopyLink}
                  className="flex-shrink-0"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                This link will expire in 24 hours.
              </p>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button onClick={handleDone} className="bg-red-600 hover:bg-red-700">
                Done
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-slate-800 text-white rounded-t-xl">
          <h2 className="text-xl font-semibold">Add user</h2>
          <button onClick={handleClose} className="text-slate-300 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Email <span className="text-red-500">*</span>
            </label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="user@company.com"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              First name <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              placeholder="First name"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Last name <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              placeholder="Last name"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Phone
            </label>
            <div className="flex">
              <select className="px-3 py-2 border border-slate-200 rounded-l-lg text-sm bg-slate-50 border-r-0">
                <option value="US">US</option>
                <option value="VN">VN</option>
              </select>
              <Input
                type="tel"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Phone"
                disabled={isSubmitting}
                className="rounded-l-none flex-1"
              />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Phone Number in E.164 format, ex. +12015550123
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Description
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Description"
              rows={2}
              disabled={isSubmitting}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Role is always TENANT_ADMIN for users created by Super Admin */}
          <div className="bg-slate-50 px-3 py-2 rounded-lg">
            <span className="text-sm text-slate-600">Role: </span>
            <span className="text-sm font-medium text-slate-900">Tenant Admin</span>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Activation method
            </label>
            <select 
              value={formData.activationMethod}
              onChange={(e) => setFormData({ 
                ...formData, 
                activationMethod: e.target.value as ActivationMethod,
                password: e.target.value === ActivationMethod.ACTIVATION_LINK ? '' : formData.password,
              })}
              disabled={isSubmitting}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value={ActivationMethod.ACTIVATION_LINK}>Display activation link</option>
              <option value={ActivationMethod.SET_PASSWORD}>Set password directly</option>
            </select>
          </div>

          {formData.activationMethod === ActivationMethod.SET_PASSWORD && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Password <span className="text-red-500">*</span>
              </label>
              <Input
                type="password"
                value={formData.password || ''}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Minimum 6 characters"
                disabled={isSubmitting}
              />
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" className="bg-red-600 hover:bg-red-700" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==================== VIEW USER MODAL ====================

interface ViewUserModalProps {
  user: TenantUser | null;
  tenantId: string;
  isOpen: boolean;
  onClose: () => void;
  onResendActivation: () => void;
}

const ViewUserModal: React.FC<ViewUserModalProps> = ({ user, tenantId, isOpen, onClose, onResendActivation }) => {
  const [activationLink, setActivationLink] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleResendActivation = async () => {
    if (!user) return;
    setIsResending(true);
    try {
      const result = await tenantUserService.resendActivationLink(tenantId, user.id);
      setActivationLink(result.activationLink);
      onResendActivation();
    } catch (err) {
      console.error('Failed to resend activation:', err);
    } finally {
      setIsResending(false);
    }
  };

  const handleCopyLink = async () => {
    if (activationLink) {
      await navigator.clipboard.writeText(activationLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setActivationLink(null);
    setCopied(false);
    onClose();
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">{user.firstName} {user.lastName}</h2>
              <p className="text-sm text-slate-500">{user.email}</p>
            </div>
          </div>
          <button onClick={handleClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                user.isActive 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-slate-100 text-slate-600'
              }`}>
                {user.isActive ? (
                  <><CheckCircle className="w-3 h-3 mr-1" /> Active</>
                ) : (
                  <><XCircle className="w-3 h-3 mr-1" /> Inactive</>
                )}
              </span>
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                user.isActivated 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-yellow-100 text-yellow-700'
              }`}>
                {user.isActivated ? 'Activated' : 'Pending Activation'}
              </span>
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-slate-500 mb-1">Role</p>
              <p className="text-sm font-medium text-slate-900">{user.role.replace('_', ' ')}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-slate-500 mb-1">Created</p>
              <p className="text-sm font-medium text-slate-900">
                {new Date(user.createdAt).toLocaleDateString()}
              </p>
            </div>
            {user.phone && (
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-500 mb-1">Phone</p>
                <p className="text-sm font-medium text-slate-900">{user.phone}</p>
              </div>
            )}
            {user.lastLogin && (
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-500 mb-1">Last Login</p>
                <p className="text-sm font-medium text-slate-900">
                  {new Date(user.lastLogin).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>

          {/* Description */}
          {user.description && (
            <div>
              <p className="text-sm text-slate-500 mb-2">Description</p>
              <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-3">{user.description}</p>
            </div>
          )}

          {/* Activation Link Section */}
          {!user.isActivated && (
            <div className="border border-yellow-200 bg-yellow-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <Clock className="w-5 h-5 text-yellow-600" />
                <p className="font-medium text-yellow-800">Pending Activation</p>
              </div>
              
              {activationLink ? (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-white rounded-lg p-2 text-xs text-slate-600 break-all border">
                      {activationLink}
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleCopyLink}
                    >
                      {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-yellow-700">Link expires in 24 hours</p>
                </div>
              ) : (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleResendActivation}
                  disabled={isResending}
                  className="border-yellow-300 text-yellow-800 hover:bg-yellow-100"
                >
                  {isResending ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
                  ) : (
                    <><Send className="w-4 h-4 mr-2" /> Generate Activation Link</>
                  )}
                </Button>
              )}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-200">
          <Button variant="outline" onClick={handleClose} className="w-full">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

// ==================== DELETE USER MODAL ====================

interface DeleteUserModalProps {
  user: TenantUser | null;
  tenantId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const DeleteUserModal: React.FC<DeleteUserModalProps> = ({ user, tenantId, isOpen, onClose, onSuccess }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!user) return;
    
    setError(null);
    setIsDeleting(true);

    try {
      await tenantUserService.deleteUser(tenantId, user.id);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to delete user');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Delete User</h2>
              <p className="text-sm text-slate-500">This action cannot be undone</p>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="bg-slate-50 rounded-lg p-4 mb-4">
            <p className="text-sm text-slate-600">
              You are about to delete user <strong>{user.firstName} {user.lastName}</strong> ({user.email}).
            </p>
          </div>

          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={onClose} disabled={isDeleting}>
              Cancel
            </Button>
            <Button 
              className="bg-red-600 hover:bg-red-700" 
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Deleting...</>
              ) : (
                <><Trash2 className="w-4 h-4 mr-2" /> Delete User</>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== SET PASSWORD MODAL ====================

interface SetPasswordModalProps {
  user: TenantUser | null;
  tenantId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const SetPasswordModal: React.FC<SetPasswordModalProps> = ({ user, tenantId, isOpen, onClose, onSuccess }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setError(null);

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsSubmitting(true);

    try {
      await tenantUserService.setPassword(tenantId, user.id, password);
      onSuccess();
      handleClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to set password');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setPassword('');
    setConfirmPassword('');
    setError(null);
    onClose();
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <Key className="w-6 h-6 text-slate-600" />
            <h2 className="text-xl font-semibold text-slate-900">Set Password</h2>
          </div>
          <button onClick={handleClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-sm text-slate-600">
            Set a new password for <strong>{user.firstName} {user.lastName}</strong>
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              New Password
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Confirm Password
            </label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
              disabled={isSubmitting}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" className="bg-red-600 hover:bg-red-700" disabled={isSubmitting}>
              {isSubmitting ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Setting...</>
              ) : (
                'Set Password'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==================== MAIN PAGE ====================

export default function TenantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tenantId = params.tenantId as string;

  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [users, setUsers] = useState<TenantUser[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSetPasswordModal, setShowSetPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<TenantUser | null>(null);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchTenant = useCallback(async () => {
    try {
      const data = await tenantService.getTenant(tenantId);
      setTenant(data);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to load tenant');
    }
  }, [tenantId]);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await tenantUserService.getUsers(tenantId, {
        page: currentPage,
        limit: pageSize,
        search: debouncedSearch || undefined,
      });

      setUsers(response.data);
      setPagination(response.pagination);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to load users');
    } finally {
      setIsLoading(false);
    }
  }, [tenantId, currentPage, pageSize, debouncedSearch]);

  useEffect(() => {
    fetchTenant();
  }, [fetchTenant]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleView = (user: TenantUser) => {
    setSelectedUser(user);
    setShowViewModal(true);
  };

  const handleDelete = (user: TenantUser) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const handleSetPassword = (user: TenantUser) => {
    setSelectedUser(user);
    setShowSetPasswordModal(true);
  };

  const handleToggleStatus = async (user: TenantUser) => {
    try {
      await tenantUserService.toggleUserStatus(tenantId, user.id);
      fetchUsers();
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  const handleSuccess = () => {
    fetchUsers();
  };

  return (
    <div className="p-6 space-y-6">
      {/* Back Button & Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            onClick={() => router.push('/admin/tenants')}
            className="flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{tenant?.name || 'Loading...'}</h1>
              <div className="flex items-center space-x-2">
                {tenant && (
                  <>
                    <code className="text-sm bg-slate-100 px-2 py-0.5 rounded">{tenant.code}</code>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      tenant.isActive 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {tenant.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="bg-red-600 hover:bg-red-700">
          <Plus className="w-4 h-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* Stats Cards */}
      {tenant && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{tenant.usersCount}</p>
                <p className="text-sm text-slate-500">Total Users</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{tenant.projectsCount}</p>
                <p className="text-sm text-slate-500">Projects</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{tenant.devicesCount}</p>
                <p className="text-sm text-slate-500">Devices</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Users Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Tenant Users</h2>
              <p className="text-sm text-slate-500">
                Manage users for this tenant
                {pagination && <span> • {pagination.total} total</span>}
              </p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" onClick={fetchUsers} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="p-4 m-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <Button variant="outline" size="sm" onClick={fetchUsers}>
              Retry
            </Button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="p-12 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="w-10 h-10 animate-spin text-red-600 mx-auto mb-4" />
              <p className="text-slate-500">Loading users...</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && users.length === 0 && (
          <div className="p-12 text-center">
            <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No users found</h3>
            <p className="text-sm text-slate-500 mb-4">
              {debouncedSearch
                ? 'Try adjusting your search'
                : 'Get started by adding your first user'}
            </p>
            {!debouncedSearch && (
              <Button onClick={() => setShowAddModal(true)} className="bg-red-600 hover:bg-red-700">
                <Plus className="w-4 h-4 mr-2" />
                Add User
              </Button>
            )}
          </div>
        )}

        {/* Users Table */}
        {!isLoading && !error && users.length > 0 && (
          <>
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">User</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Role</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Status</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Activation</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Created</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
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
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-slate-100 rounded text-sm text-slate-700">
                        {user.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        user.isActive 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {user.isActive ? (
                          <><CheckCircle className="w-3 h-3 mr-1" /> Active</>
                        ) : (
                          <><XCircle className="w-3 h-3 mr-1" /> Inactive</>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        user.isActivated 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {user.isActivated ? (
                          <><CheckCircle className="w-3 h-3 mr-1" /> Activated</>
                        ) : (
                          <><Clock className="w-3 h-3 mr-1" /> Pending</>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end space-x-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          title="View"
                          onClick={() => handleView(user)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          title="Set Password"
                          onClick={() => handleSetPassword(user)}
                        >
                          <Key className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          title={user.isActive ? 'Deactivate' : 'Activate'}
                          onClick={() => handleToggleStatus(user)}
                        >
                          {user.isActive ? (
                            <ToggleRight className="w-4 h-4 text-green-600" />
                          ) : (
                            <ToggleLeft className="w-4 h-4 text-slate-400" />
                          )}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-600 hover:text-red-700 hover:bg-red-50" 
                          title="Delete"
                          onClick={() => handleDelete(user)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
                <p className="text-sm text-slate-500">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                  {pagination.total} users
                </p>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={!pagination.hasPrev}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-slate-600">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={!pagination.hasNext}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      <AddUserModal
        tenantId={tenantId}
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleSuccess}
      />
      <ViewUserModal
        user={selectedUser}
        tenantId={tenantId}
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        onResendActivation={handleSuccess}
      />
      <DeleteUserModal
        user={selectedUser}
        tenantId={tenantId}
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onSuccess={handleSuccess}
      />
      <SetPasswordModal
        user={selectedUser}
        tenantId={tenantId}
        isOpen={showSetPasswordModal}
        onClose={() => setShowSetPasswordModal(false)}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
