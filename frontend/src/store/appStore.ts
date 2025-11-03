/**
 * 🗄️ ZUSTAND STORE - Estado Global Simplificado
 * 
 * VENTAJAS vs Context API:
 * Menos código (50% menos que Context)
 * Mejor performance (solo re-renderiza lo necesario)
 * DevTools integrado (debugging fácil)
 * Persist automático (guarda en localStorage)
 * No necesita Provider (acceso directo)

 */

import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import type { 
  Project, 
  ProjectCreate,
  Stratum, 
  StratumCreate,
  Borehole, 
  BoreholeCreate,
  BoreholeStratum,
  SPTInterval,
  SPTIntervalCreate,
} from '@/types/project';

// ===========================================
// TIPOS
// ===========================================

/**
 * Estado completo de la aplicación
 * 
 * ORGANIZACIÓN:
 * 1. Datos del servidor (con IDs)
 * 2. Datos de formularios (antes de guardar)
 * 3. Estado UI (loading, errors, etc.)
 * 4. Navegación (currentStep, completed)
 */
interface AppState {
  // === DATOS DEL SERVIDOR ===
  project: Project | null;
  strata: Stratum[];
  boreholes: Borehole[];
  boreholeStrata: BoreholeStratum[];  // Asignaciones de estratos a perforaciones
  intervals: SPTInterval[];
  
  // === DATOS DE FORMULARIOS (TEMPORAL) ===
  projectDraft: ProjectCreate | null;
  strataDraft: StratumCreate[];
  boreholesDraft: BoreholeCreate[];
  intervalsDraft: SPTIntervalCreate[];
  
  // === DRAFT STATE FOR BOREHOLE CONFIGURATION FORM ===
  draftBoreholes: Record<string, unknown> | null;  // Temporary form state for BoreholesConfigurationForm
  draftBoreholeTab: number;     // Current tab position in BoreholesConfigurationForm
  // draft state for intervals tabs

  draftIntervals: Record<string, unknown> | null;  // Temporary form state for IntervalsConfigurationForm
  draftIntervalsTab: number;  // Current tab position in IntervalsConfigurationForm


  // === ESTADO UI ===
  loading: boolean;
  error: string | null;
  
  // === NAVEGACIÓN ===
  currentStep: number;
  completedSteps: Set<number>;
}

/**
 * Acciones disponibles
 * 
 * PATRÓN:
 * - set* → Setters simples
 * - add* → Agregar a array
 * - update* → Actualizar item en array
 * - remove* → Eliminar de array
 * - reset* → Limpiar estado
 */
interface AppActions {
  // === PROJECT ===
  setProject: (project: Project | null) => void;
  setProjectDraft: (draft: ProjectCreate | null) => void;
  updateProject: (updates: Partial<Project>) => void;
  
  // === STRATA ===
  setStrata: (strata: Stratum[]) => void;
  setStrataDraft: (draft: StratumCreate[]) => void;
  addStratum: (stratum: Stratum) => void;
  updateStratum: (id: number, updates: Partial<Stratum>) => void;
  removeStratum: (id: number) => void;
  
  // === BOREHOLES ===
  setBoreholes: (boreholes: Borehole[]) => void;
  setBoreholesDraft: (draft: BoreholeCreate[]) => void;
  addBorehole: (borehole: Borehole) => void;
  updateBorehole: (id: number, updates: Partial<Borehole>) => void;
  removeBorehole: (id: number) => void;
  
  // === BOREHOLE STRATA ===
  setBoreholeStrata: (boreholeStrata: BoreholeStratum[]) => void;
  addBoreholeStratum: (boreholeStratum: BoreholeStratum) => void;
  
  // === SPT INTERVALS ===
  setIntervals: (intervals: SPTInterval[]) => void;
  setIntervalsDraft: (draft: SPTIntervalCreate[]) => void;
  addInterval: (interval: SPTInterval) => void;
  updateInterval: (id: number, updates: Partial<SPTInterval>) => void;
  removeInterval: (id: number) => void;
  
  // === DRAFT BOREHOLE FORM STATE ===
  setDraftBoreholes: (draft: Record<string, unknown> | null) => void;
  setDraftBoreholeTab: (tab: number) => void;
  clearDraftBoreholes: () => void;
  
  // === DRAFT INTERVALS FORM STATE ===
  setDraftIntervals: (draft: Record<string, unknown> | null) => void;
  setDraftIntervalsTab: (tab: number) => void;
  clearDraftIntervals: () => void;
  
  // === UI ===
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // === NAVEGACIÓN ===
  setCurrentStep: (step: number) => void;
  markStepCompleted: (step: number) => void;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  
  // === UTILIDADES ===
  resetAll: () => void;
  resetWorkflow: () => void;  // Solo navegación y drafts
}

type AppStore = AppState & AppActions;

// ===========================================
// ESTADO INICIAL
// ===========================================

const initialState: AppState = {
  // Datos del servidor
  project: null,
  strata: [],
  boreholes: [],
  boreholeStrata: [],
  intervals: [],
  
  // Drafts
  projectDraft: null,
  strataDraft: [],
  boreholesDraft: [],
  intervalsDraft: [],
  
  // Draft borehole configuration form state
  draftBoreholes: null,
  draftBoreholeTab: 0,
  
  // Draft intervals configuration form state
  draftIntervals: null,
  draftIntervalsTab: 0,
  
  // UI
  loading: false,
  error: null,
  
  // Navegación
  currentStep: 0,
  completedSteps: new Set<number>(),
};

// ===========================================
// STORE
// ===========================================

/**
 * Store principal de la aplicación
 * 
 * USO EN COMPONENTES:
 * ```tsx
 * import { useAppStore } from '@/features/shared/store/appStore';
 * 
 * function MyComponent() {
 *   // Selectores específicos (mejor performance)
 *   const project = useAppStore(state => state.project);
 *   const setProject = useAppStore(state => state.setProject);
 *   
 *   // O todo el estado (menos performante)
 *   const { project, setProject } = useAppStore();
 *   
 *   return <div>{project?.project_name}</div>;
 * }
 * ```
 * 
 * MIDDLEWARE:
 * 1. devtools → Redux DevTools para debugging
 * 2. persist → Guarda en localStorage automáticamente
 */
export const useAppStore = create<AppStore>()(
  devtools(
    persist(
      (set) => ({
        // === ESTADO INICIAL ===
        ...initialState,
        
        // === PROJECT ACTIONS ===
        setProject: (project) => 
          set({ project }, false, 'setProject'),
        
        setProjectDraft: (projectDraft) => 
          set({ projectDraft }, false, 'setProjectDraft'),
        
        updateProject: (updates) => 
          set(
            (state) => ({
              project: state.project 
                ? { ...state.project, ...updates }
                : null
            }),
            false,
            'updateProject'
          ),
        
        // === STRATA ACTIONS ===
        setStrata: (strata) => 
          set({ strata }, false, 'setStrata'),
        
        setStrataDraft: (strataDraft) => 
          set({ strataDraft }, false, 'setStrataDraft'),
        
        addStratum: (stratum) => 
          set(
            (state) => ({ strata: [...state.strata, stratum] }),
            false,
            'addStratum'
          ),
        
        updateStratum: (id, updates) => 
          set(
            (state) => ({
              strata: state.strata.map(s => 
                s.id === id ? { ...s, ...updates } : s
              )
            }),
            false,
            'updateStratum'
          ),
        
        removeStratum: (id) => 
          set(
            (state) => ({ 
              strata: state.strata.filter(s => s.id !== id) 
            }),
            false,
            'removeStratum'
          ),
        
        // === BOREHOLES ACTIONS ===
        setBoreholes: (boreholes) => 
          set({ boreholes }, false, 'setBoreholes'),
        
        setBoreholesDraft: (boreholesDraft) => 
          set({ boreholesDraft }, false, 'setBoreholesDraft'),
        
        addBorehole: (borehole) => 
          set(
            (state) => ({ boreholes: [...state.boreholes, borehole] }),
            false,
            'addBorehole'
          ),
        
        updateBorehole: (id, updates) => 
          set(
            (state) => ({
              boreholes: state.boreholes.map(b => 
                b.id === id ? { ...b, ...updates } : b
              )
            }),
            false,
            'updateBorehole'
          ),
        
        removeBorehole: (id) => 
          set(
            (state) => ({ 
              boreholes: state.boreholes.filter(b => b.id !== id) 
            }),
            false,
            'removeBorehole'
          ),
        
        // === BOREHOLE STRATA ACTIONS ===
        setBoreholeStrata: (boreholeStrata) => 
          set({ boreholeStrata }, false, 'setBoreholeStrata'),
        
        addBoreholeStratum: (boreholeStratum) => 
          set(
            (state) => ({ boreholeStrata: [...state.boreholeStrata, boreholeStratum] }),
            false,
            'addBoreholeStratum'
          ),
        
        // === SPT INTERVALS ACTIONS ===
        setIntervals: (intervals) => 
          set({ intervals }, false, 'setIntervals'),
        
        setIntervalsDraft: (intervalsDraft) => 
          set({ intervalsDraft }, false, 'setIntervalsDraft'),
        
        addInterval: (interval) => 
          set(
            (state) => ({ intervals: [...state.intervals, interval] }),
            false,
            'addInterval'
          ),
        
        updateInterval: (id, updates) => 
          set(
            (state) => ({
              intervals: state.intervals.map(i => 
                i.id === id ? { ...i, ...updates } : i
              )
            }),
            false,
            'updateInterval'
          ),
        
        removeInterval: (id) => 
          set(
            (state) => ({ 
              intervals: state.intervals.filter(i => i.id !== id) 
            }),
            false,
            'removeInterval'
          ),
        
        // === DRAFT BOREHOLE FORM STATE ACTIONS ===
        setDraftBoreholes: (draftBoreholes) => 
          set({ draftBoreholes }, false, 'setDraftBoreholes'),
        
        setDraftBoreholeTab: (draftBoreholeTab) => 
          set({ draftBoreholeTab }, false, 'setDraftBoreholeTab'),
        
        clearDraftBoreholes: () => 
          set({ draftBoreholes: null, draftBoreholeTab: 0 }, false, 'clearDraftBoreholes'),
        
        // === DRAFT INTERVALS FORM STATE ACTIONS ===

        
        setDraftIntervals: (draftIntervals) => 
          set({ draftIntervals }, false, 'setDraftIntervals'),
        
        setDraftIntervalsTab: (draftIntervalsTab) => 
          set({ draftIntervalsTab }, false, 'setDraftIntervalsTab'),
        
        clearDraftIntervals: () => 
          set({ draftIntervals: null, draftIntervalsTab: 0 }, false, 'clearDraftIntervals'),
        
        // === UI ACTIONS ===
        setLoading: (loading) => 
          set({ loading }, false, 'setLoading'),
        
        setError: (error) => 
          set({ error }, false, 'setError'),
        
        // === NAVEGACIÓN ACTIONS ===
        setCurrentStep: (currentStep) => 
          set({ currentStep }, false, 'setCurrentStep'),
        
        markStepCompleted: (step) => 
          set(
            (state) => {
              const newCompleted = new Set(state.completedSteps);
              newCompleted.add(step);
              return { completedSteps: newCompleted };
            },
            false,
            'markStepCompleted'
          ),
        
        goToNextStep: () => 
          set(
            (state) => ({ currentStep: state.currentStep + 1 }),
            false,
            'goToNextStep'
          ),
        
        goToPreviousStep: () => 
          set(
            (state) => ({ 
              currentStep: Math.max(0, state.currentStep - 1) 
            }),
            false,
            'goToPreviousStep'
          ),
        
        // === UTILIDADES ===
        resetAll: () => 
          set(initialState, false, 'resetAll'),
        
        resetWorkflow: () => 
          set(
            {
              projectDraft: null,
              strataDraft: [],
              boreholesDraft: [],
              intervalsDraft: [],
              draftBoreholes: null,
              draftBoreholeTab: 0,
              draftIntervals: null,
              draftIntervalsTab: 0,
              currentStep: 0,
              completedSteps: new Set<number>(),
            },
            false,
            'resetWorkflow'
          ),
      }),
      {
        name: 'spt-app-storage',  // localStorage key
        storage: createJSONStorage(() => localStorage),
        
        // Configurar qué persistir
        partialize: (state) => ({
          project: state.project,
          strata: state.strata,
          boreholes: state.boreholes,
          boreholeStrata: state.boreholeStrata,  // ✅ Added
          intervals: state.intervals,
          currentStep: state.currentStep,
          completedSteps: Array.from(state.completedSteps),  // ✅ Convert Set to Array for serialization
          // NO persistir: loading, error, drafts (temporal)
        }),
        
        // Merge function to handle Set deserialization
        merge: (persistedState: unknown, currentState: AppStore) => {
          const persisted = persistedState as Partial<AppState> | undefined;
          return {
            ...currentState,
            ...persisted,
            completedSteps: new Set(persisted?.completedSteps || []),  // ✅ Convert back to Set
          };
        },
      }
    ),
    {
      name: 'SPT App Store',  // Nombre en DevTools
      enabled: process.env.NODE_ENV === 'development',
    }
  )
);

// ===========================================
// SELECTORES ÚTILES (REUSABLES)
// ===========================================

/**
 * Selectores para evitar repetir lógica
 * 
 * USO:
 * ```tsx
 * const hasProject = useAppStore(selectHasProject);
 * const projectName = useAppStore(selectProjectName);
 * ```
 */

export const selectHasProject = (state: AppStore) => state.project !== null;

export const selectProjectName = (state: AppStore) => 
  state.project?.project_name || state.projectDraft?.project_name || '';

export const selectIsEditMode = (state: AppStore) => state.project !== null;

export const selectCanGoToStep = (state: AppStore, step: number) => {
  // Puede ir a pasos completados o al siguiente
  return state.completedSteps.has(step) || step === state.currentStep + 1;
};

export const selectCurrentStepData = (state: AppStore) => ({
  current: state.currentStep,
  completed: state.completedSteps,
  canGoForward: state.completedSteps.has(state.currentStep),
});

export const selectProjectWithStrata = (state: AppStore) => ({
  project: state.project,
  strata: state.strata,
  hasData: state.project !== null && state.strata.length > 0,
});

// ===========================================
// HOOKS PERSONALIZADOS (CONVENIENCE)
// ===========================================

/**
 * Hook para navegación del wizard
 */
export const useWizardNavigation = () => {
  const currentStep = useAppStore(state => state.currentStep);
  const completedSteps = useAppStore(state => state.completedSteps);
  const setCurrentStep = useAppStore(state => state.setCurrentStep);
  const markStepCompleted = useAppStore(state => state.markStepCompleted);
  const goToNextStep = useAppStore(state => state.goToNextStep);
  const goToPreviousStep = useAppStore(state => state.goToPreviousStep);
  
  return {
    currentStep,
    completedSteps,
    setCurrentStep,
    markStepCompleted,
    goToNextStep,
    goToPreviousStep,
    isStepCompleted: (step: number) => completedSteps.has(step),
  };
};

/**
 * Hook para estado del proyecto
 */
export const useProjectState = () => {
  const project = useAppStore(state => state.project);
  const projectDraft = useAppStore(state => state.projectDraft);
  const setProject = useAppStore(state => state.setProject);
  const setProjectDraft = useAppStore(state => state.setProjectDraft);
  const isEditMode = useAppStore(selectIsEditMode);
  
  return {
    project,
    projectDraft,
    setProject,
    setProjectDraft,
    isEditMode,
    hasProject: project !== null,
  };
};

/**
 * Hook para estado UI
 */
export const useUIState = () => {
  const loading = useAppStore(state => state.loading);
  const error = useAppStore(state => state.error);
  const setLoading = useAppStore(state => state.setLoading);
  const setError = useAppStore(state => state.setError);
  
  return {
    loading,
    error,
    setLoading,
    setError,
    clearError: () => setError(null),
  };
};
