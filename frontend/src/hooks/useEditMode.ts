/**
 * 🎯 HOOK UNIFICADO - Edit Mode Detection
 * 
 * RESPONSABILIDAD:
 * - Detectar automáticamente si estamos en modo CREACIÓN o EDICIÓN
 * - Proveer lógica consistente para todos los formularios
 * 
 * CRITERIOS PARA isEditMode = true:
 * 1. Los datos existen en el store (length > 0 o objeto no null)
 * 2. Los datos tienen IDs del backend (id !== undefined)
 * 3. Los datos pertenecen al proyecto actual (project_id === project.id)
 * 
 * USO:
 * ```tsx
 * const { isEditMode, canEdit } = useEditMode({
 *   data: strata,
 *   projectId: project?.id
 * });
 * 
 * return <button>{isEditMode ? 'Actualizar' : 'Crear'}</button>
 * ```
 */

/**
 * Opciones de configuración para el hook
 */
interface UseEditModeOptions<T> {
  /**
   * Los datos a verificar (puede ser array o objeto)
   * - Array: strata[], boreholes[], intervals[]
   * - Object: project
   */
  data: T[] | T | null;
  
  /**
   * ID del proyecto actual
   * Se usa para verificar que los datos pertenecen al proyecto correcto
   */
  projectId?: number;
  
  /**
   * Forzar modo edición (útil para testing)
   * @default false
   */
  forceEditMode?: boolean;
}

/**
 * Resultado del hook
 */
interface UseEditModeResult {
  /**
   * ¿Estamos en modo edición?
   * true = Los datos existen y tienen IDs del backend
   */
  isEditMode: boolean;
  
  /**
   * ¿Podemos editar?
   * true = isEditMode && los datos pertenecen al proyecto actual
   */
  canEdit: boolean;
  
  /**
   * Texto para botones (conveniente para UI)
   * - "Actualizar" si isEditMode
   * - "Guardar" si !isEditMode
   */
  submitLabel: string;
  
  /**
   * Método de API sugerido
   * - "PUT" si isEditMode
   * - "POST" si !isEditMode
   */
  suggestedMethod: 'POST' | 'PUT';
}

/**
 * Hook para detectar modo edición
 * 
 * @example
 * // Para arrays (strata, boreholes, intervals)
 * const { isEditMode } = useEditMode({
 *   data: strata,
 *   projectId: project?.id
 * });
 * 
 * @example
 * // Para objetos (project)
 * const { isEditMode } = useEditMode({
 *   data: project
 * });
 * 
 * @example
 * // Con verificación estricta de proyecto
 * const { isEditMode, canEdit } = useEditMode({
 *   data: boreholes,
 *   projectId: project?.id
 * });
 * 
 * if (!canEdit) {
 *   return <div>Los datos no pertenecen a este proyecto</div>;
 * }
 */
export function useEditMode<T extends { id?: number; project_id?: number }>(
  options: UseEditModeOptions<T>
): UseEditModeResult {
  const { data, projectId, forceEditMode = false } = options;

  // Detectar modo edición
  const isEditMode = (() => {
    // Override forzado (útil para testing)
    if (forceEditMode) return true;

    // Caso 1: data es null/undefined → CREATE
    if (!data) return false;

    // Caso 2: data es array vacío → CREATE
    if (Array.isArray(data) && data.length === 0) return false;

    // Caso 3: data es array con elementos
    if (Array.isArray(data)) {
      const firstItem = data[0];
      
      // ✅ Verificar que el primer elemento tenga ID del backend
      return firstItem?.id !== undefined;
    }

    // Caso 4: data es objeto
    return (data as T).id !== undefined;
  })();

  // Verificar si podemos editar (datos pertenecen al proyecto correcto)
  const canEdit = (() => {
    // Si no hay proyecto especificado, asumimos que sí podemos editar
    if (!projectId) return isEditMode;

    // Si no estamos en modo edición, no importa
    if (!isEditMode) return true;

    // Verificar que los datos pertenezcan al proyecto actual
    if (Array.isArray(data) && data.length > 0) {
      const firstItem = data[0];
      return firstItem?.project_id === projectId;
    }

    if (data && !Array.isArray(data)) {
      return (data as T).id === projectId;
    }

    return false;
  })();

  return {
    isEditMode,
    canEdit,
    submitLabel: isEditMode ? 'Actualizar' : 'Guardar',
    suggestedMethod: isEditMode ? 'PUT' : 'POST',
  };
}

/**
 * EJEMPLOS DE USO EN COMPONENTES:
 * 
 * === 1. ProjectSetupForm ===
 * ```tsx
 * function ProjectSetupForm() {
 *   const project = useAppStore(state => state.project);
 *   const { isEditMode, submitLabel } = useEditMode({ data: project });
 *   
 *   return <button>{submitLabel} Proyecto</button>;
 * }
 * ```
 * 
 * === 2. StrataDefinitionForm ===
 * ```tsx
 * function StrataDefinitionForm() {
 *   const project = useAppStore(state => state.project);
 *   const strata = useAppStore(state => state.strata);
 *   const { isEditMode, canEdit } = useEditMode({ 
 *     data: strata, 
 *     projectId: project?.id 
 *   });
 *   
 *   if (!canEdit) {
 *     return <div>Error: Los estratos no pertenecen a este proyecto</div>;
 *   }
 *   
 *   return <button>{isEditMode ? 'Actualizar' : 'Crear'} Estratos</button>;
 * }
 * ```
 * 
 * === 3. BoreholesConfigurationForm ===
 * ```tsx
 * function BoreholesConfigurationForm() {
 *   const project = useAppStore(state => state.project);
 *   const boreholes = useAppStore(state => state.boreholes);
 *   const { isEditMode, submitLabel } = useEditMode({ 
 *     data: boreholes, 
 *     projectId: project?.id 
 *   });
 *   
 *   return <button>{submitLabel} Perforaciones</button>;
 * }
 * ```
 */
