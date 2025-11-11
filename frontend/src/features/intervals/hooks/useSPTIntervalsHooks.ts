
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { sptIntervalsService}  from '../services/sptIntervalsService';
import type { SPTIntervalCreate, SPTInterval } from '@/types/project';
import { queryKeys } from '@/lib/queryClient';
import { useAppStore } from '@/store/appStore';
import { toast } from 'react-toastify';

// ===========================================
export function useSPTIntervalsByProject(projectId: number | undefined) {
  return useQuery({
    queryKey: [...queryKeys.projects.detail(projectId!), 'spt-intervals'],
    queryFn: () => sptIntervalsService.getByProject(projectId!),
    enabled: !!projectId,
    staleTime: 1000 * 60 * 5,
  });
}



export function useCreateSPTIntervals() {
  const queryClient = useQueryClient();
  const setIntervals = useAppStore((state) => state.setIntervals);
  const markStepCompleted = useAppStore((state) => state.markStepCompleted);
  const goToNextStep = useAppStore((state) => state.goToNextStep);
  const project = useAppStore((state) => state.project);

  return useMutation({
    mutationFn: sptIntervalsService.createMultiple,
    
    onMutate: async (newIntervals) => {
      console.log(`Creating ${newIntervals.length} SPT intervals...`);
    },
    
    onSuccess: (intervals: SPTInterval[]) => {

      setIntervals(intervals);
      markStepCompleted(3);
      goToNextStep();
      toast.success('Intervalos creados {•‿•}');
      
      if (project?.id) {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.projects.detail(project.id) 
        });
      }
      
      
      console.log('SPT Intervals created:', intervals);
    },
    

  });
}

export function useUpdateSPTInterval() {
  const queryClient = useQueryClient();
  const updateInterval = useAppStore((state) => state.updateInterval);
  const project = useAppStore((state) => state.project);

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<SPTIntervalCreate> }) =>
      sptIntervalsService.update(id, data),
    
    onSuccess: (interval: SPTInterval) => {
      // 1. Actualizar en el store
      updateInterval(interval.id, interval);
      
      // 2. Invalidar cache del proyecto
      if (project?.id) {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.projects.detail(project.id) 
        });
      }
      
      console.log('SPT Interval updated:', interval);
    },
    
    onError: (error: Error) => {
      console.error('Error updating SPT interval:', error.message);
    },
  });
}
// ===========================================

export function useDeleteSPTInterval() {
  const queryClient = useQueryClient();
  const removeInterval = useAppStore((state) => state.removeInterval);
  const project = useAppStore((state) => state.project);

  return useMutation({
    mutationFn: sptIntervalsService.delete,
    
    onSuccess: (_data, intervalId) => {
      // 1. Remover del store
      removeInterval(intervalId);
      
      // 2. Invalidar cache del proyecto
      if (project?.id) {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.projects.detail(project.id) 
        });
      }
      
      console.log('SPT Interval deleted:', intervalId);
    },
    
    onError: (error: Error) => {
      console.error('Error deleting SPT interval:', error.message);
    },
  });
}

export function useSPTIntervalsWorkflow() {
  const createIntervals = useCreateSPTIntervals();
  const existingIntervals = useAppStore((state) => state.intervals);
  const project = useAppStore((state) => state.project);

  // ✅ LÓGICA UNIFICADA - Detecta automáticamente edit mode
  // Los intervalos existen y tienen IDs = modo edición
  const isEditMode = existingIntervals.length > 0 && 
                     existingIntervals[0]?.id !== undefined &&
                     existingIntervals[0]?.project_id === project?.id;
                    
  const submit = (intervals: SPTIntervalCreate[]) => {
    if (!project?.id) {
      console.error('No active project to associate SPT intervals with.');
      return;
    }

    createIntervals.mutate(intervals);
  };

  return {
    submit,
    isLoading: createIntervals.isPending,
    error: createIntervals.error,
    isEditMode,  // Exportar para uso en componentes
  };
}
