'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Bell,
  Send,
  Megaphone,
  Users,
  Building2,
  CheckCheck,
  Trash2,
  Loader2,
  AlertTriangle,
  Info,
  Wifi,
  WifiOff,
  Server,
  Wrench,
  UserCheck,
  FolderOpen,
  Filter,
  XCircle,
  CheckCircle,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import {
  notificationService,
  type AppNotification,
  type NotificationPriority,
  type BroadcastDto,
} from '@/shared/services/notificationService';
import { tenantService, type Tenant } from '@/features/admin/services/tenantService';

// ==================== CONSTANTS ====================

const PRIORITIES: { value: NotificationPriority; label: string; color: string }[] = [
  { value: 'LOW', label: 'Thấp', color: 'bg-gray-100 text-gray-600' },
  { value: 'NORMAL', label: 'Bình thường', color: 'bg-blue-100 text-blue-700' },
  { value: 'HIGH', label: 'Cao', color: 'bg-orange-100 text-orange-700' },
  { value: 'CRITICAL', label: 'Khẩn cấp', color: 'bg-red-100 text-red-700' },
];

const TYPE_ICON: Record<string, React.ReactNode> = {
  DEVICE_OFFLINE: <WifiOff className="w-4 h-4 text-red-500" />,
  DEVICE_ONLINE: <Wifi className="w-4 h-4 text-green-500" />,
  DEVICE_ALARM: <AlertTriangle className="w-4 h-4 text-yellow-500" />,
  SYSTEM_UPDATE: <Server className="w-4 h-4 text-blue-500" />,
  SYSTEM_MAINTENANCE: <Wrench className="w-4 h-4 text-orange-500" />,
  ADMIN_MESSAGE: <Megaphone className="w-4 h-4 text-purple-500" />,
  ACCOUNT_ACTIVITY: <UserCheck className="w-4 h-4 text-teal-500" />,
  PROJECT_UPDATE: <FolderOpen className="w-4 h-4 text-indigo-500" />,
};

// ==================== SEND NOTIFICATION FORM ====================

function SendNotificationForm({ onSent }: { onSent: () => void }) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<NotificationPriority>('NORMAL');
  const [target, setTarget] = useState<'all' | 'selected'>('all');
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenantIds, setSelectedTenantIds] = useState<string[]>([]);
  const [loadingTenants, setLoadingTenants] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (target === 'selected' && tenants.length === 0) {
      setLoadingTenants(true);
      tenantService
        .getTenants({ limit: 100 })
        .then((res) => setTenants(res.data))
        .catch(() => {})
        .finally(() => setLoadingTenants(false));
    }
  }, [target, tenants.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    setSending(true);
    setResult(null);
    try {
      const dto: BroadcastDto = {
        title: title.trim(),
        message: message.trim(),
        priority,
        ...(target === 'selected' ? { tenantIds: selectedTenantIds } : {}),
      };
      const res = await notificationService.broadcast(dto);
      setResult({ type: 'success', message: `Đã gửi thông báo đến ${res.count} người dùng` });
      setTitle('');
      setMessage('');
      setPriority('NORMAL');
      setSelectedTenantIds([]);
      onSent();
    } catch (err: any) {
      setResult({ type: 'error', message: err.message || 'Gửi thông báo thất bại' });
    } finally {
      setSending(false);
    }
  };

  const toggleTenant = (id: string) => {
    setSelectedTenantIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200">
      <div className="p-5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Send className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-slate-900">Gửi thông báo</h2>
        </div>
        <p className="text-sm text-slate-500 mt-1">Gửi thông báo đến tất cả hoặc một số tenant</p>
      </div>
      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        {result && (
          <div
            className={`p-3 rounded-lg text-sm flex items-center gap-2 ${
              result.type === 'success'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {result.type === 'success' ? (
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 flex-shrink-0" />
            )}
            {result.message}
          </div>
        )}

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Tiêu đề <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Nhập tiêu đề thông báo..."
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        {/* Message */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Nội dung <span className="text-red-500">*</span>
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Nhập nội dung thông báo..."
            rows={4}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            required
          />
        </div>

        {/* Priority */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Mức độ ưu tiên</label>
          <div className="flex gap-2">
            {PRIORITIES.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setPriority(p.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                  priority === p.value
                    ? `${p.color} border-current`
                    : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Target */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Đối tượng nhận</label>
          <div className="flex gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="target"
                checked={target === 'all'}
                onChange={() => setTarget('all')}
                className="text-blue-600"
              />
              <Users className="w-4 h-4 text-slate-500" />
              <span className="text-sm text-slate-700">Tất cả người dùng</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="target"
                checked={target === 'selected'}
                onChange={() => setTarget('selected')}
                className="text-blue-600"
              />
              <Building2 className="w-4 h-4 text-slate-500" />
              <span className="text-sm text-slate-700">Chọn tenant</span>
            </label>
          </div>
        </div>

        {/* Tenant selector */}
        {target === 'selected' && (
          <div className="border border-slate-200 rounded-lg max-h-48 overflow-y-auto">
            {loadingTenants ? (
              <div className="p-4 text-center text-sm text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                Đang tải danh sách tenant...
              </div>
            ) : tenants.length === 0 ? (
              <div className="p-4 text-center text-sm text-slate-400">Không có tenant nào</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {tenants.map((t) => (
                  <label
                    key={t.id}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedTenantIds.includes(t.id)}
                      onChange={() => toggleTenant(t.id)}
                      className="rounded text-blue-600"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{t.name}</p>
                      <p className="text-xs text-slate-500">{t.code}</p>
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        t.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {t.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </label>
                ))}
              </div>
            )}
            {selectedTenantIds.length > 0 && (
              <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 text-xs text-slate-500">
                Đã chọn {selectedTenantIds.length} tenant
              </div>
            )}
          </div>
        )}

        <Button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          disabled={sending || !title.trim() || !message.trim() || (target === 'selected' && selectedTenantIds.length === 0)}
        >
          {sending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Đang gửi...
            </>
          ) : (
            <>
              <Megaphone className="w-4 h-4 mr-2" />
              Gửi thông báo
            </>
          )}
        </Button>
      </form>
    </div>
  );
}

// ==================== NOTIFICATION HISTORY ====================

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Vừa xong';
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ngày trước`;
  return new Date(dateStr).toLocaleDateString('vi-VN');
}

function NotificationHistory() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await notificationService.getMyNotifications(1, 50);
      setNotifications(res.data);
      setUnreadCount(res.unreadCount);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
    try {
      await notificationService.markAsRead(id);
    } catch {}
  };

  const handleMarkAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    try {
      await notificationService.markAllAsRead();
    } catch {}
  };

  const handleDelete = async (id: string) => {
    const n = notifications.find((x) => x.id === id);
    setNotifications((prev) => prev.filter((x) => x.id !== id));
    if (n && !n.isRead) setUnreadCount((c) => Math.max(0, c - 1));
    try {
      await notificationService.deleteNotification(id);
    } catch {}
  };

  const handleDeleteAllRead = async () => {
    setNotifications((prev) => prev.filter((n) => !n.isRead));
    try {
      await notificationService.deleteAllRead();
    } catch {}
  };

  const filtered = filter === 'unread' ? notifications.filter((n) => !n.isRead) : notifications;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200">
      <div className="p-5 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-slate-600" />
            <h2 className="text-lg font-semibold text-slate-900">Thông báo của tôi</h2>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
                <CheckCheck className="w-3.5 h-3.5 mr-1" />
                Đọc tất cả
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleDeleteAllRead} className="text-red-600">
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              Xóa đã đọc
            </Button>
          </div>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2 mt-3">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          {(['all', 'unread'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                filter === f ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f === 'all' ? `Tất cả (${notifications.length})` : `Chưa đọc (${unreadCount})`}
            </button>
          ))}
        </div>
      </div>

      <div className="max-h-[500px] overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin inline mr-2" />
            Đang tải...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-400">Không có thông báo</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((n) => (
              <div
                key={n.id}
                className={`px-5 py-3 flex items-start gap-3 hover:bg-slate-50 transition-colors ${
                  !n.isRead ? 'bg-blue-50/40' : ''
                }`}
              >
                <div className="mt-0.5 flex-shrink-0">
                  {TYPE_ICON[n.type] || <Info className="w-4 h-4 text-gray-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${!n.isRead ? 'font-medium text-slate-900' : 'text-slate-700'}`}>
                    {n.title}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] text-slate-400">{timeAgo(n.createdAt)}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        PRIORITIES.find((p) => p.value === n.priority)?.color || 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {n.priority}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {!n.isRead && (
                    <button
                      onClick={() => handleMarkAsRead(n.id)}
                      className="p-1 text-slate-400 hover:text-blue-600 rounded"
                      title="Đánh dấu đã đọc"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(n.id)}
                    className="p-1 text-slate-400 hover:text-red-600 rounded"
                    title="Xóa"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== MAIN PAGE ====================

export default function AdminNotificationsPage() {
  const [historyKey, setHistoryKey] = useState(0);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Notification Center</h1>
        <p className="text-sm text-slate-500 mt-1">Quản lý và gửi thông báo đến người dùng trong hệ thống</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SendNotificationForm onSent={() => setHistoryKey((k) => k + 1)} />
        <NotificationHistory key={historyKey} />
      </div>
    </div>
  );
}
