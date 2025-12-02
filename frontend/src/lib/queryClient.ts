/**

 * CONCEPTOS CLAVE:
 * - Queries → GET requests (leer datos)
 * - Mutations → POST/PUT/DELETE (escribir datos)
 * - QueryKey → Identificador único para cachear
 * - Stale Time → Cuánto tiempo es "fresco"
 * - Cache Time → Cuánto guardar en memoria
 * 
 * EJEMPLO DE USO:
 * ```tsx
 * // En lugar de esto (antiguo):
 * const [data, setData] = useState(null);
 * const [loading, setLoading] = useState(false);
 * useEffect(() => {
 *   setLoading(true);
 *   fetch('/api/projects/1')
 *     .then(res => res.json())
 *     .then(setData)
 *     .finally(() => setLoading(false));
 * }, []);
 * 
 * // Ahora esto (React Query):
 * const { data, isLoading } = useQuery({
 *   queryKey: ['project', 1],
 *   queryFn: () => api.getProject(1)
 * });
 * ```
 */

import { QueryClient } from '@tanstack/react-query';
import type { DefaultOptions } from '@tanstack/react-query';

/**
 * Configuración por defecto para todas las queries/mutations
 * 
 * EXPLICACIÓN:
 * - staleTime: 5min → Considera datos "frescos" por 5 minutos
 * - gcTime: 10min → Guarda en cache por 10 minutos después de no usarse
 * - retry: 1 → Reintenta 1 vez si falla (no infinito)
 * - refetchOnWindowFocus: false → No recargar al cambiar de pestaña
 */
const queryConfig: DefaultOptions = {
  queries: {
    // ⏰ Tiempo que los datos son considerados "frescos" (no refetch)
    // 5 minutos es bueno para datos que cambian ocasionalmente
    staleTime: 1000 * 60 * 5, // 5 minutos
    
    // 🗑️ Tiempo en cache antes de garbage collection
    // 10 minutos para que el usuario pueda volver sin recargar
    gcTime: 1000 * 60 * 10, // 10 minutos (antes "cacheTime")
    
    // 🔄 Reintentar 1 vez en caso de error
    // Suficiente para errores de red transitorios
    retry: 1,
    
    // 🔁 Delay progresivo entre reintentos (1s, 2s, 4s...)
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    
    // 🪟 NO refetch al volver a la ventana
    // Cambiar a `true` si quieres datos siempre actualizados
    refetchOnWindowFocus: false,
    
    // 📡 NO refetch al reconectar internet
    // Cambiar a `true` para apps críticas con tiempo real
    refetchOnReconnect: false,
    
    // 🎯 NO refetch automático al montar componente si hay cache
    // Los datos en cache son suficientes durante staleTime
    refetchOnMount: false,
  },
  
  mutations: {
    // 🔁 NO reintentar mutations automáticamente
    // Las mutations son operaciones críticas (crear/editar/borrar)
    // Mejor que el usuario decida si reintentar
    retry: 0,
    
    // ⚠️ Manejo de errores global para mutations
    onError: (error) => {
      console.error('Mutation error:', error);
      // Aquí podrías integrar con Sentry o similar
    },
  },
};

/**
 * Cliente principal de React Query
 * 
 * USO EN PROVIDER:
 * ```tsx
 * import { QueryClientProvider } from '@tanstack/react-query';
 * import { queryClient } from '@/lib/queryClient';
 * 
 * <QueryClientProvider client={queryClient}>
 *   <App />
 * </QueryClientProvider>
 * ```
 */
export const queryClient = new QueryClient({
  defaultOptions: queryConfig,
});

export const queryKeys = {
  // === PROJECTS ===
  projects: {
    all: ['projects'] as const,
    lists: () => [...queryKeys.projects.all, 'list'] as const,
    list: (filters: string) => [...queryKeys.projects.lists(), { filters }] as const,
    details: () => [...queryKeys.projects.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.projects.details(), id] as const,
  },
  
  // === STRATA ===
  strata: {
    all: ['strata'] as const,
    byProject: (projectId: number) => [...queryKeys.strata.all, 'project', projectId] as const,
    detail: (id: number) => [...queryKeys.strata.all, 'detail', id] as const,
  },
  
  // === BOREHOLES ===
  boreholes: {
    all: ['boreholes'] as const,
    byProject: (projectId: number) => [...queryKeys.boreholes.all, 'project', projectId] as const,
    detail: (id: number) => [...queryKeys.boreholes.all, 'detail', id] as const,
  },
  
  // === SPT INTERVALS ===
  sptIntervals: {
    all: ['spt-intervals'] as const,
    byBorehole: (boreholeId: number) => [...queryKeys.sptIntervals.all, 'borehole', boreholeId] as const,
    detail: (id: number) => [...queryKeys.sptIntervals.all, 'detail', id] as const,
  },
  
  // === CALCULATED RESULTS ===
  calculatedResults: {
    all: ['calculated-results'] as const,
    byProject: (projectId: number) => [...queryKeys.calculatedResults.all, 'project', projectId] as const,
    byBorehole: (boreholeId: number) => [...queryKeys.calculatedResults.all, 'borehole', boreholeId] as const,
  },
} as const;

// ===========================================
// UTILIDADES
// ===========================================

/**
 * Invalidar todo el cache de un proyecto y sus relaciones
 * 
 * USO:
 * ```tsx
 * // Después de actualizar un proyecto
 * await updateProject(data);
 * invalidateProjectData(projectId);
 * ```
 */
export function invalidateProjectData(projectId: number) {
  queryClient.invalidateQueries({ 
    queryKey: queryKeys.projects.detail(projectId) 
  });
  queryClient.invalidateQueries({ 
    queryKey: queryKeys.strata.byProject(projectId) 
  });
  queryClient.invalidateQueries({ 
    queryKey: queryKeys.boreholes.byProject(projectId) 
  });
  queryClient.invalidateQueries({ 
    queryKey: queryKeys.calculatedResults.byProject(projectId) 
  });
}

/**
 * Limpiar todo el cache (útil para logout)
 * 
 * USO:
 * ```tsx
 * function logout() {
 *   clearAllCache();
 *   // ... resto de logout
 * }
 * ```
 */
export function clearAllCache() {
  queryClient.clear();
}

/**
 * Prefetch de datos (cargar antes de navegar)
 * 
 * USO:
 * ```tsx
 * // En un listado, prefetch al hacer hover
 * <Link 
 *   to={`/project/${id}`}
 *   onMouseEnter={() => prefetchProject(id)}
 * >
 * ```
 */
export async function prefetchProject(projectId: number) {
  await queryClient.prefetchQuery({
    queryKey: queryKeys.projects.detail(projectId),
    queryFn: () => fetch(`/api/v1/projects/${projectId}`).then(r => r.json()),
    staleTime: 1000 * 60 * 5,
  });
}
