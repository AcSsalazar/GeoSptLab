"use client"

import React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import type { ProjectCreate } from "../../types/project"
import { FormulationType } from "../../types/project"
import styles from "@/styles/ProjectSetupForm.module.css"

// Esquema de validacion usando Zod para los campor del formulario base.
const projectSchema = z.object({
  project_name: z.string().min(1, "Nombre del proyecto es necesario").max(100, "Nombre del proyecto es muy largo"),
  number_of_boreholes: z.number().min(1, "Es necesario minimo una perforación").max(30, "Máximo 30 perforaciones"),
  number_of_strata: z.number().min(1, "Es necesario minimo un estrato").max(7, "Máximo 7 estratos"),
  formulation: z.nativeEnum(FormulationType),
})

type ProjectFormData = z.infer<typeof projectSchema>

interface ProjectSetupFormProps {
  initialData?: Partial<ProjectCreate>
  onValidData: (data: ProjectFormData, isValid: boolean) => void
}

const ProjectSetupForm: React.FC<ProjectSetupFormProps> = ({ initialData, onValidData }) => {
  const {
    register,
    watch,
    formState: { errors, isValid },
    getValues,
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      project_name: initialData?.project_name || "",
      number_of_boreholes: initialData?.number_of_boreholes || undefined,
      number_of_strata: initialData?.number_of_strata || undefined,
      formulation: initialData?.formulation || FormulationType.KISHIDA,
    },
    mode: "onChange",
  })

  // Watch all form values and notify parent of changes
  React.useEffect(() => {
    const subscription = watch(() => {
      const formData = getValues()
      onValidData(formData, isValid)
      console.log("Form Data Changed:", formData)
    })
    return () => subscription.unsubscribe()
  }, [watch, getValues, onValidData, isValid])

  return (
    <div className={styles.formContainer}>
      <h2 className={styles.formTitle}>Configuración del Proyecto</h2>

      <div className={`${styles.gridContainer} ${styles.gridTwoColumns}`}>
        <div className={styles.inputGroup}>
          <label className={styles.inputLabel}>
            Nombre del Proyecto <span className={styles.required}>*</span>
          </label>
          <input
            className={`${styles.inputField} ${errors.project_name ? styles.inputError : ""}`}
            {...register("project_name")}
            placeholder="Ej., Edificio Residencial Aurora"
          />
          {errors.project_name && <div className={styles.errorMessage}>{errors.project_name.message}</div>}
        </div>

        <div className={styles.inputGroup}>
          <label className={styles.inputLabel}>
            Formulación de Cálculo <span className={styles.required}>*</span>
          </label>
          <select
            className={`${styles.selectField} ${errors.formulation ? styles.inputError : ""}`}
            {...register("formulation")}
          >
            <option value={FormulationType.KISHIDA}>Kishida</option>
            <option value={FormulationType.JRB}>JRB</option>
          </select>
          {errors.formulation && <div className={styles.errorMessage}>{errors.formulation.message}</div>}
        </div>
      </div>

      <div className={`${styles.gridContainer} ${styles.gridTwoColumns}`}>
        <div className={styles.inputGroup}>
          <label className={styles.inputLabel}>
            Número de Perforaciones <span className={styles.required}>*</span>
          </label>
          <input
            type="number"
            className={`${styles.inputField} ${errors.number_of_boreholes ? styles.inputError : ""}`}
            {...register("number_of_boreholes", { valueAsNumber: true })}
            min="1"
            max="30"
            placeholder="Ej. 2"
          />
          {errors.number_of_boreholes && (
            <div className={styles.errorMessage}>{errors.number_of_boreholes.message}</div>
          )}
        </div>

        <div className={styles.inputGroup}>
          <label className={styles.inputLabel}>
            Número de Estratos <span className={styles.required}>*</span>
          </label>
          <input
            type="number"
            className={`${styles.inputField} ${errors.number_of_strata ? styles.inputError : ""}`}
            {...register("number_of_strata", { valueAsNumber: true })}
            min="1"
            max="7"
            placeholder="Ej. 2"
          />
          {errors.number_of_strata && <div className={styles.errorMessage}>{errors.number_of_strata.message}</div>}
        </div>
      </div>



      {/* Project Summary Card */}
{/*       <div className={styles.projectSummary}>
        <h3 className={styles.summaryTitle}>Resumen del Proyecto</h3>
        <div className={styles.summaryContent}>
          <div className={styles.summaryItem}>
            <span className={styles.summaryValue}>{watch("project_name") || "Sin nombre"}</span>
            mediante formulación <span className={styles.summaryValue}>{watch("formulation")}</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryValue}>{watch("number_of_boreholes")}</span> perforaciones con
            <span className={styles.summaryValue}> {watch("number_of_strata")}</span> estratos totales
          </div>
        </div>
      </div> */}
    </div>
  )
}

export default ProjectSetupForm
