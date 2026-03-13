'use client';

import * as React from 'react';
import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/features/auth/stores/authStore';

interface WebSocketContextValue {
  socket: Socket | null;
  connected: boolean;
  authenticated: boolean;
  subscribe: (event: string, handler: (...args: any[]) => void) => void;
  unsubscribe: (event: string, handler: (...args: any[]) => void) => void;
  emit: (event: string, data: any) => void;
  reconnect: () => void;
}

const WebSocketContext = createContext<WebSocketContextValue>({
  socket: null,
  connected: false,
  authenticated: false,
  subscribe: () => {},
  unsubscribe: () => {},
  emit: () => {},
  reconnect: () => {},
});

export function useWebSocket() {
  return useContext(WebSocketContext);
}

interface WebSocketProviderProps {
  children: React.ReactNode;
}

export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  
  // Get token from auth store
  const token = useAuthStore((state) => state.token);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Create/recreate socket when token changes
  useEffect(() => {
    // Clean up existing socket
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setConnected(false);
      setAuthenticated(false);
    }

    // Only connect if authenticated
    if (!isAuthenticated || !token) {
      return;
    }

    const url = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';
    
    // Create socket with authentication
    const socket = io(`${url}/realtime`, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      // Include authentication token
      auth: {
        token: token,
      },
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      setAuthenticated(true);
      console.log('[WebSocket] Connected and authenticated');
    });

    socket.on('disconnect', (reason) => {
      setConnected(false);
      console.log('[WebSocket] Disconnected:', reason);
    });

    // Handle authentication errors
    socket.on('error', (error: { message: string; code?: string }) => {
      console.error('[WebSocket] Error:', error);
      if (error.code === 'AUTH_FAILED') {
        setAuthenticated(false);
      }
    });

    socket.on('connect_error', (error) => {
      console.error('[WebSocket] Connection error:', error.message);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, isAuthenticated]);

  const subscribe = useCallback((event: string, handler: (...args: any[]) => void) => {
    socketRef.current?.on(event, handler);
  }, []);

  const unsubscribe = useCallback((event: string, handler: (...args: any[]) => void) => {
    socketRef.current?.off(event, handler);
  }, []);

  const emit = useCallback((event: string, data: any) => {
    if (!socketRef.current?.connected) {
      console.warn('[WebSocket] Cannot emit, socket not connected');
      return;
    }
    socketRef.current.emit(event, data);
  }, []);

  const reconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current.connect();
    }
  }, []);

  return (
    <WebSocketContext.Provider 
      value={{ 
        socket: socketRef.current, 
        connected, 
        authenticated,
        subscribe, 
        unsubscribe, 
        emit,
        reconnect,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
}