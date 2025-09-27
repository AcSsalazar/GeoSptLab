/**
 * Hook for managing multi-step SPT project creation workflow
 * Follows the backend API flow: Project → (Strata + Boreholes) → SPT Intervals → Results
 */
import { useState, useCallback } from 'react';
import { projectAPI, strataAPI, boreholesAPI, sptIntervalsAPI } from '@/services/api';
import type { 
  ProjectCreate, 
  Project, 
  Stratum,
  BoreholeCreate,
  Borehole,
  SPTIntervalCreate,
  SPTInterval,
  ProjectWithDetails
} from '@/types/project';
import type { BoreholeStrataSubmissionPayload } from '@/types/borehole-strata';

export interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  data?: Project | Stratum[] | Borehole[] | SPTInterval[] | ProjectWithDetails;
}

export interface ProjectWorkflowState {
  currentStep: number;
  steps: WorkflowStep[];
  projectData?: Project;
  strataData: Stratum[];
  boreholesData: Borehole[];
  sptIntervalsData: SPTInterval[];
  loading: boolean;
  error: string | null;
}

const initialSteps: WorkflowStep[] = [
  {
    id: 'project-setup',
    title: 'Formulario base',
    description: 'Configure basic project parameters and calculation settings',
    completed: false
  },
  {
    id: 'strata-definition',
    title: 'Definir estratos',
    description: 'Define soil layers and their geotechnical properties',
    completed: false
  },
  {
    id: 'borehole-creation',
    title: 'Crear perforaciones',
    description: 'Create boreholes with locations and depths',
    completed: false
  },
  {
    id: 'spt-intervals',
    title: 'Datos de intervalos SPT',
    description: 'Input SPT test results for each borehole interval',
    completed: false
  },
  {
    id: 'results',
    title: 'Resultados y análisis',
    description: 'View calculated parameters and generate reports',
    completed: false
  }
];

export const useProjectWorkflow = () => {
  const [state, setState] = useState<ProjectWorkflowState>({
    currentStep: 0,
    steps: initialSteps,
    strataData: [],
    boreholesData: [],
    sptIntervalsData: [],
    loading: false,
    error: null
  });

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, loading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  const markStepCompleted = useCallback((stepIndex: number, data?: Project | Stratum[] | Borehole[] | SPTInterval[] | ProjectWithDetails) => {
    setState(prev => ({
      ...prev,
      steps: prev.steps.map((step, index) => 
        index === stepIndex 
          ? { ...step, completed: true, data }
          : step
      )
    }));
  }, []);

  const nextStep = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentStep: Math.min(prev.currentStep + 1, prev.steps.length - 1)
    }));
  }, []);

  const goToStep = useCallback((stepIndex: number) => {
    setState(prev => ({
      ...prev,
      currentStep: stepIndex
    }));
  }, []);

  // Step 1: Create Project
  const submitProjectData = useCallback(async (projectData: ProjectCreate): Promise<Project> => {
    try {
      setLoading(true);
      setError(null);
      
      const project = await projectAPI.create(projectData);
      
      setState(prev => ({
        ...prev,
        projectData: project
      }));
      
      markStepCompleted(0, project);
      return project;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create project';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [markStepCompleted, setLoading, setError]);

  // Step 2: Create Strata and Boreholes together (NEW COMBINED APPROACH!)
  const submitBoreholeStrataData = useCallback(async (payload: BoreholeStrataSubmissionPayload): Promise<{ strata: Stratum[], boreholes: Borehole[] }> => {
    if (!state.projectData) {
      throw new Error('Project must be created first');
    }

    try {
      setLoading(true);
      setError(null);
      
      // Step 1: Create all project-level strata using bulk endpoint
      const createdStrata = await strataAPI.createBulk(state.projectData.id, payload.projectStrata);
      
      // Step 2: Create all boreholes with strata assignments using new bulk endpoint
      const createdBoreholes = await boreholesAPI.createBulkWithStrata({
        project_id: state.projectData.id,
        boreholes: payload.boreholes.map(borehole => ({
          borehole_name: borehole.borehole_name,
          final_depth: borehole.final_depth,
          diameter_mm: borehole.diameter_mm || 150,
          field_energy_percent: borehole.field_energy_percent || 45,
          rod_length: borehole.rod_length || 15,
          water_table_depth: borehole.water_table_depth,
          formulation: state.projectData?.formulation, // Use project formulation
          strata_assignments: borehole.strataAssignments.map(assignment => ({
            stratum_code: assignment.stratumCode,
            depth_from: assignment.depthFrom,
            depth_to: assignment.depthTo
          }))
        }))
      });
      
      setState(prev => ({
        ...prev,
        strataData: createdStrata,
        boreholesData: createdBoreholes
      }));
      
      // Mark both steps as completed since we did them together
      markStepCompleted(1, createdStrata);
      markStepCompleted(2, createdBoreholes);
      
      return { strata: createdStrata, boreholes: createdBoreholes };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create boreholes and strata';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [state.projectData, markStepCompleted, setLoading, setError]);

  // Step 3: Create Boreholes
  const submitBoreholesData = useCallback(async (boreholesData: BoreholeCreate[]): Promise<Borehole[]> => {
    if (!state.projectData) {
      throw new Error('Project must be created first');
    }

    try {
      setLoading(true);
      setError(null);
      
      const createdBoreholes: Borehole[] = [];
      
      // Create each borehole sequentially
      for (const boreholeData of boreholesData) {
        const borehole = await boreholesAPI.create({
          ...boreholeData,
          project_id: state.projectData.id
        });
        createdBoreholes.push(borehole);
      }
      
      setState(prev => ({
        ...prev,
        boreholesData: createdBoreholes
      }));
      
      markStepCompleted(2, createdBoreholes);
      return createdBoreholes;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create boreholes';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [state.projectData, markStepCompleted, setLoading, setError]);

  // Step 4: Create SPT Intervals
  const submitSPTIntervalsData = useCallback(async (sptIntervalsData: SPTIntervalCreate[]): Promise<SPTInterval[]> => {
    if (state.boreholesData.length === 0) {
      throw new Error('Boreholes must be created first');
    }

    try {
      setLoading(true);
      setError(null);
      
      const createdIntervals: SPTInterval[] = [];
      
      // Create each SPT interval sequentially
      for (const intervalData of sptIntervalsData) {
        const interval = await sptIntervalsAPI.create(intervalData);
        createdIntervals.push(interval);
      }
      
      setState(prev => ({
        ...prev,
        sptIntervalsData: createdIntervals
      }));
      
      markStepCompleted(3, createdIntervals);
      return createdIntervals;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create SPT intervals';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [state.boreholesData, markStepCompleted, setLoading, setError]);

  // Step 5: Get Final Results Summary
  const getProjectSummary = useCallback(async (): Promise<ProjectWithDetails> => {
    if (!state.projectData) {
      throw new Error('Project must be created first');
    }

    try {
      setLoading(true);
      setError(null);
      
      const summary = await projectAPI.getWithDetails(state.projectData.id);
      
      markStepCompleted(4, summary);
      return summary;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get project summary';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [state.projectData, markStepCompleted, setLoading, setError]);

  // Reset workflow
  const resetWorkflow = useCallback(() => {
    setState({
      currentStep: 0,
      steps: initialSteps.map(step => ({ ...step, completed: false, data: undefined })),
      strataData: [],
      boreholesData: [],
      sptIntervalsData: [],
      loading: false,
      error: null
    });
  }, []);

  return {
    ...state,
    // Actions
    submitProjectData,
    submitBoreholeStrataData,
    submitSPTIntervalsData,
    getProjectSummary,
    nextStep,
    goToStep,
    resetWorkflow,
    setError
  };
};