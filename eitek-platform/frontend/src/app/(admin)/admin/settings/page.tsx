'use client';

import React, { useState } from 'react';
import { 
  Settings, 
  Server, 
  Mail,
  Database,
  Globe,
  Shield,
  Save,
  RotateCcw,
  CheckCircle,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';

interface SettingSection {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const sections: SettingSection[] = [
  { id: 'general', title: 'General', description: 'Basic platform settings', icon: <Settings className="w-5 h-5" /> },
  { id: 'thingsboard', title: 'ThingsBoard', description: 'ThingsBoard integration', icon: <Server className="w-5 h-5" /> },
  { id: 'email', title: 'Email', description: 'Email server configuration', icon: <Mail className="w-5 h-5" /> },
  { id: 'database', title: 'Database', description: 'Database settings', icon: <Database className="w-5 h-5" /> },
  { id: 'branding', title: 'Branding', description: 'Platform appearance', icon: <Globe className="w-5 h-5" /> },
];

export default function AdminSettingsPage() {
  const [activeSection, setActiveSection] = useState('general');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">System Settings</h1>
          <p className="text-slate-500 mt-1">Configure platform-wide settings</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button onClick={handleSave} className="bg-red-600 hover:bg-red-700">
            {saved ? <CheckCircle className="w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            {saved ? 'Saved!' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-64 space-y-1">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`w-full flex items-center px-4 py-3 rounded-lg text-left transition-colors ${
                activeSection === section.id
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span className={`mr-3 ${activeSection === section.id ? 'text-red-600' : 'text-slate-400'}`}>
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
          {activeSection === 'general' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 mb-4">General Settings</h2>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Platform Name
                    </label>
                    <Input defaultValue="EITEK IoT Platform" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Platform URL
                    </label>
                    <Input defaultValue="https://iot.eitek.com" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Default Timezone
                    </label>
                    <select className="w-full px-3 py-2 border border-slate-200 rounded-lg">
                      <option>Asia/Ho_Chi_Minh</option>
                      <option>UTC</option>
                      <option>America/New_York</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Default Language
                    </label>
                    <select className="w-full px-3 py-2 border border-slate-200 rounded-lg">
                      <option>Vietnamese</option>
                      <option>English</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-6">
                <h3 className="text-md font-medium text-slate-900 mb-4">Session Settings</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Session Timeout (minutes)
                    </label>
                    <Input type="number" defaultValue={60} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Max Login Attempts
                    </label>
                    <Input type="number" defaultValue={5} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'thingsboard' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">ThingsBoard Integration</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    ThingsBoard URL
                  </label>
                  <Input defaultValue="https://thingsboard.cloud" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    System Admin Username
                  </label>
                  <Input defaultValue="sysadmin@thingsboard.org" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    System Admin Password
                  </label>
                  <Input type="password" defaultValue="••••••••" />
                </div>
                <div className="flex items-center space-x-3">
                  <input type="checkbox" id="tb-sync" className="rounded" defaultChecked />
                  <label htmlFor="tb-sync" className="text-sm text-slate-700">
                    Enable automatic device synchronization
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'email' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Email Configuration</h2>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    SMTP Host
                  </label>
                  <Input defaultValue="smtp.gmail.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    SMTP Port
                  </label>
                  <Input type="number" defaultValue={587} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    SMTP Username
                  </label>
                  <Input defaultValue="noreply@eitek.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    SMTP Password
                  </label>
                  <Input type="password" defaultValue="••••••••" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    From Name
                  </label>
                  <Input defaultValue="EITEK Platform" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    From Email
                  </label>
                  <Input defaultValue="noreply@eitek.com" />
                </div>
              </div>
              <Button variant="outline" className="mt-4">
                <Mail className="w-4 h-4 mr-2" />
                Send Test Email
              </Button>
            </div>
          )}

          {activeSection === 'database' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Database Settings</h2>
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500">Database Type:</span>
                    <span className="ml-2 font-medium text-slate-900">PostgreSQL</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Host:</span>
                    <span className="ml-2 font-medium text-slate-900">localhost:5432</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Database:</span>
                    <span className="ml-2 font-medium text-slate-900">eitek_platform</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Connection Pool:</span>
                    <span className="ml-2 font-medium text-slate-900">10 connections</span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-amber-600 flex items-center">
                <Shield className="w-4 h-4 mr-2" />
                Database credentials are managed via environment variables for security.
              </p>
            </div>
          )}

          {activeSection === 'branding' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Branding Settings</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Logo (Light Theme)
                  </label>
                  <div className="border-2 border-dashed border-slate-200 rounded-lg p-8 text-center">
                    <p className="text-sm text-slate-500">Drop image here or click to upload</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Primary Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input type="color" defaultValue="#dc2626" className="w-12 h-10 rounded cursor-pointer" />
                    <Input defaultValue="#dc2626" className="w-32" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Favicon
                  </label>
                  <div className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center">
                    <p className="text-sm text-slate-500">Upload .ico or .png (32x32)</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
