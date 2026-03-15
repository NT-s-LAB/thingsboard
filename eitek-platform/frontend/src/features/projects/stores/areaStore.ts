import { create } from 'zustand';
import { areaService } from '../services/areaService';
import type { Area, AreaCreateRequest, AreaUpdateRequest, AreaListParams } from '../types/area';

interface AreaState {
  // Data
  areas: Area[];
  selectedArea: Area | null;
  
  // UI State
  loading: boolean;
  error: string | null;
  
  // Pagination
  page: number;
  pageSize: number;
  totalPages: number;
  totalElements: number;
  
  // Filters
  searchQuery: string;
  siteIdFilter: string | null;
  
  // Modals
  isCreateModalOpen: boolean;
  isEditModalOpen: boolean;
  isDeleteDialogOpen: boolean;
  
  // Actions
  fetchAreas: (params?: AreaListParams) => Promise<void>;
  fetchArea: (id: string) => Promise<void>;
  createArea: (data: AreaCreateRequest) => Promise<Area>;
  updateArea: (data: AreaUpdateRequest) => Promise<Area>;
  deleteArea: (id: string) => Promise<void>;
  
  // UI Actions
  setSearchQuery: (query: string) => void;
  setSiteIdFilter: (siteId: string | null) => void;
  setPage: (page: number) => void;
  setSelectedArea: (area: Area | null) => void;
  openCreateModal: () => void;
  openEditModal: (area: Area) => void;
  openDeleteDialog: (area: Area) => void;
  closeModals: () => void;
  clearError: () => void;
}

export const useAreaStore = create<AreaState>((set, get) => ({
  // Initial State
  areas: [],
  selectedArea: null,
  loading: false,
  error: null,
  page: 1,
  pageSize: 12,
  totalPages: 0,
  totalElements: 0,
  searchQuery: '',
  siteIdFilter: null,
  isCreateModalOpen: false,
  isEditModalOpen: false,
  isDeleteDialogOpen: false,

  // Data Actions
  fetchAreas: async (params?: AreaListParams) => {
    const state = get();
    set({ loading: true, error: null });
    
    try {
      const response = await areaService.getAreas({
        page: params?.page ?? state.page,
        pageSize: params?.pageSize ?? state.pageSize,
        search: params?.search ?? (state.searchQuery || undefined),
        siteId: params?.siteId ?? (state.siteIdFilter || undefined),
        sortBy: params?.sortBy ?? 'name',
        sortOrder: params?.sortOrder ?? 'asc',
      });
      
      set({
        areas: response.data || [],
        totalPages: response.pagination?.totalPages || 0,
        totalElements: response.pagination?.total || 0,
        loading: false,
      });
    } catch (error: any) {
      set({
        error: error.message || 'Không thể tải danh sách khu vực',
        loading: false,
      });
    }
  },

  fetchArea: async (id: string) => {
    set({ loading: true, error: null });
    
    try {
      const area = await areaService.getArea(id);
      set({ selectedArea: area, loading: false });
    } catch (error: any) {
      set({
        error: error.message || 'Không thể tải thông tin khu vực',
        loading: false,
      });
    }
  },

  createArea: async (data: AreaCreateRequest) => {
    set({ loading: true, error: null });
    
    try {
      const newArea = await areaService.createArea(data);
      set({ loading: false, isCreateModalOpen: false });
      // Refresh list
      get().fetchAreas();
      return newArea;
    } catch (error: any) {
      set({
        error: error.message || 'Không thể tạo khu vực',
        loading: false,
      });
      throw error;
    }
  },

  updateArea: async (data: AreaUpdateRequest) => {
    set({ loading: true, error: null });
    
    try {
      const updatedArea = await areaService.updateArea(data);
      set({ loading: false, isEditModalOpen: false, selectedArea: null });
      // Refresh list
      get().fetchAreas();
      return updatedArea;
    } catch (error: any) {
      set({
        error: error.message || 'Không thể cập nhật khu vực',
        loading: false,
      });
      throw error;
    }
  },

  deleteArea: async (id: string) => {
    set({ loading: true, error: null });
    
    try {
      await areaService.deleteArea(id);
      set({ loading: false, isDeleteDialogOpen: false, selectedArea: null });
      // Refresh list
      get().fetchAreas();
    } catch (error: any) {
      set({
        error: error.message || 'Không thể xóa khu vực',
        loading: false,
      });
      throw error;
    }
  },

  // UI Actions
  setSearchQuery: (query: string) => {
    set({ searchQuery: query, page: 1 });
  },

  setSiteIdFilter: (siteId: string | null) => {
    set({ siteIdFilter: siteId, page: 1 });
  },

  setPage: (page: number) => {
    set({ page });
  },

  setSelectedArea: (area: Area | null) => {
    set({ selectedArea: area });
  },

  openCreateModal: () => {
    set({ isCreateModalOpen: true, selectedArea: null, error: null });
  },

  openEditModal: (area: Area) => {
    set({ isEditModalOpen: true, selectedArea: area, error: null });
  },

  openDeleteDialog: (area: Area) => {
    set({ isDeleteDialogOpen: true, selectedArea: area, error: null });
  },

  closeModals: () => {
    set({
      isCreateModalOpen: false,
      isEditModalOpen: false,
      isDeleteDialogOpen: false,
      selectedArea: null,
      error: null,
    });
  },

  clearError: () => {
    set({ error: null });
  },
}));
