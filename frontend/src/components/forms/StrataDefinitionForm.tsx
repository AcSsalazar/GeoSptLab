"use client";

import React, { useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, Info, Layers } from "lucide-react";
import type { Project, StratumCreate } from "../../types/project";
import { BehaviorType } from "../../types/project";
import styles from "@/styles/StrataDefinitionForm.module.css";

// Zod schema for individual stratum definition
const stratumDefinitionSchema = z
  .object({
    stratum_code: z
      .string()
      .min(1, "Código requerido")
      .max(10, "Código muy largo"),
    name: z.string().min(1, "Nombre requerido").max(100, "Nombre muy largo"),
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
        return data.plasticity_index !== undefined && data.plasticity_index !== null;
      }
      // For granular soils, plasticity_index should be undefined or null
      return true;
    },
    {
      message: "El índice de plasticidad es requerido para suelos cohesivos",
      path: ["plasticity_index"],
    }
  );

const strataDefinitionFormSchema = z
  .object({
    strata: z
      .array(stratumDefinitionSchema)
      .min(1, "Al menos un tipo de estrato requerido"),
  })
  .refine(
    (data) => {
      const codes = data.strata.map((s) => s.stratum_code);
      return codes.length === new Set(codes).size;
    },
    {
      message: "Los códigos de estratos deben ser únicos",
      path: ["strata"],
    }
  );

type StrataDefinitionFormData = z.infer<typeof strataDefinitionFormSchema>;

interface StrataDefinitionFormProps {
  projectData: Project;
  onValidData: (data: StratumCreate[], isValid: boolean) => void;
}

const StrataDefinitionForm: React.FC<StrataDefinitionFormProps> = ({
  projectData,
  onValidData,
}) => {
  const {
    control,
    register,
    watch,
    setValue,
    formState: { errors, isValid },
    getValues,
  } = useForm<StrataDefinitionFormData>({
    resolver: zodResolver(strataDefinitionFormSchema),
    defaultValues: {
      // Initialize with the number of strata types defined in project
      strata: Array.from(
        { length: projectData.number_of_strata },
        (_, index) => ({
          stratum_code: `E${index + 1}`,
          name: `E${index + 1}`,
          description: `Tipo de suelo ${index + 1}`,
          gamma_humid: 10.0,
          gamma_saturated: 10.0,
          behavior_type: BehaviorType.GRANULAR,
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

  // Watch all form values and notify parent
  useEffect(() => {
    const subscription = watch(() => {
      const formData = getValues();
      const strataCreateData: StratumCreate[] = formData.strata.map(
        (stratum, index) => ({
          project_id: projectData.id,
          stratum_code: index + 1,
          name: stratum.name,
          description: stratum.description,
          gamma_humid: stratum.gamma_humid,
          gamma_saturated: stratum.gamma_saturated,
          behavior_type: stratum.behavior_type,
          // Only include plasticity_index for cohesive soils
          plasticity_index: stratum.behavior_type === BehaviorType.COHESIVE ? stratum.plasticity_index : undefined,
        })
      );
      
      // Enhanced validation reporting
      console.log('Strata Form Validation Details:', {
        isValid,
        errors: Object.keys(errors).length > 0 ? errors : 'No errors',
        formData: formData.strata.map((s, i) => ({
          index: i,
          code: s.stratum_code,
          behavior: s.behavior_type,
          hasPlasticityIndex: s.plasticity_index !== undefined,
          plasticityValue: s.plasticity_index
        }))
      });
      
      onValidData(strataCreateData, isValid);
    });
    return () => subscription.unsubscribe();
  }, [watch, getValues, onValidData, isValid, projectData.id, errors]);

  const addStratum = () => {
    append({
      stratum_code: `E${fields.length + 1}`,
      name: `E${fields.length + 1}`,
      description: `Tipo de suelo ${fields.length + 1}`,
      gamma_humid: 10.0,
      gamma_saturated: 10.0,
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
    <div className={styles.formContainer}>
      <div className={styles.formHeader}>
        <div className={styles.headerContent}>
          <div className={styles.titleSection}>
            <Layers className={styles.titleIcon} size={24} />
            <div>
              <h2 className={styles.formTitle}>
                Definición de Tipos de Estratos
              </h2>
              <p className={styles.formSubtitle}>
                Define los tipos de suelo que existen en el área del proyecto
              </p>
            </div>
          </div>
          <div className={styles.projectInfo}>
            <span className={styles.projectCode}>
              {projectData.project_code}
            </span>
            <span className={styles.projectName}>
              {projectData.project_name}
            </span>
          </div>
        </div>
      </div>

      <div className={styles.infoCard}>
        <Info size={16} className={styles.infoIcon} />
        <div className={styles.infoContent}>
          <strong>¿Qué estamos definiendo aquí?</strong>
          <p>
            Estos son los <strong>tipos de suelo</strong> que pueden aparecer en
            cualquiera de las perforaciones del proyecto. En el siguiente paso,
            asignarás qué tipos aparecen y a qué profundidades en cada
            perforación específica.
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
                    Código del Estrato{" "}
                    <span className={styles.required}>*</span>
                  </label>
                  <input
                    {...register(`strata.${index}.stratum_code`)}
                    className={`${styles.input} ${
                      errors.strata?.[index]?.stratum_code
                        ? styles.inputError
                        : ""
                    }`}
                    placeholder="E1, E2, etc."
                  />
                  {errors.strata?.[index]?.stratum_code && (
                    <span className={styles.errorText}>
                      {errors.strata[index]?.stratum_code?.message}
                    </span>
                  )}
                </div>

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
              </div>

              <div className={styles.formRow}>
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
                    placeholder="Ej: Arcilla limosa café, Arena fina a media, etc."
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
                      setValue(`strata.${index}.behavior_type`, newBehaviorType);
                      
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
                      step="0.1"
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
                    step="0.1"
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
                    step="0.1"
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
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.addStratumSection}>
        <button
          type="button"
          onClick={addStratum}
          className={styles.addStratumButton}
        >
          <Plus size={16} />
          Agregar Otro Tipo de Estrato
        </button>
        <span className={styles.addInfo}>
          Puedes agregar más tipos si en tu proyecto existen más variedades de
          suelo
        </span>
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
    </div>
  );
};

export default StrataDefinitionForm;
