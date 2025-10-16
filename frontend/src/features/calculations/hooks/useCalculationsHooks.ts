/**
 * Custom Hooks para Calculations con React Query
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  calculationsService, 
  type CalculationRequest
} from '../services/calculationsService';
import { queryKeys } from '@/lib/queryClient';
import { showToast } from '@/lib/toast';
import { useAppStore } from '@/store/appStore';

// ===========================================
// QUERIES (GET)
// ===========================================

/**
 * Hook para obtener resultados calculados de un proyecto
 */
export function useProjectResults(projectId: number | undefined) {
  return useQuery({
    queryKey: [...queryKeys.projects.detail(projectId!), 'results'],
    queryFn: () => calculationsService.getProjectResults(projectId!),
    enabled: !!projectId,
    staleTime: 1000 * 60 * 2, // 2 minutos (más dinámico)
  });
}

// ===========================================
// MUTATIONS (POST/DELETE)
// ===========================================

/**
 * Hook para calcular parámetros SPT de un proyecto
 * 
 * USO:
 * ```tsx
 * const calculate = useCalculateProject();
 * 
 * const handleCalculate = () => {
 *   calculate.mutate({ recalculate_all: true });
 * };
 * ```
 */
export function useCalculateProject() {
  const queryClient = useQueryClient();
  const project = useAppStore((state) => state.project);
  const markStepCompleted = useAppStore((state) => state.markStepCompleted);
  const goToNextStep = useAppStore((state) => state.goToNextStep);

  return useMutation({
    mutationFn: (options: CalculationRequest = {}) => {
      if (!project?.id) {
        return Promise.reject(new Error('No hay proyecto activo'));
      }
      return calculationsService.calculateProject(project.id, options);
    },
    
    onMutate: async () => {
      console.log('Calculating SPT parameters...');
      showToast.info('🧮 Calculando parámetros SPT...');
    },
    
    onSuccess: (response) => {
      // Marcar paso como completado
      markStepCompleted(4);
      
      // Navegar al paso de resultados
      goToNextStep();
      
      // Invalidar cache de resultados
      if (project?.id) {
        queryClient.invalidateQueries({ 
          queryKey: [...queryKeys.projects.detail(project.id), 'results']
        });
      }
      
      // Toast de éxito
      showToast.success(
        `✅ ${response.calculated_intervals + response.updated_intervals} intervalos calculados`
      );
      
      console.log('Calculation response:', response);
    },
    
    onError: (error: Error) => {
      showToast.error(error.message || 'Error al calcular parámetros');
      console.error('Calculation error:', error);
    },
  });
}

/**
 * Hook para el flujo completo de cálculos
 * 
 * USO:
 * ```tsx
 * const { calculate, isCalculating, results, isLoadingResults } = useCalculationsWorkflow();
 * 
 * <button onClick={() => calculate()} disabled={isCalculating}>
 *   Calcular Parámetros
 * </button>
 * 
 * {results && <ResultsTable data={results} />}
 * ```
 */
export function useCalculationsWorkflow() {
  const project = useAppStore((state) => state.project);
  const calculateMutation = useCalculateProject();
  const resultsQuery = useProjectResults(project?.id);

  const calculate = (options: CalculationRequest = { recalculate_all: true }) => {
    calculateMutation.mutate(options);
  };

  return {
    calculate,
    isCalculating: calculateMutation.isPending,
    calculationError: calculateMutation.error,
    results: resultsQuery.data,
    isLoadingResults: resultsQuery.isLoading,
    resultsError: resultsQuery.error,
    refetchResults: resultsQuery.refetch,
  };
}
