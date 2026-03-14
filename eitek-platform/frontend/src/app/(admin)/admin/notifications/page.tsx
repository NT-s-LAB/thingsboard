'use client';

import React, { useState } from 'react';
import { 
  Bell, 
  CheckCircle,
  AlertTriangle,
  Info,
  XCircle,
  Trash2,
  CheckCheck,
  Filter,
  Settings,
  Clock,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';

interface Notification {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  source: string;
}

// Mock data
const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'success',
    title: 'Tenant Created Successfully',
    message: 'New tenant "Acme Corp" has been created and is ready for use.',
    timestamp: '2024-03-14T10:30:00',
    read: false,
    source: 'System',
  },
  {
    id: '2',
    type: 'warning',
    title: 'High Resource Usage',
    message: 'Tenant "EITEK Corporation" is approaching device limit (850/1000).',
    timestamp: '2024-03-14T09:15:00',
    read: false,
    source: 'Monitoring',
  },
  {
    id: '3',
    type: 'error',
    title: 'ThingsBoard Connection Failed',
    message: 'Unable to connect to ThingsBoard server. Retrying in 5 minutes.',
    timestamp: '2024-03-14T08:45:00',
    read: true,
    source: 'Integration',
  },
  {
    id: '4',
    type: 'info',
    title: 'System Maintenance Scheduled',
    message: 'Platform maintenance scheduled for March 15, 2024 at 02:00 UTC.',
    timestamp: '2024-03-13T16:00:00',
    read: true,
    source: 'System',
  },
  {
    id: '5',
    type: 'success',
    title: 'Backup Completed',
    message: 'Daily database backup completed successfully. Size: 2.3GB',
    timestamp: '2024-03-14T03:00:00',
    read: true,
    source: 'Backup',
  },
];

const typeConfig = {
  success: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50', border: 'border-green-200' },
  warning: { icon: AlertTriangle, color: 'text-yellow-500', bg: 'bg-yellow-50', border: 'border-yellow-200' },
  error: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200' },
  info: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-200' },
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const filteredNotifications = notifications.filter(n => 
    filter === 'all' || !n.read
  );

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notification Center</h1>
          <p className="text-slate-500 mt-1">
            {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={markAllAsRead} disabled={unreadCount === 0}>
            <CheckCheck className="w-4 h-4 mr-2" />
            Mark All Read
          </Button>
          <Button variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="flex items-center gap-4">
          <Filter className="w-4 h-4 text-slate-400" />
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all' 
                  ? 'bg-slate-900 text-white' 
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'unread' 
                  ? 'bg-slate-900 text-white' 
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.map((notification) => {
          const config = typeConfig[notification.type];
          const Icon = config.icon;
          
          return (
            <div
              key={notification.id}
              className={`bg-white rounded-xl shadow-sm border overflow-hidden transition-all ${
                notification.read ? 'border-slate-200' : `${config.border} ${config.bg}`
              }`}
            >
              <div className="p-5">
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg ${config.bg}`}>
                    <Icon className={`w-5 h-5 ${config.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className={`font-semibold ${notification.read ? 'text-slate-700' : 'text-slate-900'}`}>
                          {notification.title}
                        </h3>
                        <p className="text-sm text-slate-500 mt-1">{notification.message}</p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        {!notification.read && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => markAsRead(notification.id)}
                            title="Mark as read"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => deleteNotification(notification.id)}
                          className="text-red-600 hover:text-red-700"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
                      <span className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {formatTime(notification.timestamp)}
                      </span>
                      <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-500">
                        {notification.source}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {filteredNotifications.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <Bell className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">
              {filter === 'unread' ? 'No unread notifications' : 'No notifications'}
            </p>
          </div>
        )}
      </div>

      {/* Notification Settings Summary */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-900 mb-4">Notification Preferences</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-2">
            <input type="checkbox" id="email-notify" className="rounded" defaultChecked />
            <label htmlFor="email-notify" className="text-sm text-slate-600">Email Alerts</label>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="push-notify" className="rounded" defaultChecked />
            <label htmlFor="push-notify" className="text-sm text-slate-600">Push Notifications</label>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="slack-notify" className="rounded" />
            <label htmlFor="slack-notify" className="text-sm text-slate-600">Slack Integration</label>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="telegram-notify" className="rounded" />
            <label htmlFor="telegram-notify" className="text-sm text-slate-600">Telegram Bot</label>
          </div>
        </div>
      </div>
    </div>
  );
}
