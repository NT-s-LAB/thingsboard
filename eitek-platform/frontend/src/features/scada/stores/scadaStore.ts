import { create } from 'zustand';
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type {
  ScadaDashboard,
  Widget,
  EditorState,
  EditorViewport,
  ScadaTemplate,
  ScadaVariable,
  ScadaScript,
  DashboardListParams,
} from '../types';
import { scadaService } from '../services/scadaService';

/** Transform BE response (scadaWidgets) into FE-compatible shape (widgets) */
function normalizeDashboard(raw: any): ScadaDashboard | null {
  if (!raw) return null;
  const d = { ...raw };
  // Map scadaWidgets -> widgets if needed
  if (!d.widgets && d.scadaWidgets) {
    d.widgets = (d.scadaWidgets as any[]).map((sw: any) => {
      // If already transformed by BE, use as-is
      if (sw.transform) return sw;
      // Transform raw ScadaWidget + Widget relation
      const pos = sw.position || {};
      return {
        id: sw.id,
        type: sw.widget?.type || sw.properties?.widgetType || 'custom',
        name: sw.properties?.name || sw.widget?.name || 'Widget',
        description: sw.widget?.description || '',
        transform: {
          position: { x: pos.x ?? 100, y: pos.y ?? 100 },
          size: { width: pos.width ?? 100, height: pos.height ?? 50 },
          rotation: pos.rotation ?? 0,
          scale: pos.scale ?? 1,
          zIndex: pos.zIndex ?? 0,
        },
        style: sw.styles || {},
        visible: sw.isVisible ?? true,
        enabled: true,
        locked: false,
        dataBindings: Array.isArray(sw.bindings) ? sw.bindings : [],
        actions: [],
        properties: sw.properties || {},
        createdTime: sw.createdAt || new Date().toISOString(),
        updatedTime: sw.updatedAt || new Date().toISOString(),
        createdBy: '',
      };
    });
  }
  if (!d.widgets) d.widgets = [];
  if (!d.layers) d.layers = [];
  if (!d.backgroundColor) d.backgroundColor = '#FFFFFF';
  if (!d.settings) d.settings = { grid: { size: 20, color: '#E5E7EB' } };
  if (!d.canvasSize) d.canvasSize = { width: 1920, height: 1080 };
  return d as ScadaDashboard;
}

interface ScadaState {
  // Data state
  dashboards: ScadaDashboard[];
  currentDashboard: ScadaDashboard | null;
  templates: ScadaTemplate[];
  
  // UI state
  loading: boolean;
  saving: boolean;
  error: string | null;
  
  // Editor state
  editorState: EditorState;
  
  // Runtime state
  isRuntimeMode: boolean;
  runtimeSessionId: string | null;
  realtimeData: Record<string, any>;
  
  // Modal states
  isCreateModalOpen: boolean;
  isTemplateModalOpen: boolean;
  isPropertiesModalOpen: boolean;
  isVariablesModalOpen: boolean;
  isScriptsModalOpen: boolean;
  isLayersModalOpen: boolean;
  isExportModalOpen: boolean;
  isImportModalOpen: boolean;
  
  // Selection and clipboard
  selectedWidget: Widget | null;
}

interface ScadaActions {
  // Dashboard actions
  fetchDashboards: (projectId?: string) => Promise<void>;
  fetchDashboard: (id: string) => Promise<void>;
  createDashboard: (data: any) => Promise<void>;
  updateDashboard: (data: any) => Promise<void>;
  deleteDashboard: (id: string) => Promise<void>;
  cloneDashboard: (id: string, name: string) => Promise<void>;
  setCurrentDashboard: (dashboard: ScadaDashboard | null) => void;
  
  // Template actions
  fetchTemplates: (category?: string) => Promise<void>;
  createTemplate: (template: any) => Promise<void>;
  
  // Widget actions
  addWidget: (widget: Omit<Widget, 'id' | 'createdTime' | 'updatedTime' | 'createdBy'>) => Promise<void>;
  updateWidget: (widget: Widget) => Promise<void>;
  updateWidgetLocal: (widgetId: string, updates: Partial<Widget>) => void;
  deleteWidget: (widgetId: string) => Promise<void>;
  duplicateWidget: (widgetId: string) => Promise<void>;
  selectWidget: (widgetId: string | null) => void;
  moveWidget: (widgetId: string, position: { x: number; y: number }) => void;
  resizeWidget: (widgetId: string, size: { width: number; height: number }) => void;
  
  // Selection actions
  selectWidgets: (widgetIds: string[]) => void;
  clearSelection: () => void;
  selectAll: () => void;
  
  // Clipboard actions
  copyWidgets: (widgetIds: string[]) => void;
  cutWidgets: (widgetIds: string[]) => void;
  pasteWidgets: () => Promise<void>;
  
  // History actions
  undo: () => void;
  redo: () => void;
  addToHistory: (action: string, data: any) => void;
  
  // Editor state actions
  setEditorMode: (mode: 'design' | 'runtime' | 'debug') => void;
  setViewport: (viewport: Partial<EditorViewport>) => void;
  setActiveTool: (tool: EditorState['activeTool']) => void;
  setGridSettings: (showGrid: boolean, snapToGrid: boolean) => void;
  togglePanel: (panel: 'left' | 'right' | 'bottom') => void;
  
  // Runtime actions
  startRuntime: () => Promise<void>;
  stopRuntime: () => Promise<void>;
  updateRealtimeData: (deviceId: string, data: any) => void;
  
  // Variable actions
  createVariable: (variable: Omit<ScadaVariable, 'id'>) => Promise<void>;
  updateVariable: (variable: ScadaVariable) => Promise<void>;
  deleteVariable: (variableId: string) => Promise<void>;
  
  // Script actions
  createScript: (script: Omit<ScadaScript, 'id'>) => Promise<void>;
  updateScript: (script: ScadaScript) => Promise<void>;
  deleteScript: (scriptId: string) => Promise<void>;
  testScript: (script: ScadaScript) => Promise<any>;
  
  // Modal actions
  openCreateModal: () => void;
  openTemplateModal: () => void;
  openPropertiesModal: (widget: Widget) => void;
  openVariablesModal: () => void;
  openScriptsModal: () => void;
  openLayersModal: () => void;
  openExportModal: () => void;
  openImportModal: () => void;
  closeAllModals: () => void;
  
  // Utility actions
  setError: (error: string | null) => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  setSaving: (saving: boolean) => void;
  reset: () => void;
}

const initialEditorState: EditorState = {
  mode: 'design',
  viewport: {
    position: { x: 0, y: 0 },
    zoom: 1,
    size: { width: 1920, height: 1080 },
  },
  selection: {
    selectedWidgetIds: [],
  },
  clipboard: null,
  history: {
    past: [],
    future: [],
    maxSize: 50,
  },
  showGrid: true,
  snapToGrid: true,
  showRulers: true,
  showGuides: true,
  leftPanelWidth: 300,
  rightPanelWidth: 300,
  bottomPanelHeight: 200,
  activeTool: 'select',
};

const initialState = {
  dashboards: [],
  currentDashboard: null,
  templates: [],
  
  loading: false,
  saving: false,
  error: null,
  
  editorState: initialEditorState,
  
  isRuntimeMode: false,
  runtimeSessionId: null,
  realtimeData: {},
  
  isCreateModalOpen: false,
  isTemplateModalOpen: false,
  isPropertiesModalOpen: false,
  isVariablesModalOpen: false,
  isScriptsModalOpen: false,
  isLayersModalOpen: false,
  isExportModalOpen: false,
  isImportModalOpen: false,
  
  selectedWidget: null,
};

export const useScadaStore = create<ScadaState & ScadaActions>()(
  devtools(
    persist(
      subscribeWithSelector(
        immer((set, get) => ({
          ...initialState,

          // Dashboard actions
          fetchDashboards: async (projectId) => {
            try {
              set((state) => {
                state.loading = true;
                state.error = null;
              });

              const params: DashboardListParams = {};
              if (projectId) {
                params.projectId = projectId;
              }
              const response = await scadaService.getDashboards(params);

              set((state) => {
                state.dashboards = response.data;
                state.loading = false;
              });
            } catch (error) {
              set((state) => {
                state.loading = false;
                state.error = error instanceof Error ? error.message : 'Failed to fetch dashboards';
              });
            }
          },

          fetchDashboard: async (id) => {
            try {
              set((state) => {
                state.loading = true;
                state.error = null;
              });

              const rawDashboard = await scadaService.getDashboard(id);
              const dashboard = normalizeDashboard(rawDashboard);

              set((state) => {
                state.currentDashboard = dashboard;
                state.loading = false;
              });
            } catch (error) {
              set((state) => {
                state.loading = false;
                state.error = error instanceof Error ? error.message : 'Failed to fetch dashboard';
              });
            }
          },

          createDashboard: async (data) => {
            try {
              set((state) => {
                state.saving = true;
                state.error = null;
              });

              const dashboard = await scadaService.createDashboard(data);

              set((state) => {
                state.dashboards.unshift(dashboard);
                state.currentDashboard = dashboard;
                state.saving = false;
                state.isCreateModalOpen = false;
              });
            } catch (error) {
              set((state) => {
                state.saving = false;
                state.error = error instanceof Error ? error.message : 'Failed to create dashboard';
              });
            }
          },

          updateDashboard: async (data) => {
            try {
              set((state) => {
                state.saving = true;
                state.error = null;
              });

              const updatedDashboard = await scadaService.updateDashboard(data);

              set((state) => {
                const index = state.dashboards.findIndex(d => d.id === data.id);
                if (index !== -1) {
                  state.dashboards[index] = updatedDashboard;
                }
                if (state.currentDashboard?.id === data.id) {
                  state.currentDashboard = updatedDashboard;
                }
                state.saving = false;
              });
            } catch (error) {
              set((state) => {
                state.saving = false;
                state.error = error instanceof Error ? error.message : 'Failed to update dashboard';
              });
            }
          },

          deleteDashboard: async (id) => {
            try {
              set((state) => {
                state.saving = true;
                state.error = null;
              });

              await scadaService.deleteDashboard(id);

              set((state) => {
                state.dashboards = state.dashboards.filter(d => d.id !== id);
                if (state.currentDashboard?.id === id) {
                  state.currentDashboard = null;
                }
                state.saving = false;
              });
            } catch (error) {
              set((state) => {
                state.saving = false;
                state.error = error instanceof Error ? error.message : 'Failed to delete dashboard';
              });
            }
          },

          cloneDashboard: async (id, name) => {
            try {
              set((state) => {
                state.saving = true;
                state.error = null;
              });

              const clonedDashboard = await scadaService.cloneDashboard(id, name);

              set((state) => {
                state.dashboards.unshift(clonedDashboard);
                state.saving = false;
              });
            } catch (error) {
              set((state) => {
                state.saving = false;
                state.error = error instanceof Error ? error.message : 'Failed to clone dashboard';
              });
            }
          },

          setCurrentDashboard: (dashboard) => {
            set((state) => {
              state.currentDashboard = dashboard;
              if (dashboard) {
                // Update canvas size in editor viewport
                state.editorState.viewport.size = dashboard.canvasSize;
                // Reset selection and history when switching dashboards
                state.editorState.selection = { selectedWidgetIds: [] };
                state.editorState.history = { past: [], future: [], maxSize: 50 };
              }
            });
          },

          // Template actions
          fetchTemplates: async (category) => {
            try {
              const templates = await scadaService.getTemplates(category);
              set((state) => {
                state.templates = templates;
              });
            } catch (error) {
              console.error('Failed to fetch templates:', error);
            }
          },

          createTemplate: async (template) => {
            try {
              const newTemplate = await scadaService.createTemplate(template);
              set((state) => {
                state.templates.unshift(newTemplate);
              });
            } catch (error) {
              set((state) => {
                state.error = error instanceof Error ? error.message : 'Failed to create template';
              });
            }
          },

          // Widget actions
          addWidget: async (widget) => {
            const { currentDashboard } = get();
            if (!currentDashboard) return;

            try {
              set((state) => {
                state.saving = true;
                state.error = null;
              });

              let newWidget: Widget;
              try {
                // Try to persist via API
                newWidget = await scadaService.addWidget(currentDashboard.id, widget);
              } catch {
                // API not available — create widget locally
                newWidget = {
                  ...widget,
                  id: crypto.randomUUID(),
                  createdTime: new Date().toISOString(),
                  updatedTime: new Date().toISOString(),
                  createdBy: 'local',
                } as Widget;
              }

              set((state) => {
                if (state.currentDashboard) {
                  if (!state.currentDashboard.widgets) {
                    (state.currentDashboard as any).widgets = [];
                  }
                  state.currentDashboard.widgets.push(newWidget);
                }
                state.saving = false;
              });

              // Add to history
              get().addToHistory('addWidget', { widget: newWidget });
            } catch (error) {
              set((state) => {
                state.saving = false;
                state.error = error instanceof Error ? error.message : 'Failed to add widget';
              });
            }
          },

          updateWidget: async (widget) => {
            const { currentDashboard } = get();
            if (!currentDashboard) return;

            try {
              const updatedWidget = await scadaService.updateWidget(currentDashboard.id, widget);

              set((state) => {
                if (state.currentDashboard) {
                  const widgets = state.currentDashboard.widgets ?? [];
                  const index = widgets.findIndex(w => w.id === widget.id);
                  if (index !== -1) {
                    const oldWidget = widgets[index];
                    widgets[index] = updatedWidget;
                    
                    // Add to history
                    get().addToHistory('updateWidget', { 
                      oldWidget, 
                      newWidget: updatedWidget 
                    });
                  }
                }
                if (state.selectedWidget?.id === widget.id) {
                  state.selectedWidget = updatedWidget;
                }
              });
            } catch (error) {
              set((state) => {
                state.error = error instanceof Error ? error.message : 'Failed to update widget';
              });
            }
          },

          updateWidgetLocal: (widgetId, updates) => {
            set((state) => {
              if (state.currentDashboard) {
                const widgets = state.currentDashboard.widgets ?? [];
                const index = widgets.findIndex(w => w.id === widgetId);
                if (index !== -1) {
                  const old = widgets[index]!;
                  const merged = {
                    ...old,
                    ...updates,
                    transform: updates.transform
                      ? { ...old.transform, ...updates.transform }
                      : old.transform,
                    style: updates.style
                      ? { ...old.style, ...updates.style }
                      : old.style,
                    properties: updates.properties
                      ? { ...old.properties, ...updates.properties }
                      : old.properties,
                    updatedTime: new Date().toISOString(),
                  } as any;
                  widgets[index] = merged;
                  if (state.selectedWidget?.id === widgetId) {
                    state.selectedWidget = merged;
                  }
                }
              }
            });
          },

          deleteWidget: async (widgetId) => {
            const { currentDashboard } = get();
            if (!currentDashboard) return;

            try {
              await scadaService.deleteWidget(currentDashboard.id, widgetId);

              set((state) => {
                if (state.currentDashboard) {
                  const widgets = state.currentDashboard.widgets ?? [];
                  const widgetIndex = widgets.findIndex(w => w.id === widgetId);
                  if (widgetIndex !== -1) {
                    const deletedWidget = widgets[widgetIndex];
                    widgets.splice(widgetIndex, 1);
                    
                    // Remove from selection
                    state.editorState.selection.selectedWidgetIds = 
                      state.editorState.selection.selectedWidgetIds.filter(id => id !== widgetId);
                    
                    if (state.selectedWidget?.id === widgetId) {
                      state.selectedWidget = null;
                    }

                    // Add to history
                    get().addToHistory('deleteWidget', { widget: deletedWidget });
                  }
                }
              });
            } catch (error) {
              set((state) => {
                state.error = error instanceof Error ? error.message : 'Failed to delete widget';
              });
            }
          },

          duplicateWidget: async (widgetId) => {
            const { currentDashboard } = get();
            if (!currentDashboard) return;

            try {
              const newWidget = await scadaService.duplicateWidget(currentDashboard.id, widgetId);

              set((state) => {
                if (state.currentDashboard) {
                  if (!state.currentDashboard.widgets) {
                    (state.currentDashboard as any).widgets = [];
                  }
                  state.currentDashboard.widgets.push(newWidget);
                  // Select the duplicated widget
                  state.editorState.selection.selectedWidgetIds = [newWidget.id];
                  state.selectedWidget = newWidget;
                }
              });

              get().addToHistory('duplicateWidget', { widget: newWidget });
            } catch (error) {
              set((state) => {
                state.error = error instanceof Error ? error.message : 'Failed to duplicate widget';
              });
            }
          },

          selectWidget: (widgetId) => {
            set((state) => {
              if (widgetId) {
                const widget = (state.currentDashboard?.widgets ?? []).find(w => w.id === widgetId);
                state.selectedWidget = widget || null;
                state.editorState.selection.selectedWidgetIds = [widgetId];
              } else {
                state.selectedWidget = null;
                state.editorState.selection.selectedWidgetIds = [];
              }
            });
          },

          moveWidget: (widgetId, position) => {
            set((state) => {
              if (state.currentDashboard) {
                const widget = (state.currentDashboard.widgets ?? []).find(w => w.id === widgetId);
                if (widget) {
                  widget.transform.position = position;
                  widget.updatedTime = new Date().toISOString();
                  
                  if (state.selectedWidget?.id === widgetId) {
                    state.selectedWidget = widget;
                  }
                }
              }
            });
          },

          resizeWidget: (widgetId, size) => {
            set((state) => {
              if (state.currentDashboard) {
                const widget = (state.currentDashboard.widgets ?? []).find(w => w.id === widgetId);
                if (widget) {
                  widget.transform.size = size;
                  widget.updatedTime = new Date().toISOString();
                  
                  if (state.selectedWidget?.id === widgetId) {
                    state.selectedWidget = widget;
                  }
                }
              }
            });
          },

          // Selection actions
          selectWidgets: (widgetIds) => {
            set((state) => {
              state.editorState.selection.selectedWidgetIds = widgetIds;
              if (widgetIds.length === 1) {
                const widget = (state.currentDashboard?.widgets ?? []).find(w => w.id === widgetIds[0]);
                state.selectedWidget = widget || null;
              } else {
                state.selectedWidget = null;
              }
            });
          },

          clearSelection: () => {
            set((state) => {
              state.editorState.selection.selectedWidgetIds = [];
              state.selectedWidget = null;
            });
          },

          selectAll: () => {
            set((state) => {
              if (state.currentDashboard) {
                state.editorState.selection.selectedWidgetIds = 
                  (state.currentDashboard.widgets ?? []).map(w => w.id);
                state.selectedWidget = null;
              }
            });
          },

          // Clipboard actions
          copyWidgets: (widgetIds) => {
            const { currentDashboard } = get();
            if (!currentDashboard) return;

            const widgets = (currentDashboard.widgets ?? []).filter(w => widgetIds.includes(w.id));
            
            set((state) => {
              state.editorState.clipboard = {
                widgets,
                operation: 'copy',
                timestamp: new Date().toISOString(),
              };
            });
          },

          cutWidgets: (widgetIds) => {
            const { currentDashboard } = get();
            if (!currentDashboard) return;

            const widgets = (currentDashboard.widgets ?? []).filter(w => widgetIds.includes(w.id));
            
            set((state) => {
              state.editorState.clipboard = {
                widgets,
                operation: 'cut',
                timestamp: new Date().toISOString(),
              };
            });
          },

          pasteWidgets: async () => {
            const { editorState, currentDashboard } = get();
            if (!currentDashboard || !editorState.clipboard) return;

            try {
              const { widgets, operation } = editorState.clipboard;
              const pastedWidgets: Widget[] = [];

              for (const widget of widgets) {
                const newWidget = {
                  ...widget,
                  id: crypto.randomUUID(),
                  transform: {
                    ...widget.transform,
                    position: {
                      x: widget.transform.position.x + 20,
                      y: widget.transform.position.y + 20,
                    },
                  },
                  name: `${widget.name} (Copy)`,
                  createdTime: new Date().toISOString(),
                  updatedTime: new Date().toISOString(),
                };

                try {
                  const addedWidget = await scadaService.addWidget(currentDashboard.id, newWidget);
                  pastedWidgets.push(addedWidget);
                } catch {
                  pastedWidgets.push(newWidget as Widget);
                }
              }

              set((state) => {
                if (state.currentDashboard) {
                  if (!state.currentDashboard.widgets) {
                    (state.currentDashboard as any).widgets = [];
                  }
                  state.currentDashboard.widgets.push(...pastedWidgets);
                  // Select the pasted widgets
                  state.editorState.selection.selectedWidgetIds = pastedWidgets.map(w => w.id);
                  
                  if (operation === 'cut') {
                    state.editorState.clipboard = null;
                  }
                }
              });

              get().addToHistory('pasteWidgets', { widgets: pastedWidgets });
            } catch (error) {
              set((state) => {
                state.error = error instanceof Error ? error.message : 'Failed to paste widgets';
              });
            }
          },

          // History actions
          undo: () => {
            set((state) => {
              const { past, future } = state.editorState.history;
              if (past.length === 0) return;

              const previous = past[past.length - 1];
              if (!previous) return;
              const newPast = past.slice(0, past.length - 1);
              
              // TODO: Implement undo logic based on action type
              
              state.editorState.history.past = newPast;
              state.editorState.history.future = [previous, ...future];
            });
          },

          redo: () => {
            set((state) => {
              const { past, future } = state.editorState.history;
              if (future.length === 0) return;

              const next = future[0];
              if (!next) return;
              const newFuture = future.slice(1);
              
              // TODO: Implement redo logic based on action type
              
              state.editorState.history.past = [...past, next];
              state.editorState.history.future = newFuture;
            });
          },

          addToHistory: (action, data) => {
            set((state) => {
              const { maxSize } = state.editorState.history;
              const historyItem = {
                action,
                data,
                timestamp: new Date().toISOString(),
              };

              state.editorState.history.past.push(historyItem);
              
              // Limit history size
              if (state.editorState.history.past.length > maxSize) {
                state.editorState.history.past = state.editorState.history.past.slice(-maxSize);
              }
              
              // Clear future history on new action
              state.editorState.history.future = [];
            });
          },

          // Editor state actions
          setEditorMode: (mode) => {
            set((state) => {
              state.editorState.mode = mode;
              if (mode === 'runtime') {
                state.isRuntimeMode = true;
              } else {
                state.isRuntimeMode = false;
              }
            });
          },

          setViewport: (viewport) => {
            set((state) => {
              state.editorState.viewport = {
                ...state.editorState.viewport,
                ...viewport,
              };
            });
          },

          setActiveTool: (tool) => {
            set((state) => {
              state.editorState.activeTool = tool;
            });
          },

          setGridSettings: (showGrid, snapToGrid) => {
            set((state) => {
              state.editorState.showGrid = showGrid;
              state.editorState.snapToGrid = snapToGrid;
            });
          },

          togglePanel: (panel) => {
            set((state) => {
              switch (panel) {
                case 'left':
                  state.editorState.leftPanelWidth = 
                    state.editorState.leftPanelWidth > 0 ? 0 : 300;
                  break;
                case 'right':
                  state.editorState.rightPanelWidth = 
                    state.editorState.rightPanelWidth > 0 ? 0 : 300;
                  break;
                case 'bottom':
                  state.editorState.bottomPanelHeight = 
                    state.editorState.bottomPanelHeight > 0 ? 0 : 200;
                  break;
              }
            });
          },

          // Runtime actions
          startRuntime: async () => {
            const { currentDashboard } = get();
            if (!currentDashboard) return;

            try {
              let sessionId: string;
              try {
                const result = await scadaService.startRuntime(currentDashboard.id);
                sessionId = result.sessionId;
              } catch {
                // Runtime API not available yet — run locally
                sessionId = `local-${crypto.randomUUID()}`;
              }

              set((state) => {
                state.isRuntimeMode = true;
                state.runtimeSessionId = sessionId;
                state.editorState.mode = 'runtime';
              });
            } catch (error) {
              set((state) => {
                state.error = error instanceof Error ? error.message : 'Failed to start runtime';
              });
            }
          },

          stopRuntime: async () => {
            const { currentDashboard, runtimeSessionId } = get();
            if (!currentDashboard || !runtimeSessionId) return;

            try {
              try {
                await scadaService.stopRuntime(currentDashboard.id, runtimeSessionId);
              } catch {
                // Runtime API not available — stop locally
              }
              
              set((state) => {
                state.isRuntimeMode = false;
                state.runtimeSessionId = null;
                state.realtimeData = {};
                state.editorState.mode = 'design';
              });
            } catch (error) {
              set((state) => {
                state.error = error instanceof Error ? error.message : 'Failed to stop runtime';
              });
            }
          },

          updateRealtimeData: (deviceId, data) => {
            set((state) => {
              state.realtimeData[deviceId] = {
                ...state.realtimeData[deviceId],
                ...data,
                timestamp: new Date().toISOString(),
              };
            });
          },

          // Variable actions
          createVariable: async (variable) => {
            const { currentDashboard } = get();
            if (!currentDashboard) return;

            try {
              const newVariable = await scadaService.createVariable(currentDashboard.id, variable);
              
              set((state) => {
                if (state.currentDashboard) {
                  state.currentDashboard.variables.push(newVariable);
                }
              });
            } catch (error) {
              set((state) => {
                state.error = error instanceof Error ? error.message : 'Failed to create variable';
              });
            }
          },

          updateVariable: async (variable) => {
            const { currentDashboard } = get();
            if (!currentDashboard) return;

            try {
              const updatedVariable = await scadaService.updateVariable(currentDashboard.id, variable);
              
              set((state) => {
                if (state.currentDashboard) {
                  const index = state.currentDashboard.variables.findIndex(v => v.id === variable.id);
                  if (index !== -1) {
                    state.currentDashboard.variables[index] = updatedVariable;
                  }
                }
              });
            } catch (error) {
              set((state) => {
                state.error = error instanceof Error ? error.message : 'Failed to update variable';
              });
            }
          },

          deleteVariable: async (variableId) => {
            const { currentDashboard } = get();
            if (!currentDashboard) return;

            try {
              await scadaService.deleteVariable(currentDashboard.id, variableId);
              
              set((state) => {
                if (state.currentDashboard) {
                  state.currentDashboard.variables = 
                    state.currentDashboard.variables.filter(v => v.id !== variableId);
                }
              });
            } catch (error) {
              set((state) => {
                state.error = error instanceof Error ? error.message : 'Failed to delete variable';
              });
            }
          },

          // Script actions
          createScript: async (script) => {
            const { currentDashboard } = get();
            if (!currentDashboard) return;

            try {
              const newScript = await scadaService.createScript(currentDashboard.id, script);
              
              set((state) => {
                if (state.currentDashboard) {
                  state.currentDashboard.scripts.push(newScript);
                }
              });
            } catch (error) {
              set((state) => {
                state.error = error instanceof Error ? error.message : 'Failed to create script';
              });
            }
          },

          updateScript: async (script) => {
            const { currentDashboard } = get();
            if (!currentDashboard) return;

            try {
              const updatedScript = await scadaService.updateScript(currentDashboard.id, script);
              
              set((state) => {
                if (state.currentDashboard) {
                  const index = state.currentDashboard.scripts.findIndex(s => s.id === script.id);
                  if (index !== -1) {
                    state.currentDashboard.scripts[index] = updatedScript;
                  }
                }
              });
            } catch (error) {
              set((state) => {
                state.error = error instanceof Error ? error.message : 'Failed to update script';
              });
            }
          },

          deleteScript: async (scriptId) => {
            const { currentDashboard } = get();
            if (!currentDashboard) return;

            try {
              await scadaService.deleteScript(currentDashboard.id, scriptId);
              
              set((state) => {
                if (state.currentDashboard) {
                  state.currentDashboard.scripts = 
                    state.currentDashboard.scripts.filter(s => s.id !== scriptId);
                }
              });
            } catch (error) {
              set((state) => {
                state.error = error instanceof Error ? error.message : 'Failed to delete script';
              });
            }
          },

          testScript: async (script) => {
            const { currentDashboard } = get();
            if (!currentDashboard) return;

            try {
              const result = await scadaService.testScript(currentDashboard.id, script);
              return result;
            } catch (error) {
              set((state) => {
                state.error = error instanceof Error ? error.message : 'Failed to test script';
              });
              throw error;
            }
          },

          // Modal actions
          openCreateModal: () => {
            set((state) => {
              state.isCreateModalOpen = true;
            });
          },

          openTemplateModal: () => {
            set((state) => {
              state.isTemplateModalOpen = true;
            });
          },

          openPropertiesModal: (widget) => {
            set((state) => {
              state.selectedWidget = widget;
              state.isPropertiesModalOpen = true;
            });
          },

          openVariablesModal: () => {
            set((state) => {
              state.isVariablesModalOpen = true;
            });
          },

          openScriptsModal: () => {
            set((state) => {
              state.isScriptsModalOpen = true;
            });
          },

          openLayersModal: () => {
            set((state) => {
              state.isLayersModalOpen = true;
            });
          },

          openExportModal: () => {
            set((state) => {
              state.isExportModalOpen = true;
            });
          },

          openImportModal: () => {
            set((state) => {
              state.isImportModalOpen = true;
            });
          },

          closeAllModals: () => {
            set((state) => {
              state.isCreateModalOpen = false;
              state.isTemplateModalOpen = false;
              state.isPropertiesModalOpen = false;
              state.isVariablesModalOpen = false;
              state.isScriptsModalOpen = false;
              state.isLayersModalOpen = false;
              state.isExportModalOpen = false;
              state.isImportModalOpen = false;
            });
          },

          // Utility actions
          setError: (error) => {
            set((state) => {
              state.error = error;
            });
          },

          clearError: () => {
            set((state) => {
              state.error = null;
            });
          },

          setLoading: (loading) => {
            set((state) => {
              state.loading = loading;
            });
          },

          setSaving: (saving) => {
            set((state) => {
              state.saving = saving;
            });
          },

          reset: () => {
            set(() => initialState);
          },
        }))
      ),
      {
        name: 'scada-store',
        partialize: (state) => ({
          editorState: {
            showGrid: state.editorState.showGrid,
            snapToGrid: state.editorState.snapToGrid,
            showRulers: state.editorState.showRulers,
            showGuides: state.editorState.showGuides,
            leftPanelWidth: state.editorState.leftPanelWidth,
            rightPanelWidth: state.editorState.rightPanelWidth,
            bottomPanelHeight: state.editorState.bottomPanelHeight,
          },
        }),
        merge: (persistedState, currentState) => {
          const persisted = persistedState as Partial<ScadaState>;
          return {
            ...currentState,
            ...persisted,
            editorState: {
              ...currentState.editorState,
              ...(persisted.editorState ?? {}),
            },
          };
        },
      }
    ),
    {
      name: 'scada-store',
    }
  )
);