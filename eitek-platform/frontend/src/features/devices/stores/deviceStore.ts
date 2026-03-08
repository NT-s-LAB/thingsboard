import { create } from 'zustand';
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { 
  Device, 
  DeviceFilters, 
  DeviceSort, 
  DeviceSelection,
  DeviceListParams,
  DeviceProfile,
  DeviceGroup,
  DeviceAlarm,
  DeviceCommand
} from '../types';
import { deviceService } from '../services/deviceService';

interface DeviceState {
  // Data state
  devices: Device[];
  selectedDevice: Device | null;
  deviceProfiles: DeviceProfile[];
  deviceGroups: DeviceGroup[];
  
  // UI state
  loading: boolean;
  saving: boolean;
  error: string | null;
  
  // List state
  pagination: {
    page: number;
    pageSize: number;
    totalElements: number;
    totalPages: number;
    hasNext: boolean;
  };
  
  // Filters and sorting
  filters: DeviceFilters;
  sort: DeviceSort;
  selection: DeviceSelection;
  
  // Modal states
  isCreateModalOpen: boolean;
  isEditModalOpen: boolean;
  isDeleteModalOpen: boolean;
  isBulkActionsModalOpen: boolean;
  isAttributesModalOpen: boolean;
  isTelemetryModalOpen: boolean;
  isRpcModalOpen: boolean;
  isAlarmsModalOpen: boolean;
  
  // Real-time data
  realtimeTelemetry: Record<string, any>;
  deviceAlarms: DeviceAlarm[];
  rpcCommands: DeviceCommand[];
  
  // View mode
  viewMode: 'grid' | 'list' | 'map';
}

interface DeviceActions {
  // Data actions
  fetchDevices: (params?: DeviceListParams) => Promise<void>;
  fetchDevice: (id: string) => Promise<void>;
  createDevice: (data: any) => Promise<void>;
  updateDevice: (id: string, data: any) => Promise<void>;
  deleteDevice: (id: string) => Promise<void>;
  deleteDevices: (ids: string[]) => Promise<void>;
  
  // Profile actions
  fetchDeviceProfiles: () => Promise<void>;
  
  // Group actions
  fetchDeviceGroups: () => Promise<void>;
  
  // Filter and sort actions
  setFilters: (filters: Partial<DeviceFilters>) => void;
  resetFilters: () => void;
  setSort: (sort: DeviceSort) => void;
  setSearch: (search: string) => void;
  
  // Selection actions
  selectDevice: (id: string) => void;
  selectAllDevices: () => void;
  deselectAllDevices: () => void;
  toggleDeviceSelection: (id: string) => void;
  
  // Modal actions
  openCreateModal: () => void;
  openEditModal: (device: Device) => void;
  openDeleteModal: (device: Device) => void;
  openBulkActionsModal: () => void;
  openAttributesModal: (device: Device) => void;
  openTelemetryModal: (device: Device) => void;
  openRpcModal: (device: Device) => void;
  openAlarmsModal: (device: Device) => void;
  closeAllModals: () => void;
  
  // Pagination actions
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  
  // View actions
  setViewMode: (mode: 'grid' | 'list' | 'map') => void;
  
  // Real-time actions
  updateRealtimeTelemetry: (deviceId: string, data: any) => void;
  addDeviceAlarm: (alarm: DeviceAlarm) => void;
  updateDeviceAlarm: (alarm: DeviceAlarm) => void;
  addRpcCommand: (command: DeviceCommand) => void;
  updateRpcCommand: (command: DeviceCommand) => void;
  
  // Utility actions
  setError: (error: string | null) => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  setSaving: (saving: boolean) => void;
  reset: () => void;
}

const initialFilters: DeviceFilters = {
  search: '',
  deviceTypes: [],
  statuses: [],
  connectionTypes: [],
  hasLocation: null,
};

const initialSort: DeviceSort = {
  field: 'name',
  direction: 'asc',
};

const initialSelection: DeviceSelection = {
  selectedIds: [],
  isAllSelected: false,
  isIndeterminate: false,
};

const initialState: DeviceState = {
  devices: [],
  selectedDevice: null,
  deviceProfiles: [],
  deviceGroups: [],
  
  loading: false,
  saving: false,
  error: null,
  
  pagination: {
    page: 0,
    pageSize: 20,
    totalElements: 0,
    totalPages: 0,
    hasNext: false,
  },
  
  filters: initialFilters,
  sort: initialSort,
  selection: initialSelection,
  
  isCreateModalOpen: false,
  isEditModalOpen: false,
  isDeleteModalOpen: false,
  isBulkActionsModalOpen: false,
  isAttributesModalOpen: false,
  isTelemetryModalOpen: false,
  isRpcModalOpen: false,
  isAlarmsModalOpen: false,
  
  realtimeTelemetry: {},
  deviceAlarms: [],
  rpcCommands: [],
  
  viewMode: 'grid',
};

export const useDeviceStore = create<DeviceState & DeviceActions>()(
  devtools(
    persist(
      subscribeWithSelector(
        immer((set, get) => ({
          ...initialState,

          // Data actions
          fetchDevices: async (params) => {
            try {
              set((state) => {
                state.loading = true;
                state.error = null;
              });

              const { filters, sort, pagination } = get();
              const requestParams: DeviceListParams = {
                page: (pagination.page ?? 0) + 1, // FE is 0-based, BE is 1-based
                pageSize: pagination.pageSize ?? 20,
                sortProperty: sort.field,
                sortOrder: sort.direction.toUpperCase() as 'ASC' | 'DESC',
                ...params,
              };

              // Apply filters
              if (filters.search) {
                requestParams.textSearch = filters.search;
              }
              if (filters.deviceTypes.length > 0) {
                requestParams.deviceTypes = filters.deviceTypes;
              }
              if (filters.statuses.length > 0) {
                requestParams.statuses = filters.statuses;
              }

              const response = await deviceService.getDevices(requestParams);

              set((state) => {
                state.devices = response.data;
                state.pagination = {
                  ...state.pagination,
                  totalElements: response.totalElements,
                  totalPages: response.totalPages,
                  hasNext: response.hasNext,
                };
                state.loading = false;
                
                // Update selection state
                const selectedIds = state.selection.selectedIds.filter(id =>
                  response.data.some(device => device.id === id)
                );
                state.selection = {
                  selectedIds,
                  isAllSelected: selectedIds.length === response.data.length && response.data.length > 0,
                  isIndeterminate: selectedIds.length > 0 && selectedIds.length < response.data.length,
                };
              });
            } catch (error) {
              set((state) => {
                state.loading = false;
                state.error = error instanceof Error ? error.message : 'Failed to fetch devices';
              });
            }
          },

          fetchDevice: async (id) => {
            try {
              set((state) => {
                state.loading = true;
                state.error = null;
              });

              const device = await deviceService.getDevice(id);

              set((state) => {
                state.selectedDevice = device;
                state.loading = false;
              });
            } catch (error) {
              set((state) => {
                state.loading = false;
                state.error = error instanceof Error ? error.message : 'Failed to fetch device';
              });
            }
          },

          createDevice: async (data) => {
            try {
              set((state) => {
                state.saving = true;
                state.error = null;
              });

              const device = await deviceService.createDevice(data);

              set((state) => {
                state.devices.unshift(device);
                state.saving = false;
                state.isCreateModalOpen = false;
              });

              // Refresh devices to get updated pagination
              get().fetchDevices();
            } catch (error) {
              set((state) => {
                state.saving = false;
                state.error = error instanceof Error ? error.message : 'Failed to create device';
              });
            }
          },

          updateDevice: async (id, data) => {
            try {
              set((state) => {
                state.saving = true;
                state.error = null;
              });

              const updatedDevice = await deviceService.updateDevice({ id, ...data });

              set((state) => {
                const index = state.devices.findIndex(d => d.id === id);
                if (index !== -1) {
                  state.devices[index] = updatedDevice;
                }
                if (state.selectedDevice?.id === id) {
                  state.selectedDevice = updatedDevice;
                }
                state.saving = false;
                state.isEditModalOpen = false;
              });
            } catch (error) {
              set((state) => {
                state.saving = false;
                state.error = error instanceof Error ? error.message : 'Failed to update device';
              });
            }
          },

          deleteDevice: async (id) => {
            try {
              set((state) => {
                state.saving = true;
                state.error = null;
              });

              await deviceService.deleteDevice(id);

              set((state) => {
                state.devices = state.devices.filter(d => d.id !== id);
                state.selection.selectedIds = state.selection.selectedIds.filter(selectedId => selectedId !== id);
                if (state.selectedDevice?.id === id) {
                  state.selectedDevice = null;
                }
                state.saving = false;
                state.isDeleteModalOpen = false;
              });

              // Update selection state
              set((state) => {
                const { selectedIds } = state.selection;
                state.selection = {
                  selectedIds,
                  isAllSelected: selectedIds.length === state.devices.length && state.devices.length > 0,
                  isIndeterminate: selectedIds.length > 0 && selectedIds.length < state.devices.length,
                };
              });
            } catch (error) {
              set((state) => {
                state.saving = false;
                state.error = error instanceof Error ? error.message : 'Failed to delete device';
              });
            }
          },

          deleteDevices: async (ids) => {
            try {
              set((state) => {
                state.saving = true;
                state.error = null;
              });

              await deviceService.deleteDevices(ids);

              set((state) => {
                state.devices = state.devices.filter(d => !ids.includes(d.id));
                state.selection = initialSelection;
                if (state.selectedDevice && ids.includes(state.selectedDevice.id)) {
                  state.selectedDevice = null;
                }
                state.saving = false;
                state.isBulkActionsModalOpen = false;
              });
            } catch (error) {
              set((state) => {
                state.saving = false;
                state.error = error instanceof Error ? error.message : 'Failed to delete devices';
              });
            }
          },

          // Profile actions
          fetchDeviceProfiles: async () => {
            try {
              const response = await deviceService.getDeviceProfiles(0, 100);
              set((state) => {
                state.deviceProfiles = response.data;
              });
            } catch (error) {
              console.error('Failed to fetch device profiles:', error);
            }
          },

          // Group actions
          fetchDeviceGroups: async () => {
            try {
              const groups = await deviceService.getDeviceGroups();
              set((state) => {
                state.deviceGroups = groups;
              });
            } catch (error) {
              console.error('Failed to fetch device groups:', error);
            }
          },

          // Filter and sort actions
          setFilters: (filters) => {
            set((state) => {
              state.filters = { ...state.filters, ...filters };
              state.pagination.page = 0;
            });
            get().fetchDevices();
          },

          resetFilters: () => {
            set((state) => {
              state.filters = initialFilters;
              state.pagination.page = 0;
            });
            get().fetchDevices();
          },

          setSort: (sort) => {
            set((state) => {
              state.sort = sort;
              state.pagination.page = 0;
            });
            get().fetchDevices();
          },

          setSearch: (search) => {
            set((state) => {
              state.filters.search = search;
              state.pagination.page = 0;
            });
            // Debounce search
            setTimeout(() => {
              get().fetchDevices();
            }, 300);
          },

          // Selection actions
          selectDevice: (id) => {
            set((state) => {
              const device = state.devices.find(d => d.id === id);
              if (device) {
                state.selectedDevice = device;
              }
            });
          },

          selectAllDevices: () => {
            set((state) => {
              const allIds = state.devices.map(d => d.id);
              state.selection = {
                selectedIds: allIds,
                isAllSelected: true,
                isIndeterminate: false,
              };
            });
          },

          deselectAllDevices: () => {
            set((state) => {
              state.selection = initialSelection;
            });
          },

          toggleDeviceSelection: (id) => {
            set((state) => {
              const { selectedIds } = state.selection;
              const isSelected = selectedIds.includes(id);
              
              const newSelectedIds = isSelected
                ? selectedIds.filter(selectedId => selectedId !== id)
                : [...selectedIds, id];
              
              state.selection = {
                selectedIds: newSelectedIds,
                isAllSelected: newSelectedIds.length === state.devices.length && state.devices.length > 0,
                isIndeterminate: newSelectedIds.length > 0 && newSelectedIds.length < state.devices.length,
              };
            });
          },

          // Modal actions
          openCreateModal: () => {
            set((state) => {
              state.isCreateModalOpen = true;
            });
          },

          openEditModal: (device) => {
            set((state) => {
              state.selectedDevice = device;
              state.isEditModalOpen = true;
            });
          },

          openDeleteModal: (device) => {
            set((state) => {
              state.selectedDevice = device;
              state.isDeleteModalOpen = true;
            });
          },

          openBulkActionsModal: () => {
            set((state) => {
              state.isBulkActionsModalOpen = true;
            });
          },

          openAttributesModal: (device) => {
            set((state) => {
              state.selectedDevice = device;
              state.isAttributesModalOpen = true;
            });
          },

          openTelemetryModal: (device) => {
            set((state) => {
              state.selectedDevice = device;
              state.isTelemetryModalOpen = true;
            });
          },

          openRpcModal: (device) => {
            set((state) => {
              state.selectedDevice = device;
              state.isRpcModalOpen = true;
            });
          },

          openAlarmsModal: (device) => {
            set((state) => {
              state.selectedDevice = device;
              state.isAlarmsModalOpen = true;
            });
          },

          closeAllModals: () => {
            set((state) => {
              state.isCreateModalOpen = false;
              state.isEditModalOpen = false;
              state.isDeleteModalOpen = false;
              state.isBulkActionsModalOpen = false;
              state.isAttributesModalOpen = false;
              state.isTelemetryModalOpen = false;
              state.isRpcModalOpen = false;
              state.isAlarmsModalOpen = false;
            });
          },

          // Pagination actions
          setPage: (page) => {
            set((state) => {
              state.pagination.page = page;
            });
            get().fetchDevices();
          },

          setPageSize: (pageSize) => {
            set((state) => {
              state.pagination.pageSize = pageSize;
              state.pagination.page = 0;
            });
            get().fetchDevices();
          },

          // View actions
          setViewMode: (mode) => {
            set((state) => {
              state.viewMode = mode;
            });
          },

          // Real-time actions
          updateRealtimeTelemetry: (deviceId, data) => {
            set((state) => {
              state.realtimeTelemetry[deviceId] = {
                ...state.realtimeTelemetry[deviceId],
                ...data,
              };
              
              // Update device status if available
              const deviceIndex = state.devices.findIndex(d => d.id === deviceId);
              if (deviceIndex !== -1 && data.status && state.devices[deviceIndex]) {
                state.devices[deviceIndex].status = data.status;
                state.devices[deviceIndex].lastActivityTime = new Date().toISOString();
              }
            });
          },

          addDeviceAlarm: (alarm) => {
            set((state) => {
              state.deviceAlarms.unshift(alarm);
            });
          },

          updateDeviceAlarm: (alarm) => {
            set((state) => {
              const index = state.deviceAlarms.findIndex(a => a.id === alarm.id);
              if (index !== -1) {
                state.deviceAlarms[index] = alarm;
              }
            });
          },

          addRpcCommand: (command) => {
            set((state) => {
              state.rpcCommands.unshift(command);
            });
          },

          updateRpcCommand: (command) => {
            set((state) => {
              const index = state.rpcCommands.findIndex(c => c.id === command.id);
              if (index !== -1) {
                state.rpcCommands[index] = command;
              }
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
        name: 'device-store',
        partialize: (state) => ({
          viewMode: state.viewMode,
          pagination: {
            pageSize: state.pagination.pageSize,
          },
          filters: state.filters,
          sort: state.sort,
        }),
        merge: (persistedState: any, currentState) => ({
          ...currentState,
          ...persistedState,
          pagination: {
            ...currentState.pagination,
            ...(persistedState as any)?.pagination,
          },
        }),
      }
    ),
    {
      name: 'device-store',
    }
  )
);