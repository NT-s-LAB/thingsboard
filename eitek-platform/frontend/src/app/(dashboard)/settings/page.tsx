'use client';

import React, { useState } from 'react';
import { Settings, User, Shield, Bell, Palette, Database, Globe, Code, Save } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Card } from '@/shared/components/ui/Card';

interface SettingsSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
}

const SettingsPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState('general');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const sections: SettingsSection[] = [
    {
      id: 'general',
      title: 'General',
      icon: <Settings className="w-5 h-5" />,
      description: 'Basic application settings'
    },
    {
      id: 'account',
      title: 'Account',
      icon: <User className="w-5 h-5" />,
      description: 'User profile and preferences'
    },
    {
      id: 'security',
      title: 'Security',
      icon: <Shield className="w-5 h-5" />,
      description: 'Authentication and security settings'
    },
    {
      id: 'notifications',
      title: 'Notifications',
      icon: <Bell className="w-5 h-5" />,
      description: 'Alert and notification preferences'
    },
    {
      id: 'appearance',
      title: 'Appearance',
      icon: <Palette className="w-5 h-5" />,
      description: 'Theme and display settings'
    },
    {
      id: 'database',
      title: 'Database',
      icon: <Database className="w-5 h-5" />,
      description: 'Database connection and settings'
    },
    {
      id: 'api',
      title: 'API',
      icon: <Globe className="w-5 h-5" />,
      description: 'API keys and external integrations'
    },
    {
      id: 'advanced',
      title: 'Advanced',
      icon: <Code className="w-5 h-5" />,
      description: 'Advanced configuration options'
    }
  ];

  const handleSave = () => {
    // TODO: Implement save functionality
    setHasUnsavedChanges(false);
    console.log('Settings saved');
  };

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Application Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Application Name
            </label>
            <Input
              type="text"
              defaultValue="EITEK Platform"
              onChange={() => setHasUnsavedChanges(true)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Organization
            </label>
            <Input
              type="text"
              defaultValue="EITEK Corporation"
              onChange={() => setHasUnsavedChanges(true)}
            />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Regional Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Language
            </label>
            <select
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              onChange={() => setHasUnsavedChanges(true)}
            >
              <option value="en">English</option>
              <option value="vi">Tiếng Việt</option>
              <option value="zh">中文</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Timezone
            </label>
            <select
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              onChange={() => setHasUnsavedChanges(true)}
            >
              <option value="Asia/Ho_Chi_Minh">Asia/Ho Chi Minh</option>
              <option value="Asia/Tokyo">Asia/Tokyo</option>
              <option value="UTC">UTC</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date Format
            </label>
            <select
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              onChange={() => setHasUnsavedChanges(true)}
            >
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderAccountSettings = () => (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Profile Information</h3>
        <div className="flex items-center space-x-6 mb-6">
          <div className="w-20 h-20 bg-gray-300 rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-gray-600" />
          </div>
          <div>
            <Button variant="outline" size="sm">Change Avatar</Button>
            <p className="text-sm text-gray-500 mt-1">JPG, GIF or PNG. Max size of 2MB.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              First Name
            </label>
            <Input
              type="text"
              defaultValue="John"
              onChange={() => setHasUnsavedChanges(true)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Last Name
            </label>
            <Input
              type="text"
              defaultValue="Doe"
              onChange={() => setHasUnsavedChanges(true)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <Input
              type="email"
              defaultValue="john.doe@eitek.com"
              onChange={() => setHasUnsavedChanges(true)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            <Input
              type="tel"
              defaultValue="+84 123 456 789"
              onChange={() => setHasUnsavedChanges(true)}
            />
          </div>
        </div>
      </Card>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Password</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Password
            </label>
            <Input
              type="password"
              placeholder="Enter current password"
              onChange={() => setHasUnsavedChanges(true)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <Input
              type="password"
              placeholder="Enter new password"
              onChange={() => setHasUnsavedChanges(true)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm New Password
            </label>
            <Input
              type="password"
              placeholder="Confirm new password"
              onChange={() => setHasUnsavedChanges(true)}
            />
          </div>
          <Button>Update Password</Button>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Two-Factor Authentication</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-900 font-medium">Enable 2FA</p>
            <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
          </div>
          <input
            type="checkbox"
            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            onChange={() => setHasUnsavedChanges(true)}
          />
        </div>
      </Card>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Email Notifications</h3>
        <div className="space-y-4">
          {[
            { id: 'device_alerts', label: 'Device Alerts', description: 'Get notified when devices go offline or trigger alarms' },
            { id: 'system_updates', label: 'System Updates', description: 'Receive notifications about system updates and maintenance' },
            { id: 'project_activity', label: 'Project Activity', description: 'Get notified about changes to your projects' },
            { id: 'weekly_reports', label: 'Weekly Reports', description: 'Receive weekly summary reports' }
          ].map((notification) => (
            <div key={notification.id} className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-900 font-medium">{notification.label}</p>
                <p className="text-sm text-gray-500">{notification.description}</p>
              </div>
              <input
                type="checkbox"
                defaultChecked
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                onChange={() => setHasUnsavedChanges(true)}
              />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );

  const renderAppearanceSettings = () => (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Theme</h3>
        <div className="grid grid-cols-3 gap-4">
          {[
            { id: 'light', name: 'Light', preview: 'bg-white border-gray-300' },
            { id: 'dark', name: 'Dark', preview: 'bg-gray-900 border-gray-600' },
            { id: 'auto', name: 'Auto', preview: 'bg-gradient-to-r from-white to-gray-900' }
          ].map((theme) => (
            <label key={theme.id} className="cursor-pointer">
              <input
                type="radio"
                name="theme"
                value={theme.id}
                defaultChecked={theme.id === 'light'}
                className="sr-only"
                onChange={() => setHasUnsavedChanges(true)}
              />
              <div className="border-2 border-gray-300 rounded-lg p-4 hover:border-primary-500">
                <div className={`w-full h-16 rounded ${theme.preview} mb-2`}></div>
                <p className="text-sm font-medium text-center">{theme.name}</p>
              </div>
            </label>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Display</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-900 font-medium">Compact Mode</p>
              <p className="text-sm text-gray-500">Use smaller spacing and elements</p>
            </div>
            <input
              type="checkbox"
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              onChange={() => setHasUnsavedChanges(true)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-900 font-medium">Show Grid Lines</p>
              <p className="text-sm text-gray-500">Display grid lines in SCADA editor</p>
            </div>
            <input
              type="checkbox"
              defaultChecked
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              onChange={() => setHasUnsavedChanges(true)}
            />
          </div>
        </div>
      </Card>
    </div>
  );

  const renderDatabaseSettings = () => (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Connection</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Host
            </label>
            <Input
              type="text"
              defaultValue="localhost"
              onChange={() => setHasUnsavedChanges(true)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Port
              </label>
              <Input
                type="number"
                defaultValue="5432"
                onChange={() => setHasUnsavedChanges(true)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Database
              </label>
              <Input
                type="text"
                defaultValue="eitek_platform"
                onChange={() => setHasUnsavedChanges(true)}
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline">Test Connection</Button>
            <span className="text-sm text-green-600">✓ Connected</span>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'general':
        return renderGeneralSettings();
      case 'account':
        return renderAccountSettings();
      case 'security':
        return renderSecuritySettings();
      case 'notifications':
        return renderNotificationSettings();
      case 'appearance':
        return renderAppearanceSettings();
      case 'database':
        return renderDatabaseSettings();
      case 'api':
        return (
          <Card className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">API Configuration</h3>
            <p className="text-gray-500">API settings will be implemented here.</p>
          </Card>
        );
      case 'advanced':
        return (
          <Card className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Advanced Settings</h3>
            <p className="text-gray-500">Advanced configuration options will be implemented here.</p>
          </Card>
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-full flex bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Settings</h2>
          <p className="text-sm text-gray-600">Manage your platform preferences</p>
        </div>
        
        <nav className="p-4">
          <ul className="space-y-2">
            {sections.map((section) => (
              <li key={section.id}>
                <button
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full text-left flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                    activeSection === section.id
                      ? 'bg-primary-50 text-primary-700 border border-primary-200'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="mr-3">{section.icon}</span>
                  <div>
                    <div className="font-medium">{section.title}</div>
                    <div className="text-xs text-gray-500">{section.description}</div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {sections.find(s => s.id === activeSection)?.title}
              </h1>
              <p className="text-sm text-gray-600">
                {sections.find(s => s.id === activeSection)?.description}
              </p>
            </div>

            {hasUnsavedChanges && (
              <div className="flex items-center space-x-3">
                <span className="text-sm text-orange-600">You have unsaved changes</span>
                <Button onClick={handleSave}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          <div className="max-w-4xl mx-auto p-6">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;