'use client';

import React, { useState } from 'react';
import {
  Bell,
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
  Loader2,
  Filter,
  XCircle,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { useNotifications } from '@/shared/stores/notificationStore';
import type { NotificationType, AppNotification } from '@/shared/services/notificationService';

const NOTIFICATION_ICON: Record<NotificationType, React.ReactNode> = {
  DEVICE_OFFLINE: <WifiOff className="w-5 h-5 text-red-500" />,
  DEVICE_ONLINE: <Wifi className="w-5 h-5 text-green-500" />,
  DEVICE_ALARM: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
  SYSTEM_UPDATE: <Server className="w-5 h-5 text-blue-500" />,
  SYSTEM_MAINTENANCE: <Wrench className="w-5 h-5 text-orange-500" />,
  ADMIN_MESSAGE: <Megaphone className="w-5 h-5 text-purple-500" />,
  ACCOUNT_ACTIVITY: <UserCheck className="w-5 h-5 text-teal-500" />,
  PROJECT_UPDATE: <FolderOpen className="w-5 h-5 text-indigo-500" />,
};

const NOTIFICATION_LABEL: Record<NotificationType, string> = {
  DEVICE_OFFLINE: 'Thiết bị offline',
  DEVICE_ONLINE: 'Thiết bị online',
  DEVICE_ALARM: 'Cảnh báo thiết bị',
  SYSTEM_UPDATE: 'Cập nhật hệ thống',
  SYSTEM_MAINTENANCE: 'Bảo trì hệ thống',
  ADMIN_MESSAGE: 'Thông báo từ Admin',
  ACCOUNT_ACTIVITY: 'Hoạt động tài khoản',
  PROJECT_UPDATE: 'Cập nhật dự án',
};

const PRIORITY_COLOR: Record<string, string> = {
  LOW: 'bg-gray-100 text-gray-600',
  NORMAL: 'bg-blue-100 text-blue-700',
  HIGH: 'bg-orange-100 text-orange-700',
  CRITICAL: 'bg-red-100 text-red-700',
};

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Vừa xong';
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ngày trước`;
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

type FilterType = 'all' | 'unread' | NotificationType;

function NotificationItem({
  n,
  onMarkRead,
  onDelete,
}: {
  n: AppNotification;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div
      className={`flex items-start gap-4 p-4 rounded-lg border transition-colors ${
        !n.isRead ? 'bg-blue-50/60 border-blue-200' : 'bg-white border-gray-200 hover:bg-gray-50'
      }`}
    >
      <div className="mt-0.5 flex-shrink-0">
        {NOTIFICATION_ICON[n.type] || <Info className="w-5 h-5 text-gray-400" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-sm font-medium ${!n.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
            {n.title}
          </span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${PRIORITY_COLOR[n.priority] || PRIORITY_COLOR.NORMAL}`}>
            {n.priority}
          </span>
          <span className="text-[11px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
            {NOTIFICATION_LABEL[n.type] || n.type}
          </span>
        </div>
        <p className="text-sm text-gray-600">{n.message}</p>
        <p className="text-xs text-gray-400 mt-1">{formatTime(n.createdAt)}</p>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        {!n.isRead && (
          <button
            onClick={() => onMarkRead(n.id)}
            className="p-1.5 text-gray-400 hover:text-blue-600 rounded hover:bg-blue-50"
            title="Đánh dấu đã đọc"
          >
            <CheckCheck className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={() => onDelete(n.id)}
          className="p-1.5 text-gray-400 hover:text-red-600 rounded hover:bg-red-50"
          title="Xóa"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  const {
    notifications,
    unreadCount,
    loading,
    hasMore,
    loadMore,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllRead,
  } = useNotifications();

  const [filter, setFilter] = useState<FilterType>('all');

  const filtered = notifications.filter((n) => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !n.isRead;
    return n.type === filter;
  });

  const filterOptions: { value: FilterType; label: string }[] = [
    { value: 'all', label: 'Tất cả' },
    { value: 'unread', label: `Chưa đọc (${unreadCount})` },
    { value: 'DEVICE_OFFLINE', label: 'Thiết bị offline' },
    { value: 'DEVICE_ALARM', label: 'Cảnh báo' },
    { value: 'ADMIN_MESSAGE', label: 'Từ Admin' },
    { value: 'SYSTEM_UPDATE', label: 'Hệ thống' },
  ];

  return (
      <div className="p-6 max-w-4xl mx-auto">
        {/* Header actions */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-gray-500" />
            <span className="text-sm text-gray-500">
              {notifications.length} thông báo, {unreadCount} chưa đọc
            </span>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={markAllAsRead}>
                <CheckCheck className="w-4 h-4 mr-1.5" />
                Đọc tất cả
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={deleteAllRead} className="text-red-600 hover:text-red-700">
              <Trash2 className="w-4 h-4 mr-1.5" />
              Xóa đã đọc
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <Filter className="w-4 h-4 text-gray-400" />
          {filterOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filter === opt.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
          {filter !== 'all' && (
            <button
              onClick={() => setFilter('all')}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <XCircle className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Notifications list */}
        <div className="space-y-2">
          {loading && notifications.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-400">Đang tải...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400">
                {filter === 'all' ? 'Không có thông báo nào' : 'Không có thông báo phù hợp'}
              </p>
            </div>
          ) : (
            <>
              {filtered.map((n) => (
                <NotificationItem
                  key={n.id}
                  n={n}
                  onMarkRead={markAsRead}
                  onDelete={deleteNotification}
                />
              ))}

              {hasMore && (
                <div className="text-center pt-4">
                  <Button variant="outline" size="sm" onClick={loadMore} disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Đang tải...
                      </>
                    ) : (
                      'Tải thêm'
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
  );
}
