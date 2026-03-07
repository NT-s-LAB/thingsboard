frontend/
├── README.md
├── package.json
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
├── .env.local.example
├── public/
│   ├── icons/
│   │   ├── devices/
│   │   ├── symbols/
│   │   └── ui/
│   ├── images/
│   └── fonts/
└── src/
    ├── app/
    │   ├── layout.tsx                    # Root layout
    │   ├── page.tsx                      # Home redirect
    │   ├── globals.css                   # Global styles
    │   ├── providers.tsx                 # Global providers
    │   ├── not-found.tsx                # 404 page
    │   ├── loading.tsx                   # Global loading
    │   ├── error.tsx                     # Global error boundary
    │   │
    │   ├── (auth)/                       # Auth route group
    │   │   ├── login/
    │   │   │   └── page.tsx
    │   │   ├── register/
    │   │   │   └── page.tsx
    │   │   └── layout.tsx               # Auth layout
    │   │
    │   └── (dashboard)/                  # Protected dashboard routes
    │       ├── layout.tsx               # Dashboard layout with sidebar
    │       ├── dashboard/
    │       │   └── page.tsx             # Dashboard home
    │       ├── projects/
    │       │   ├── page.tsx             # Projects list
    │       │   └── [id]/
    │       │       ├── page.tsx         # Project detail
    │       │       └── sites/
    │       │           ├── page.tsx     # Sites list
    │       │           └── [siteId]/
    │       │               ├── page.tsx # Site detail
    │       │               └── areas/
    │       │                   ├── page.tsx      # Areas list
    │       │                   └── [areaId]/
    │       │                       ├── page.tsx  # Area detail
    │       │                       ├── devices/
    │       │                       │   ├── page.tsx           # Devices list
    │       │                       │   ├── [deviceId]/
    │       │                       │   │   ├── page.tsx       # Device detail
    │       │                       │   │   └── ui/
    │       │                       │   │       └── page.tsx   # Device UI renderer
    │       │                       │   └── new/
    │       │                       │       └── page.tsx       # Add device
    │       │                       └── scada/
    │       │                           ├── page.tsx           # SCADA views list
    │       │                           ├── [viewId]/
    │       │                           │   ├── page.tsx       # SCADA view
    │       │                           │   └── edit/
    │       │                           │       └── page.tsx   # SCADA editor
    │       │                           └── new/
    │       │                               └── page.tsx       # Create SCADA view
    │       ├── templates/
    │       │   ├── page.tsx             # Template management
    │       │   ├── devices/
    │       │   │   └── page.tsx         # Device templates
    │       │   ├── widgets/
    │       │   │   └── page.tsx         # Widget templates
    │       │   └── symbols/
    │       │       └── page.tsx         # Symbol library
    │       ├── settings/
    │       │   ├── page.tsx             # Settings home
    │       │   ├── profile/
    │       │   │   └── page.tsx         # User profile
    │       │   ├── users/
    │       │   │   └── page.tsx         # User management
    │       │   └── system/
    │       │       └── page.tsx         # System settings
    │       └── reports/
    │           └── page.tsx             # Reports & analytics
    │
    ├── features/                        # Feature-based modules
    │   ├── auth/
    │   │   ├── components/
    │   │   │   ├── LoginForm.tsx
    │   │   │   ├── RegisterForm.tsx
    │   │   │   ├── AuthGuard.tsx
    │   │   │   └── index.ts
    │   │   ├── hooks/
    │   │   │   ├── useAuth.ts
    │   │   │   ├── useLogin.ts
    │   │   │   └── index.ts
    │   │   ├── services/
    │   │   │   ├── authApi.ts
    │   │   │   └── index.ts
    │   │   ├── stores/
    │   │   │   ├── authStore.ts
    │   │   │   └── index.ts
    │   │   ├── types/
    │   │   │   ├── auth.types.ts
    │   │   │   └── index.ts
    │   │   └── utils/
    │   │       ├── tokenManager.ts
    │   │       └── index.ts
    │   │
    │   ├── projects/
    │   │   ├── components/
    │   │   │   ├── ProjectCard.tsx
    │   │   │   ├── ProjectForm.tsx
    │   │   │   ├── ProjectList.tsx
    │   │   │   └── index.ts
    │   │   ├── hooks/
    │   │   │   ├── useProjects.ts
    │   │   │   ├── useProject.ts
    │   │   │   └── index.ts
    │   │   ├── services/
    │   │   │   └── projectsApi.ts
    │   │   ├── stores/
    │   │   │   └── projectsStore.ts
    │   │   └── types/
    │   │       └── project.types.ts
    │   │
    │   ├── sites/
    │   │   ├── components/
    │   │   │   ├── SiteCard.tsx
    │   │   │   ├── SiteForm.tsx
    │   │   │   ├── SiteMap.tsx
    │   │   │   └── index.ts
    │   │   ├── hooks/
    │   │   │   ├── useSites.ts
    │   │   │   └── useSite.ts
    │   │   ├── services/
    │   │   │   └── sitesApi.ts
    │   │   └── types/
    │   │       └── site.types.ts
    │   │
    │   ├── areas/
    │   │   ├── components/
    │   │   │   ├── AreaCard.tsx
    │   │   │   ├── AreaForm.tsx
    │   │   │   ├── AreaLayout.tsx
    │   │   │   └── index.ts
    │   │   ├── hooks/
    │   │   │   ├── useAreas.ts
    │   │   │   └── useArea.ts
    │   │   ├── services/
    │   │   │   └── areasApi.ts
    │   │   └── types/
    │   │       └── area.types.ts
    │   │
    │   ├── devices/
    │   │   ├── components/
    │   │   │   ├── DeviceCard.tsx
    │   │   │   ├── DeviceForm.tsx
    │   │   │   ├── DeviceList.tsx
    │   │   │   ├── DeviceDetail.tsx
    │   │   │   ├── DeviceStatus.tsx
    │   │   │   ├── DeviceControls.tsx
    │   │   │   └── DeviceUI/
    │   │   │       ├── DeviceRenderer.tsx         # Main device UI renderer
    │   │   │       ├── TemplateEngine.tsx         # Template processing
    │   │   │       ├── WidgetRenderer.tsx         # Individual widget renderer
    │   │   │       ├── templates/                 # Device UI templates
    │   │   │       │   ├── SensorTemplate.tsx
    │   │   │       │   ├── ActuatorTemplate.tsx
    │   │   │       │   ├── GatewayTemplate.tsx
    │   │   │       │   └── BaseTemplate.tsx
    │   │   │       └── index.ts
    │   │   ├── hooks/
    │   │   │   ├── useDevices.ts
    │   │   │   ├── useDevice.ts
    │   │   │   ├── useDeviceTelemetry.ts
    │   │   │   ├── useDeviceControl.ts
    │   │   │   └── index.ts
    │   │   ├── services/
    │   │   │   ├── devicesApi.ts
    │   │   │   ├── telemetryApi.ts
    │   │   │   └── rpcApi.ts
    │   │   ├── stores/
    │   │   │   ├── devicesStore.ts
    │   │   │   └── deviceTemplatesStore.ts
    │   │   └── types/
    │   │       ├── device.types.ts
    │   │       └── deviceTemplate.types.ts
    │   │
    │   ├── scada/
    │   │   ├── components/
    │   │   │   ├── ScadaViewer/                  # SCADA display mode
    │   │   │   │   ├── ScadaCanvas.tsx
    │   │   │   │   ├── ScadaWidget.tsx
    │   │   │   │   ├── ScadaControls.tsx
    │   │   │   │   ├── ScadaToolbar.tsx
    │   │   │   │   └── index.ts
    │   │   │   ├── ScadaEditor/                  # SCADA edit mode
    │   │   │   │   ├── EditorCanvas.tsx
    │   │   │   │   ├── EditorToolbox.tsx
    │   │   │   │   ├── WidgetPalette.tsx
    │   │   │   │   ├── PropertyPanel.tsx
    │   │   │   │   ├── LayerPanel.tsx
    │   │   │   │   ├── BindingPanel.tsx
    │   │   │   │   ├── CanvasToolbar.tsx
    │   │   │   │   ├── GridOverlay.tsx
    │   │   │   │   ├── SelectionBox.tsx
    │   │   │   │   ├── DragHandles.tsx
    │   │   │   │   └── index.ts
    │   │   │   ├── ScadaList.tsx
    │   │   │   ├── ScadaForm.tsx
    │   │   │   └── index.ts
    │   │   ├── hooks/
    │   │   │   ├── useScada.ts
    │   │   │   ├── useScadaEditor.ts
    │   │   │   ├── useDragDrop.ts
    │   │   │   ├── useCanvasSelection.ts
    │   │   │   ├── useCanvasZoom.ts
    │   │   │   ├── useWidgetBinding.ts
    │   │   │   └── index.ts
    │   │   ├── services/
    │   │   │   ├── scadaApi.ts
    │   │   │   ├── scadaEditorService.ts
    │   │   │   └── canvasService.ts
    │   │   ├── stores/
    │   │   │   ├── scadaStore.ts
    │   │   │   ├── editorStore.ts
    │   │   │   ├── selectionStore.ts
    │   │   │   └── canvasStore.ts
    │   │   ├── types/
    │   │   │   ├── scada.types.ts
    │   │   │   ├── canvas.types.ts
    │   │   │   ├── widget.types.ts
    │   │   │   └── editor.types.ts
    │   │   └── utils/
    │   │       ├── canvasUtils.ts
    │   │       ├── transformUtils.ts
    │   │       ├── snapUtils.ts
    │   │       └── exportUtils.ts
    │   │
    │   ├── widgets/
    │   │   ├── components/
    │   │   │   ├── WidgetLibrary/                # Widget management
    │   │   │   │   ├── WidgetGrid.tsx
    │   │   │   │   ├── WidgetCard.tsx
    │   │   │   │   ├── WidgetPreview.tsx
    │   │   │   │   ├── CategoryTabs.tsx
    │   │   │   │   └── index.ts
    │   │   │   ├── WidgetRenderer/               # Widget rendering engine
    │   │   │   │   ├── BaseWidget.tsx            # Base widget component
    │   │   │   │   ├── ChartWidgets/
    │   │   │   │   │   ├── LineChart.tsx
    │   │   │   │   │   ├── BarChart.tsx
    │   │   │   │   │   ├── PieChart.tsx
    │   │   │   │   │   ├── GaugeChart.tsx
    │   │   │   │   │   └── index.ts
    │   │   │   │   ├── ControlWidgets/
    │   │   │   │   │   ├── Button.tsx
    │   │   │   │   │   ├── Switch.tsx
    │   │   │   │   │   ├── Slider.tsx
    │   │   │   │   │   ├── Knob.tsx
    │   │   │   │   │   └── index.ts
    │   │   │   │   ├── DisplayWidgets/
    │   │   │   │   │   ├── Text.tsx
    │   │   │   │   │   ├── Value.tsx
    │   │   │   │   │   ├── LED.tsx
    │   │   │   │   │   ├── Progress.tsx
    │   │   │   │   │   └── index.ts
    │   │   │   │   ├── SymbolWidgets/
    │   │   │   │   │   ├── SVGSymbol.tsx
    │   │   │   │   │   ├── ImageSymbol.tsx
    │   │   │   │   │   └── index.ts
    │   │   │   │   └── index.ts
    │   │   │   ├── WidgetConfig/                 # Widget configuration
    │   │   │   │   ├── WidgetConfigPanel.tsx
    │   │   │   │   ├── DataBindingConfig.tsx
    │   │   │   │   ├── StyleConfig.tsx
    │   │   │   │   ├── AnimationConfig.tsx
    │   │   │   │   └── index.ts
    │   │   │   └── index.ts
    │   │   ├── hooks/
    │   │   │   ├── useWidgets.ts
    │   │   │   ├── useWidgetConfig.ts
    │   │   │   ├── useWidgetData.ts
    │   │   │   └── index.ts
    │   │   ├── services/
    │   │   │   ├── widgetsApi.ts
    │   │   │   ├── widgetConfigService.ts
    │   │   │   └── widgetDataService.ts
    │   │   ├── stores/
    │   │   │   ├── widgetLibraryStore.ts
    │   │   │   └── widgetConfigStore.ts
    │   │   ├── types/
    │   │   │   ├── widget.types.ts
    │   │   │   ├── widgetConfig.types.ts
    │   │   │   └── widgetData.types.ts
    │   │   └── registry/
    │   │       ├── widgetRegistry.ts             # Widget type registry
    │   │       ├── widgetFactory.ts             # Widget factory
    │   │       └── index.ts
    │   │
    │   ├── templates/
    │   │   ├── components/
    │   │   │   ├── TemplateManager.tsx
    │   │   │   ├── TemplateCard.tsx
    │   │   │   ├── TemplateForm.tsx
    │   │   │   ├── TemplatePreview.tsx
    │   │   │   └── index.ts
    │   │   ├── hooks/
    │   │   │   ├── useTemplates.ts
    │   │   │   └── index.ts
    │   │   ├── services/
    │   │   │   └── templatesApi.ts
    │   │   └── types/
    │   │       └── template.types.ts
    │   │
    │   ├── symbols/
    │   │   ├── components/
    │   │   │   ├── SymbolLibrary.tsx
    │   │   │   ├── SymbolCard.tsx
    │   │   │   ├── SymbolUpload.tsx
    │   │   │   ├── SVGEditor.tsx
    │   │   │   └── index.ts
    │   │   ├── hooks/
    │   │   │   ├── useSymbols.ts
    │   │   │   └── index.ts
    │   │   ├── services/
    │   │   │   └── symbolsApi.ts
    │   │   └── types/
    │   │       └── symbol.types.ts
    │   │
    │   └── realtime/
    │       ├── components/
    │       │   ├── RealtimeProvider.tsx
    │       │   ├── ConnectionStatus.tsx
    │       │   └── index.ts
    │       ├── hooks/
    │       │   ├── useWebSocket.ts
    │       │   ├── useRealtimeData.ts
    │       │   └── index.ts
    │       ├── services/
    │       │   ├── websocketService.ts
    │       │   ├── realtimeDataService.ts
    │       │   └── index.ts
    │       ├── stores/
    │       │   ├── realtimeStore.ts
    │       │   └── connectionStore.ts
    │       └── types/
    │           └── realtime.types.ts
    │
    ├── shared/
    │   ├── components/
    │   │   ├── ui/                              # Basic UI components
    │   │   │   ├── Button/
    │   │   │   │   ├── Button.tsx
    │   │   │   │   ├── Button.stories.tsx
    │   │   │   │   ├── Button.test.tsx
    │   │   │   │   └── index.ts
    │   │   │   ├── Input/
    │   │   │   ├── Modal/
    │   │   │   ├── Table/
    │   │   │   ├── Card/
    │   │   │   ├── Tabs/
    │   │   │   ├── Tooltip/
    │   │   │   ├── Dropdown/
    │   │   │   ├── Loading/
    │   │   │   ├── ErrorBoundary/
    │   │   │   └── index.ts
    │   │   ├── layout/                          # Layout components
    │   │   │   ├── Header/
    │   │   │   │   ├── Header.tsx
    │   │   │   │   ├── UserMenu.tsx
    │   │   │   │   ├── Notifications.tsx
    │   │   │   │   └── index.ts
    │   │   │   ├── Sidebar/
    │   │   │   │   ├── Sidebar.tsx
    │   │   │   │   ├── NavItem.tsx
    │   │   │   │   ├── NavGroup.tsx
    │   │   │   │   └── index.ts
    │   │   │   ├── Breadcrumb/
    │   │   │   ├── PageHeader/
    │   │   │   ├── MainLayout/
    │   │   │   └── index.ts
    │   │   ├── charts/                          # Chart components
    │   │   │   ├── LineChart.tsx
    │   │   │   ├── BarChart.tsx
    │   │   │   ├── PieChart.tsx
    │   │   │   ├── GaugeChart.tsx
    │   │   │   └── index.ts
    │   │   ├── canvas/                          # Canvas/drawing components
    │   │   │   ├── Canvas.tsx
    │   │   │   ├── CanvasLayer.tsx
    │   │   │   ├── CanvasGrid.tsx
    │   │   │   ├── CanvasRuler.tsx
    │   │   │   ├── SelectionBox.tsx
    │   │   │   ├── DragHandle.tsx
    │   │   │   └── index.ts
    │   │   ├── forms/                           # Form components
    │   │   │   ├── FormField.tsx
    │   │   │   ├── FormSection.tsx
    │   │   │   ├── FormActions.tsx
    │   │   │   └── index.ts
    │   │   └── providers/                       # Context providers
    │   │       ├── ThemeProvider.tsx
    │   │       ├── AuthProvider.tsx
    │   │       ├── WebSocketProvider.tsx
    │   │       ├── ToastProvider.tsx
    │   │       └── index.ts
    │   │
    │   ├── hooks/                               # Shared hooks
    │   │   ├── useApi.ts
    │   │   ├── useLocalStorage.ts
    │   │   ├── useDebounce.ts
    │   │   ├── useClickOutside.ts
    │   │   ├── useKeyboard.ts
    │   │   ├── usePrevious.ts
    │   │   ├── useWindowSize.ts
    │   │   └── index.ts
    │   │
    │   ├── services/                            # Shared services
    │   │   ├── api/
    │   │   │   ├── apiClient.ts                # Main API client
    │   │   │   ├── endpoints.ts                # API endpoints
    │   │   │   ├── interceptors.ts             # Request/Response interceptors
    │   │   │   ├── types.ts                    # API types
    │   │   │   └── index.ts
    │   │   ├── websocket/
    │   │   │   ├── websocketClient.ts          # WebSocket client
    │   │   │   ├── messageHandlers.ts          # Message handlers
    │   │   │   ├── types.ts                    # WebSocket types
    │   │   │   └── index.ts
    │   │   ├── storage/
    │   │   │   ├── localStorage.ts             # Local storage service
    │   │   │   ├── sessionStorage.ts           # Session storage service
    │   │   │   └── index.ts
    │   │   ├── validation/
    │   │   │   ├── schemas.ts                  # Zod validation schemas
    │   │   │   ├── validators.ts               # Custom validators
    │   │   │   └── index.ts
    │   │   ├── utils/
    │   │   │   ├── formatters.ts               # Data formatters
    │   │   │   ├── parsers.ts                  # Data parsers
    │   │   │   ├── calculations.ts             # Math utilities
    │   │   │   ├── dates.ts                    # Date utilities
    │   │   │   ├── colors.ts                   # Color utilities
    │   │   │   ├── files.ts                    # File utilities
    │   │   │   └── index.ts
    │   │   └── index.ts
    │   │
    │   ├── stores/                              # Global state
    │   │   ├── appStore.ts                     # Global app state
    │   │   ├── themeStore.ts                   # Theme state
    │   │   ├── notificationStore.ts            # Notifications
    │   │   └── index.ts
    │   │
    │   ├── types/                               # Shared types
    │   │   ├── api.types.ts                    # API types
    │   │   ├── common.types.ts                 # Common types
    │   │   ├── ui.types.ts                     # UI types
    │   │   ├── database.types.ts               # Database entity types
    │   │   └── index.ts
    │   │
    │   ├── constants/                           # Constants
    │   │   ├── routes.ts                       # Route constants
    │   │   ├── apiEndpoints.ts                 # API endpoint constants
    │   │   ├── permissions.ts                  # Permission constants
    │   │   ├── colors.ts                       # Color constants
    │   │   ├── sizes.ts                        # Size constants
    │   │   └── index.ts
    │   │
    │   └── lib/                                # External library configs
    │       ├── queryClient.ts                  # React Query config
    │       ├── axios.ts                        # Axios config
    │       ├── dayjs.ts                        # Day.js config
    │       └── index.ts
    │
    ├── styles/                                 # Additional styles
    │   ├── components.css                      # Component styles
    │   ├── utilities.css                       # Utility styles
    │   └── themes/
    │       ├── light.css
    │       └── dark.css
    │
    └── middleware.ts                           # Next.js middleware