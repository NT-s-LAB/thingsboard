import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { profileService } from '../services/profileService';
import type {
  DeviceProfile,
  AssetProfile,
  DeviceProfileCreateRequest,
  DeviceProfileUpdateRequest,
  AssetProfileCreateRequest,
  AssetProfileUpdateRequest,
  ProfileListParams,
} from '../types';

interface ProfileState {
  // Device Profiles
  deviceProfiles: DeviceProfile[];
  selectedDeviceProfile: DeviceProfile | null;
  deviceProfilePagination: {
    page: number;
    pageSize: number;
    totalElements: number;
    totalPages: number;
    hasNext: boolean;
  };

  // Asset Profiles
  assetProfiles: AssetProfile[];
  selectedAssetProfile: AssetProfile | null;
  assetProfilePagination: {
    page: number;
    pageSize: number;
    totalElements: number;
    totalPages: number;
    hasNext: boolean;
  };

  // UI State
  loading: boolean;
  saving: boolean;
  error: string | null;
  searchText: string;

  // Modals
  isCreateDeviceProfileModalOpen: boolean;
  isEditDeviceProfileModalOpen: boolean;
  isDeleteDeviceProfileModalOpen: boolean;
  isCreateAssetProfileModalOpen: boolean;
  isEditAssetProfileModalOpen: boolean;
  isDeleteAssetProfileModalOpen: boolean;

  // Actions
  fetchDeviceProfiles: (params?: ProfileListParams) => Promise<void>;
  fetchDeviceProfile: (id: string) => Promise<void>;
  createDeviceProfile: (data: DeviceProfileCreateRequest) => Promise<void>;
  updateDeviceProfile: (id: string, data: DeviceProfileUpdateRequest) => Promise<void>;
  deleteDeviceProfile: (id: string) => Promise<void>;

  fetchAssetProfiles: (params?: ProfileListParams) => Promise<void>;
  fetchAssetProfile: (id: string) => Promise<void>;
  createAssetProfile: (data: AssetProfileCreateRequest) => Promise<void>;
  updateAssetProfile: (id: string, data: AssetProfileUpdateRequest) => Promise<void>;
  deleteAssetProfile: (id: string) => Promise<void>;

  setSearchText: (text: string) => void;
  setDeviceProfilePage: (page: number) => void;
  setAssetProfilePage: (page: number) => void;

  selectDeviceProfile: (profile: DeviceProfile) => void;
  selectAssetProfile: (profile: AssetProfile) => void;

  openCreateDeviceProfileModal: () => void;
  openEditDeviceProfileModal: (profile: DeviceProfile) => void;
  openDeleteDeviceProfileModal: (profile: DeviceProfile) => void;
  openCreateAssetProfileModal: () => void;
  openEditAssetProfileModal: (profile: AssetProfile) => void;
  openDeleteAssetProfileModal: (profile: AssetProfile) => void;
  closeAllModals: () => void;
}

export const useProfileStore = create<ProfileState>()(
  devtools(
    immer((set, get) => ({
      // Initial State
      deviceProfiles: [],
      selectedDeviceProfile: null,
      deviceProfilePagination: {
        page: 1,
        pageSize: 10,
        totalElements: 0,
        totalPages: 0,
        hasNext: false,
      },

      assetProfiles: [],
      selectedAssetProfile: null,
      assetProfilePagination: {
        page: 1,
        pageSize: 10,
        totalElements: 0,
        totalPages: 0,
        hasNext: false,
      },

      loading: false,
      saving: false,
      error: null,
      searchText: '',

      isCreateDeviceProfileModalOpen: false,
      isEditDeviceProfileModalOpen: false,
      isDeleteDeviceProfileModalOpen: false,
      isCreateAssetProfileModalOpen: false,
      isEditAssetProfileModalOpen: false,
      isDeleteAssetProfileModalOpen: false,

      // Device Profile Actions
      fetchDeviceProfiles: async (params) => {
        set((state) => { state.loading = true; state.error = null; });
        try {
          const { deviceProfilePagination, searchText } = get();
          const response = await profileService.getDeviceProfiles({
            page: params?.page ?? deviceProfilePagination.page,
            pageSize: params?.pageSize ?? deviceProfilePagination.pageSize,
            textSearch: params?.textSearch ?? (searchText || undefined),
            sortProperty: params?.sortProperty ?? 'name',
            sortOrder: params?.sortOrder ?? 'ASC',
          });

          set((state) => {
            state.deviceProfiles = response.data || [];
            state.deviceProfilePagination = {
              ...state.deviceProfilePagination,
              totalElements: response.totalElements || 0,
              totalPages: response.totalPages || 0,
              hasNext: response.hasNext || false,
            };
            state.loading = false;
          });
        } catch (error: any) {
          set((state) => {
            state.error = error.message || 'Failed to fetch device profiles';
            state.loading = false;
          });
        }
      },

      fetchDeviceProfile: async (id) => {
        set((state) => { state.loading = true; state.error = null; });
        try {
          const profile = await profileService.getDeviceProfile(id);
          set((state) => {
            state.selectedDeviceProfile = profile;
            state.loading = false;
          });
        } catch (error: any) {
          set((state) => {
            state.error = error.message || 'Failed to fetch device profile';
            state.loading = false;
          });
        }
      },

      createDeviceProfile: async (data) => {
        set((state) => { state.saving = true; state.error = null; });
        try {
          await profileService.createDeviceProfile(data);
          set((state) => {
            state.saving = false;
            state.isCreateDeviceProfileModalOpen = false;
          });
          get().fetchDeviceProfiles();
        } catch (error: any) {
          set((state) => {
            state.error = error.message || 'Failed to create device profile';
            state.saving = false;
          });
        }
      },

      updateDeviceProfile: async (id, data) => {
        set((state) => { state.saving = true; state.error = null; });
        try {
          await profileService.updateDeviceProfile(id, data);
          set((state) => {
            state.saving = false;
            state.isEditDeviceProfileModalOpen = false;
            state.selectedDeviceProfile = null;
          });
          get().fetchDeviceProfiles();
        } catch (error: any) {
          set((state) => {
            state.error = error.message || 'Failed to update device profile';
            state.saving = false;
          });
        }
      },

      deleteDeviceProfile: async (id) => {
        set((state) => { state.saving = true; state.error = null; });
        try {
          await profileService.deleteDeviceProfile(id);
          set((state) => {
            state.saving = false;
            state.isDeleteDeviceProfileModalOpen = false;
            state.selectedDeviceProfile = null;
          });
          get().fetchDeviceProfiles();
        } catch (error: any) {
          set((state) => {
            state.error = error.message || 'Failed to delete device profile';
            state.saving = false;
          });
        }
      },

      // Asset Profile Actions
      fetchAssetProfiles: async (params) => {
        set((state) => { state.loading = true; state.error = null; });
        try {
          const { assetProfilePagination, searchText } = get();
          const response = await profileService.getAssetProfiles({
            page: params?.page ?? assetProfilePagination.page,
            pageSize: params?.pageSize ?? assetProfilePagination.pageSize,
            textSearch: params?.textSearch ?? (searchText || undefined),
            sortProperty: params?.sortProperty ?? 'name',
            sortOrder: params?.sortOrder ?? 'ASC',
          });

          set((state) => {
            state.assetProfiles = response.data || [];
            state.assetProfilePagination = {
              ...state.assetProfilePagination,
              totalElements: response.totalElements || 0,
              totalPages: response.totalPages || 0,
              hasNext: response.hasNext || false,
            };
            state.loading = false;
          });
        } catch (error: any) {
          set((state) => {
            state.error = error.message || 'Failed to fetch asset profiles';
            state.loading = false;
          });
        }
      },

      fetchAssetProfile: async (id) => {
        set((state) => { state.loading = true; state.error = null; });
        try {
          const profile = await profileService.getAssetProfile(id);
          set((state) => {
            state.selectedAssetProfile = profile;
            state.loading = false;
          });
        } catch (error: any) {
          set((state) => {
            state.error = error.message || 'Failed to fetch asset profile';
            state.loading = false;
          });
        }
      },

      createAssetProfile: async (data) => {
        set((state) => { state.saving = true; state.error = null; });
        try {
          await profileService.createAssetProfile(data);
          set((state) => {
            state.saving = false;
            state.isCreateAssetProfileModalOpen = false;
          });
          get().fetchAssetProfiles();
        } catch (error: any) {
          set((state) => {
            state.error = error.message || 'Failed to create asset profile';
            state.saving = false;
          });
        }
      },

      updateAssetProfile: async (id, data) => {
        set((state) => { state.saving = true; state.error = null; });
        try {
          await profileService.updateAssetProfile(id, data);
          set((state) => {
            state.saving = false;
            state.isEditAssetProfileModalOpen = false;
            state.selectedAssetProfile = null;
          });
          get().fetchAssetProfiles();
        } catch (error: any) {
          set((state) => {
            state.error = error.message || 'Failed to update asset profile';
            state.saving = false;
          });
        }
      },

      deleteAssetProfile: async (id) => {
        set((state) => { state.saving = true; state.error = null; });
        try {
          await profileService.deleteAssetProfile(id);
          set((state) => {
            state.saving = false;
            state.isDeleteAssetProfileModalOpen = false;
            state.selectedAssetProfile = null;
          });
          get().fetchAssetProfiles();
        } catch (error: any) {
          set((state) => {
            state.error = error.message || 'Failed to delete asset profile';
            state.saving = false;
          });
        }
      },

      // UI Actions
      setSearchText: (text) => {
        set((state) => { state.searchText = text; });
      },

      setDeviceProfilePage: (page) => {
        set((state) => { state.deviceProfilePagination.page = page; });
        get().fetchDeviceProfiles({ page });
      },

      setAssetProfilePage: (page) => {
        set((state) => { state.assetProfilePagination.page = page; });
        get().fetchAssetProfiles({ page });
      },

      selectDeviceProfile: (profile) => {
        set((state) => { state.selectedDeviceProfile = profile; });
      },

      selectAssetProfile: (profile) => {
        set((state) => { state.selectedAssetProfile = profile; });
      },

      // Modal Actions
      openCreateDeviceProfileModal: () => {
        set((state) => { state.isCreateDeviceProfileModalOpen = true; state.error = null; });
      },
      openEditDeviceProfileModal: (profile) => {
        set((state) => {
          state.selectedDeviceProfile = profile;
          state.isEditDeviceProfileModalOpen = true;
          state.error = null;
        });
      },
      openDeleteDeviceProfileModal: (profile) => {
        set((state) => {
          state.selectedDeviceProfile = profile;
          state.isDeleteDeviceProfileModalOpen = true;
          state.error = null;
        });
      },
      openCreateAssetProfileModal: () => {
        set((state) => { state.isCreateAssetProfileModalOpen = true; state.error = null; });
      },
      openEditAssetProfileModal: (profile) => {
        set((state) => {
          state.selectedAssetProfile = profile;
          state.isEditAssetProfileModalOpen = true;
          state.error = null;
        });
      },
      openDeleteAssetProfileModal: (profile) => {
        set((state) => {
          state.selectedAssetProfile = profile;
          state.isDeleteAssetProfileModalOpen = true;
          state.error = null;
        });
      },
      closeAllModals: () => {
        set((state) => {
          state.isCreateDeviceProfileModalOpen = false;
          state.isEditDeviceProfileModalOpen = false;
          state.isDeleteDeviceProfileModalOpen = false;
          state.isCreateAssetProfileModalOpen = false;
          state.isEditAssetProfileModalOpen = false;
          state.isDeleteAssetProfileModalOpen = false;
          state.error = null;
        });
      },
    })),
    { name: 'profile-store' },
  ),
);
