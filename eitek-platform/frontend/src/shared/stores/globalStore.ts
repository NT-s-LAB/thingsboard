import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { Project, Site, Area, Theme, Language, Notification, ModalState } from '@/shared/types';

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
        theme: 'light',
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
            ...modal,
            id: crypto.randomUUID(),
            isOpen: true,
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
            ...notification,
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
          };
          
          set((state) => ({ 
            notifications: [...state.notifications, newNotification],
          }));
          
          // Auto remove after 5 seconds
          setTimeout(() => {
            get().removeNotification(newNotification.id);
          }, 5000);
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