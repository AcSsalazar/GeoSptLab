/**
 * 🎣 PROJECT HOOKS - Custom Hooks con React Query
 * 
 * VENTAJAS DE CUSTOM HOOKS:
 * ✅ Encapsulan lógica repetitiva (query keys, invalidaciones, toasts)
 * ✅ Reutilizables en múltiples componentes
 * ✅ Más fáciles de testear
 * ✅ API consistente en toda la app
 * 
 * PATRÓN:
 * - useProjects → Query (GET lista)
 * - useProject → Query (GET por ID)
 * - useCreateProject → Mutation (POST)
 * - useUpdateProject → Mutation (PUT)
 * - useDeleteProject → Mutation (DELETE)
 * 
 * USO EN COMPONENTES:
 * ```tsx
 * function ProjectList() {
 *   const { data: projects, isLoading } = useProjects();
 *   
 *   if (isLoading) return <div>Cargando...</div>;
 *   
 *   return (
 *     <div>
 *       {projects?.map(p => <div key={p.id}>{p.project_name}</div>)}
 *     </div>
 *   );
 * }
 * ```
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { projectService } from '../services/projectService';
import { queryKeys, invalidateProjectData } from '@/lib/queryClient';
import { useAppStore } from '@/store/appStore';
import type { Project, ProjectCreate } from '@/types/project';

// ===========================================
// QUERIES (GET)
// ===========================================

/**
 * Hook para obtener todos los proyectos
 * 
 * USO:
 * ```tsx
 * const { data: projects, isLoading, error } = useProjects();
 * ```
 */
export function useProjects() {
  return useQuery({
    queryKey: queryKeys.projects.all,
    queryFn: projectService.getAll,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

/**
 * Hook para obtener un proyecto por ID
 * 
 * USO:
 * ```tsx
 * const { data: project, isLoading } = useProject(1);
 * ```
 */
export function useProject(id: number | undefined) {
  return useQuery({
    queryKey: queryKeys.projects.detail(id!),
    queryFn: () => projectService.getById(id!),
    enabled: !!id, // Solo ejecutar si hay ID
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook para obtener proyecto con detalles (strata, boreholes, etc.)
 * 
 * USO:
 * ```tsx
 * const { data, isLoading } = useProjectWithDetails(1);
 * console.log(data.strata); // Array de estratos
 * ```
 */
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

/**
 * Hook para crear un proyecto
 * 
 * CARACTERÍSTICAS:
 * - Guarda en store automáticamente
 * - Invalida cache de proyectos
 * - Muestra toast de éxito/error
 * - Marca paso como completado
 * 
 * USO:
 * ```tsx
 * const createProject = useCreateProject();
 * 
 * const handleSubmit = (data: ProjectCreate) => {
 *   createProject.mutate(data);
 * };
 * ```
 */
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
      
      // 5. Toast de éxito
      
    },
    
    onError: (error: Error) => {
      console.error('Error creating project:', error.message || 'Unknown error');
    },
  });
}

/**
 * Hook para actualizar un proyecto
 * 
 * USO:
 * ```tsx
 * const updateProject = useUpdateProject();
 * 
 * const handleUpdate = () => {
 *   updateProject.mutate({ id: 1, data: { project_name: 'Nuevo nombre' } });
 * };
 * ```
 */
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
      
      // 3. Toast de éxito
      
    },
    
   
  });
}

/**
 * Hook para eliminar un proyecto
 * 
 * USO:
 * ```tsx
 * const deleteProject = useDeleteProject();
 * 
 * const handleDelete = (id: number) => {
 *   if (confirm('¿Seguro?')) {
 *     deleteProject.mutate(id);
 *   }
 * };
 * ```
 */
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
      
      // 4. Toast de éxito
      
    },
    
    onError: (error: Error) => {
      console.error('Error deleting project:', error.message || 'Unknown error');
    },
  });
}

// ===========================================
// HOOKS COMPUESTOS (WORKFLOW)
// ===========================================

/**
 * Hook para el flujo completo de crear/editar proyecto
 * 
 * Detecta automáticamente si es CREATE o UPDATE según el store.
 * 
 * USO:
 * ```tsx
 * const { submit, isLoading, isEditMode } = useProjectWorkflow();
 * 
 * const handleSubmit = (data: ProjectCreate) => {
 *   submit(data);
 * };
 * ```
 */
export function useProjectWorkflow() {
  const project = useAppStore((state) => state.project);
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();

  const isEditMode = !!project;

  const submit = (data: ProjectCreate) => {
    if (isEditMode && project) {
      // UPDATE
      updateProject.mutate({ id: project.id, data });
    } else {
      // CREATE
      createProject.mutate(data);
    }
  };

  return {
    submit,
    isLoading: createProject.isPending || updateProject.isPending,
    isEditMode,
    error: createProject.error || updateProject.error,
  };
}

/**
 * EJEMPLOS DE USO AVANZADO:
 * 
 * 1. Con loading manual:
 * ```tsx
 * function ProjectForm() {
 *   const { submit, isLoading } = useProjectWorkflow();
 *   
 *   return (
 *     <form onSubmit={handleSubmit(submit)}>
 *       <button disabled={isLoading}>
 *         {isLoading ? 'Guardando...' : 'Guardar'}
 *       </button>
 *     </form>
 *   );
 * }
 * ```
 * 
 * 2. Con callbacks personalizados:
 * ```tsx
 * function ProjectForm({ onSuccess }: { onSuccess: () => void }) {
 *   const createProject = useCreateProject();
 *   
 *   const handleSubmit = async (data: ProjectCreate) => {
 *     createProject.mutate(data, {
 *       onSuccess: () => {
 *         onSuccess();
 *         navigate('/next-step');
 *       }
 *     });
 *   };
 * }
 * ```
 * 
 * 3. Con validación antes de enviar:
 * ```tsx
 * function ProjectForm() {
 *   const { submit } = useProjectWorkflow();
 *   
 *   const handleSubmit = async (data: ProjectCreate) => {
 *     // Validación personalizada
 *     const isCodeAvailable = await projectService.isCodeAvailable(data.project_code);
 *     
 *     if (!isCodeAvailable) {
 *       showToast.error('El código ya existe');
 *       return;
 *     }
 *     
 *     submit(data);
 *   };
 * }
 * ```
 */
