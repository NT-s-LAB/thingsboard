# EITEK Platform State Management Design

## State Management Strategy

### Architecture Overview
- **Zustand**: Primary state management for complex state
- **React Query**: Server state and caching
- **React State**: Local component state
- **Context API**: Cross-cutting concerns (theme, auth)

## Core Store Structure

### 1. Global Store (Shared State)

```typescript
// shared/stores/globalStore.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { Project, Site, Area, User, Theme, Language } from '@/shared/types';

interface GlobalState {
  // UI State
  sidebarCollapsed: boolean;
  theme: Theme;
  language: Language;
  
  // Navigation Context
  currentProject: Project | null;
  currentSite: Site | null;
  currentArea: Area | null;
  
  // Modal System
  modals: ModalState[];
  
  // Notifications
  notifications: Notification[];
  
  // Loading States
  globalLoading: boolean;
  loadingMessage: string | null;
}

interface GlobalActions {
  // UI Actions
  setSidebarCollapsed: (collapsed: boolean) => void;
  setTheme: (theme: Theme) => void;
  setLanguage: (language: Language) => void;
  
  // Navigation Actions
  setCurrentProject: (project: Project | null) => void;
  setCurrentSite: (site: Site | null) => void;
  setCurrentArea: (area: Area | null) => void;
  
  // Modal Actions
  openModal: (modal: Omit<ModalState, 'id'>) => void;
  closeModal: (id: string) => void;
  closeAllModals: () => void;
  
  // Notification Actions
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  
  // Loading Actions
  setGlobalLoading: (loading: boolean, message?: string) => void;
}

export const useGlobalStore = create<GlobalState & GlobalActions>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial State
        sidebarCollapsed: false,
        theme: 'LIGHT',
        language: 'vi',
        currentProject: null,
        currentSite: null,
        currentArea: null,
        modals: [],
        notifications: [],
        globalLoading: false,
        loadingMessage: null,

        // UI Actions
        setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
        
        setTheme: (theme) => {
          set({ theme });
          document.documentElement.setAttribute('data-theme', theme.toLowerCase());
        },
        
        setLanguage: (language) => set({ language }),

        // Navigation Actions
        setCurrentProject: (project) => {
          set({ 
            currentProject: project,
            currentSite: null,
            currentArea: null,
          });
        },
        
        setCurrentSite: (site) => {
          set({ 
            currentSite: site,
            currentArea: null,
          });
        },
        
        setCurrentArea: (area) => set({ currentArea: area }),

        // Modal Actions
        openModal: (modal) => {
          const newModal: ModalState = {
            id: crypto.randomUUID(),
            ...modal,
          };
          set((state) => ({ modals: [...state.modals, newModal] }));
        },
        
        closeModal: (id) => {
          set((state) => ({
            modals: state.modals.filter(modal => modal.id !== id),
          }));
        },
        
        closeAllModals: () => set({ modals: [] }),

        // Notification Actions
        addNotification: (notification) => {
          const newNotification: Notification = {
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            ...notification,
          };
          
          set((state) => ({ 
            notifications: [...state.notifications, newNotification],
          }));
          
          // Auto remove after duration
          if (notification.duration !== 0) {
            setTimeout(() => {
              get().removeNotification(newNotification.id);
            }, notification.duration || 5000);
          }
        },
        
        removeNotification: (id) => {
          set((state) => ({
            notifications: state.notifications.filter(n => n.id !== id),
          }));
        },
        
        clearNotifications: () => set({ notifications: [] }),

        // Loading Actions
        setGlobalLoading: (loading, message) => {
          set({ 
            globalLoading: loading,
            loadingMessage: message || null,
          });
        },
      }),
      {
        name: 'global-store',
        partialize: (state) => ({
          sidebarCollapsed: state.sidebarCollapsed,
          theme: state.theme,
          language: state.language,
        }),
      }
    ),
    { name: 'global-store' }
  )
);
```

### 2. Auth Store

```typescript
// features/auth/stores/authStore.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { User, LoginRequest } from '@/shared/types';
import { authService } from '../services/authService';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  permissions: string[];
}

interface AuthActions {
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
  clearError: () => void;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
}

export const useAuthStore = create<AuthState & AuthActions>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial State
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        permissions: [],

        // Actions
        login: async (credentials) => {
          try {
            set({ isLoading: true, error: null });
            
            const response = await authService.login(credentials);
            
            set({
              user: response.user,
              token: response.token,
              isAuthenticated: true,
              permissions: response.permissions,
              isLoading: false,
            });
          } catch (error) {
            set({
              error: error.message,
              isLoading: false,
              isAuthenticated: false,
            });
            throw error;
          }
        },

        logout: async () => {
          try {
            await authService.logout();
          } finally {
            set({
              user: null,
              token: null,
              isAuthenticated: false,
              permissions: [],
              error: null,
            });
          }
        },

        refreshUser: async () => {
          try {
            const user = await authService.getProfile();
            set({ user });
          } catch (error) {
            // If refresh fails, logout
            get().logout();
          }
        },

        updateUser: (userData) => {
          set((state) => ({
            user: state.user ? { ...state.user, ...userData } : null,
          }));
        },

        clearError: () => set({ error: null }),

        // Permission helpers
        hasPermission: (permission) => {
          const { permissions } = get();
          return permissions.includes(permission);
        },

        hasAnyPermission: (requiredPermissions) => {
          const { permissions } = get();
          return requiredPermissions.some(p => permissions.includes(p));
        },

        hasAllPermissions: (requiredPermissions) => {
          const { permissions } = get();
          return requiredPermissions.every(p => permissions.includes(p));
        },
      }),
      {
        name: 'auth-store',
        partialize: (state) => ({
          user: state.user,
          token: state.token,
          isAuthenticated: state.isAuthenticated,
          permissions: state.permissions,
        }),
      }
    ),
    { name: 'auth-store' }
  )
);

// Initialize auth on app start
export async function initializeAuth() {
  const { token, refreshUser, logout } = useAuthStore.getState();
  
  if (token) {
    try {
      await refreshUser();
    } catch {
      await logout();
    }
  }
}
```

### 3. Device Store (Real-time State)

```typescript
// features/devices/stores/deviceStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Device, TelemetryValue, Alarm } from '@/shared/types';
import { socketClient } from '@/shared/services/socketClient';

interface DeviceState {
  devices: Record<string, Device>;
  selectedDevice: Device | null;
  telemetryData: Record<string, Record<string, TelemetryValue>>;
  deviceAlarms: Record<string, Alarm[]>;
  connectionStatus: Record<string, boolean>;
  subscriptions: Set<string>;
}

interface DeviceActions {
  setDevices: (devices: Device[]) => void;
  addDevice: (device: Device) => void;
  updateDevice: (deviceId: string, updates: Partial<Device>) => void;
  removeDevice: (deviceId: string) => void;
  
  selectDevice: (device: Device | null) => void;
  
  updateTelemetry: (deviceId: string, telemetry: Record<string, TelemetryValue>) => void;
  updateDeviceStatus: (deviceId: string, isOnline: boolean) => void;
  addAlarm: (alarm: Alarm) => void;
  updateAlarm: (alarm: Alarm) => void;
  
  subscribeToDevice: (deviceId: string) => void;
  unsubscribeFromDevice: (deviceId: string) => void;
  subscribeToDevices: (deviceIds: string[]) => void;
  clearSubscriptions: () => void;
}

export const useDeviceStore = create<DeviceState & DeviceActions>()(
  devtools(
    (set, get) => ({
      // Initial State
      devices: {},
      selectedDevice: null,
      telemetryData: {},
      deviceAlarms: {},
      connectionStatus: {},
      subscriptions: new Set(),

      // Actions
      setDevices: (devices) => {
        const deviceMap = devices.reduce((acc, device) => {
          acc[device.id] = device;
          return acc;
        }, {} as Record<string, Device>);
        
        set({ devices: deviceMap });
      },

      addDevice: (device) => {
        set((state) => ({
          devices: { ...state.devices, [device.id]: device },
        }));
      },

      updateDevice: (deviceId, updates) => {
        set((state) => ({
          devices: {
            ...state.devices,
            [deviceId]: { ...state.devices[deviceId], ...updates },
          },
        }));
      },

      removeDevice: (deviceId) => {
        set((state) => {
          const { [deviceId]: removed, ...devices } = state.devices;
          const { [deviceId]: removedTelemetry, ...telemetryData } = state.telemetryData;
          const { [deviceId]: removedAlarms, ...deviceAlarms } = state.deviceAlarms;
          const { [deviceId]: removedStatus, ...connectionStatus } = state.connectionStatus;
          
          const subscriptions = new Set(state.subscriptions);
          subscriptions.delete(deviceId);
          
          return {
            devices,
            telemetryData,
            deviceAlarms,
            connectionStatus,
            subscriptions,
            selectedDevice: state.selectedDevice?.id === deviceId ? null : state.selectedDevice,
          };
        });
      },

      selectDevice: (device) => set({ selectedDevice: device }),

      updateTelemetry: (deviceId, telemetry) => {
        set((state) => ({
          telemetryData: {
            ...state.telemetryData,
            [deviceId]: { ...state.telemetryData[deviceId], ...telemetry },
          },
        }));
      },

      updateDeviceStatus: (deviceId, isOnline) => {
        set((state) => ({
          connectionStatus: { ...state.connectionStatus, [deviceId]: isOnline },
          devices: {
            ...state.devices,
            [deviceId]: state.devices[deviceId] 
              ? { ...state.devices[deviceId], isOnline }
              : state.devices[deviceId],
          },
        }));
      },

      addAlarm: (alarm) => {
        set((state) => ({
          deviceAlarms: {
            ...state.deviceAlarms,
            [alarm.deviceId]: [
              ...(state.deviceAlarms[alarm.deviceId] || []),
              alarm,
            ],
          },
        }));
      },

      updateAlarm: (alarm) => {
        set((state) => {
          const deviceAlarms = state.deviceAlarms[alarm.deviceId] || [];
          const updatedAlarms = deviceAlarms.map(a => 
            a.id === alarm.id ? alarm : a
          );
          
          return {
            deviceAlarms: {
              ...state.deviceAlarms,
              [alarm.deviceId]: updatedAlarms,
            },
          };
        });
      },

      // Real-time subscriptions
      subscribeToDevice: (deviceId) => {
        const { subscriptions } = get();
        
        if (!subscriptions.has(deviceId)) {
          subscriptions.add(deviceId);
          socketClient.subscribeTelemetry([deviceId]);
          set({ subscriptions: new Set(subscriptions) });
        }
      },

      unsubscribeFromDevice: (deviceId) => {
        const { subscriptions } = get();
        
        if (subscriptions.has(deviceId)) {
          subscriptions.delete(deviceId);
          socketClient.unsubscribeTelemetry([deviceId]);
          set({ subscriptions: new Set(subscriptions) });
        }
      },

      subscribeToDevices: (deviceIds) => {
        const { subscriptions } = get();
        const newSubscriptions = deviceIds.filter(id => !subscriptions.has(id));
        
        if (newSubscriptions.length > 0) {
          newSubscriptions.forEach(id => subscriptions.add(id));
          socketClient.subscribeTelemetry(newSubscriptions);
          set({ subscriptions: new Set(subscriptions) });
        }
      },

      clearSubscriptions: () => {
        const { subscriptions } = get();
        
        if (subscriptions.size > 0) {
          socketClient.unsubscribeTelemetry([...subscriptions]);
          set({ subscriptions: new Set() });
        }
      },
    }),
    { name: 'device-store' }
  )
);

// Setup real-time listeners
export function initializeDeviceStore() {
  socketClient.on('telemetry', (data: { deviceId: string; telemetry: Record<string, TelemetryValue> }) => {
    useDeviceStore.getState().updateTelemetry(data.deviceId, data.telemetry);
  });

  socketClient.on('device-status', (data: { deviceId: string; isOnline: boolean }) => {
    useDeviceStore.getState().updateDeviceStatus(data.deviceId, data.isOnline);
  });

  socketClient.on('alarm', (alarm: Alarm) => {
    useDeviceStore.getState().addAlarm(alarm);
  });

  socketClient.on('alarm-update', (alarm: Alarm) => {
    useDeviceStore.getState().updateAlarm(alarm);
  });
}
```

### 4. SCADA Editor Store

```typescript
// features/scada/stores/scadaStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { 
  ScadaView, 
  ScadaConfiguration,
  WidgetConfiguration,
  Position,
  Size,
  Layer 
} from '@/shared/types';

interface ScadaEditorState {
  currentView: ScadaView | null;
  configuration: ScadaConfiguration | null;
  
  // Editor state
  isEditing: boolean;
  selectedWidgets: string[];
  selectedLayer: string | null;
  
  // Canvas state
  canvasZoom: number;
  canvasCenter: Position;
  showGrid: boolean;
  snapToGrid: boolean;
  
  // Clipboard
  clipboard: WidgetConfiguration[];
  
  // History for undo/redo
  history: ScadaConfiguration[];
  historyIndex: number;
  
  // UI state
  showLayers: boolean;
  showProperties: boolean;
  showWidgetPalette: boolean;
}

interface ScadaEditorActions {
  // View management
  setCurrentView: (view: ScadaView | null) => void;
  setConfiguration: (configuration: ScadaConfiguration) => void;
  
  // Editor mode
  setEditing: (isEditing: boolean) => void;
  
  // Selection
  selectWidgets: (widgetIds: string[]) => void;
  selectWidget: (widgetId: string, addToSelection?: boolean) => void;
  clearSelection: () => void;
  selectLayer: (layerId: string | null) => void;
  
  // Widget operations
  addWidget: (widget: WidgetConfiguration) => void;
  updateWidget: (widgetId: string, updates: Partial<WidgetConfiguration>) => void;
  deleteWidgets: (widgetIds: string[]) => void;
  duplicateWidgets: (widgetIds: string[]) => void;
  
  // Widget positioning
  moveWidgets: (widgetIds: string[], delta: Position) => void;
  resizeWidget: (widgetId: string, size: Size) => void;
  
  // Layer operations
  addLayer: (layer: Omit<Layer, 'id'>) => void;
  updateLayer: (layerId: string, updates: Partial<Layer>) => void;
  deleteLayer: (layerId: string) => void;
  reorderLayers: (fromIndex: number, toIndex: number) => void;
  
  // Canvas operations
  setZoom: (zoom: number) => void;
  setCenter: (center: Position) => void;
  setShowGrid: (show: boolean) => void;
  setSnapToGrid: (snap: boolean) => void;
  
  // Clipboard operations
  copyWidgets: (widgetIds: string[]) => void;
  cutWidgets: (widgetIds: string[]) => void;
  pasteWidgets: () => void;
  
  // History operations
  saveToHistory: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  
  // UI state
  toggleLayers: () => void;
  toggleProperties: () => void;
  toggleWidgetPalette: () => void;
  
  // Reset
  reset: () => void;
}

export const useScadaStore = create<ScadaEditorState & ScadaEditorActions>()(
  devtools(
    (set, get) => ({
      // Initial state
      currentView: null,
      configuration: null,
      isEditing: false,
      selectedWidgets: [],
      selectedLayer: null,
      canvasZoom: 1,
      canvasCenter: { x: 0, y: 0 },
      showGrid: true,
      snapToGrid: true,
      clipboard: [],
      history: [],
      historyIndex: -1,
      showLayers: true,
      showProperties: true,
      showWidgetPalette: true,

      // View management
      setCurrentView: (view) => {
        set({ 
          currentView: view,
          configuration: view?.configuration || null,
          selectedWidgets: [],
          selectedLayer: null,
        });
      },

      setConfiguration: (configuration) => {
        set({ configuration });
      },

      // Editor mode
      setEditing: (isEditing) => set({ isEditing }),

      // Selection
      selectWidgets: (widgetIds) => set({ selectedWidgets: widgetIds }),
      
      selectWidget: (widgetId, addToSelection = false) => {
        set((state) => ({
          selectedWidgets: addToSelection 
            ? state.selectedWidgets.includes(widgetId)
              ? state.selectedWidgets.filter(id => id !== widgetId)
              : [...state.selectedWidgets, widgetId]
            : [widgetId],
        }));
      },

      clearSelection: () => set({ selectedWidgets: [] }),
      
      selectLayer: (layerId) => set({ selectedLayer: layerId }),

      // Widget operations
      addWidget: (widget) => {
        set((state) => {
          if (!state.configuration) return state;
          
          const configuration = {
            ...state.configuration,
            widgets: [...state.configuration.widgets, widget],
          };
          
          return { configuration };
        });
        
        get().saveToHistory();
      },

      updateWidget: (widgetId, updates) => {
        set((state) => {
          if (!state.configuration) return state;
          
          const widgets = state.configuration.widgets.map(widget =>
            widget.id === widgetId ? { ...widget, ...updates } : widget
          );
          
          const configuration = { ...state.configuration, widgets };
          
          return { configuration };
        });
        
        get().saveToHistory();
      },

      deleteWidgets: (widgetIds) => {
        set((state) => {
          if (!state.configuration) return state;
          
          const widgets = state.configuration.widgets.filter(
            widget => !widgetIds.includes(widget.id)
          );
          
          const configuration = { ...state.configuration, widgets };
          
          return { 
            configuration,
            selectedWidgets: state.selectedWidgets.filter(id => !widgetIds.includes(id)),
          };
        });
        
        get().saveToHistory();
      },

      duplicateWidgets: (widgetIds) => {
        const state = get();
        if (!state.configuration) return;
        
        const widgets = state.configuration.widgets.filter(
          widget => widgetIds.includes(widget.id)
        );
        
        const duplicatedWidgets = widgets.map(widget => ({
          ...widget,
          id: crypto.randomUUID(),
          position: {
            x: widget.position.x + 20,
            y: widget.position.y + 20,
          },
        }));
        
        set((state) => {
          if (!state.configuration) return state;
          
          const configuration = {
            ...state.configuration,
            widgets: [...state.configuration.widgets, ...duplicatedWidgets],
          };
          
          return { 
            configuration,
            selectedWidgets: duplicatedWidgets.map(w => w.id),
          };
        });
        
        get().saveToHistory();
      },

      // Widget positioning
      moveWidgets: (widgetIds, delta) => {
        set((state) => {
          if (!state.configuration) return state;
          
          const widgets = state.configuration.widgets.map(widget => {
            if (widgetIds.includes(widget.id)) {
              return {
                ...widget,
                position: {
                  x: widget.position.x + delta.x,
                  y: widget.position.y + delta.y,
                },
              };
            }
            return widget;
          });
          
          const configuration = { ...state.configuration, widgets };
          
          return { configuration };
        });
      },

      resizeWidget: (widgetId, size) => {
        get().updateWidget(widgetId, { size });
      },

      // Canvas operations
      setZoom: (zoom) => set({ canvasZoom: zoom }),
      setCenter: (center) => set({ canvasCenter: center }),
      setShowGrid: (show) => set({ showGrid: show }),
      setSnapToGrid: (snap) => set({ snapToGrid: snap }),

      // Clipboard operations
      copyWidgets: (widgetIds) => {
        const state = get();
        if (!state.configuration) return;
        
        const widgets = state.configuration.widgets.filter(
          widget => widgetIds.includes(widget.id)
        );
        
        set({ clipboard: widgets });
      },

      cutWidgets: (widgetIds) => {
        get().copyWidgets(widgetIds);
        get().deleteWidgets(widgetIds);
      },

      pasteWidgets: () => {
        const { clipboard } = get();
        
        const pastedWidgets = clipboard.map(widget => ({
          ...widget,
          id: crypto.randomUUID(),
          position: {
            x: widget.position.x + 20,
            y: widget.position.y + 20,
          },
        }));
        
        pastedWidgets.forEach(widget => get().addWidget(widget));
        
        set({ selectedWidgets: pastedWidgets.map(w => w.id) });
      },

      // History operations
      saveToHistory: () => {
        const { configuration, history, historyIndex } = get();
        if (!configuration) return;
        
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push({ ...configuration });
        
        set({
          history: newHistory,
          historyIndex: newHistory.length - 1,
        });
      },

      undo: () => {
        const { history, historyIndex } = get();
        
        if (historyIndex > 0) {
          const configuration = history[historyIndex - 1];
          set({
            configuration,
            historyIndex: historyIndex - 1,
          });
        }
      },

      redo: () => {
        const { history, historyIndex } = get();
        
        if (historyIndex < history.length - 1) {
          const configuration = history[historyIndex + 1];
          set({
            configuration,
            historyIndex: historyIndex + 1,
          });
        }
      },

      canUndo: () => get().historyIndex > 0,
      canRedo: () => get().historyIndex < get().history.length - 1,

      // UI state
      toggleLayers: () => set((state) => ({ showLayers: !state.showLayers })),
      toggleProperties: () => set((state) => ({ showProperties: !state.showProperties })),
      toggleWidgetPalette: () => set((state) => ({ showWidgetPalette: !state.showWidgetPalette })),

      // Reset
      reset: () => set({
        currentView: null,
        configuration: null,
        isEditing: false,
        selectedWidgets: [],
        selectedLayer: null,
        canvasZoom: 1,
        canvasCenter: { x: 0, y: 0 },
        clipboard: [],
        history: [],
        historyIndex: -1,
      }),
    }),
    { name: 'scada-store' }
  )
);
```

### 5. Custom Hooks for State Integration

```typescript
// shared/hooks/useStores.ts

// Combine multiple stores
export function useAppState() {
  const auth = useAuthStore();
  const global = useGlobalStore();
  const devices = useDeviceStore();
  const scada = useScadaStore();
  
  return {
    auth,
    global,
    devices,
    scada,
  };
}

// Derived state hook
export function useBreadcrumbs() {
  const { currentProject, currentSite, currentArea } = useGlobalStore();
  
  return useMemo(() => {
    const breadcrumbs: Breadcrumb[] = [
      { label: 'Dashboard', href: '/dashboard' },
    ];
    
    if (currentProject) {
      breadcrumbs.push({
        label: currentProject.name,
        href: `/dashboard/projects/${currentProject.id}`,
      });
    }
    
    if (currentSite) {
      breadcrumbs.push({
        label: currentSite.name,
        href: `/dashboard/projects/${currentProject?.id}/sites/${currentSite.id}`,
      });
    }
    
    if (currentArea) {
      breadcrumbs.push({
        label: currentArea.name,
        href: `/dashboard/projects/${currentProject?.id}/sites/${currentSite?.id}/areas/${currentArea.id}`,
      });
    }
    
    return breadcrumbs;
  }, [currentProject, currentSite, currentArea]);
}

// Permission hook
export function usePermissions() {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = useAuthStore();
  
  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    can: hasPermission, // Alias for better readability
  };
}

// Real-time data hook
export function useDeviceTelemetry(deviceId?: string) {
  const { telemetryData, subscribeToDevice, unsubscribeFromDevice } = useDeviceStore();
  
  useEffect(() => {
    if (deviceId) {
      subscribeToDevice(deviceId);
      return () => unsubscribeFromDevice(deviceId);
    }
  }, [deviceId, subscribeToDevice, unsubscribeFromDevice]);
  
  return deviceId ? telemetryData[deviceId] || {} : {};
}
```

### 6. Store Initialization

```typescript
// shared/stores/index.ts
import { initializeAuth } from '@/features/auth/stores/authStore';
import { initializeDeviceStore } from '@/features/devices/stores/deviceStore';
import { socketClient } from '@/shared/services/socketClient';

export async function initializeStores() {
  // Initialize auth first
  await initializeAuth();
  
  // Initialize device store with real-time listeners
  initializeDeviceStore();
  
  // Connect WebSocket if authenticated
  const { isAuthenticated, token } = useAuthStore.getState();
  if (isAuthenticated && token) {
    socketClient.connect(token);
  }
}

// Export all stores
export { useAuthStore } from '@/features/auth/stores/authStore';
export { useGlobalStore } from '@/shared/stores/globalStore';
export { useDeviceStore } from '@/features/devices/stores/deviceStore';
export { useScadaStore } from '@/features/scada/stores/scadaStore';
```

This state management design provides:

1. **Clear separation** between different types of state
2. **Type safety** with TypeScript
3. **Real-time capabilities** through WebSocket integration
4. **Persistence** for user preferences and auth state
5. **Undo/redo** functionality for SCADA editor
6. **Performance optimized** with selective subscriptions
7. **Developer experience** with devtools integration