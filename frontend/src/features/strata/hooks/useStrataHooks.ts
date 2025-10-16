/**
 * STRATA HOOKS - Custom Hooks con React Query
 * 
 * PATRÓN (igual que useProjectHooks):
 * - useStrata → Query (GET lista)
 * - useCreateStrata → Mutation (POST bulk)
 * - useStrataWorkflow → Hook compuesto para formulario
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { strataService, type StratumCreate, type Stratum } from '../services/strataService';
import { queryKeys } from '@/lib/queryClient';
import { useAppStore } from '@/store/appStore';

// ===========================================
// QUERIES (GET)
// ===========================================

/**
 * Hook para obtener estratos de un proyecto
 */
export function useStrataByProject(projectId: number | undefined) {
  return useQuery({
    queryKey: [...queryKeys.projects.detail(projectId!), 'strata'],
    queryFn: () => strataService.getByProject(projectId!),
    enabled: !!projectId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

// ===========================================
// MUTATIONS (POST/PUT/DELETE)
// ===========================================

/**
 * Hook para crear estratos en batch
 * 
 * CARACTERÍSTICAS:
 * - Guarda en store automáticamente
 * - Invalida cache de proyecto
 * - Muestra toast de éxito/error
 * - Navega al siguiente paso
 * 
 * USO:
 * ```tsx
 * const createStrata = useCreateStrata();
 * 
 * const handleSubmit = (strata: StratumCreate[]) => {
 *   createStrata.mutate(strata);
 * };
 * ```
 */
export function useCreateStrata() {
  const queryClient = useQueryClient();
  const setStrata = useAppStore((state) => state.setStrata);
  const markStepCompleted = useAppStore((state) => state.markStepCompleted);
  const goToNextStep = useAppStore((state) => state.goToNextStep);
  const project = useAppStore((state) => state.project);

  return useMutation({
    mutationFn: strataService.createBulk,
    
    onMutate: async (newStrata) => {
      console.log(`Creating ${newStrata.length} strata...`);
      console.log(newStrata);
    },
    
    onSuccess: (strata: Stratum[]) => {
      // 1. Guardar en store global
      setStrata(strata);
      
      // 2. Marcar paso como completado
      markStepCompleted(1);
      
      // 3. Navegar al siguiente paso
      goToNextStep();
      
      // 4. Invalidar cache del proyecto
      if (project?.id) {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.projects.detail(project.id) 
        });
      }
      
      // 5. Toast de éxito
      
      
      console.log('Strata created:', strata);
    },
    
    onError: (error: Error) => {
      // Log detailed error for debugging
      const axiosError = error as { response?: { data?: { detail?: string | Array<{ msg: string }> } } };
      console.error('Strata creation error:', error);
      console.error('Backend error details:', axiosError.response?.data);
      
      const errorDetail = axiosError.response?.data?.detail;
      let errorMessage = error.message || 'Error al crear estratos';
      
      if (typeof errorDetail === 'string') {
        errorMessage = errorDetail;
      } else if (Array.isArray(errorDetail) && errorDetail.length > 0) {
        errorMessage = errorDetail[0]?.msg || errorMessage;
      }
      
      console.error('User-friendly error message:', errorMessage);
    },
  });
}

/**
 * Hook para el flujo completo de estratos
 * 
 * USO:
 * ```tsx
 * const { submit, isLoading } = useStrataWorkflow();
 * 
 * const handleSubmit = (strata: StratumCreate[]) => {
 *   submit(strata);
 * };
 * ```
 */
export function useStrataWorkflow() {
  const createStrata = useCreateStrata();
  const project = useAppStore((state) => state.project);
  const existingStrata = useAppStore((state) => state.strata);
  const markStepCompleted = useAppStore((state) => state.markStepCompleted);
  const goToNextStep = useAppStore((state) => state.goToNextStep);

  const submit = (strata: StratumCreate[]) => {
    if (!project?.id) {
      console.error('No active project to associate strata with.');
      return;
    }

    // Check if strata already exist for this project
    if (existingStrata.length > 0 && existingStrata[0].project_id === project.id) {
      console.log('Strata already exist, skipping creation and navigating to next step');
      markStepCompleted(1); // Mark step 1 (strata) as completed
      goToNextStep();
      return;
    }

    // Agregar project_id a cada estrato
    const strataWithProject = strata.map(s => ({
      ...s,
      project_id: project.id,
    }));

    createStrata.mutate(strataWithProject);
  };

  return {
    submit,
    isLoading: createStrata.isPending,
    error: createStrata.error,
  };
}
