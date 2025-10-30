/**
 * 🎯 APP PROVIDERS - Configuración Central de la Aplicación
 * 
 * Este archivo envuelve toda la app con los providers necesarios:
 * 1. QueryClientProvider → React Query (server state)
 * 2. ReactQueryDevtools → Debugging de queries
 * 3. Toaster → Notificaciones toast (Sonner)
 * 
 * ARQUITECTURA:
 * - Zustand NO necesita provider (ya está global)
 * - React Query SÍ necesita provider
 * - Toaster es un componente que se monta una vez
 * 
 * USO EN MAIN.TSX:
 * ```tsx
 * import { AppProviders } from './providers/AppProviders';
 * 
 * createRoot(document.getElementById('root')!).render(
 *   <StrictMode>
 *     <AppProviders>
 *       <App />
 *     </AppProviders>
 *   </StrictMode>
 * );
 * ```
 */

import type { ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from '@/lib/queryClient';

interface AppProvidersProps {
  children: ReactNode;
}

/**
 * Provider principal que envuelve toda la aplicación
 * 
 * ORDEN IMPORTA:
 * 1. QueryClient → Primero porque otros pueden usarlo
 * 2. Otros providers → Si hubiera auth, theme, etc.
 * 3. Toaster → Al final porque es solo UI
 */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {/* React Query Devtools - Solo en desarrollo */}
      {import.meta.env.DEV && (
        <ReactQueryDevtools 
          initialIsOpen={false}
          position="bottom"
          buttonPosition="bottom-right"
        />
      )}
      
      {/* Contenido de la app */}
      {children}
      
      {/* Toast Notifications - Sonner */}

    </QueryClientProvider>
  );
}

/**
 * 📝 NOTAS SOBRE ZUSTAND:
 * 
 * ❓ ¿Por qué Zustand NO está aquí?
 * ✅ Zustand no necesita provider, es global automáticamente
 * ✅ Cada componente importa directamente: `useAppStore()`
 * ✅ Más simple que Context API o Redux
 * 
 * COMPARACIÓN:
 * 
 * // Context API (antiguo) ❌
 * <ProjectContext.Provider value={...}>
 *   <App />
 * </ProjectContext.Provider>
 * 
 * // Zustand (nuevo) ✅
 * // No provider necesario
 * import { useAppStore } from '@/store/appStore';
 * const project = useAppStore(state => state.project);
 */

/**
 * 📝 NOTAS SOBRE TOASTER (SONNER):
 * 
 * USO EN COMPONENTES:
 * ```tsx
 * import { toast } from 'sonner';
 * 
 * // Success
 * toast.success('Proyecto creado correctamente');
 * 
 * // Error
 * toast.error('Error al guardar');
 * 
 * // Promise (loading automático)
 * toast.promise(
 *   createProject(data),
 *   {
 *     loading: 'Guardando proyecto...',
 *     success: 'Proyecto creado',
 *     error: 'Error al crear proyecto'
 *   }
 * );
 * ```
 * 
 * VENTAJAS vs Toast Antiguo:
 * ✅ Animaciones suaves y modernas
 * ✅ Maneja promises automáticamente
 * ✅ Apila múltiples toasts
 * ✅ Posición configurable
 * ✅ Tipos nativos (success, error, info, warning)
 */
