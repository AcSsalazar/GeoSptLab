"use client";

import React from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, Info, Layers } from "lucide-react";
import { useAppStore } from "@/store/appStore";
import { useStrataWorkflow } from "@/features/strata/hooks/useStrataHooks";
import type { StratumCreate } from "@/types/project";
import { BehaviorType } from "@/types/project";
import styles from "@/styles/forms/StrataDefinitionForm.module.css";
import common from "@/styles/ui/Common.module.css";
import Alerts from "@/components/layout/Alerts";

// Zod schema for individual stratum definition
const stratumDefinitionSchema = z
  .object({
    stratum_code: z.string(),

    name: z.string("Nombre requerido").min(1,"Nombre requerido").max(100, "Nombre muy largo"),
    description: z
      .string()
      .min(1, "Descripción requerida")
      .max(500, "Descripción muy larga"),
    gamma_humid: z
      .number()
      .min(10, "γ húmedo >= 10 kN/m³")
      .max(40, "γ húmedo <= 40 kN/m³"),
    gamma_saturated: z
      .number()
      .min(10, "γ saturado >= 10 kN/m³")
      .max(40, "γ saturado <= 40 kN/m³"),
    behavior_type: z.enum(BehaviorType),
    plasticity_index: z
      .number()
      .min(0, "IP >= 0%")
      .max(100, "IP <= 100%")
      .optional(),
  })
  .refine((data) => data.gamma_saturated >= data.gamma_humid, {
    message: "Peso unitario saturado debe ser mayor o igual al húmedo",
    path: ["gamma_saturated"],
  })
  .refine(
    (data) => {
      // Plasticity index required for cohesive soils only
      if (data.behavior_type === BehaviorType.COHESIVE) {
        return (
          data.plasticity_index !== undefined && data.plasticity_index !== null
        );
      }
      // For granular soils, plasticity_index should be undefined or null
      return true;
    },
    {
      message: "El índice de plasticidad es requerido para suelos cohesivos",
      path: ["plasticity_index"],
    }
  );

const strataDefinitionFormSchema = z.object({
  strata: z
    .array(stratumDefinitionSchema)
    .min(1, "Al menos un tipo de estrato requerido"),
});

type StrataDefinitionFormData = z.infer<typeof strataDefinitionFormSchema>;

const StrataDefinitionForm: React.FC = () => {
  // === ARQUITECTURA ZUSTAND + REACT QUERY ===
  const project = useAppStore((state) => state.project);
  const strata = useAppStore((state) => state.strata);
  const { submit, isLoading, submitLabel } = useStrataWorkflow();
  const {
    control,
    register,
    watch,
    setValue,
    formState: { errors, isValid },
    handleSubmit,
  } = useForm<StrataDefinitionFormData>({
    resolver: zodResolver(strataDefinitionFormSchema),
    defaultValues:
      strata.length > 0
        ? {
            strata: strata.map((s) => ({
              stratum_code: s.stratum_code, // Use existing data
              name: s.name,
              description: s.description,
              gamma_humid: s.gamma_humid,
              gamma_saturated: s.gamma_saturated,
              behavior_type: s.behavior_type,
              plasticity_index: s.plasticity_index,
            })),
          }
        : {
            // Initialize empty fields for the number of strata defined in project
            strata: Array.from(
              { length: project?.number_of_strata || 1 },
              () => ({
                stratum_code: "", // Empty instead of `E${index + 1}`
                name: "", // Empty instead of `E${index + 1}`
                description: "", // Empty instead of `Tipo de suelo ${index + 1}`
                gamma_humid: undefined, // undefined instead of 10.0
                gamma_saturated: undefined, // undefined instead of 10.0
                behavior_type: BehaviorType.GRANULAR, // Keep default for dropdown
                plasticity_index: undefined,
              })
            ),
          },
    mode: "onChange",
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "strata",
  });

  if (!project) {
    return (
      <div>
        <Alerts />
      </div>
    );
  }

  // === SUBMIT HANDLER (REACT QUERY) ===
  const onSubmit = handleSubmit(
    (formData) => {
      console.log("Form is valid, submitting...", formData);
      const strataCreateData: StratumCreate[] = formData.strata.map(
        (stratum, index) => ({
          project_id: project.id,
          stratum_code: `E${index + 1}`,
          name: stratum.name,
          description: stratum.description,
          gamma_humid: stratum.gamma_humid,
          gamma_saturated: stratum.gamma_saturated,
          behavior_type: stratum.behavior_type,
          plasticity_index:
            stratum.behavior_type === BehaviorType.COHESIVE
              ? stratum.plasticity_index
              : undefined,
        })
      );

      //  REACT QUERY - POST al backend
      submit(strataCreateData);
      // Navigation automática en onSuccess del hook
    },
    (errors) => {
      console.error("Form validation failed:", errors);
      // Show which fields have errors
      Object.keys(errors).forEach((key) => {
        console.error(
          `Field "${key}" error:`,
          errors[key as keyof typeof errors]
        );
      });
    }
  );

  const addStratum = () => {
    append({
      stratum_code: "", // Empty to match defaultValues
      name: "",
      description: "",
      gamma_humid: undefined as unknown as number, // Type assertion for undefined
      gamma_saturated: undefined as unknown as number,
      behavior_type: BehaviorType.GRANULAR,
      plasticity_index: undefined,
    });
  };

  const removeStratum = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  return (
    <form onSubmit={onSubmit} className={common.formContainer}>
      <div className={common.formHeader}>
        <div className={common.headerContent}>
          <div className={common.titleSection}>
            <Layers className={common.titleIcon} size={24} />
            <div>
              <h2 className={common.formTitle}>
                Definición de Tipos de Estratos
              </h2>
            </div>
          </div>
          <div className={common.projectInfo}>
            <span className={common.projectCode}>{project.project_code}</span>
            <span className={common.projectName}>{project.project_name}</span>
          </div>
        </div>
      </div>

      <div className={styles.infoCard}>
        <Info size={16} className={styles.infoIcon} />
        <div className={styles.infoContent}>
          <strong>¿Qué estamos definiendo aquí?</strong>
          <p>
            Estos son los <b>tipos de suelo</b> que pueden aparecer en
            cualquiera de las perforaciones del proyecto.
          </p>
        </div>
      </div>

      <div className={styles.strataList}>
        {fields.map((field, index) => (
          <div key={field.id} className={styles.stratumCard}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitle}>
                <span className={styles.stratumNumber}>#{index + 1}</span>
                <span className={styles.stratumCode}>
                  {watch(`strata.${index}.stratum_code`) || `E${index + 1}`}
                </span>
              </div>
              {fields.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeStratum(index)}
                  className={styles.removeButton}
                  title="Eliminar tipo de estrato"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>

            <div className={styles.cardContent}>
              <div className={styles.formRow}>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>
                    Nombre del Estrato{" "}
                    <span className={styles.required}>*</span>
                  </label>
                  <input
                    {...register(`strata.${index}.name`)}
                    className={`${styles.input} ${
                      errors.strata?.[index]?.name ? styles.inputError : ""
                    }`}
                    placeholder="E1, Arcilla, Arena, etc."
                  />
                  {errors.strata?.[index]?.name && (
                    <span className={styles.errorText}>
                      {errors.strata[index]?.name?.message}
                    </span>
                  )}
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.label}>
                    Descripción del Suelo{" "}
                    <span className={styles.required}>*</span>
                  </label>
                  <input
                    {...register(`strata.${index}.description`)}
                    className={`${styles.input} ${
                      errors.strata?.[index]?.description
                        ? styles.inputError
                        : ""
                    }`}
                    placeholder="Ej: Arcilla limosa, Arena fina a media, etc."
                  />
                  {errors.strata?.[index]?.description && (
                    <span className={styles.errorText}>
                      {errors.strata[index]?.description?.message}
                    </span>
                  )}
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.label}>
                    Tipo de Comportamiento{" "}
                    <span className={styles.required}>*</span>
                  </label>
                  <select
                    {...register(`strata.${index}.behavior_type`)}
                    className={`${styles.select} ${
                      errors.strata?.[index]?.behavior_type
                        ? styles.inputError
                        : ""
                    }`}
                    onChange={(e) => {
                      // Handle behavior type change
                      const newBehaviorType = e.target.value as BehaviorType;
                      setValue(
                        `strata.${index}.behavior_type`,
                        newBehaviorType
                      );

                      // Clear plasticity_index when switching to granular
                      if (newBehaviorType === BehaviorType.GRANULAR) {
                        setValue(`strata.${index}.plasticity_index`, undefined);
                      }
                    }}
                  >
                    <option value={BehaviorType.COHESIVE}>Cohesivo</option>
                    <option value={BehaviorType.GRANULAR}>Granular</option>
                  </select>
                  {errors.strata?.[index]?.behavior_type && (
                    <span className={styles.errorText}>
                      {errors.strata[index]?.behavior_type?.message}
                    </span>
                  )}
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>
                    γ húmedo (kN/m³) <span className={styles.required}>*</span>
                    <div title="Peso unitario del suelo húmedo">
                      <Info size={12} className={styles.tooltip} />
                    </div>
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="Ej. 17.5"
                    {...register(`strata.${index}.gamma_humid`, {
                      valueAsNumber: true,
                    })}
                    className={`${styles.input} ${
                      errors.strata?.[index]?.gamma_humid
                        ? styles.inputError
                        : ""
                    }`}
                  />
                  {errors.strata?.[index]?.gamma_humid && (
                    <span className={styles.errorText}>
                      {errors.strata[index]?.gamma_humid?.message}
                    </span>
                  )}
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.label}>
                    γ saturado (kN/m³){" "}
                    <span className={styles.required}>*</span>
                    <div title="Peso unitario del suelo saturado">
                      <Info size={12} className={styles.tooltip} />
                    </div>
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="Ej. 18.5"
                    {...register(`strata.${index}.gamma_saturated`, {
                      valueAsNumber: true,
                    })}
                    className={`${styles.input} ${
                      errors.strata?.[index]?.gamma_saturated
                        ? styles.inputError
                        : ""
                    }`}
                  />
                  {errors.strata?.[index]?.gamma_saturated && (
                    <span className={styles.errorText}>
                      {errors.strata[index]?.gamma_saturated?.message}
                    </span>
                  )}
                </div>

                {watch(`strata.${index}.behavior_type`) ===
                  BehaviorType.COHESIVE && (
                  <div className={styles.inputGroup}>
                    <label className={styles.label}>
                      Índice de Plasticidad (%){" "}
                      <span className={styles.required}>*</span>
                      <div title="Requerido para suelos cohesivos">
                        <Info size={12} className={styles.tooltip} />
                      </div>
                    </label>
                    <input
                      type="number"
                      step="any"
                      {...register(`strata.${index}.plasticity_index`, {
                        valueAsNumber: true,
                      })}
                      className={`${styles.input} ${
                        errors.strata?.[index]?.plasticity_index
                          ? styles.inputError
                          : ""
                      }`}
                      placeholder="15.0"
                    />
                    {errors.strata?.[index]?.plasticity_index && (
                      <span className={styles.errorText}>
                        {errors.strata[index]?.plasticity_index?.message}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Stratum Button */}
      <div className={styles.addStratumSection}>
        <button
          type="button"
          onClick={addStratum}
          className={styles.addStratumButton}
        >
          <Plus size={18} />
          Agregar Otro Tipo de Estrato
        </button>
        <button className={styles.skeletonButton}></button>
        <button className={styles.skeletonButton}></button>
      </div>
      {/* Summary Section */}
      <div className={styles.summarySection}>
        <h3 className={styles.summaryTitle}>
          <Layers size={18} />
          Resumen de Tipos de Estratos Definidos
        </h3>
        <div className={styles.summaryGrid}>
          {fields.map((field, index) => (
            <div key={field.id} className={styles.summaryCard}>
              <div className={styles.summaryHeader}>
                <span className={styles.summaryCode}>
                  {watch(`strata.${index}.name`)}
                </span>
                <span className={styles.summaryType}>
                  {watch(`strata.${index}.behavior_type`)}
                </span>
              </div>
              <p className={styles.summaryDescription}>
                {watch(`strata.${index}.description`)}
              </p>
              <div className={styles.summaryProps}>
                <span>γh: {watch(`strata.${index}.gamma_humid`)} kN/m³</span>
                <span>
                  γsat: {watch(`strata.${index}.gamma_saturated`)} kN/m³
                </span>
                {watch(`strata.${index}.plasticity_index`) && (
                  <span>IP: {watch(`strata.${index}.plasticity_index`)}%</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {errors.strata && typeof errors.strata.message === "string" && (
          <div className={styles.globalError}>{errors.strata.message}</div>
        )}
      </div>

      {/* Botón de Submit */}
      <div className={styles.submitSection}>
        <button
          type="submit"
          disabled={isLoading || !isValid}
          className={`${common.submitButton} ${
            isLoading ? common.loading : ""
          } `}
        >
          {isLoading
            ? "Guardando estratos..."
            : `${submitLabel} Estratos y Continuar`}
        </button>
      </div>
    </form>
  );
};

export default StrataDefinitionForm;
