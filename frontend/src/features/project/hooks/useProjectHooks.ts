
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { projectService } from '../services/projectService';
import { queryKeys, invalidateProjectData } from '@/lib/queryClient';
import { useAppStore } from '@/store/appStore';
import type { Project, ProjectCreate } from '@/types/project';
import { toast } from 'react-toastify';

  
// ===========================================
// QUERIES (GET)
// ===========================================


export function useProjects() {
  return useQuery({
    queryKey: queryKeys.projects.all,
    queryFn: projectService.getAll,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}



export function useProject(id: number | undefined) {
  return useQuery({
    queryKey: queryKeys.projects.detail(id!),
    queryFn: () => projectService.getById(id!),
    enabled: !!id, // Solo ejecutar si hay ID
    staleTime: 1000 * 60 * 5,
  });
}


export function useProjectWithDetails(id: number | undefined) {
  return useQuery({
    queryKey: [...queryKeys.projects.detail(id!), 'with-details'],
    queryFn: () => projectService.getWithDetails(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 2, // 2 minutos (más dinámico)
  });
}

// ===========================================
// MUTATIONS (POST/PUT/DELETE)
// ===========================================


export function useCreateProject() {
  const queryClient = useQueryClient();
  const setProject = useAppStore((state) => state.setProject);
  const markStepCompleted = useAppStore((state) => state.markStepCompleted);
  const goToNextStep = useAppStore((state) => state.goToNextStep);

  return useMutation({
    mutationFn: projectService.create,
    
    onMutate: async (newProject) => {
      // Optimistic update (opcional)
      console.log('Creating project:', newProject.project_name);
      console.log(newProject);
    },
    
    onSuccess: (project: Project) => {
      // 1. Guardar en store global
      setProject(project);
      
      // 2. Marcar paso como completado
      markStepCompleted(0);
      
      // 3. Navegar al siguiente paso
      goToNextStep();
      
      // 4. Invalidar cache para refrescar listas
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.projects.all 
      });
    },
    
    onError: (error: Error) => {
      console.error('Error creating project:', error.message || 'Unknown error');
      toast.error('Error al crear proyecto. Intenta nuevamente.');
    },
  });
}


export function useUpdateProject() {
  const updateProject = useAppStore((state) => state.updateProject);

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ProjectCreate> }) =>
      projectService.update(id, data),
    
    onSuccess: (project: Project) => {
      // 1. Actualizar store
      updateProject(project);
      console.log('Project updated:', project);
      // 2. Invalidar cache del proyecto
      invalidateProjectData(project.id);
      // 3. Toast de éxito (necesario porque no hay navegación automática)
      toast.success('Proyecto actualizado exitosamente');
    },
    
    onError: (error: Error) => {
      console.error('Error updating project:', error.message || 'Unknown error');
      toast.error('Error al actualizar proyecto. Intenta nuevamente.');
    },
    
   
  });
}


export function useDeleteProject() {
  const queryClient = useQueryClient();
  const setProject = useAppStore((state) => state.setProject);

  return useMutation({
    mutationFn: projectService.delete,
    
    onSuccess: (_data, projectId) => {
      // 1. Limpiar store si es el proyecto actual
      const currentProject = useAppStore.getState().project;
      if (currentProject?.id === projectId) {
        setProject(null);
      }
      
      // 2. Invalidar cache
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.projects.all 
      });
      
      // 3. Remover de cache específico
      queryClient.removeQueries({
        queryKey: queryKeys.projects.detail(projectId)
      });
    },
    
    onError: (error: Error) => {
      console.error('Error deleting project:', error.message || 'Unknown error');
      toast.error('Error al eliminar proyecto. Intenta nuevamente.');
    },
  });
}

// ===========================================
// HOOKS COMPUESTOS (WORKFLOW)
// ===========================================


export function useProjectWorkflow() {
  const project = useAppStore((state) => state.project);
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();

  // LÓGICA UNIFICADA - Detecta automáticamente edit mode
  const isEditMode = !!project && project.id !== undefined;

  const submit = (data: ProjectCreate) => {
    if (isEditMode && project) {
      // UPDATE - El proyecto ya existe en el backend
      updateProject.mutate({ id: project.id, data });
    } else {
      // CREATE - Es un proyecto nuevo
      createProject.mutate(data);
    }
  };

  return {
    submit,
    isLoading: createProject.isPending || updateProject.isPending,
    isEditMode,
    submitLabel: isEditMode ? 'Actualizar' : 'Guardar',
    error: createProject.error || updateProject.error,
  };
}
