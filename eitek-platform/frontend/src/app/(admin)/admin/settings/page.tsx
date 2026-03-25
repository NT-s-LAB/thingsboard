'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Settings, 
  Server, 
  Mail,
  Globe,
  Shield,
  Save,
  RotateCcw,
  CheckCircle,
  Loader2,
  AlertTriangle,
  TestTube,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import {
  adminSettingsService,
  type SettingsCategory,
  DEFAULT_GENERAL_SETTINGS,
  DEFAULT_THINGSBOARD_SETTINGS,
  DEFAULT_EMAIL_SETTINGS,
  DEFAULT_BRANDING_SETTINGS,
  DEFAULT_SECURITY_SETTINGS,
} from '@/features/admin/services/adminSettingsService';

interface SettingSection {
  id: SettingsCategory;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const sections: SettingSection[] = [
  { id: 'general', title: 'Cài đặt chung', description: 'Cấu hình nền tảng cơ bản', icon: <Settings className="w-5 h-5" /> },
  { id: 'thingsboard', title: 'ThingsBoard', description: 'Tích hợp ThingsBoard', icon: <Server className="w-5 h-5" /> },
  { id: 'email', title: 'Email', description: 'Cấu hình máy chủ email', icon: <Mail className="w-5 h-5" /> },
  { id: 'branding', title: 'Thương hiệu', description: 'Giao diện nền tảng', icon: <Globe className="w-5 h-5" /> },
  { id: 'security', title: 'Bảo mật', description: 'Cài đặt bảo mật', icon: <Shield className="w-5 h-5" /> },
];

export default function AdminSettingsPage() {
  const [activeSection, setActiveSection] = useState<SettingsCategory>('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testingEmail, setTestingEmail] = useState(false);
  const [testingTB, setTestingTB] = useState(false);
  const [testResult, setTestResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [testRecipient, setTestRecipient] = useState('');

  // Form states
  const [generalSettings, setGeneralSettings] = useState(DEFAULT_GENERAL_SETTINGS);
  const [tbSettings, setTbSettings] = useState(DEFAULT_THINGSBOARD_SETTINGS);
  const [emailSettings, setEmailSettings] = useState(DEFAULT_EMAIL_SETTINGS);
  const [brandingSettings, setBrandingSettings] = useState(DEFAULT_BRANDING_SETTINGS);
  const [securitySettings, setSecuritySettings] = useState(DEFAULT_SECURITY_SETTINGS);

  // Password visibility
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  // Load settings
  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminSettingsService.getAll();

      // Extract values from grouped settings
      setGeneralSettings(
        adminSettingsService.extractCategoryValues(data, 'general', DEFAULT_GENERAL_SETTINGS)
      );
      setTbSettings(
        adminSettingsService.extractCategoryValues(data, 'thingsboard', DEFAULT_THINGSBOARD_SETTINGS)
      );
      setEmailSettings(
        adminSettingsService.extractCategoryValues(data, 'email', DEFAULT_EMAIL_SETTINGS)
      );
      setBrandingSettings(
        adminSettingsService.extractCategoryValues(data, 'branding', DEFAULT_BRANDING_SETTINGS)
      );
      setSecuritySettings(
        adminSettingsService.extractCategoryValues(data, 'security', DEFAULT_SECURITY_SETTINGS)
      );
    } catch (err: any) {
      setError(err.message || 'Không thể tải cài đặt');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Save current section
  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      let settings: Record<string, any> = {};
      switch (activeSection) {
        case 'general':
          settings = generalSettings;
          break;
        case 'thingsboard':
          settings = tbSettings;
          break;
        case 'email':
          settings = emailSettings;
          break;
        case 'branding':
          settings = brandingSettings;
          break;
        case 'security':
          settings = securitySettings;
          break;
      }

      await adminSettingsService.updateCategory(activeSection, settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      setError(err.message || 'Không thể lưu cài đặt');
    } finally {
      setSaving(false);
    }
  };

  // Reset to defaults
  const handleReset = async () => {
    if (!confirm('Bạn có chắc muốn khôi phục tất cả cài đặt về giá trị mặc định?')) return;

    try {
      setSaving(true);
      await adminSettingsService.resetToDefaults();
      await loadSettings();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      setError(err.message || 'Không thể khôi phục cài đặt');
    } finally {
      setSaving(false);
    }
  };

  // Test email
  const handleTestEmail = async () => {
    try {
      setTestingEmail(true);
      setTestResult(null);
      const result = await adminSettingsService.testEmail({
        recipient: testRecipient || undefined,
        ...emailSettings,
      });
      setTestResult({ type: result.success ? 'success' : 'error', message: result.message });
    } catch (err: any) {
      setTestResult({ type: 'error', message: err.message });
    } finally {
      setTestingEmail(false);
    }
  };

  // Test ThingsBoard
  const handleTestThingsBoard = async () => {
    try {
      setTestingTB(true);
      setTestResult(null);
      const result = await adminSettingsService.testThingsBoard();
      setTestResult({ type: result.success ? 'success' : 'error', message: result.message });
    } catch (err: any) {
      setTestResult({ type: 'error', message: err.message });
    } finally {
      setTestingTB(false);
    }
  };

  const togglePasswordVisibility = (key: string) => {
    setShowPasswords((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Render sections
  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Cài đặt chung</h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Tên nền tảng</label>
            <Input
              value={generalSettings.platformName}
              onChange={(e) => setGeneralSettings({ ...generalSettings, platformName: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">URL nền tảng</label>
            <Input
              value={generalSettings.platformUrl}
              onChange={(e) => setGeneralSettings({ ...generalSettings, platformUrl: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Múi giờ mặc định</label>
            <select
              value={generalSettings.defaultTimezone}
              onChange={(e) => setGeneralSettings({ ...generalSettings, defaultTimezone: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="Asia/Ho_Chi_Minh">Asia/Ho Chi Minh (GMT+7)</option>
              <option value="Asia/Bangkok">Asia/Bangkok (GMT+7)</option>
              <option value="Asia/Singapore">Asia/Singapore (GMT+8)</option>
              <option value="UTC">UTC</option>
              <option value="America/New_York">America/New_York (EST)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Ngôn ngữ mặc định</label>
            <select
              value={generalSettings.defaultLanguage}
              onChange={(e) => setGeneralSettings({ ...generalSettings, defaultLanguage: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="vi">Tiếng Việt</option>
              <option value="en">English</option>
              <option value="zh">中文</option>
            </select>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200 pt-6">
        <h3 className="text-md font-medium text-slate-900 mb-4">Cài đặt phiên</h3>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Thời gian hết phiên (phút)</label>
            <Input
              type="number"
              value={generalSettings.sessionTimeout}
              onChange={(e) => setGeneralSettings({ ...generalSettings, sessionTimeout: parseInt(e.target.value) || 60 })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Số lần đăng nhập sai tối đa</label>
            <Input
              type="number"
              value={generalSettings.maxLoginAttempts}
              onChange={(e) => setGeneralSettings({ ...generalSettings, maxLoginAttempts: parseInt(e.target.value) || 5 })}
            />
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-md font-medium text-slate-900">Chế độ bảo trì</h3>
            <p className="text-sm text-slate-500">Khi bật, chỉ Super Admin mới có thể truy cập</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={generalSettings.maintenanceMode}
              onChange={(e) => setGeneralSettings({ ...generalSettings, maintenanceMode: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>
    </div>
  );

  const renderThingsBoardSettings = () => (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">Tích hợp ThingsBoard</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">ThingsBoard URL</label>
          <Input
            value={tbSettings.url}
            onChange={(e) => setTbSettings({ ...tbSettings, url: e.target.value })}
            placeholder="https://thingsboard.cloud"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">System Admin Username</label>
          <Input
            value={tbSettings.username}
            onChange={(e) => setTbSettings({ ...tbSettings, username: e.target.value })}
            placeholder="sysadmin@thingsboard.org"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">System Admin Password</label>
          <div className="relative">
            <Input
              type={showPasswords.tbPassword ? 'text' : 'password'}
              value={tbSettings.password}
              onChange={(e) => setTbSettings({ ...tbSettings, password: e.target.value })}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility('tbPassword')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPasswords.tbPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="tb-sync"
              checked={tbSettings.autoSync}
              onChange={(e) => setTbSettings({ ...tbSettings, autoSync: e.target.checked })}
              className="rounded"
            />
            <label htmlFor="tb-sync" className="text-sm text-slate-700">
              Bật đồng bộ thiết bị tự động
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Khoảng thời gian đồng bộ (giây)</label>
            <Input
              type="number"
              value={tbSettings.syncInterval}
              onChange={(e) => setTbSettings({ ...tbSettings, syncInterval: parseInt(e.target.value) || 300 })}
            />
          </div>
        </div>
        <Button variant="outline" onClick={handleTestThingsBoard} disabled={testingTB}>
          {testingTB ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <TestTube className="w-4 h-4 mr-2" />}
          Kiểm tra kết nối
        </Button>
        {testResult && activeSection === 'thingsboard' && (
          <div className={`p-3 rounded-lg text-sm ${testResult.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {testResult.message}
          </div>
        )}
      </div>
    </div>
  );

  const renderEmailSettings = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Cấu hình Email</h2>
        <button
          type="button"
          onClick={() => setEmailSettings({ ...emailSettings, enabled: !emailSettings.enabled })}
          className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            emailSettings.enabled ? 'bg-blue-600' : 'bg-gray-200'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              emailSettings.enabled ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {!emailSettings.enabled && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-50 border border-amber-200">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
          <p className="text-sm text-amber-700">
            Tính năng gửi email đang <strong>tắt</strong>. Bật để cấu hình và sử dụng email (thông báo, khôi phục mật khẩu, v.v.).
          </p>
        </div>
      )}

      <fieldset disabled={!emailSettings.enabled} className={!emailSettings.enabled ? 'opacity-50 pointer-events-none' : ''}>
        <div className="space-y-6">
          {/* Provider Selection */}
          <div>
            <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wide mb-3">Nhà cung cấp Email</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setEmailSettings({ ...emailSettings, provider: 'smtp' })}
                className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                  emailSettings.provider === 'smtp'
                    ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-200'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  emailSettings.provider === 'smtp' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'
                }`}>
                  <Server className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className={`font-medium text-sm ${emailSettings.provider === 'smtp' ? 'text-blue-700' : 'text-slate-700'}`}>SMTP</p>
                  <p className="text-xs text-slate-500">Gmail, Office365, Custom SMTP</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setEmailSettings({ ...emailSettings, provider: 'resend' })}
                className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                  emailSettings.provider === 'resend'
                    ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-200'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  emailSettings.provider === 'resend' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'
                }`}>
                  <Mail className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className={`font-medium text-sm ${emailSettings.provider === 'resend' ? 'text-blue-700' : 'text-slate-700'}`}>Resend</p>
                  <p className="text-xs text-slate-500">API-based email service</p>
                </div>
              </button>
            </div>
          </div>

          {/* SMTP Settings */}
          {emailSettings.provider === 'smtp' && (
            <div>
              <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wide mb-3">Máy chủ SMTP</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">SMTP Host</label>
                  <Input
                    value={emailSettings.smtpHost}
                    onChange={(e) => setEmailSettings({ ...emailSettings, smtpHost: e.target.value })}
                    placeholder="smtp.gmail.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">SMTP Port</label>
                  <Input
                    type="number"
                    value={emailSettings.smtpPort}
                    onChange={(e) => setEmailSettings({ ...emailSettings, smtpPort: parseInt(e.target.value) || 587 })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">SMTP Username</label>
                  <Input
                    value={emailSettings.smtpUsername}
                    onChange={(e) => setEmailSettings({ ...emailSettings, smtpUsername: e.target.value })}
                    placeholder="user@gmail.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">SMTP Password</label>
                  <div className="relative">
                    <Input
                      type={showPasswords.smtpPassword ? 'text' : 'password'}
                      value={emailSettings.smtpPassword}
                      onChange={(e) => setEmailSettings({ ...emailSettings, smtpPassword: e.target.value })}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('smtpPassword')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.smtpPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3 mt-3">
                <input
                  type="checkbox"
                  id="smtp-secure"
                  checked={emailSettings.smtpSecure}
                  onChange={(e) => setEmailSettings({ ...emailSettings, smtpSecure: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="smtp-secure" className="text-sm text-slate-700">Sử dụng TLS/SSL</label>
              </div>
            </div>
          )}

          {/* Resend Settings */}
          {emailSettings.provider === 'resend' && (
            <div>
              <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wide mb-3">Resend API</h3>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">API Key</label>
                <div className="relative">
                  <Input
                    type={showPasswords.resendApiKey ? 'text' : 'password'}
                    value={emailSettings.resendApiKey}
                    onChange={(e) => setEmailSettings({ ...emailSettings, resendApiKey: e.target.value })}
                    placeholder="re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('resendApiKey')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.resendApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="mt-1.5 text-xs text-slate-500">
                  Lấy API Key tại{' '}
                  <a href="https://resend.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    resend.com/api-keys
                  </a>
                </p>
              </div>
            </div>
          )}

          {/* Sender Info */}
          <div className="border-t border-slate-200 pt-4">
            <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wide mb-3">Thông tin người gửi</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tên người gửi</label>
                <Input
                  value={emailSettings.fromName}
                  onChange={(e) => setEmailSettings({ ...emailSettings, fromName: e.target.value })}
                  placeholder="EITEK Platform"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email người gửi</label>
                <Input
                  value={emailSettings.fromEmail}
                  onChange={(e) => setEmailSettings({ ...emailSettings, fromEmail: e.target.value })}
                  placeholder="noreply@eitek.com"
                />
                {emailSettings.provider === 'resend' && (
                  <p className="mt-1 text-xs text-slate-500">Domain phải được xác minh trên Resend</p>
                )}
              </div>
            </div>
          </div>

          {/* Test Email */}
          <div className="border-t border-slate-200 pt-4">
            <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wide mb-3">Kiểm tra kết nối</h3>
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">Email nhận thử (tùy chọn)</label>
                <Input
                  type="email"
                  value={testRecipient}
                  onChange={(e) => setTestRecipient(e.target.value)}
                  placeholder="admin@eitek.com"
                />
              </div>
              <Button variant="outline" onClick={handleTestEmail} disabled={testingEmail} className="shrink-0">
                {testingEmail ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <TestTube className="w-4 h-4 mr-2" />}
                {testRecipient ? 'Gửi email kiểm tra' : 'Kiểm tra kết nối'}
              </Button>
            </div>
            {testResult && activeSection === 'email' && (
              <div className={`mt-3 p-3 rounded-lg text-sm flex items-start gap-2 ${
                testResult.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {testResult.type === 'success' ? <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" /> : <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />}
                <span>{testResult.message}</span>
              </div>
            )}
          </div>
        </div>
      </fieldset>
    </div>
  );

  const renderBrandingSettings = () => (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">Cài đặt thương hiệu</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">URL Logo</label>
          <Input
            value={brandingSettings.logoUrl}
            onChange={(e) => setBrandingSettings({ ...brandingSettings, logoUrl: e.target.value })}
            placeholder="https://example.com/logo.png"
          />
          {brandingSettings.logoUrl && (
            <div className="mt-2 p-4 bg-slate-100 rounded-lg">
              <img src={brandingSettings.logoUrl} alt="Logo preview" className="h-12 object-contain" />
            </div>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">URL Favicon</label>
          <Input
            value={brandingSettings.faviconUrl}
            onChange={(e) => setBrandingSettings({ ...brandingSettings, faviconUrl: e.target.value })}
            placeholder="https://example.com/favicon.ico"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Màu chính</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={brandingSettings.primaryColor}
                onChange={(e) => setBrandingSettings({ ...brandingSettings, primaryColor: e.target.value })}
                className="w-12 h-10 rounded cursor-pointer border border-slate-200"
              />
              <Input
                value={brandingSettings.primaryColor}
                onChange={(e) => setBrandingSettings({ ...brandingSettings, primaryColor: e.target.value })}
                className="w-32"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Màu phụ</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={brandingSettings.secondaryColor}
                onChange={(e) => setBrandingSettings({ ...brandingSettings, secondaryColor: e.target.value })}
                className="w-12 h-10 rounded cursor-pointer border border-slate-200"
              />
              <Input
                value={brandingSettings.secondaryColor}
                onChange={(e) => setBrandingSettings({ ...brandingSettings, secondaryColor: e.target.value })}
                className="w-32"
              />
            </div>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Văn bản footer</label>
          <Input
            value={brandingSettings.footerText}
            onChange={(e) => setBrandingSettings({ ...brandingSettings, footerText: e.target.value })}
          />
        </div>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">Cài đặt bảo mật</h2>
      
      <div className="bg-slate-50 rounded-lg p-4">
        <h3 className="text-md font-medium text-slate-900 mb-4">Yêu cầu mật khẩu</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Độ dài tối thiểu</label>
            <Input
              type="number"
              value={securitySettings.passwordMinLength}
              onChange={(e) => setSecuritySettings({ ...securitySettings, passwordMinLength: parseInt(e.target.value) || 8 })}
            />
          </div>
          <div className="space-y-3 pt-6">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={securitySettings.passwordRequireUppercase}
                onChange={(e) => setSecuritySettings({ ...securitySettings, passwordRequireUppercase: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm text-slate-700">Yêu cầu chữ hoa</span>
            </label>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={securitySettings.passwordRequireLowercase}
                onChange={(e) => setSecuritySettings({ ...securitySettings, passwordRequireLowercase: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm text-slate-700">Yêu cầu chữ thường</span>
            </label>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={securitySettings.passwordRequireNumber}
                onChange={(e) => setSecuritySettings({ ...securitySettings, passwordRequireNumber: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm text-slate-700">Yêu cầu số</span>
            </label>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={securitySettings.passwordRequireSpecial}
                onChange={(e) => setSecuritySettings({ ...securitySettings, passwordRequireSpecial: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm text-slate-700">Yêu cầu ký tự đặc biệt</span>
            </label>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-md font-medium text-slate-900">Xác thực hai yếu tố (2FA)</h3>
            <p className="text-sm text-slate-500">Yêu cầu 2FA cho tất cả người dùng</p>
          </div>
          <div className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full">
            Sắp ra mắt
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      );
    }

    switch (activeSection) {
      case 'general':
        return renderGeneralSettings();
      case 'thingsboard':
        return renderThingsBoardSettings();
      case 'email':
        return renderEmailSettings();
      case 'branding':
        return renderBrandingSettings();
      case 'security':
        return renderSecuritySettings();
      default:
        return null;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Cài đặt hệ thống</h1>
          <p className="text-slate-500 mt-1">Cấu hình toàn nền tảng</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleReset} disabled={saving}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Khôi phục mặc định
          </Button>
          <Button onClick={handleSave} disabled={saving || loading} className="bg-blue-600 hover:bg-blue-700">
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : saved ? (
              <CheckCircle className="w-4 h-4 mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {saved ? 'Đã lưu!' : 'Lưu thay đổi'}
          </Button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-64 space-y-1">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => {
                setActiveSection(section.id);
                setTestResult(null);
              }}
              className={`w-full flex items-center px-4 py-3 rounded-lg text-left transition-colors ${
                activeSection === section.id
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span className={`mr-3 ${activeSection === section.id ? 'text-blue-600' : 'text-slate-400'}`}>
                {section.icon}
              </span>
              <div>
                <p className="font-medium text-sm">{section.title}</p>
                <p className="text-xs text-slate-500">{section.description}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
