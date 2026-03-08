'use client';

import * as React from 'react';
import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface WebSocketContextValue {
  socket: Socket | null;
  connected: boolean;
  subscribe: (event: string, handler: (...args: any[]) => void) => void;
  unsubscribe: (event: string, handler: (...args: any[]) => void) => void;
  emit: (event: string, data: any) => void;
}

const WebSocketContext = createContext<WebSocketContextValue>({
  socket: null,
  connected: false,
  subscribe: () => {},
  unsubscribe: () => {},
  emit: () => {},
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

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';
    const socket = io(`${url}/realtime`, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const subscribe = useCallback((event: string, handler: (...args: any[]) => void) => {
    socketRef.current?.on(event, handler);
  }, []);

  const unsubscribe = useCallback((event: string, handler: (...args: any[]) => void) => {
    socketRef.current?.off(event, handler);
  }, []);

  const emit = useCallback((event: string, data: any) => {
    socketRef.current?.emit(event, data);
  }, []);

  return (
    <WebSocketContext.Provider value={{ socket: socketRef.current, connected, subscribe, unsubscribe, emit }}>
      {children}
    </WebSocketContext.Provider>
  );
}