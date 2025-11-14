"use client";

import React, { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Plus,
  Trash2,
  Loader2,
  OctagonAlert,
  Save,
  Target,
} from "lucide-react";
import { useAppStore } from "@/store/appStore";
import { useSPTIntervalsWorkflow } from "@/features/intervals/hooks/useSPTIntervalsHooks";
import styles from "@/styles//forms/SPTIntervalsForm.module.css";
import common from "@/styles/ui/Common.module.css";
import Alerts from "@/components/layout/Alerts";

const sptIntervalSchema = z
  .object({
    borehole_stratum_id: z
      .number()
      .int()
      .positive("Debe seleccionar un estrato"),
    depth_from: z.number("Campo Obligatoirio").min(0, "Profundidad >= 0"),
    
    depth_to: z.number("Campo Obligatoirio").min(0, "Profundidad >= 0"),
    nspt_field: z
      .number()
      .int()
      .positive()
      .min(2, "N >= 0")
      .max(200, "N máx 200"),
    description: z.string().optional(),
    
  })
  

  

  
  .refine((data) => data.depth_to > data.depth_from, {
    message: "Profundidad final debe ser mayor que inicial",
    path: ["depth_to"],
  });

const boreholeWithIntervalsSchema = z.object({
  borehole_id: z.number().int().positive(),
  borehole_name: z.string(),
  intervals: z
    .array(sptIntervalSchema)
    .min(1, "Debe agregar al menos un ensayo SPT"),
});

// Base schema without validation - will add .superRefine() inside component
const baseSptIntervalsFormSchema = z.object({
  boreholes: z.array(boreholeWithIntervalsSchema),
});

type SPTIntervalsFormData = z.infer<typeof baseSptIntervalsFormSchema>;

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
  const setBoreholeStrata = useAppStore((state) => state.setBoreholeStrata);
  
  // .superRefine() with access to boreholeStrata
  const sptIntervalsFormSchema = baseSptIntervalsFormSchema.superRefine((data, ctx) => {
    // Validate: depth_from y depth_to must be within stratum bounds
    data.boreholes.forEach((borehole, boreholeIndex) => {
      borehole.intervals.forEach((interval, intervalIndex) => {
        // Find the stratum for this interval
        const stratum = boreholeStrata.find(
          (bs) => bs.id === interval.borehole_stratum_id
        );
        
        if (stratum) {
          if (
            interval.depth_from < stratum.initial_depth ||
            interval.depth_to > stratum.final_depth
          ) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `El intervalo debe estar dentro de los límites del estrato (${stratum.initial_depth}m - ${stratum.final_depth}m)`,
              path: ["boreholes", boreholeIndex, "intervals", intervalIndex, "depth_from"],
            });
          }
        }
      });
    });
  });
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

  const buildFormDataFromSavedIntervals = (): SPTIntervalsFormData => {
    return {
      boreholes: boreholes.map((borehole) => {
        const intervalsForBorehole = existingIntervals
          .filter((interval) => interval.borehole_id === borehole.id)
          .filter((interval) => {
            // VALIDACIÓN: Solo incluir intervalos con borehole_stratum_id válido
            const isValid = boreholeStrata.some(
              (bs) => bs.id === interval.borehole_stratum_id && bs.borehole_id === borehole.id
            );
            if (!isValid) {
              console.warn(
                `⚠️ Skipping interval with invalid stratum ${interval.borehole_stratum_id} for borehole ${borehole.id}`
              );
            }
            return isValid;
          })
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

  // Función para validar y limpiar draftIntervals
  const getValidatedDefaultValues = (): SPTIntervalsFormData => {
    const baseData = draftIntervals || buildFormDataFromSavedIntervals();
    
    // Limpiar intervalos con borehole_stratum_id inválidos
    return {
      boreholes: baseData.boreholes.map((borehole) => ({
        ...borehole,
        intervals: borehole.intervals.filter((interval) => {
          const isValid = boreholeStrata.some(
            (bs) => bs.id === interval.borehole_stratum_id && bs.borehole_id === borehole.borehole_id
          );
          if (!isValid) {
            console.warn(
              `⚠️ Removing draft interval with invalid stratum ${interval.borehole_stratum_id} for borehole ${borehole.borehole_id}`
            );
          }
          return isValid;
        }),
      })),
    };
  };

  // FORM SETUP
  const {
    control,
    register,
    watch,
    getValues,
    setValue,
    trigger,
    formState: { errors, isValid },
    handleSubmit,
  } = useForm<SPTIntervalsFormData>({
    resolver: zodResolver(sptIntervalsFormSchema),
    defaultValues: getValidatedDefaultValues(),
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

  // 🔄 CARGAR BOREHOLE STRATA SI ESTÁ VACÍO
  useEffect(() => {
    const loadBoreholeStrata = async () => {
      // Solo cargar si boreholeStrata está vacío pero tenemos boreholes
      if (boreholeStrata.length === 0 && boreholes.length > 0) {
        console.log("📥 Loading boreholeStrata for intervals form...");
        try {
          const { boreholeStrataService } = await import('@/features/boreholes/services/boreholeStrataService');
          const boreholeIds = boreholes.map(b => b.id);
          const strata = await boreholeStrataService.getByBoreholes(boreholeIds);
          setBoreholeStrata(strata);
          console.log(`✅ Loaded ${strata.length} boreholeStrata`);
        } catch (error) {
          console.error("❌ Error loading boreholeStrata:", error);
        }
      }
    };

    loadBoreholeStrata();
  }, [boreholes, boreholeStrata.length, setBoreholeStrata]);

  // TAB MANAGEMENT
  const handleTabChange = (newTab: number) => {
    saveDraft(); // Save current tab data
    setCurrentTab(newTab);
    setDraftIntervalsTab(newTab);
  };

  // CAMBIO 3: Función que acepta boreholeId para calcular estratos por perforación específica
  // Antes usaba currentTab (índice) lo que causaba que todos los tabs recibieran los mismos datos
  const getBoreholeStratumOptions = (
    boreholeId: number
  ): BoreholeStratumInfo[] => {
    return boreholeStrata
      .filter((bs) => bs.borehole_id === boreholeId)
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

  // FORM SUBMIT
  const onSubmit = (data: SPTIntervalsFormData) => {
    if (!project?.id) {
      console.error("No project ID available");
      return;
    }

    console.log("Submitting form data:", data);

    // Transform nested structure to flat array for API
    // VALIDACIÓN: Verificar que cada borehole_stratum_id pertenece al borehole correcto
    const flatIntervals = data.boreholes.flatMap((borehole) =>
      borehole.intervals.map((interval) => {
        // Verificar que el stratum pertenece al borehole
        const stratumBelongsToBorehole = boreholeStrata.some(
          (bs) => bs.id === interval.borehole_stratum_id && bs.borehole_id === borehole.borehole_id
        );

        if (!stratumBelongsToBorehole) {
          console.error(
            `❌ ERROR: Stratum ${interval.borehole_stratum_id} no pertenece a borehole ${borehole.borehole_id}`,
            {
              interval,
              borehole,
              availableStrata: boreholeStrata.filter(bs => bs.borehole_id === borehole.borehole_id)
            }
          );
        }

        return {
          ...interval,
          borehole_id: borehole.borehole_id,
        };
      })
    );

    // Filtrar solo los intervalos válidos
    const validIntervals = flatIntervals.filter((interval) => {
      const isValid = boreholeStrata.some(
        (bs) => bs.id === interval.borehole_stratum_id && bs.borehole_id === interval.borehole_id
      );
      if (!isValid) {
        console.warn(`⚠️ Skipping invalid interval with stratum ${interval.borehole_stratum_id}`);
      }
      return isValid;
    });

    console.log("📤 Valid intervals for API:", validIntervals);
    
    if (validIntervals.length === 0) {
      console.error("❌ No hay intervalos válidos para enviar");
      return;
    }

    submit(validIntervals);
  };

  if (!project) {
    return (
      <div>
        <Alerts />
      </div>
    );
  }

  if (boreholes.length === 0) {
    return (
      <div className={common.placeholderContainer}>
        <OctagonAlert size={48} className={common.placeholderIcon} />
        <h3>No hay perforaciones configuradas</h3>
        <p>
          Debes configurar al menos una perforación antes de ingresar ensayos
          SPT.
        </p>
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
      <div className={common.tabContainer}>
        <div className={common.tabList}>
          {boreholes.map((borehole, index) => {
            const intervalsCount =
              watch(`boreholes.${index}.intervals`)?.length || 0;
            const hasError = errors.boreholes?.[index]?.intervals !== undefined;
            return (
              <button
                key={borehole.id}
                type="button"
                onClick={() => handleTabChange(index)}
                className={`${common.tab} ${
                  currentTab === index ? common.active : ""
                } ${hasError ? common.error : ""}`}
              >
                {borehole.borehole_name}
                {intervalsCount > 0 && (
                  <span className={common.tabDepth}>
                    {" "}
                    Intervalos: {intervalsCount}
                  </span>
                )}
                {hasError && <span className={common.errorIndicator}>⚠</span>}
              </button>
            );
          })}
        </div>
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
          setValue={setValue}
          trigger={trigger}
          errors={errors}
          boreholeStratumOptions={getBoreholeStratumOptions(borehole.id)}
        />
      ))}

      {/* Form Actions */}
      <div className={styles.formActions}>
        <button
          type="submit"
          disabled={!isValid || isSubmitting}
          className={`${common.submitButton} ${
            isSubmitting ? common.loading : ""
          } ${!isValid ? common.disabled : ""}`}
        >
          {isSubmitting ? (
            <>
              <Loader2 className={styles.spinner} size={16} />
              Guardando...
            </>
          ) : (
            <>
              <Save size={16} /> Guardar Ensayos SPT
            </>
          )}
        </button>
        {!isValid && (
          <p
            className={common.formHint}
            style={{ color: "var(--color-error)", marginTop: "0.5rem" }}
          >
            Debe agregar al menos un ensayo SPT válido en cada perforación
          </p>
        )}
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
  setValue: ReturnType<typeof useForm<SPTIntervalsFormData>>["setValue"];
  trigger: ReturnType<typeof useForm<SPTIntervalsFormData>>["trigger"];
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
  trigger,
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
    // CAMBIO 4: nspt_field cambiado de 0 a 10 (valor válido según schema min: 2)
    // CAMBIO 5: depth_to usa Math.min para no exceder final_depth del estrato
    append({
      borehole_stratum_id: firstStratum.id,
      depth_from: midpoint,
      depth_to: Math.min(midpoint + 1.45, firstStratum.final_depth),
      nspt_field: 10,
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
            Agregar Intervalo
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

                  {/* Warning if stratum info available */}
                  {stratumInfo && (
                    <div style={{
                      padding: '0.75rem',
                      backgroundColor: '#e3f2fd',
                      borderLeft: '3px solid #2196f3',
                      marginBottom: '1rem',
                      fontSize: '0.9em',
                      color: '#1565c0'
                    }}>
                      ℹ️ Este intervalo debe estar entre <strong>{stratumInfo.initial_depth}m</strong> y <strong>{stratumInfo.final_depth}m</strong>
                    </div>
                  )}

                  <div className={styles.intervalForm}>
                    {/* Stratum Selection */}
                    <div className={styles.formGroup}>
                      <label>Estrato</label>
                      <select
                        {...register(
                          `boreholes.${boreholeIndex}.intervals.${index}.borehole_stratum_id`,
                          { 
                            valueAsNumber: true,
                            onChange: () => {
                              // Revalidar cuando cambie el estrato
                              trigger(`boreholes.${boreholeIndex}.intervals.${index}`);
                            }
                          }
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
                        <label>
                          Prof. Inicial (m)
                          {stratumInfo && (
                            <span style={{ fontSize: '0.85em', color: '#666', marginLeft: '0.5rem' }}>
                              (Rango: {stratumInfo.initial_depth} - {stratumInfo.final_depth}m)
                            </span>
                          )}
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          {...register(
                            `boreholes.${boreholeIndex}.intervals.${index}.depth_from`,
                            { 
                              valueAsNumber: true,
                              onChange: () => {
                                // Revalidar este intervalo específico
                                trigger(`boreholes.${boreholeIndex}.intervals.${index}`);
                              }
                            }
                          )}
                          className={`${styles.input} ${
                            errors.boreholes?.[boreholeIndex]?.intervals?.[index]?.depth_from
                              ? styles.inputError
                              : ''
                          }`}
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
                        <label>
                          Prof. Final (m)
                          {stratumInfo && (
                            <span style={{ fontSize: '0.85em', color: '#666', marginLeft: '0.5rem' }}>
                              (Rango: {stratumInfo.initial_depth} - {stratumInfo.final_depth}m)
                            </span>
                          )}
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          {...register(
                            `boreholes.${boreholeIndex}.intervals.${index}.depth_to`,
                            { 
                              valueAsNumber: true,
                              onChange: () => {
                                // Revalidar este intervalo específico
                                trigger(`boreholes.${boreholeIndex}.intervals.${index}`);
                              }
                            }
                          )}
                          className={`${styles.input} ${
                            errors.boreholes?.[boreholeIndex]?.intervals?.[index]?.depth_to
                              ? styles.inputError
                              : ''
                          }`}
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
                        step="any"
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
