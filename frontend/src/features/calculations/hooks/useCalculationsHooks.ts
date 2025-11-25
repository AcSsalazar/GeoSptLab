
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { calculationsService} from '../services/calculationsService';
import type { CalculationRequest } from '@/types/api';
import { queryKeys } from '@/lib/queryClient';
import { useAppStore } from '@/store/appStore';
import { toast } from 'react-toastify';

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
      
    },
    
    onSuccess: (response) => {
      // Marcar paso como completado
      markStepCompleted(4);
      
      // Navegar al paso de resultados
      goToNextStep();

      toast.success('Cálculo completado con éxito');
      
      // Invalidar cache de resultados
      if (project?.id) {
        queryClient.invalidateQueries({ 
          queryKey: [...queryKeys.projects.detail(project.id), 'results']
        });
      }
      
      
      
      console.log('Calculation response:', response);
    },
    
    onError: (error: Error) => {
      
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
