/**
 * Custom Hooks para Boreholes con React Query
 */

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { boreholesService, type BoreholeCreate, type Borehole } from '../services/boreholesService';
import { boreholeStrataService, type BoreholeStratumCreate } from '../services/boreholeStrataService';
import { queryKeys } from '@/lib/queryClient';
import { useAppStore } from '@/store/appStore';

// ===========================================
// QUERIES (GET)
// ===========================================

export function useBoreholesByProject(projectId: number | undefined) {
  return useQuery({
    queryKey: [...queryKeys.projects.detail(projectId!), 'boreholes'],
    queryFn: () => boreholesService.getByProject(projectId!),
    enabled: !!projectId,
    staleTime: 1000 * 60 * 5,
  });
}

// ===========================================
// MUTATIONS (POST/PUT/DELETE)
// ===========================================

export function useCreateBoreholes() {
  const queryClient = useQueryClient();
  const setBoreholes = useAppStore((state) => state.setBoreholes);
  const markStepCompleted = useAppStore((state) => state.markStepCompleted);
  const goToNextStep = useAppStore((state) => state.goToNextStep);
  const project = useAppStore((state) => state.project);

  return useMutation({
    mutationFn: boreholesService.createMultiple,
    
    onMutate: async (newBoreholes) => {
      console.log(`Creating ${newBoreholes.length} boreholes...`);
    },
    
    onSuccess: (boreholes: Borehole[]) => {
      setBoreholes(boreholes);
      markStepCompleted(2);
      goToNextStep();
      
      if (project?.id) {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.projects.detail(project.id) 
        });
      }
      
      
      console.log('Boreholes created:', boreholes);
    },
    
    onError: (error: Error) => {
      console.log(error.message || 'Error al crear perforaciones');
    },
  });
}

export function useCreateBoreholeStrata() {
  const queryClient = useQueryClient();
  const project = useAppStore((state) => state.project);
  const setBoreholeStrata = useAppStore((state) => state.setBoreholeStrata);
  const markStepCompleted = useAppStore((state) => state.markStepCompleted);
  const goToNextStep = useAppStore((state) => state.goToNextStep);

  return useMutation({
    mutationFn: boreholeStrataService.createMultiple,
    
    onMutate: (data) => {
      console.log('📤 Creating borehole-strata assignments:', data);
    },
    
    onSuccess: (boreholeStrata) => {
      // Save to store
      setBoreholeStrata(boreholeStrata);
      
      // Mark step as completed and navigate
      markStepCompleted(2); // Step 2 = Boreholes
      goToNextStep();
      
      if (project?.id) {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.projects.detail(project.id) 
        });
      }
      
      
      console.log('Borehole-Strata created:', boreholeStrata);
    },
    
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { detail?: string | Array<{type: string, loc: Array<string>, msg: string, input: unknown}> } }; message?: string };
      console.error('❌ Error creating borehole-strata:', error);
      console.error('❌ Error response:', err.response?.data);
      
      // Extract error message
      let errorMessage = 'Error al asignar estratos';
      if (err.response?.data?.detail) {
        if (Array.isArray(err.response.data.detail)) {
          // Pydantic validation errors
          const validationErrors = err.response.data.detail.map(e => `${e.loc.join('.')}: ${e.msg}`).join(', ');
          console.error('❌ Validation errors:', validationErrors);
          errorMessage = `Error de validación: ${validationErrors}`;
        } else {
          errorMessage = err.response.data.detail;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      console.log(errorMessage);
    },
  });
}

export function useBoreholeWorkflow() {
  const createBoreholes = useCreateBoreholes();
  const createBoreholeStrata = useCreateBoreholeStrata();
  const project = useAppStore((state) => state.project);
  const strata = useAppStore((state) => state.strata);
  const existingBoreholes = useAppStore((state) => state.boreholes);
  const [createdBoreholes, setCreatedBoreholes] = useState<Borehole[]>([]);

  // Two-phase submission:
  // 1. Create boreholes
  // 2. Create borehole-strata assignments
  const submitBoreholes = ({
    boreholes,
    strataAssignments,
  }: {
    boreholes: BoreholeCreate[];
    strataAssignments: Array<{
      borehole_name: string;
      assignments: Array<{
        stratum_code: string;
        depth_from: number;
        depth_to: number;
      }>;
    }>;
  }) => {
    if (!project?.id) {
      console.log('No hay proyecto activo');
      return;
    }

    // Check if boreholes already exist for this project
    if (existingBoreholes.length > 0 && existingBoreholes[0].project_id === project.id) {
      console.log('Boreholes already exist, but will create/update strata assignments');
      
      // Create borehole-strata assignments using existing boreholes
      const boreholeStrataData: BoreholeStratumCreate[] = [];

      strataAssignments.forEach((assignment) => {
        const borehole = existingBoreholes.find((bh) => bh.borehole_name === assignment.borehole_name);
        
        if (borehole) {
          assignment.assignments.forEach((stratumAssignment) => {
            const stratum = strata.find((s) => s.name === stratumAssignment.stratum_code);
            
            if (stratum) {
              boreholeStrataData.push({
                borehole_id: borehole.id,
                stratum_definition_id: stratum.id,
                stratum_code: stratum.stratum_code, // ✅ Added required field
                initial_depth: stratumAssignment.depth_from,
                final_depth: stratumAssignment.depth_to,
              });
            }
          });
        }
      });

      // Submit borehole-strata
      if (boreholeStrataData.length > 0) {
        console.log('📊 Borehole-Strata data (existing boreholes):', boreholeStrataData);
        createBoreholeStrata.mutate(boreholeStrataData);
      } else {
        console.warn('⚠️ No borehole-strata data to submit!');
        
      }
      
      return;
    }

    const boreholesWithProject = boreholes.map((b) => ({
      ...b,
      project_id: project.id,
    }));

    // Phase 1: Create boreholes
    createBoreholes.mutate(boreholesWithProject, {
      onSuccess: (createdBhs: Borehole[]) => {
        setCreatedBoreholes(createdBhs);

        // Phase 2: Create borehole-strata assignments
        const boreholeStrataData: BoreholeStratumCreate[] = [];

        strataAssignments.forEach((assignment) => {
          const borehole = createdBhs.find((bh) => bh.borehole_name === assignment.borehole_name);
          
          if (borehole) {
            assignment.assignments.forEach((stratumAssignment) => {
              const stratum = strata.find((s) => s.name === stratumAssignment.stratum_code);
              
              if (stratum) {
                boreholeStrataData.push({
                  borehole_id: borehole.id,
                  stratum_definition_id: stratum.id,
                  stratum_code: stratum.stratum_code, // ✅ Added required field
                  initial_depth: stratumAssignment.depth_from,
                  final_depth: stratumAssignment.depth_to,
                });
              }
            });
          }
        });

        // Submit borehole-strata
        if (boreholeStrataData.length > 0) {
          console.log('📊 Borehole-Strata data to submit:', boreholeStrataData);
          createBoreholeStrata.mutate(boreholeStrataData);
        } else {
          console.warn('⚠️ No borehole-strata data to submit!');
        }
      },
    });
  };

  return {
    submitBoreholes,
    isSubmitting: createBoreholes.isPending || createBoreholeStrata.isPending,
    error: createBoreholes.error || createBoreholeStrata.error,
    createdBoreholes,
  };
}
