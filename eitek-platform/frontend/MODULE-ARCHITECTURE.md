# EITEK Platform Module Architecture

## Core Modules

### 1. Auth Module (`features/auth/`)
**Responsibility**: Authentication & user management
```
features/auth/
├── components/
│   ├── LoginForm.tsx
│   ├── RegisterForm.tsx
│   ├── PasswordReset.tsx
│   └── UserProfile.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useLogin.ts
│   └── useProfile.ts
├── services/
│   └── authService.ts
├── stores/
│   └── authStore.ts
└── types/
    └── auth.types.ts
```

### 2. Devices Module (`features/devices/`)
**Responsibility**: Device management & monitoring
```
features/devices/
├── components/
│   ├── DeviceList.tsx
│   ├── DeviceCard.tsx
│   ├── DeviceDetails.tsx
│   ├── DeviceForm.tsx
│   ├── DeviceTelemetry.tsx
│   ├── DeviceAlarms.tsx
│   └── DeviceUI/
│       ├── DeviceRenderer.tsx
│       ├── DeviceTemplate.tsx
│       └── DeviceControls.tsx
├── hooks/
│   ├── useDevices.ts
│   ├── useDeviceTelemetry.ts
│   └── useDeviceControls.ts
├── services/
│   ├── deviceService.ts
│   └── telemetryService.ts
├── stores/
│   └── deviceStore.ts
└── types/
    └── device.types.ts
```

### 3. SCADA Module (`features/scada/`)
**Responsibility**: SCADA editor & visualization
```
features/scada/
├── components/
│   ├── ScadaViewer.tsx
│   ├── ScadaEditor/
│   │   ├── EditorCanvas.tsx
│   │   ├── EditorToolbar.tsx
│   │   ├── LayerPanel.tsx
│   │   ├── PropertyPanel.tsx
│   │   └── ComponentLibrary.tsx
│   ├── Widgets/
│   │   ├── BaseWidget.tsx
│   │   ├── ChartWidget.tsx
│   │   ├── GaugeWidget.tsx
│   │   ├── ButtonWidget.tsx
│   │   ├── ImageWidget.tsx
│   │   ├── TextWidget.tsx
│   │   └── CustomWidget.tsx
│   └── Symbols/
│       ├── SymbolLibrary.tsx
│       ├── SymbolEditor.tsx
│       └── SymbolRenderer.tsx
├── hooks/
│   ├── useScadaEditor.ts
│   ├── useWidgets.ts
│   ├── useCanvas.ts
│   └── useSymbols.ts
├── services/
│   ├── scadaService.ts
│   ├── widgetService.ts
│   └── symbolService.ts
├── stores/
│   ├── scadaStore.ts
│   ├── widgetStore.ts
│   └── canvasStore.ts
├── engine/
│   ├── CanvasEngine.ts
│   ├── WidgetEngine.ts
│   ├── AnimationEngine.ts
│   └── InteractionEngine.ts
└── types/
    ├── scada.types.ts
    ├── widget.types.ts
    └── canvas.types.ts
```

### 4. Projects Module (`features/projects/`)
**Responsibility**: Project hierarchy management
```
features/projects/
├── components/
│   ├── ProjectList.tsx
│   ├── ProjectCard.tsx
│   ├── ProjectForm.tsx
│   ├── SiteList.tsx
│   ├── SiteForm.tsx
│   ├── AreaList.tsx
│   ├── AreaForm.tsx
│   └── HierarchyTree.tsx
├── hooks/
│   ├── useProjects.ts
│   ├── useSites.ts
│   └── useAreas.ts
├── services/
│   ├── projectService.ts
│   ├── siteService.ts
│   └── areaService.ts
├── stores/
│   └── projectStore.ts
└── types/
    └── project.types.ts
```

### 5. Templates Module (`features/templates/`)
**Responsibility**: Template & library management
```
features/templates/
├── components/
│   ├── DeviceTemplateList.tsx
│   ├── DeviceTemplateForm.tsx
│   ├── WidgetTemplateList.tsx
│   ├── WidgetTemplateForm.tsx
│   ├── SymbolLibrary.tsx
│   └── TemplateImport.tsx
├── hooks/
│   ├── useDeviceTemplates.ts
│   ├── useWidgetTemplates.ts
│   └── useSymbols.ts
├── services/
│   ├── deviceTemplateService.ts
│   ├── widgetTemplateService.ts
│   └── symbolService.ts
├── stores/
│   └── templateStore.ts
└── types/
    └── template.types.ts
```

### 6. Reports Module (`features/reports/`)
**Responsibility**: Analytics & reporting
```
features/reports/
├── components/
│   ├── ReportBuilder.tsx
│   ├── ReportViewer.tsx
│   ├── ChartRenderer.tsx
│   ├── DataTable.tsx
│   └── ExportOptions.tsx
├── hooks/
│   ├── useReports.ts
│   ├── useCharts.ts
│   └── useAnalytics.ts
├── services/
│   ├── reportService.ts
│   └── analyticsService.ts
├── stores/
│   └── reportStore.ts
└── types/
    └── report.types.ts
```

### 7. Settings Module (`features/settings/`)
**Responsibility**: Configuration & administration
```
features/settings/
├── components/
│   ├── UserManagement.tsx
│   ├── RoleManagement.tsx
│   ├── SystemSettings.tsx
│   ├── IntegrationSettings.tsx
│   └── SecuritySettings.tsx
├── hooks/
│   ├── useUsers.ts
│   ├── useRoles.ts
│   └── useSettings.ts
├── services/
│   ├── userService.ts
│   ├── roleService.ts
│   └── settingsService.ts
├── stores/
│   └── settingsStore.ts
└── types/
    └── settings.types.ts
```

## Shared Infrastructure

### 1. Shared Components (`shared/components/`)
```
shared/components/
├── ui/           # Basic UI components
├── layout/       # Layout components
├── forms/        # Form components
└── data/         # Data display components
```

### 2. Shared Hooks (`shared/hooks/`)
```
shared/hooks/
├── useApi.ts     # API client hook
├── useSocket.ts  # WebSocket hook
├── useStorage.ts # Local storage hook
└── useDebounce.ts # Utility hooks
```

### 3. Shared Services (`shared/services/`)
```
shared/services/
├── apiClient.ts  # HTTP client
├── socketClient.ts # WebSocket client
├── storage.ts    # Storage utilities
└── utils/        # Utility functions
```

## Module Communication

### Inter-module Communication
```typescript
// Event-driven communication
export const ModuleEvents = {
  DEVICE_SELECTED: 'device:selected',
  SCADA_UPDATED: 'scada:updated',
  ALARM_TRIGGERED: 'alarm:triggered',
} as const;

// Global event bus
export const eventBus = new EventEmitter();

// Module subscription
export function useModuleEvents(event: string, handler: Function) {
  useEffect(() => {
    eventBus.on(event, handler);
    return () => eventBus.off(event, handler);
  }, [event, handler]);
}
```

### Shared State
```typescript
// Cross-module state through Zustand
export const useGlobalStore = create((set, get) => ({
  selectedDevice: null,
  currentProject: null,
  realTimeData: {},
  
  setSelectedDevice: (device) => set({ selectedDevice: device }),
  setCurrentProject: (project) => set({ currentProject: project }),
  updateRealTimeData: (data) => set(state => ({ 
    realTimeData: { ...state.realTimeData, ...data }
  })),
}));
```

## Module Independence

### Dependency Rules
1. **Modules cannot import from other feature modules**
2. **Modules can only import from shared infrastructure**
3. **Communication through events or shared state only**
4. **Each module has its own types, services, and stores**

### Import Boundaries
```typescript
// ✅ Allowed
import { Button } from '@/shared/components/ui';
import { useApi } from '@/shared/hooks';
import { eventBus } from '@/shared/services';

// ❌ Not allowed
import { DeviceList } from '@/features/devices/components';
import { useScadaStore } from '@/features/scada/stores';
```

## Module Testing Strategy

### Unit Testing
- Each module tested independently
- Mock external dependencies
- Test business logic and component behavior

### Integration Testing
- Test module communication
- Test event handling
- Test shared state updates

### E2E Testing
- Test complete user workflows
- Test cross-module interactions
- Test real-time features