import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { strataService } from "../services/strataService";
import type { Stratum, StratumCreate } from "@/types/project";
import { queryKeys } from "@/lib/queryClient";
import { useAppStore } from "@/store/appStore";
import { toast } from "react-toastify";

// QUERIES (GET)

export function useStrataByProject(projectId: number | undefined) {
  return useQuery({
    queryKey: [...queryKeys.projects.detail(projectId!), "strata"],
    queryFn: () => strataService.getByProject(projectId!),
    enabled: !!projectId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

// MUTATIONS (POST/PUT/DELETE)

export function useCreateStrata() {
  const queryClient = useQueryClient();
  const setStrata = useAppStore((state) => state.setStrata);
  const markStepCompleted = useAppStore((state) => state.markStepCompleted);
  const goToNextStep = useAppStore((state) => state.goToNextStep);
  const project = useAppStore((state) => state.project);

  return useMutation({
    mutationFn: strataService.createBulk,

    onMutate: async (newStrata) => {
      console.log(`Creating ${newStrata.length} strata...`);
      console.log(newStrata);
    },

    onSuccess: (strata: Stratum[]) => {
      // 1. Guardar en store global
      setStrata(strata);

      // 2. Marcar paso como completado
      markStepCompleted(1);

      // 3. Navegar al siguiente paso
      goToNextStep();

      // 4. Tostada exitosa
      toast.success("Estratos guardados {•‿•}");

      //5. Invalidar cache del proyecto
      if (project?.id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.projects.detail(project.id),
        });
      }

      console.log("Strata created:", strata);
    },

    onError: (error: Error) => {
      // Log detailed error for debugging
      const axiosError = error as {
        response?: { data?: { detail?: string | Array<{ msg: string }> } };
      };
      console.error("Strata creation error:", error);
      console.error("Backend error details:", axiosError.response?.data);

      const errorDetail = axiosError.response?.data?.detail;
      let errorMessage = error.message || "Error al crear estratos";

      toast.success("Error al crear estratos {•︵•}");
      if (typeof errorDetail === "string") {
        errorMessage = errorDetail;
      } else if (Array.isArray(errorDetail) && errorDetail.length > 0) {
        errorMessage = errorDetail[0]?.msg || errorMessage;
      }

      console.error("User-friendly error message:", errorMessage);
    },
  });
}

export function useUpdateStratum() {
  const queryClient = useQueryClient();
  const updateStratum = useAppStore((state) => state.updateStratum);
  const project = useAppStore((state) => state.project);

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<StratumCreate> }) =>
      strataService.update(id, data),

    onSuccess: (stratum: Stratum) => {
      // 1. Actualizar en el store
      updateStratum(stratum.id, stratum);

      // 2. Invalidar cache del proyecto
      if (project?.id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.projects.detail(project.id),
        });
      }

      console.log("Stratum updated:", stratum);
    },

    onError: (error: Error) => {
      console.error("Error updating stratum:", error.message);
    },
  });
}

export function useDeleteStratum() {
  const queryClient = useQueryClient();
  const removeStratum = useAppStore((state) => state.removeStratum);
  const project = useAppStore((state) => state.project);

  return useMutation({
    mutationFn: strataService.delete,

    onSuccess: (_data, stratumId) => {
      // 1. Remover del store
      removeStratum(stratumId);

      // 2. Invalidar cache del proyecto
      if (project?.id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.projects.detail(project.id),
        });
      }

      console.log("Stratum deleted:", stratumId);
    },

    onError: (error: Error) => {
      console.error("Error deleting stratum:", error.message);
    },
  });
}

export function useStrataWorkflow() {
  const createStrata = useCreateStrata();
  const project = useAppStore((state) => state.project);
  const existingStrata = useAppStore((state) => state.strata);
  const markStepCompleted = useAppStore((state) => state.markStepCompleted);
  const goToNextStep = useAppStore((state) => state.goToNextStep);

  // ✅ LÓGICA UNIFICADA - Detecta automáticamente edit mode
  const isEditMode =
    existingStrata.length > 0 &&
    existingStrata[0]?.id !== undefined &&
    existingStrata[0]?.project_id === project?.id;

  const submit = (strata: StratumCreate[]) => {
    if (!project?.id) {
      console.error("❌ No active project to associate strata with.");
      return;
    }

    if (isEditMode) {
      // MODO EDICIÓN: DELETE + CREATE (porque no hay UPDATE bulk en el backend)
      console.log("🔄 Edit mode: Deleting old strata and creating new ones");

      // TODO: Implementar DELETE batch + CREATE bulk en el backend
      // Por ahora, simplemente navegamos (los datos ya están en el store)
      console.warn(
        "⚠️ Backend does not support bulk UPDATE yet. Skipping re-creation."
      );
      markStepCompleted(1);
      goToNextStep();
      return;
    }

    // MODO CREACIÓN: POST normal
    console.log("✨ Create mode: Creating new strata");
    const strataWithProject = strata.map((s) => ({
      ...s,
      project_id: project.id,
    }));

    createStrata.mutate(strataWithProject);
  };

  return {
    submit,
    isLoading: createStrata.isPending,
    isEditMode,
    submitLabel: isEditMode ? "Actualizar" : "Guardar",
    error: createStrata.error,
  };
}
