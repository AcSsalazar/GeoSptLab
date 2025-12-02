/**
 * 📦 PROJECT SERVICE - Lógica de Negocio de Proyectos
 * 
 * RESPONSABILIDADES:
 * 1. Llamadas a API (separado del componente)
 * 2. Transformación de datos (si es necesaria)
 * 3. Validación de negocio (antes de enviar al backend)
 * 4. Manejo de errores (catch y formateo)
 * 
 * VENTAJAS:
 * ✅ Componentes más limpios (sin lógica de API)
 * ✅ Reusable en múltiples componentes
 * ✅ Fácil de testear (mock del servicio)
 * ✅ Cambiar backend es más fácil (solo cambia aquí)
 * 
 * USO EN HOOKS:
 * ```tsx
 * import { projectService } from './projectService';
 * 
 * const mutation = useMutation({
 *   mutationFn: projectService.create,
 *   onSuccess: (project) => {
 *     console.log('Created:', project);
 *   }
 * });
 * ```
 */

import axios from 'axios';
import type { Project, ProjectCreate, ProjectWithDetails } from '@/types/project';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

/**
 * Cliente axios configurado para la API
 */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 segundos
});

/**
 * Interceptor de respuesta para manejo de errores
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Formatear error para mostrar al usuario
    const message = error.response?.data?.detail || error.message || 'Error desconocido';
    console.error('API Error:', message);
    
    // Re-lanzar error para que React Query lo maneje
    return Promise.reject(new Error(message));
  }
);

/**
 * Servicio de Projects
 * 
 * PATRÓN:
 * - Todas las funciones son async
 * - Retornan el tipo correcto (no AxiosResponse)
 * - Manejan errores consistentemente
 */
export const projectService = {
  /**
   * Obtener todos los proyectos
   * 
   * GET /projects/
   */
  async getAll(): Promise<Project[]> {
    const response = await apiClient.get<Project[]>('/projects/');
    return response.data;
  },

  /**
   * Obtener proyecto por ID
   * 
   * GET /projects/{id}
   */
  async getById(id: number): Promise<Project> {
    const response = await apiClient.get<Project>(`/projects/${id}`);
    return response.data;
  },

  /**
   * Obtener proyecto con detalles (strata, boreholes, etc.)
   * 
   * GET /projects/{id}/with-details
   */
  async getWithDetails(id: number): Promise<ProjectWithDetails> {
    const response = await apiClient.get<ProjectWithDetails>(
      `/projects/${id}/with-details`
    );
    return response.data;
  },

  /**
   * Crear nuevo proyecto
   * 
   * POST /projects/
   */
  async create(data: ProjectCreate): Promise<Project> {
    // Validación de negocio (opcional)
    if (!data.project_name.trim()) {
      throw new Error('El nombre del proyecto es requerido');
    }

    const response = await apiClient.post<Project>('/projects/', data);
    return response.data;
  },

  /**
   * Actualizar proyecto existente
   * 
   * PUT /projects/{id}
   */
  async update(id: number, data: Partial<ProjectCreate>): Promise<Project> {
    const response = await apiClient.put<Project>(`/projects/${id}`, data);
    return response.data;
  },

  /**
   * Eliminar proyecto
   * 
   * DELETE /projects/{id}
   */
  async delete(id: number): Promise<void> {
    await apiClient.delete(`/projects/${id}`);
  },

  /**
   * Buscar proyectos por código
   * 
   * GET /projects/?project_code={code}
   */
  async searchByCode(code: string): Promise<Project[]> {
    const response = await apiClient.get<Project[]>('/projects/', {
      params: { project_code: code },
    });
    return response.data;
  },

  /**
   * Validar si un código de proyecto ya existe
   * 
   * Útil para validación en formularios
   */
  async isCodeAvailable(code: string): Promise<boolean> {
    try {
      const projects = await this.searchByCode(code);
      return projects.length === 0;
    } catch {
      return false;
    }
  },
};

/**
 * EJEMPLOS DE USO:
 * 
 * 1. En un hook personalizado:
 * ```tsx
 * export function useCreateProject() {
 *   return useMutation({
 *     mutationFn: projectService.create,
 *     onSuccess: (project) => {
 *       queryClient.invalidateQueries({ queryKey: ['projects'] });
 *       showToast.success(`Proyecto ${project.project_name} creado`);
 *     },
 *     onError: (error: Error) => {
 *       showToast.error(error.message);
 *     }
 *   });
 * }
 * ```
 * 
 * 2. En un componente directamente (menos recomendado):
 * ```tsx
 * function ProjectForm() {
 *   const mutation = useMutation({
 *     mutationFn: projectService.create
 *   });
 *   
 *   const handleSubmit = (data: ProjectCreate) => {
 *     mutation.mutate(data);
 *   };
 * }
 * ```
 * 
 * 3. Para queries:
 * ```tsx
 * const { data: projects } = useQuery({
 *   queryKey: ['projects'],
 *   queryFn: projectService.getAll
 * });
 * ```
 */

/**
 * Export del cliente axios para casos especiales
 */
export { apiClient };
