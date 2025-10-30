/**
 * Custom Hooks para SPT Intervals con React Query
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { sptIntervalsService, type SPTIntervalCreate, type SPTInterval } from '../services/sptIntervalsService';
import { queryKeys } from '@/lib/queryClient';
import { useAppStore } from '@/store/appStore';

// ===========================================
// QUERIES (GET)
// ===========================================

export function useSPTIntervalsByProject(projectId: number | undefined) {
  return useQuery({
    queryKey: [...queryKeys.projects.detail(projectId!), 'spt-intervals'],
    queryFn: () => sptIntervalsService.getByProject(projectId!),
    enabled: !!projectId,
    staleTime: 1000 * 60 * 5,
  });
}

// ===========================================
// MUTATIONS (POST/PUT/DELETE)
// ===========================================

export function useCreateSPTIntervals() {
  const queryClient = useQueryClient();
  const markStepCompleted = useAppStore((state) => state.markStepCompleted);
  const goToNextStep = useAppStore((state) => state.goToNextStep);
  const project = useAppStore((state) => state.project);

  return useMutation({
    mutationFn: sptIntervalsService.createMultiple,
    
    onMutate: async (newIntervals) => {
      console.log(`Creating ${newIntervals.length} SPT intervals...`);
    },
    
    onSuccess: (intervals: SPTInterval[]) => {
      markStepCompleted(3);
      goToNextStep();
      
      if (project?.id) {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.projects.detail(project.id) 
        });
      }
      
      
      console.log('SPT Intervals created:', intervals);
    },
    

  });
}

export function useSPTIntervalsWorkflow() {
  const createIntervals = useCreateSPTIntervals();
  const project = useAppStore((state) => state.project);

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
  };
}
