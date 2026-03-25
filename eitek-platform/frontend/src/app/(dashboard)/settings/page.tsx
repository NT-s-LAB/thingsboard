'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { User, Shield, Bell, Palette, Save, Eye, EyeOff, Upload, RefreshCw, Check, X, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Card } from '@/shared/components/ui/Card';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { useGlobalStore } from '@/shared/stores/globalStore';
import {
  settingsService,
  type UserProfile,
  type UserSettings,
  type UpdateProfileDto,
  type UpdateUserSettingsDto,
} from '@/shared/services/settingsService';

// ── Types ────────────────────────────────────────────────────────────────────

interface SettingsSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
}

// ── Constants ────────────────────────────────────────────────────────────────

const TIMEZONES = [
  { value: 'Asia/Ho_Chi_Minh', label: 'Hồ Chí Minh (GMT+7)' },
  { value: 'Asia/Bangkok', label: 'Bangkok (GMT+7)' },
  { value: 'Asia/Singapore', label: 'Singapore (GMT+8)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (GMT+9)' },
  { value: 'Asia/Seoul', label: 'Seoul (GMT+9)' },
  { value: 'Europe/London', label: 'London (GMT+0)' },
  { value: 'America/New_York', label: 'New York (GMT-5)' },
  { value: 'UTC', label: 'UTC' },
];

const LANGUAGES = [
  { value: 'vi', label: 'Tiếng Việt' },
  { value: 'en', label: 'English' },
  { value: 'zh', label: '中文' },
];

const DATE_FORMATS = [
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
];

// ── Password Helpers ─────────────────────────────────────────────────────────

interface PasswordCheck {
  label: string;
  met: boolean;
}

function getPasswordChecks(password: string): PasswordCheck[] {
  return [
    { label: 'Ít nhất 8 ký tự', met: password.length >= 8 },
    { label: 'Chứa chữ hoa (A-Z)', met: /[A-Z]/.test(password) },
    { label: 'Chứa chữ thường (a-z)', met: /[a-z]/.test(password) },
    { label: 'Chứa số hoặc ký tự đặc biệt', met: /(\d|\W)/.test(password) },
  ];
}

function getPasswordStrength(password: string): { level: number; label: string; color: string } {
  if (!password) return { level: 0, label: '', color: '' };
  const checks = getPasswordChecks(password);
  const met = checks.filter(c => c.met).length;
  if (met <= 1) return { level: 1, label: 'Yếu', color: 'bg-red-500' };
  if (met === 2) return { level: 2, label: 'Trung bình', color: 'bg-yellow-500' };
  if (met === 3) return { level: 3, label: 'Khá', color: 'bg-blue-500' };
  return { level: 4, label: 'Mạnh', color: 'bg-green-500' };
}

// ── Toggle Component ─────────────────────────────────────────────────────────

const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }> = ({ checked, onChange, disabled }) => (
  <label className="relative inline-flex items-center cursor-pointer">
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      disabled={disabled}
      className="sr-only peer"
    />
    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
  </label>
);

// ════════════════════════════════════════════════════════════════════════════
// Main Component
// ════════════════════════════════════════════════════════════════════════════

const SettingsPage: React.FC = () => {
  const { updateUser } = useAuthStore();
  const { addNotification } = useGlobalStore();

  const [activeSection, setActiveSection] = useState('account');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // API base URL for static assets
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

  // Profile state
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileForm, setProfileForm] = useState<UpdateProfileDto>({});
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Settings state
  const [, setSettings] = useState<UserSettings | null>(null);
  const [settingsForm, setSettingsForm] = useState<UpdateUserSettingsDto>({});

  // Password state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [changingPassword, setChangingPassword] = useState(false);

  // Dirty tracking
  const [initialProfileForm, setInitialProfileForm] = useState<UpdateProfileDto>({});
  const [initialSettingsForm, setInitialSettingsForm] = useState<UpdateUserSettingsDto>({});

  const isProfileDirty = useMemo(() => {
    return JSON.stringify(profileForm) !== JSON.stringify(initialProfileForm) || !!avatarFile;
  }, [profileForm, initialProfileForm, avatarFile]);

  const isPreferencesDirty = useMemo(() => {
    return JSON.stringify(settingsForm) !== JSON.stringify(initialSettingsForm);
  }, [settingsForm, initialSettingsForm]);

  // Password validation
  const passwordChecks = useMemo(() => getPasswordChecks(passwordForm.newPassword), [passwordForm.newPassword]);
  const passwordStrength = useMemo(() => getPasswordStrength(passwordForm.newPassword), [passwordForm.newPassword]);
  const isPasswordFormValid = useMemo(() => {
    return (
      passwordForm.currentPassword.length > 0 &&
      passwordForm.newPassword.length >= 8 &&
      passwordChecks.every(c => c.met) &&
      passwordForm.newPassword === passwordForm.confirmPassword
    );
  }, [passwordForm, passwordChecks]);

  // Sections
  const sections: SettingsSection[] = [
    { id: 'account', title: 'Tài khoản', icon: <User className="w-5 h-5" />, description: 'Thông tin cá nhân' },
    { id: 'security', title: 'Bảo mật', icon: <Shield className="w-5 h-5" />, description: 'Mật khẩu & xác thực' },
    { id: 'notifications', title: 'Thông báo', icon: <Bell className="w-5 h-5" />, description: 'Cài đặt thông báo' },
    { id: 'appearance', title: 'Giao diện', icon: <Palette className="w-5 h-5" />, description: 'Chủ đề & hiển thị' },
  ];

  // ── Load Data ──────────────────────────────────────────────────────────────

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      const data = await settingsService.getAll();
      setProfile(data.profile);
      setSettings(data.settings);

      const profileData: UpdateProfileDto = {
        firstName: data.profile.firstName,
        lastName: data.profile.lastName,
        email: data.profile.email,
        phone: data.profile.phone || '',
        description: data.profile.description || '',
      };
      setProfileForm(profileData);
      setInitialProfileForm(profileData);

      const settingsData: UpdateUserSettingsDto = {
        theme: data.settings.theme,
        language: data.settings.language,
        timezone: data.settings.timezone,
        dateFormat: data.settings.dateFormat,
        compactMode: data.settings.compactMode,
        showGridLines: data.settings.showGridLines,
        emailNotifications: data.settings.emailNotifications,
        deviceAlerts: data.settings.deviceAlerts,
        systemUpdates: data.settings.systemUpdates,
        projectActivity: data.settings.projectActivity,
        weeklyReports: data.settings.weeklyReports,
      };
      setSettingsForm(settingsData);
      setInitialSettingsForm(settingsData);
    } catch {
      addNotification({ type: 'error', title: 'Lỗi', message: 'Không thể tải cài đặt' });
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Cleanup avatar preview URL
  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        addNotification({ type: 'error', title: 'Lỗi', message: 'Kích thước ảnh tối đa 2MB' });
        return;
      }
      setAvatarFile(file);
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);

      // Upload avatar if changed
      if (avatarFile) {
        const avatarResult = await settingsService.uploadAvatar(avatarFile);
        setProfile(prev => prev ? { ...prev, avatar: avatarResult.avatar } : null);
        updateUser({ avatar: avatarResult.avatar });
        setAvatarFile(null);
        if (avatarPreview) URL.revokeObjectURL(avatarPreview);
        setAvatarPreview(null);
      }

      // Update profile
      const updatedProfile = await settingsService.updateProfile(profileForm);
      setProfile(updatedProfile);
      updateUser({
        firstName: updatedProfile.firstName,
        lastName: updatedProfile.lastName,
        email: updatedProfile.email,
      });

      // Reset dirty tracking
      setInitialProfileForm({ ...profileForm });

      addNotification({ type: 'success', title: 'Thành công', message: 'Đã cập nhật hồ sơ' });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Không thể cập nhật hồ sơ';
      addNotification({ type: 'error', title: 'Lỗi', message });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!isPasswordFormValid) return;

    try {
      setChangingPassword(true);
      await settingsService.changePassword(passwordForm);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      addNotification({ type: 'success', title: 'Thành công', message: 'Đã đổi mật khẩu' });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Không thể đổi mật khẩu';
      addNotification({ type: 'error', title: 'Lỗi', message });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSavePreferences = async () => {
    try {
      setSaving(true);
      const updated = await settingsService.updatePreferences(settingsForm);
      setSettings(updated);
      setInitialSettingsForm({ ...settingsForm });
      addNotification({ type: 'success', title: 'Thành công', message: 'Đã lưu cài đặt' });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Không thể lưu cài đặt';
      addNotification({ type: 'error', title: 'Lỗi', message });
    } finally {
      setSaving(false);
    }
  };

  // ── Render Sections ────────────────────────────────────────────────────────

  const renderAccountSection = () => (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Ảnh đại diện</h3>
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
              {avatarPreview || profile?.avatar ? (
                <img
                  src={avatarPreview || (profile?.avatar?.startsWith('http') ? profile.avatar : `${apiBaseUrl}${profile?.avatar}`)}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-10 h-10 text-gray-400" />
              )}
            </div>
          </div>
          <div>
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
              <span className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                <Upload className="w-4 h-4" />
                Tải ảnh lên
              </span>
            </label>
            <p className="text-sm text-gray-500 mt-2">JPG, PNG hoặc GIF. Tối đa 2MB.</p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Thông tin cá nhân</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Họ</label>
            <Input
              value={profileForm.firstName || ''}
              onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tên</label>
            <Input
              value={profileForm.lastName || ''}
              onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <Input
              type="email"
              value={profileForm.email || ''}
              onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
            <Input
              type="tel"
              value={profileForm.phone || ''}
              onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
              placeholder="+84 xxx xxx xxx"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
            <textarea
              value={profileForm.description || ''}
              onChange={(e) => setProfileForm({ ...profileForm, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Giới thiệu ngắn về bạn..."
            />
          </div>
        </div>
        <div className="mt-6 flex items-center justify-end gap-3">
          {isProfileDirty && (
            <span className="text-sm text-amber-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              Có thay đổi chưa lưu
            </span>
          )}
          <Button onClick={handleSaveProfile} disabled={saving || !isProfileDirty}>
            {saving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Lưu thay đổi
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông tin tài khoản</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-500">Tên đăng nhập</span>
            <span className="font-medium">{profile?.username || profile?.email}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-500">Vai trò</span>
            <span className="font-medium">{profile?.role}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-500">Tenant</span>
            <span className="font-medium">{profile?.tenant?.name}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-gray-500">Đăng nhập lần cuối</span>
            <span className="font-medium">
              {profile?.lastLogin ? new Date(profile.lastLogin).toLocaleString('vi-VN') : 'Chưa có'}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderSecuritySection = () => (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Đổi mật khẩu</h3>
        <div className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu hiện tại</label>
            <div className="relative">
              <Input
                type={showPasswords.current ? 'text' : 'password'}
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                placeholder="Nhập mật khẩu hiện tại"
              />
              <button
                type="button"
                onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu mới</label>
            <div className="relative">
              <Input
                type={showPasswords.new ? 'text' : 'password'}
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                placeholder="Nhập mật khẩu mới"
              />
              <button
                type="button"
                onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Password Strength Indicator */}
            {passwordForm.newPassword && (
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex gap-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`h-1.5 flex-1 rounded-full transition-colors ${
                          level <= passwordStrength.level ? passwordStrength.color : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  <span className={`text-xs font-medium ${
                    passwordStrength.level <= 1 ? 'text-red-600' :
                    passwordStrength.level === 2 ? 'text-yellow-600' :
                    passwordStrength.level === 3 ? 'text-blue-600' : 'text-green-600'
                  }`}>
                    {passwordStrength.label}
                  </span>
                </div>

                {/* Requirements Checklist */}
                <div className="space-y-1">
                  {passwordChecks.map((check, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      {check.met ? (
                        <Check className="w-3.5 h-3.5 text-green-500" />
                      ) : (
                        <X className="w-3.5 h-3.5 text-gray-300" />
                      )}
                      <span className={check.met ? 'text-green-700' : 'text-gray-500'}>{check.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Xác nhận mật khẩu mới</label>
            <div className="relative">
              <Input
                type={showPasswords.confirm ? 'text' : 'password'}
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                placeholder="Nhập lại mật khẩu mới"
              />
              <button
                type="button"
                onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword && (
              <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                <X className="w-3 h-3" /> Mật khẩu không khớp
              </p>
            )}
            {passwordForm.confirmPassword && passwordForm.newPassword === passwordForm.confirmPassword && (
              <p className="mt-1 text-xs text-green-600 flex items-center gap-1">
                <Check className="w-3 h-3" /> Mật khẩu khớp
              </p>
            )}
          </div>
          <Button
            onClick={handleChangePassword}
            disabled={changingPassword || !isPasswordFormValid}
          >
            {changingPassword ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Shield className="w-4 h-4 mr-2" />}
            Đổi mật khẩu
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Phiên đăng nhập</h3>
        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-green-800">Phiên hiện tại</p>
              <p className="text-green-600 text-xs">Đang hoạt động — Trình duyệt này</p>
            </div>
          </div>
          {profile?.lastLogin && (
            <div className="flex items-center justify-between text-gray-500 px-1">
              <span>Đăng nhập lần cuối</span>
              <span className="font-medium text-gray-700">{new Date(profile.lastLogin).toLocaleString('vi-VN')}</span>
            </div>
          )}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Xác thực hai yếu tố</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-900 font-medium">Bật 2FA</p>
            <p className="text-sm text-gray-500">Thêm một lớp bảo mật cho tài khoản của bạn</p>
          </div>
          <div className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full">
            Sắp ra mắt
          </div>
        </div>
      </Card>
    </div>
  );

  const renderNotificationsSection = () => {
    const notificationItems = [
      { key: 'deviceAlerts' as const, label: 'Cảnh báo thiết bị', description: 'Khi thiết bị offline hoặc có lỗi', enabled: true },
      { key: 'systemUpdates' as const, label: 'Cập nhật hệ thống', description: 'Thông báo về bảo trì và cập nhật', enabled: true },
      { key: 'projectActivity' as const, label: 'Hoạt động dự án', description: 'Thay đổi trong dự án của bạn', enabled: true },
    ];

    const emailItems = [
      { key: 'emailNotifications' as const, label: 'Thông báo email', description: 'Nhận thông báo qua email' },
      { key: 'weeklyReports' as const, label: 'Báo cáo tuần', description: 'Tổng hợp hoạt động hàng tuần' },
    ];

    return (
      <div className="space-y-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Thông báo trong ứng dụng</h3>
          <div className="space-y-4">
            {notificationItems.map((item) => (
              <div key={item.key} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">{item.label}</p>
                  <p className="text-sm text-gray-500">{item.description}</p>
                </div>
                <Toggle
                  checked={settingsForm[item.key] ?? false}
                  onChange={(v) => setSettingsForm({ ...settingsForm, [item.key]: v })}
                />
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Thông báo qua email</h3>
            <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full">Sắp triển khai</span>
          </div>
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-blue-700">
              Cấu hình thông báo email sẽ được kích hoạt sau khi thiết lập SMTP server. 
              Bạn có thể bật/tắt trước, cài đặt sẽ được áp dụng khi tính năng sẵn sàng.
            </p>
          </div>
          <div className="space-y-4">
            {emailItems.map((item) => (
              <div key={item.key} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">{item.label}</p>
                  <p className="text-sm text-gray-500">{item.description}</p>
                </div>
                <Toggle
                  checked={settingsForm[item.key] ?? false}
                  onChange={(v) => setSettingsForm({ ...settingsForm, [item.key]: v })}
                />
              </div>
            ))}
          </div>
        </Card>

        <div className="flex items-center justify-end gap-3">
          {isPreferencesDirty && (
            <span className="text-sm text-amber-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              Có thay đổi chưa lưu
            </span>
          )}
          <Button onClick={handleSavePreferences} disabled={saving || !isPreferencesDirty}>
            {saving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Lưu cài đặt
          </Button>
        </div>
      </div>
    );
  };

  const renderAppearanceSection = () => (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Chủ đề</h3>
        <div className="grid grid-cols-3 gap-4">
          {[
            { id: 'light' as const, name: 'Sáng', bgClass: 'bg-white border-gray-200' },
            { id: 'dark' as const, name: 'Tối', bgClass: 'bg-gray-900' },
            { id: 'auto' as const, name: 'Tự động', bgClass: 'bg-gradient-to-r from-white to-gray-900' },
          ].map((theme) => (
            <label key={theme.id} className="cursor-pointer">
              <input
                type="radio"
                name="theme"
                value={theme.id}
                checked={settingsForm.theme === theme.id}
                onChange={(e) => setSettingsForm({ ...settingsForm, theme: e.target.value as 'light' | 'dark' | 'auto' })}
                className="sr-only peer"
              />
              <div className={`border-2 rounded-xl p-4 transition-all peer-checked:border-blue-500 peer-checked:ring-2 peer-checked:ring-blue-200 ${
                settingsForm.theme === theme.id ? 'border-blue-500' : 'border-gray-200 hover:border-gray-300'
              }`}>
                <div className={`w-full h-16 rounded-lg ${theme.bgClass} border`}></div>
                <p className="text-sm font-medium text-center mt-3">{theme.name}</p>
              </div>
            </label>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Ngôn ngữ & Vùng</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ngôn ngữ</label>
            <select
              value={settingsForm.language || 'vi'}
              onChange={(e) => setSettingsForm({ ...settingsForm, language: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.value} value={lang.value}>{lang.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Múi giờ</label>
            <select
              value={settingsForm.timezone || 'Asia/Ho_Chi_Minh'}
              onChange={(e) => setSettingsForm({ ...settingsForm, timezone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>{tz.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Định dạng ngày</label>
            <select
              value={settingsForm.dateFormat || 'DD/MM/YYYY'}
              onChange={(e) => setSettingsForm({ ...settingsForm, dateFormat: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {DATE_FORMATS.map((df) => (
                <option key={df.value} value={df.value}>{df.label}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Hiển thị</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <p className="text-sm font-medium text-gray-900">Chế độ compact</p>
              <p className="text-sm text-gray-500">Sử dụng khoảng cách nhỏ hơn</p>
            </div>
            <Toggle
              checked={settingsForm.compactMode ?? false}
              onChange={(v) => setSettingsForm({ ...settingsForm, compactMode: v })}
            />
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium text-gray-900">Hiển thị lưới</p>
              <p className="text-sm text-gray-500">Hiển thị đường lưới trong SCADA editor</p>
            </div>
            <Toggle
              checked={settingsForm.showGridLines ?? true}
              onChange={(v) => setSettingsForm({ ...settingsForm, showGridLines: v })}
            />
          </div>
        </div>
      </Card>

      <div className="flex items-center justify-end gap-3">
        {isPreferencesDirty && (
          <span className="text-sm text-amber-600 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            Có thay đổi chưa lưu
          </span>
        )}
        <Button onClick={handleSavePreferences} disabled={saving || !isPreferencesDirty}>
          {saving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Lưu cài đặt
        </Button>
      </div>
    </div>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      );
    }

    switch (activeSection) {
      case 'account':
        return renderAccountSection();
      case 'security':
        return renderSecuritySection();
      case 'notifications':
        return renderNotificationsSection();
      case 'appearance':
        return renderAppearanceSection();
      default:
        return null;
    }
  };

  // ── Main Render ────────────────────────────────────────────────────────────

  return (
    <div className="h-full flex bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex-shrink-0">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Cài đặt</h2>
          <p className="text-sm text-gray-500 mt-1">Quản lý tài khoản của bạn</p>
        </div>

        <nav className="p-4">
          <ul className="space-y-1">
            {sections.map((section) => (
              <li key={section.id}>
                <button
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full text-left flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                    activeSection === section.id
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className={activeSection === section.id ? 'text-blue-600' : 'text-gray-400'}>
                    {section.icon}
                  </span>
                  <div>
                    <div className="font-medium text-sm">{section.title}</div>
                    <div className="text-xs text-gray-500">{section.description}</div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-3xl mx-auto p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              {sections.find(s => s.id === activeSection)?.title}
            </h1>
            <p className="text-gray-500 mt-1">
              {sections.find(s => s.id === activeSection)?.description}
            </p>
          </div>
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;