"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Settings } from "lucide-react";
import { useProjectWorkflow } from "@/features/project/hooks/useProjectHooks";
import { useAppStore } from "@/store/appStore";
import type { ProjectCreate } from "../../types/project";
import { FormulationType } from "../../types/project";
import styles from "@/styles/ProjectSetupForm.module.css";

// Esquema de validacion usando Zod para los campos del formulario base.
const projectSchema = z.object({
  project_name: z
    .string()
    .min(1, "Nombre del proyecto es necesario")
    .max(100, "Nombre del proyecto es muy largo"),
  number_of_boreholes: z.coerce
    .number()
    .min(1, "Es necesario minimo una perforación")
    .max(30, "Máximo 30 perforaciones"),
  number_of_strata: z.coerce
    .number()
    .min(1, "Es necesario minimo un estrato")
    .max(7, "Máximo 7 estratos"),
  formulation: z.enum(FormulationType),
});

// Tipo explícito para el formulario (después de coerce)
type ProjectFormData = {
  project_name: string;
  number_of_boreholes: number;
  number_of_strata: number;
  formulation: "kishida" | "jrb";
};

const ProjectSetupForm: React.FC = () => {
  // === ARQUITECTURA ZUSTAND ===
  const { submit, isLoading, isEditMode } = useProjectWorkflow();
  const project = useAppStore((state) => state.project);

  const {
    register,
    formState: { errors, isValid },
    handleSubmit,
  } = useForm<ProjectFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(projectSchema) as any,
    defaultValues: project || {
      project_name: "",
      number_of_boreholes: 1,
      number_of_strata: 1,
      formulation: FormulationType.KISHIDA,
    },
    mode: "onChange",
  });

  // Handler para submit del form
  const onSubmit = handleSubmit((data) => {
    submit(data as unknown as ProjectCreate);
    // Navigation happens automatically in useCreateProject hook
  });

  return (
    <form onSubmit={onSubmit} className={styles.formContainer}>
      <div style={{display: "flex", gap: "12px"}}>
        <Settings className={styles.titleIcon} size={20} />
        <div>
          <h2 className={styles.formTitle}>
            {isEditMode
              ? "1. Editar Configuración del Proyecto"
              : "1. Configuración del Proyecto"}
          </h2>
        </div>
      </div>
      <div className={`${styles.gridContainer} ${styles.gridTwoColumns}`}>
        <div className={styles.inputGroup}>
          <label className={styles.inputLabel}>
            Nombre del Proyecto <span className={styles.required}>*</span>
          </label>
          <input
            className={`${styles.inputField} ${
              errors.project_name ? styles.inputError : ""
            }`}
            {...register("project_name")}
            placeholder="Ej., Edificio Residencial Aurora"
          />
          {errors.project_name && (
            <div className={styles.errorMessage}>
              {errors.project_name.message}
            </div>
          )}
        </div>

        <div className={styles.inputGroup}>
          <label className={styles.inputLabel}>
            Formulación de Cálculo <span className={styles.required}>*</span>
          </label>
          <select
            className={`${styles.selectField} ${
              errors.formulation ? styles.inputError : ""
            }`}
            {...register("formulation")}
          >
            <option value={FormulationType.KISHIDA}>Kishida</option>
            <option value={FormulationType.JRB}>JRB</option>
          </select>
          {errors.formulation && (
            <div className={styles.errorMessage}>
              {errors.formulation.message}
            </div>
          )}
        </div>
      </div>

      <div className={`${styles.gridContainer} ${styles.gridTwoColumns}`}>
        <div className={styles.inputGroup}>
          <label className={styles.inputLabel}>
            Número de Perforaciones <span className={styles.required}>*</span>
          </label>
          <input
            type="number"
            className={`${styles.inputField} ${
              errors.number_of_boreholes ? styles.inputError : ""
            }`}
            {...register("number_of_boreholes", { valueAsNumber: true })}
            min="1"
            max="30"
            placeholder="Ej. 2"
          />
          {errors.number_of_boreholes && (
            <div className={styles.errorMessage}>
              {errors.number_of_boreholes.message}
            </div>
          )}
        </div>

        <div className={styles.inputGroup}>
          <label className={styles.inputLabel}>
            Número de Estratos <span className={styles.required}>*</span>
          </label>
          <input
            type="number"
            className={`${styles.inputField} ${
              errors.number_of_strata ? styles.inputError : ""
            }`}
            {...register("number_of_strata", { valueAsNumber: true })}
            min="1"
            max="7"
            placeholder="Ej. 2"
          />
          {errors.number_of_strata && (
            <div className={styles.errorMessage}>
              {errors.number_of_strata.message}
            </div>
          )}
        </div>
      </div>

      {/* Botón de Submit */}
      <div className={styles.inputGroup}>
        <button
          type="submit"
          disabled={isLoading || !isValid}
          className={styles.submitButton}
          style={{
            padding: "8px 20px",
            backgroundColor: isLoading || !isValid ? "#ccc" : "#144381ff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: isLoading || !isValid ? "not-allowed" : "pointer",
            fontSize: "16px",
            fontWeight: 500,
            
          }}
        >
          {isLoading
            ? "Guardando..."
            : isEditMode
            ? "Actualizar Proyecto"
            : "Crear Proyecto"}
        </button>
      </div>
    </form>
  );
};

export default ProjectSetupForm;
