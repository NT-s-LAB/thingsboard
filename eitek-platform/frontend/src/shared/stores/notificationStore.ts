'use client';

import { useEffect, useCallback, useRef } from 'react';
import { create } from 'zustand';
import { useWebSocket } from '@/shared/components/providers/WebSocketProvider';
import { useAuthStore } from '@/features/auth/stores/authStore';
import {
  notificationService,
  AppNotification,
} from '@/shared/services/notificationService';

// ==================== STORE ====================

interface NotificationStore {
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
  page: number;
  hasMore: boolean;
  setNotifications: (n: AppNotification[]) => void;
  setUnreadCount: (c: number) => void;
  setLoading: (l: boolean) => void;
  setPage: (p: number) => void;
  setHasMore: (h: boolean) => void;
  addNotification: (n: AppNotification) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  removeNotification: (id: string) => void;
  appendNotifications: (n: AppNotification[]) => void;
  reset: () => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,
  page: 1,
  hasMore: true,
  setNotifications: (notifications) => set({ notifications }),
  setUnreadCount: (unreadCount) => set({ unreadCount }),
  setLoading: (loading) => set({ loading }),
  setPage: (page) => set({ page }),
  setHasMore: (hasMore) => set({ hasMore }),
  addNotification: (n) =>
    set((s) => ({
      notifications: [n, ...s.notifications],
      unreadCount: s.unreadCount + 1,
    })),
  markRead: (id) =>
    set((s) => ({
      notifications: s.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n,
      ),
      unreadCount: Math.max(0, s.unreadCount - 1),
    })),
  markAllRead: () =>
    set((s) => ({
      notifications: s.notifications.map((n) => ({
        ...n,
        isRead: true,
        readAt: n.readAt || new Date().toISOString(),
      })),
      unreadCount: 0,
    })),
  removeNotification: (id) =>
    set((s) => ({
      notifications: s.notifications.filter((n) => n.id !== id),
      unreadCount: s.notifications.find((n) => n.id === id && !n.isRead)
        ? s.unreadCount - 1
        : s.unreadCount,
    })),
  appendNotifications: (newOnes) =>
    set((s) => ({
      notifications: [...s.notifications, ...newOnes],
    })),
  reset: () =>
    set({ notifications: [], unreadCount: 0, loading: false, page: 1, hasMore: true }),
}));

// ==================== HOOK ====================

// Module-level tracker to ensure only one WebSocket subscription exists,
// even when multiple components call useNotifications().
let wsSubscriberCount = 0;
let wsHandler: ((data: AppNotification) => void) | null = null;

export function useNotifications() {
  const store = useNotificationStore();
  const { subscribe, unsubscribe } = useWebSocket();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const initialised = useRef(false);

  // Fetch initial data
  const fetchNotifications = useCallback(async (page = 1) => {
    store.setLoading(true);
    try {
      const res = await notificationService.getMyNotifications(page);
      if (page === 1) {
        store.setNotifications(res.data);
      } else {
        store.appendNotifications(res.data);
      }
      store.setUnreadCount(res.unreadCount);
      store.setPage(page);
      store.setHasMore(res.hasNext);
    } catch {
      // silently fail - notifications are non-critical
    } finally {
      store.setLoading(false);
    }
  }, []);

  const loadMore = useCallback(() => {
    if (!store.loading && store.hasMore) {
      fetchNotifications(store.page + 1);
    }
  }, [store.loading, store.hasMore, store.page, fetchNotifications]);

  const handleMarkAsRead = useCallback(async (id: string) => {
    store.markRead(id);
    try {
      await notificationService.markAsRead(id);
    } catch {
      // revert on error would be complex; notifications are not critical
    }
  }, []);

  const handleMarkAllAsRead = useCallback(async () => {
    store.markAllRead();
    try {
      await notificationService.markAllAsRead();
    } catch {}
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    store.removeNotification(id);
    try {
      await notificationService.deleteNotification(id);
    } catch {}
  }, []);

  const handleDeleteAllRead = useCallback(async () => {
    store.setNotifications(store.notifications.filter((n) => !n.isRead));
    try {
      await notificationService.deleteAllRead();
    } catch {}
  }, [store.notifications]);

  // WebSocket listener for real-time notifications
  useEffect(() => {
    if (!isAuthenticated) {
      store.reset();
      initialised.current = false;
      return;
    }

    // Fetch initial data once
    if (!initialised.current) {
      initialised.current = true;
      fetchNotifications(1);
    }

    // Only the first subscriber registers the WebSocket handler
    wsSubscriberCount++;
    if (wsSubscriberCount === 1) {
      wsHandler = (data: AppNotification) => {
        useNotificationStore.getState().addNotification(data);
      };
      subscribe('notification:new', wsHandler);
    }

    return () => {
      wsSubscriberCount--;
      if (wsSubscriberCount === 0 && wsHandler) {
        unsubscribe('notification:new', wsHandler);
        wsHandler = null;
      }
    };
  }, [isAuthenticated, subscribe, unsubscribe, fetchNotifications]);

  return {
    notifications: store.notifications,
    unreadCount: store.unreadCount,
    loading: store.loading,
    hasMore: store.hasMore,
    refresh: () => fetchNotifications(1),
    loadMore,
    markAsRead: handleMarkAsRead,
    markAllAsRead: handleMarkAllAsRead,
    deleteNotification: handleDelete,
    deleteAllRead: handleDeleteAllRead,
  };
}
