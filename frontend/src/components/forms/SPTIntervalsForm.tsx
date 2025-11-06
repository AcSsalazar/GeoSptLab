"use client";

import React, { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, Target,  Loader2, OctagonAlert } from "lucide-react";
import { useAppStore } from "@/store/appStore";
import { useSPTIntervalsWorkflow } from "@/features/spt/hooks/useSPTIntervalsHooks";
import styles from "@/styles/SPTIntervalsForm.module.css";
import common from "@/styles/ui/Common.module.css";

// ZOD SCHEMAS

const sptIntervalSchema = z
  .object({
    borehole_stratum_id: z
      .number()
      .int()
      .positive("Debe seleccionar un estrato"),
    depth_from: z.number().min(0, "Profundidad >= 0"),
    depth_to: z.number().min(0, "Profundidad >= 0"),
    nspt_field: z.number().int().min(0, "N >= 0").max(200, "N máx 200"),
    description: z.string().optional(),
  })
  .refine((data) => data.depth_to > data.depth_from, {
    message: "Profundidad final debe ser mayor que inicial",
    path: ["depth_to"],
  });

const boreholeWithIntervalsSchema = z.object({
  borehole_id: z.number().int().positive(),
  borehole_name: z.string(),
  intervals: z.array(sptIntervalSchema),
});

const sptIntervalsFormSchema = z.object({
  boreholes: z.array(boreholeWithIntervalsSchema),
});

type SPTIntervalsFormData = z.infer<typeof sptIntervalsFormSchema>;

interface BoreholeStratumInfo {
  id: number;
  borehole_id: number;
  stratum_name: string;
  initial_depth: number;
  final_depth: number;
}

const SPTIntervalsForm: React.FC = () => {
  const project = useAppStore((state) => state.project);
  const boreholes = useAppStore((state) => state.boreholes);
  const boreholeStrata = useAppStore((state) => state.boreholeStrata);
  const strata = useAppStore((state) => state.strata);
  const existingIntervals = useAppStore((state) => state.intervals);
  const draftIntervals = useAppStore((state) => state.draftIntervals);
  const draftIntervalsTab = useAppStore((state) => state.draftIntervalsTab);
  const setDraftIntervals = useAppStore((state) => state.setDraftIntervals);
  const setDraftIntervalsTab = useAppStore(
    (state) => state.setDraftIntervalsTab
  );
  const { submit, isLoading: isSubmitting } = useSPTIntervalsWorkflow();
  const [currentTab, setCurrentTab] = useState(draftIntervalsTab);

  // HELPER FUNCTION: BUILD FORM DATA

  const buildFormDataFromSavedIntervals = (): SPTIntervalsFormData => {
    return {
      boreholes: boreholes.map((borehole) => {
        // Filtrar intervalos que pertenecen a esta perforación
        const intervalsForBorehole = existingIntervals
          .filter((interval) => interval.borehole_id === borehole.id)
          .map((interval) => ({
            borehole_stratum_id: interval.borehole_stratum_id,
            depth_from: interval.depth_from,
            depth_to: interval.depth_to,
            nspt_field: interval.nspt_field,
            description: "",
          }));

        return {
          borehole_id: borehole.id,
          borehole_name: borehole.borehole_name,
          intervals: intervalsForBorehole,
        };
      }),
    };
  };

  // FORM SETUP
  const {
    control,
    register,
    watch,
    getValues,
    formState: { errors, isValid },
    handleSubmit,
  } = useForm<SPTIntervalsFormData>({
    resolver: zodResolver(sptIntervalsFormSchema),
    defaultValues: draftIntervals || buildFormDataFromSavedIntervals(),
    mode: "onChange",
  });

  // SAVE DRAFT FUNCTIONS
  const saveDraft = React.useCallback(() => {
    const currentFormData = getValues();
    setDraftIntervals(currentFormData);
  }, [getValues, setDraftIntervals]);
  // Save before page unload/refresh (F5)
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveDraft();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [saveDraft]);

  // Save when unmounting component
  useEffect(() => {
    return () => {
      saveDraft();
    };
  }, [saveDraft]);

  // TAB MANAGEMENT

  const handleTabChange = (newTab: number) => {
    saveDraft(); // Save current tab data
    setCurrentTab(newTab);
    setDraftIntervalsTab(newTab);
  };
  // STRATUM OPTIONS FOR CURRENT TAB

  const getCurrentBoreholeStratumOptions = (): BoreholeStratumInfo[] => {
    const currentBorehole = boreholes[currentTab];
    if (!currentBorehole) return [];

    return boreholeStrata
      .filter((bs) => bs.borehole_id === currentBorehole.id)
      .map((bs) => {
        const stratum = strata.find((s) => s.id === bs.stratum_definition_id);
        return {
          id: bs.id,
          borehole_id: bs.borehole_id,
          stratum_name: stratum?.name || "Unknown",
          initial_depth: bs.initial_depth,
          final_depth: bs.final_depth,
        };
      })
      .sort((a, b) => a.initial_depth - b.initial_depth);
  };

  const boreholeStratumOptions = getCurrentBoreholeStratumOptions();

  // FORM SUBMIT
  const onSubmit = (data: SPTIntervalsFormData) => {
    if (!project?.id) {
      console.error("No project ID available");
      return;
    }

    console.log("📤 Submitting form data:", data);

    // Transform nested structure to flat array for API
    const flatIntervals = data.boreholes.flatMap((borehole) =>
      borehole.intervals.map((interval) => ({
        ...interval,
        borehole_id: borehole.borehole_id,
      }))
    );

    console.log("📤 Flat intervals for API:", flatIntervals);
    submit(flatIntervals);
  };

  if (!project) {
    return (
      <div className={common.placeholderContainer}>
        <OctagonAlert size={48} className={common.placeholderIcon} />
        <h3>No hay proyecto activo</h3>
        <p>Debes crear un proyecto primero.</p>
      </div>
    );
  }

  if (boreholes.length === 0) {
    return (
      <div className={common.placeholderContainer}>
        <Target size={48} className={common.placeholderIcon} />
        <h3>No hay perforaciones configuradas</h3>
        <p>
          Debes configurar al menos una perforación antes de ingresar ensayos
          SPT.
        </p>
      </div>
    );
  }

  if (boreholeStrata.length === 0) {
    return (
      <div className={common.placeholderContainer}>
        <OctagonAlert size={48} className={common.placeholderIcon} />
        <h3>No hay asignación de estratos</h3>
        <p>Debes asignar estratos a las perforaciones primero.</p>
      </div>
    );
  }

  return (
    /* Form Header */

    <form onSubmit={handleSubmit(onSubmit)} className={common.formContainer}>
      <div className={common.formHeader}>
        <div className={common.headerContent}>
          <div className={common.titleSection}>
            <Target className={common.titleIcon} size={24} />
            <div>
              <h2 className={common.formTitle}>Ensayos SPT</h2>
              <p className={common.formSubtitle}>
                Ingrese los valores de N campo (golpes/30cm) para cada intervalo
                ensayado
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabsContainer}>
        {boreholes.map((borehole, index) => {
          const intervalsCount =
            watch(`boreholes.${index}.intervals`)?.length || 0;
          return (
            <button
              key={borehole.id}
              type="button"
              onClick={() => handleTabChange(index)}
              className={`${styles.tab} ${
                currentTab === index ? styles.activeTab : ""
              }`}
            >
              {borehole.borehole_name}
              {intervalsCount > 0 && (
                <span className={styles.tabBadge}>{intervalsCount}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {boreholes.map((borehole, boreholeIndex) => (
        <TabContent
          key={borehole.id}
          boreholeIndex={boreholeIndex}
          borehole={borehole}
          isActive={currentTab === boreholeIndex}
          control={control}
          register={register}
          watch={watch}
          errors={errors}
          boreholeStratumOptions={boreholeStratumOptions}
        />
      ))}

      {/* Form Actions */}
      <div className={styles.formActions}>
        <button
          type="submit"
          disabled={!isValid || isSubmitting}
          className={`${common.submitButton} ${isSubmitting ? common.loading : ''}`}
        >
          {isSubmitting ? (
            <>
              <Loader2 className={styles.spinner} size={16} />
              Guardando...
            </>
          ) : (
            <>
              <Target size={16} />
              Guardar Ensayos SPT
            </>
          )}
        </button>
      </div>
    </form>
  );
};

// TAB CONTENT COMPONENT
interface TabContentProps {
  boreholeIndex: number;
  borehole: {
    id: number;
    borehole_name: string;
  };
  isActive: boolean;
  control: ReturnType<typeof useForm<SPTIntervalsFormData>>["control"];
  register: ReturnType<typeof useForm<SPTIntervalsFormData>>["register"];
  watch: ReturnType<typeof useForm<SPTIntervalsFormData>>["watch"];
  errors: ReturnType<
    typeof useForm<SPTIntervalsFormData>
  >["formState"]["errors"];
  boreholeStratumOptions: BoreholeStratumInfo[];
}

const TabContent: React.FC<TabContentProps> = ({
  boreholeIndex,
  borehole,
  isActive,
  control,
  register,
  watch,
  errors,
  boreholeStratumOptions,
}) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `boreholes.${boreholeIndex}.intervals`,
  });

  const addInterval = () => {
    if (boreholeStratumOptions.length === 0) return;

    const firstStratum = boreholeStratumOptions[0];
    const midpoint =
      (firstStratum.initial_depth + firstStratum.final_depth) / 2;

    append({
      borehole_stratum_id: firstStratum.id,
      depth_from: midpoint,
      depth_to: midpoint + 1.45,
      nspt_field: 0,
      description: "",
    });
  };

  const getStratumInfo = (
    boreholeStratumId: number
  ): BoreholeStratumInfo | undefined => {
    return boreholeStratumOptions.find((bs) => bs.id === boreholeStratumId);
  };

  if (!isActive) {
    return <div className={styles.hiddenTab} />;
  }

  return (
    <div className={`${styles.activeTabContent} ${styles.fadeIn}`}>
      {/* Stratum Reference Table */}
      {boreholeStratumOptions.length > 0 && (
        <div className={styles.stratumReference}>
          <h4>Estratos en {borehole.borehole_name}:</h4>
          <table className={styles.referenceTable}>
            <thead>
              <tr>
                <th>Estrato</th>
                <th>Prof. Inicial (m)</th>
                <th>Prof. Final (m)</th>
              </tr>
            </thead>
            <tbody>
              {boreholeStratumOptions.map((bs) => (
                <tr key={bs.id}>
                  <td>{bs.stratum_name}</td>
                  <td>{bs.initial_depth}</td>
                  <td>{bs.final_depth}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Intervals Section */}
      <div className={styles.intervalsSection}>
        <div className={styles.sectionHeader}>
          <h3>Ensayos SPT</h3>
          <button
            type="button"
            onClick={addInterval}
            className={styles.addButton}
            disabled={boreholeStratumOptions.length === 0}
          >
            <Plus size={16} />
            Agregar Ensayo
          </button>
        </div>

        {fields.length === 0 ? (
          <div className={styles.emptyState}>
            <Target size={32} />
            <p>No hay ensayos SPT agregados</p>
            <p className={styles.hint}>
              Haz clic en "Agregar Ensayo" para comenzar
            </p>
          </div>
        ) : (
          <div className={styles.intervalsList}>
            {fields.map((field, index) => {
              const stratumInfo = getStratumInfo(
                watch(
                  `boreholes.${boreholeIndex}.intervals.${index}.borehole_stratum_id`
                )
              );

              return (
                <div key={field.id} className={styles.intervalCard}>
                  <div className={styles.intervalHeader}>
                    <h4>Ensayo #{index + 1}</h4>
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className={styles.removeButton}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className={styles.intervalForm}>
                    {/* Stratum Selection */}
                    <div className={styles.formGroup}>
                      <label>Estrato</label>
                      <select
                        {...register(
                          `boreholes.${boreholeIndex}.intervals.${index}.borehole_stratum_id`,
                          { valueAsNumber: true }
                        )}
                        className={styles.input}
                      >
                        {boreholeStratumOptions.map((bs) => (
                          <option key={bs.id} value={bs.id}>
                            {bs.stratum_name} ({bs.initial_depth}-
                            {bs.final_depth}m)
                          </option>
                        ))}
                      </select>
                      {errors.boreholes?.[boreholeIndex]?.intervals?.[index]
                        ?.borehole_stratum_id && (
                        <span className={styles.error}>
                          {
                            errors.boreholes[boreholeIndex].intervals[index]
                              .borehole_stratum_id.message
                          }
                        </span>
                      )}
                    </div>

                    {/* Depth Range */}
                    <div className={styles.formRow}>
                      <div className={styles.formGroup}>
                        <label>Prof. Inicial (m)</label>
                        <input
                          type="number"
                          step="0.1"
                          {...register(
                            `boreholes.${boreholeIndex}.intervals.${index}.depth_from`,
                            { valueAsNumber: true }
                          )}
                          className={styles.input}
                          min={stratumInfo?.initial_depth}
                          max={stratumInfo?.final_depth}
                        />
                        {errors.boreholes?.[boreholeIndex]?.intervals?.[index]
                          ?.depth_from && (
                          <span className={styles.error}>
                            {
                              errors.boreholes[boreholeIndex].intervals[index]
                                .depth_from.message
                            }
                          </span>
                        )}
                      </div>

                      <div className={styles.formGroup}>
                        <label>Prof. Final (m)</label>
                        <input
                          type="number"
                          step="0.1"
                          {...register(
                            `boreholes.${boreholeIndex}.intervals.${index}.depth_to`,
                            { valueAsNumber: true }
                          )}
                          className={styles.input}
                          min={stratumInfo?.initial_depth}
                          max={stratumInfo?.final_depth}
                        />
                        {errors.boreholes?.[boreholeIndex]?.intervals?.[index]
                          ?.depth_to && (
                          <span className={styles.error}>
                            {
                              errors.boreholes[boreholeIndex].intervals[index]
                                .depth_to.message
                            }
                          </span>
                        )}
                      </div>
                    </div>

                    {/* N Field Value */}
                    <div className={styles.formGroup}>
                      <label>N Campo (golpes/30cm)</label>
                      <input
                        type="number"
                        {...register(
                          `boreholes.${boreholeIndex}.intervals.${index}.nspt_field`,
                          { valueAsNumber: true }
                        )}
                        className={styles.inputLarge}
                        min={0}
                        max={200}
                      />
                      {errors.boreholes?.[boreholeIndex]?.intervals?.[index]
                        ?.nspt_field && (
                        <span className={styles.error}>
                          {
                            errors.boreholes[boreholeIndex].intervals[index]
                              .nspt_field.message
                          }
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    <div className={styles.formGroup}>
                      <label>Descripción (opcional)</label>
                      <input
                        type="text"
                        {...register(
                          `boreholes.${boreholeIndex}.intervals.${index}.description`
                        )}
                        className={styles.input}
                        placeholder="Ej: Muestra M-1, profundidad 3.5m"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default SPTIntervalsForm;
