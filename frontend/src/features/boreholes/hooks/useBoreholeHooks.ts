import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { boreholesService } from "../services/boreholesService";
import { boreholeStrataService } from "../services/boreholeStrataService";
import type {
  Borehole,
  BoreholeCreate,
  BoreholeStratumCreate,
} from "@/types/project";
import { queryKeys } from "@/lib/queryClient";
import { useAppStore } from "@/store/appStore";
import { toast } from "react-toastify";

// QUERIES (GET)

export function useBoreholesByProject(projectId: number | undefined) {
  return useQuery({
    queryKey: [...queryKeys.projects.detail(projectId!), "boreholes"],
    queryFn: () => boreholesService.getByProject(projectId!),
    enabled: !!projectId,
    staleTime: 1000 * 60 * 5,
  });
}

// MUTATIONS (POST/PUT/DELETE)

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
      toast.success("Perforaciones guardadas con exito {•‿•}");
      if (project?.id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.projects.detail(project.id),
        });
      }

      console.log("Boreholes created:", boreholes);
    },

    onError: (error: Error) => {
      console.log(error.message || "Error al crear perforaciones");
    },
  });
}

export function useCreateBoreholeStrata() {
  const queryClient = useQueryClient();
  const project = useAppStore((state) => state.project);
  const setBoreholeStrata = useAppStore((state) => state.setBoreholeStrata);
  const markStepCompleted = useAppStore((state) => state.markStepCompleted);
  const goToNextStep = useAppStore((state) => state.goToNextStep);
  const clearDraftBoreholes = useAppStore((state) => state.clearDraftBoreholes);

  return useMutation({
    mutationFn: boreholeStrataService.createMultiple,

    onMutate: (data) => {
      console.log("📤 Creating borehole-strata assignments:", data);
    },

    onSuccess: (boreholeStrata) => {
      // Save to store
      setBoreholeStrata(boreholeStrata);

      // Clear draft state on successful submission
      clearDraftBoreholes();

      // Mark step as completed and navigate
      markStepCompleted(2); // Step 2 = Boreholes
      goToNextStep();

      if (project?.id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.projects.detail(project.id),
        });
      }

      console.log("Borehole-Strata created:", boreholeStrata);
    },

    onError: (error: unknown) => {
      const err = error as {
        response?: {
          data?: {
            detail?:
              | string
              | Array<{
                  type: string;
                  loc: Array<string>;
                  msg: string;
                  input: unknown;
                }>;
          };
        };
        message?: string;
      };
      console.error("❌ Error creating borehole-strata:", error);
      console.error("❌ Error response:", err.response?.data);

      // Extract error message
      let errorMessage = "Error al asignar estratos";
      if (err.response?.data?.detail) {
        if (Array.isArray(err.response.data.detail)) {
          // Pydantic validation errors
          const validationErrors = err.response.data.detail
            .map((e) => `${e.loc.join(".")}: ${e.msg}`)
            .join(", ");
          console.error("❌ Validation errors:", validationErrors);
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

export function useUpdateBorehole() {
  const queryClient = useQueryClient();
  const updateBorehole = useAppStore((state) => state.updateBorehole);
  const project = useAppStore((state) => state.project);

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<BoreholeCreate> }) =>
      boreholesService.update(id, data),

    onSuccess: (borehole: Borehole) => {
      // 1. Actualizar en el store
      updateBorehole(borehole.id, borehole);

      // 2. Invalidar cache del proyecto
      if (project?.id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.projects.detail(project.id),
        });
      }

      console.log("Borehole updated:", borehole);
    },

    onError: (error: Error) => {
      console.error("Error updating borehole:", error.message);
    },
  });
}

export function useDeleteBorehole() {
  const queryClient = useQueryClient();
  const removeBorehole = useAppStore((state) => state.removeBorehole);
  const project = useAppStore((state) => state.project);

  return useMutation({
    mutationFn: boreholesService.delete,

    onSuccess: (_data, boreholeId) => {
      // 1. Remover del store
      removeBorehole(boreholeId);

      // 2. Invalidar cache del proyecto
      if (project?.id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.projects.detail(project.id),
        });
      }

      console.log("Borehole deleted:", boreholeId);
    },

    onError: (error: Error) => {
      console.error("Error deleting borehole:", error.message);
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

  // ✅ LÓGICA UNIFICADA - Detecta automáticamente edit mode
  const isEditMode =
    existingBoreholes.length > 0 &&
    existingBoreholes[0]?.id !== undefined &&
    existingBoreholes[0]?.project_id === project?.id;

  // 2. Create/Update borehole-strata assignments
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
      console.error("❌ No hay proyecto activo");
      return;
    }

    if (isEditMode) {
      console.log(
        "🔄 Edit mode: Deleting old strata assignments and creating new ones"
      );

      // STEP 1: Delete all existing borehole-strata assignments
      const deletePromises = existingBoreholes.map((bh) =>
        boreholeStrataService
          .deleteByBorehole(bh.id)
          .catch((err) =>
            console.warn(
              `Could not delete assignments for borehole ${bh.id}:`,
              err
            )
          )
      );

      Promise.all(deletePromises).then(() => {
        console.log("✅ Old strata assignments deleted");

        // STEP 2: Create NEW borehole-strata assignments
        const boreholeStrataData: BoreholeStratumCreate[] = [];

        strataAssignments.forEach((assignment) => {
          const borehole = existingBoreholes.find(
            (bh) => bh.borehole_name === assignment.borehole_name
          );

          if (borehole) {
            assignment.assignments.forEach((stratumAssignment) => {
              const stratum = strata.find(
                (s) => s.name === stratumAssignment.stratum_code
              );

              if (stratum) {
                boreholeStrataData.push({
                  borehole_id: borehole.id,
                  stratum_definition_id: stratum.id,
                  stratum_code: stratum.stratum_code,
                  initial_depth: stratumAssignment.depth_from,
                  final_depth: stratumAssignment.depth_to,
                });
              }
            });
          }
        });

        // Submit NEW borehole-strata
        if (boreholeStrataData.length > 0) {
          console.log(
            "📊 NEW Borehole-Strata data to submit:",
            boreholeStrataData
          );
          createBoreholeStrata.mutate(boreholeStrataData);
        } else {
          console.warn("⚠️ No borehole-strata data to submit!");
        }
      });

      return;
    }

    // ✅ MODO CREACIÓN - POST normal
    console.log("✨ Create mode: Creating new boreholes");
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
          const borehole = createdBhs.find(
            (bh) => bh.borehole_name === assignment.borehole_name
          );

          if (borehole) {
            assignment.assignments.forEach((stratumAssignment) => {
              const stratum = strata.find(
                (s) => s.name === stratumAssignment.stratum_code
              );

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
          console.log("📊 Borehole-Strata data to submit:", boreholeStrataData);
          createBoreholeStrata.mutate(boreholeStrataData);
        } else {
          console.warn("⚠️ No borehole-strata data to submit!");
        }
      },
    });
  };

  return {
    submitBoreholes,
    isSubmitting: createBoreholes.isPending || createBoreholeStrata.isPending,
    isEditMode,
    submitLabel: isEditMode ? "Actualizar" : "Guardar",
    error: createBoreholes.error || createBoreholeStrata.error,
    createdBoreholes,
  };
}
