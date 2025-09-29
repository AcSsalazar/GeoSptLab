"use client"

import React, { useState, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Trash2, MapPin, Layers, Target } from 'lucide-react'
import type { Project, Stratum, BoreholeCreate } from '../../types/project'
import styles from '@/styles/BoreholesConfigurationForm.module.css'

// Schema for stratum assignment within a borehole
const stratumAssignmentSchema = z.object({
  stratum_code: z.string().min(1, "Selecciona un tipo de estrato"),
  depth_from: z.number().min(0, "Profundidad inicial >= 0"),
  depth_to: z.number().min(0, "Profundidad final >= 0")
}).refine(
  (data) => data.depth_to > data.depth_from,
  {
    message: "Profundidad final debe ser mayor que inicial",
    path: ["depth_to"],
  }
)

// Schema for individual borehole
const boreholeSchema = z.object({
  borehole_name: z.string().min(1, "Nombre requerido").max(20, "Nombre muy largo"),
  final_depth: z.number().min(1, "Profundidad > 0").max(100, "Profundidad máx 100m"),
  diameter_mm: z.number().min(50, "Diámetro mín 50mm").max(500, "Diámetro máx 500mm"),
  field_energy_percent: z.number().min(30, "Energía mín 30%").max(100, "Energía máx 100%"),
  rod_length: z.number().min(5, "Longitud mín 5m").max(50, "Longitud máx 50m"),
  water_table_depth: z.number().min(0, "Profundidad >= 0").optional().nullable(),
  strata_assignments: z.array(stratumAssignmentSchema).min(1, "Al menos un estrato requerido")
}).refine(
  (data) => {
    // Validate that strata assignments don't overlap and cover the full depth
    const assignments = data.strata_assignments.sort((a, b) => a.depth_from - b.depth_from)
    
    // Check for gaps or overlaps
    for (let i = 0; i < assignments.length - 1; i++) {
      if (assignments[i].depth_to !== assignments[i + 1].depth_from) {
        return false
      }
    }
    
    // Check that assignments start at 0 and end at final depth
    return assignments[0].depth_from === 0 && 
           assignments[assignments.length - 1].depth_to === data.final_depth
  },
  {
    message: "Los estratos deben cubrir toda la profundidad sin gaps ni overlaps",
    path: ["strata_assignments"],
  }
)

const boreholesConfigFormSchema = z.object({
  boreholes: z.array(boreholeSchema).min(1, "Al menos una perforación requerida")
}).refine(
  (data) => {
    // Check for unique borehole names
    const names = data.boreholes.map(b => b.borehole_name)
    return names.length === new Set(names).size
  },
  {
    message: "Los nombres de perforaciones deben ser únicos",
    path: ["boreholes"],
  }
)

type BoreholesConfigFormData = z.infer<typeof boreholesConfigFormSchema>

interface BoreholesConfigurationFormProps {
  projectData: Project
  availableStrata: Stratum[] // The strata types defined in previous step
  onValidData: (data: BoreholeCreate[], isValid: boolean) => void
}

const BoreholesConfigurationForm: React.FC<BoreholesConfigurationFormProps> = ({ 
  projectData, 
  availableStrata, 
  onValidData 
}) => {
  const [currentTab, setCurrentTab] = useState(0)

  const {
    control,
    register,
    watch,
    formState: { errors, isValid },
    getValues,
    setValue,
    trigger
  } = useForm<BoreholesConfigFormData>({
    resolver: zodResolver(boreholesConfigFormSchema),
    defaultValues: {
      // Create tabs based on number_of_boreholes from project
      boreholes: Array.from({ length: projectData.number_of_boreholes }, (_, index) => ({
        borehole_name: `P${index + 1}`,
        final_depth: 15.0,
        diameter_mm: 150,
        field_energy_percent: 45,
        rod_length: 15,
        water_table_depth: null,
        strata_assignments: [
          // Default: assign first stratum to full depth
          {
            stratum_code: availableStrata[0]?.name || 'E1',
            depth_from: 0,
            depth_to: 15
          }
        ]
      }))
    },
    mode: 'onChange'
  })

  const { fields: boreholeFields } = useFieldArray({
    control,
    name: 'boreholes'
  })

  // Watch all form values and notify parent
  useEffect(() => {
    const subscription = watch(() => {
      const formData = getValues()
      const boreholeCreateData: BoreholeCreate[] = formData.boreholes.map(borehole => ({
        project_id: projectData.id,
        borehole_name: borehole.borehole_name,
        final_depth: borehole.final_depth,
        diameter_mm: borehole.diameter_mm,
        field_energy_percent: borehole.field_energy_percent,
        rod_length: borehole.rod_length,
        water_table_depth: borehole.water_table_depth || undefined,
        formulation: projectData.formulation,
        // Note: strata assignments will be handled separately in backend
      }))
      onValidData(boreholeCreateData, isValid)
    })
    return () => subscription.unsubscribe()
  }, [watch, getValues, onValidData, isValid, projectData.id, projectData.formulation])

  // Add stratum assignment to a specific borehole
  const addStratumAssignment = (boreholeIndex: number) => {
    const currentAssignments = getValues(`boreholes.${boreholeIndex}.strata_assignments`)
    const lastAssignment = currentAssignments[currentAssignments.length - 1]
    const finalDepth = getValues(`boreholes.${boreholeIndex}.final_depth`)
    
    // Find available stratum (one not already used in this borehole)
    const usedCodes = currentAssignments.map(a => a.stratum_code)
    const availableStratum = availableStrata.find(s => !usedCodes.includes(s.name))
    
    if (availableStratum && lastAssignment.depth_to < finalDepth) {
      const newAssignment = {
        stratum_code: availableStratum.name,
        depth_from: lastAssignment.depth_to,
        depth_to: finalDepth
      }
      
      setValue(`boreholes.${boreholeIndex}.strata_assignments`, [...currentAssignments, newAssignment])
      trigger(`boreholes.${boreholeIndex}.strata_assignments`)
    }
  }

  // Remove stratum assignment from a specific borehole
  const removeStratumAssignment = (boreholeIndex: number, assignmentIndex: number) => {
    const currentAssignments = getValues(`boreholes.${boreholeIndex}.strata_assignments`)
    if (currentAssignments.length > 1) {
      const updatedAssignments = currentAssignments.filter((_, idx) => idx !== assignmentIndex)
      setValue(`boreholes.${boreholeIndex}.strata_assignments`, updatedAssignments)
      trigger(`boreholes.${boreholeIndex}.strata_assignments`)
    }
  }

  // Auto-adjust depths when final depth changes
  const handleFinalDepthChange = (boreholeIndex: number, newDepth: number) => {
    setValue(`boreholes.${boreholeIndex}.final_depth`, newDepth)
    
    // Adjust last stratum assignment to match final depth
    const currentAssignments = getValues(`boreholes.${boreholeIndex}.strata_assignments`)
    if (currentAssignments.length > 0) {
      const updatedAssignments = [...currentAssignments]
      updatedAssignments[updatedAssignments.length - 1].depth_to = newDepth
      setValue(`boreholes.${boreholeIndex}.strata_assignments`, updatedAssignments)
    }
    
    trigger(`boreholes.${boreholeIndex}`)
  }

  if (availableStrata.length === 0) {
    return (
      <div className={styles.placeholderContainer}>
        <Layers size={48} className={styles.placeholderIcon} />
        <h3>No hay estratos definidos</h3>
        <p>Debes definir al menos un tipo de estrato antes de configurar las perforaciones.</p>
      </div>
    )
  }

  return (
    <div className={styles.formContainer}>
      <div className={styles.formHeader}>
        <div className={styles.headerContent}>
          <div className={styles.titleSection}>
            <MapPin className={styles.titleIcon} size={24} />
            <div>
              <h2 className={styles.formTitle}>Configuración de Perforaciones</h2>
              <p className={styles.formSubtitle}>
                Configure cada perforación y asigne estratos a las profundidades específicas
              </p>
            </div>
          </div>
          <div className={styles.projectInfo}>
            <span className={styles.projectCode}>{projectData.project_code}</span>
            <span className={styles.projectName}>{projectData.project_name}</span>
          </div>
        </div>
      </div>

      {/* Available Strata Reference */}
      <div className={styles.strataReference}>
        <h4><Layers size={16} /> Tipos de Estratos Disponibles</h4>
        <div className={styles.strataList}>
          {availableStrata.map(stratum => (
            <div key={stratum.id} className={styles.stratumTag}>
              <span className={styles.stratumCode}>{stratum.name}</span>
              <span className={styles.stratumDesc}>{stratum.description}</span>
              <span className={styles.stratumType}>({stratum.behavior_type})</span>
            </div>
          ))}
        </div>
      </div>

      {/* Borehole Tabs - THIS IS THE KEY PART! */}
      <div className={styles.tabContainer}>
        <div className={styles.tabList}>
          {boreholeFields.map((field, index) => (
            <button
              key={field.id}
              onClick={() => setCurrentTab(index)}
              className={`${styles.tab} ${currentTab === index ? styles.active : ''} ${
                errors.boreholes?.[index] ? styles.error : ''
              }`}
            >
              <MapPin size={14} />
              <span className={styles.tabLabel}>
                {watch(`boreholes.${index}.borehole_name`) || `P${index + 1}`}
              </span>
              <span className={styles.tabDepth}>
                ({watch(`boreholes.${index}.final_depth`)}m)
              </span>
              {errors.boreholes?.[index] && <span className={styles.errorIndicator}>!</span>}
            </button>
          ))}
        </div>

        {/* Tab Content for Each Borehole */}
        {boreholeFields.map((field, boreholeIndex) => (
          <div
            key={field.id}
            className={`${styles.tabContent} ${currentTab === boreholeIndex ? styles.active : styles.hidden}`}
          >
            <div className={styles.boreholeForm}>
              {/* Basic Borehole Info */}
              <div className={styles.basicInfoSection}>
                <h4 className={styles.sectionTitle}>
                  <Target size={16} />
                  Información Básica de la Perforación
                </h4>
                <div className={styles.formGrid}>
                  <div className={styles.inputGroup}>
                    <label className={styles.label}>
                      Nombre de Perforación <span className={styles.required}>*</span>
                    </label>
                    <input
                      {...register(`boreholes.${boreholeIndex}.borehole_name`)}
                      className={`${styles.input} ${errors.boreholes?.[boreholeIndex]?.borehole_name ? styles.inputError : ''}`}
                      placeholder="P1, P2, etc."
                    />
                    {errors.boreholes?.[boreholeIndex]?.borehole_name && (
                      <span className={styles.errorText}>
                        {errors.boreholes[boreholeIndex]?.borehole_name?.message}
                      </span>
                    )}
                  </div>

                  <div className={styles.inputGroup}>
                    <label className={styles.label}>
                      Profundidad Final (m) <span className={styles.required}>*</span>
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      {...register(`boreholes.${boreholeIndex}.final_depth`, { 
                        valueAsNumber: true,
                        onChange: (e) => handleFinalDepthChange(boreholeIndex, parseFloat(e.target.value))
                      })}
                      className={`${styles.input} ${errors.boreholes?.[boreholeIndex]?.final_depth ? styles.inputError : ''}`}
                    />
                    {errors.boreholes?.[boreholeIndex]?.final_depth && (
                      <span className={styles.errorText}>
                        {errors.boreholes[boreholeIndex]?.final_depth?.message}
                      </span>
                    )}
                  </div>

                  <div className={styles.inputGroup}>
                    <label className={styles.label}>
                      Diámetro (mm) <span className={styles.required}>*</span>
                    </label>
                    <input
                      type="number"
                      {...register(`boreholes.${boreholeIndex}.diameter_mm`, { valueAsNumber: true })}
                      className={`${styles.input} ${errors.boreholes?.[boreholeIndex]?.diameter_mm ? styles.inputError : ''}`}
                    />
                    {errors.boreholes?.[boreholeIndex]?.diameter_mm && (
                      <span className={styles.errorText}>
                        {errors.boreholes[boreholeIndex]?.diameter_mm?.message}
                      </span>
                    )}
                  </div>

                  <div className={styles.inputGroup}>
                    <label className={styles.label}>
                      Energía de Campo (%) <span className={styles.required}>*</span>
                    </label>
                    <input
                      type="number"
                      {...register(`boreholes.${boreholeIndex}.field_energy_percent`, { valueAsNumber: true })}
                      className={`${styles.input} ${errors.boreholes?.[boreholeIndex]?.field_energy_percent ? styles.inputError : ''}`}
                    />
                    {errors.boreholes?.[boreholeIndex]?.field_energy_percent && (
                      <span className={styles.errorText}>
                        {errors.boreholes[boreholeIndex]?.field_energy_percent?.message}
                      </span>
                    )}
                  </div>

                  <div className={styles.inputGroup}>
                    <label className={styles.label}>
                      Longitud de Barras (m) <span className={styles.required}>*</span>
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      {...register(`boreholes.${boreholeIndex}.rod_length`, { valueAsNumber: true })}
                      className={`${styles.input} ${errors.boreholes?.[boreholeIndex]?.rod_length ? styles.inputError : ''}`}
                    />
                    {errors.boreholes?.[boreholeIndex]?.rod_length && (
                      <span className={styles.errorText}>
                        {errors.boreholes[boreholeIndex]?.rod_length?.message}
                      </span>
                    )}
                  </div>

                  <div className={styles.inputGroup}>
                    <label className={styles.label}>
                      Nivel Freático (m) <span className={styles.optional}>(opcional)</span>
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      {...register(`boreholes.${boreholeIndex}.water_table_depth`, { valueAsNumber: true })}
                      className={`${styles.input} ${errors.boreholes?.[boreholeIndex]?.water_table_depth ? styles.inputError : ''}`}
                    />
                    {errors.boreholes?.[boreholeIndex]?.water_table_depth && (
                      <span className={styles.errorText}>
                        {errors.boreholes[boreholeIndex]?.water_table_depth?.message}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Strata Assignments - THE CORE FUNCTIONALITY */}
              <div className={styles.strataAssignmentsSection}>
                <div className={styles.sectionHeader}>
                  <h4 className={styles.sectionTitle}>
                    <Layers size={16} />
                    Asignación de Estratos por Profundidad
                  </h4>
                  <button
                    type="button"
                    onClick={() => addStratumAssignment(boreholeIndex)}
                    className={styles.addButton}
                    disabled={
                      getValues(`boreholes.${boreholeIndex}.strata_assignments`).length >= availableStrata.length
                    }
                  >
                    <Plus size={14} />
                    Agregar Estrato
                  </button>
                </div>

                <StrataAssignmentsList
                  control={control}
                  boreholeIndex={boreholeIndex}
                  availableStrata={availableStrata}
                  register={register}
                  watch={watch}
                  errors={errors}
                  onRemove={(assignmentIndex) => removeStratumAssignment(boreholeIndex, assignmentIndex)}
                />

                {errors.boreholes?.[boreholeIndex]?.strata_assignments && 
                 typeof errors.boreholes[boreholeIndex]?.strata_assignments?.message === 'string' && (
                  <div className={styles.assignmentError}>
                    {errors.boreholes[boreholeIndex]?.strata_assignments?.message}
                  </div>
                )}
              </div>

              {/* Visual Profile Preview */}
              <BoreholeProfilePreview
                boreholeData={{
                  name: watch(`boreholes.${boreholeIndex}.borehole_name`),
                  finalDepth: watch(`boreholes.${boreholeIndex}.final_depth`),
                  waterTable: watch(`boreholes.${boreholeIndex}.water_table_depth`),
                  assignments: watch(`boreholes.${boreholeIndex}.strata_assignments`)
                }}
                availableStrata={availableStrata}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Helper Component for Strata Assignments List
const StrataAssignmentsList: React.FC<{
  control: any // eslint-disable-line @typescript-eslint/no-explicit-any
  boreholeIndex: number
  availableStrata: Stratum[]
  register: any // eslint-disable-line @typescript-eslint/no-explicit-any
  watch: any // eslint-disable-line @typescript-eslint/no-explicit-any
  errors: any // eslint-disable-line @typescript-eslint/no-explicit-any
  onRemove: (index: number) => void
}> = ({ control, boreholeIndex, availableStrata, register, watch, errors, onRemove }) => {
  const { fields } = useFieldArray({
    control,
    name: `boreholes.${boreholeIndex}.strata_assignments`
  })

  return (
    <div className={styles.assignmentsList}>
      {fields.map((field, assignmentIndex) => {
        const selectedStratumCode = watch(`boreholes.${boreholeIndex}.strata_assignments.${assignmentIndex}.stratum_code`)
        const selectedStratum = availableStrata.find(s => s.name === selectedStratumCode)
        
        return (
          <div key={field.id} className={styles.assignmentCard}>
            <div className={styles.assignmentHeader}>
              <span className={styles.assignmentNumber}>Capa #{assignmentIndex + 1}</span>
              {fields.length > 1 && (
                <button
                  type="button"
                  onClick={() => onRemove(assignmentIndex)}
                  className={styles.removeAssignmentButton}
                  title="Eliminar capa"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>

            <div className={styles.assignmentForm}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Tipo de Estrato</label>
                <select
                  {...register(`boreholes.${boreholeIndex}.strata_assignments.${assignmentIndex}.stratum_code`)}
                  className={`${styles.select} ${
                    errors.boreholes?.[boreholeIndex]?.strata_assignments?.[assignmentIndex]?.stratum_code ? 
                    styles.inputError : ''
                  }`}
                >
                  {availableStrata.map(stratum => (
                    <option key={stratum.id} value={stratum.name}>
                      {stratum.name} - {stratum.description}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.depthInputs}>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>Desde (m)</label>
                  <input
                    type="number"
                    step="0.1"
                    {...register(`boreholes.${boreholeIndex}.strata_assignments.${assignmentIndex}.depth_from`, { valueAsNumber: true })}
                    className={`${styles.input} ${
                      errors.boreholes?.[boreholeIndex]?.strata_assignments?.[assignmentIndex]?.depth_from ? 
                      styles.inputError : ''
                    }`}
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.label}>Hasta (m)</label>
                  <input
                    type="number"
                    step="0.1"
                    {...register(`boreholes.${boreholeIndex}.strata_assignments.${assignmentIndex}.depth_to`, { valueAsNumber: true })}
                    className={`${styles.input} ${
                      errors.boreholes?.[boreholeIndex]?.strata_assignments?.[assignmentIndex]?.depth_to ? 
                      styles.inputError : ''
                    }`}
                  />
                </div>
              </div>
            </div>

            {selectedStratum && (
              <div className={styles.stratumInfo}>
                <span className={styles.stratumProps}>
                  {selectedStratum.behavior_type} | γh: {selectedStratum.gamma_humid} kN/m³ | 
                  γsat: {selectedStratum.gamma_saturated} kN/m³
                </span>
              </div>
            )}

            {errors.boreholes?.[boreholeIndex]?.strata_assignments?.[assignmentIndex] && (
              <div className={styles.assignmentErrors}>
                {Object.entries(errors.boreholes[boreholeIndex].strata_assignments[assignmentIndex] as Record<string, { message: string }>).map(([key, error]) => (
                  <span key={key} className={styles.errorText}>{error.message}</span>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// Visual Preview Component
const BoreholeProfilePreview: React.FC<{
  boreholeData: {
    name: string
    finalDepth: number
    waterTable?: number | null
    assignments: Array<{
      stratum_code: string
      depth_from: number
      depth_to: number
    }>
  }
  availableStrata: Stratum[]
}> = ({ boreholeData, availableStrata }) => {
  const getStratumColor = (stratumCode: string) => {
    const colors = ['#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#6B7280', '#EC4899']
    const index = availableStrata.findIndex(s => s.name === stratumCode)
    return colors[index % colors.length]
  }

  return (
    <div className={styles.profilePreview}>
      <h5 className={styles.previewTitle}>Vista Previa del Perfil</h5>
      <div className={styles.profileContainer}>
        <div className={styles.profileHeader}>
          <span className={styles.profileName}>{boreholeData.name}</span>
          <span className={styles.profileDepth}>Prof. Total: {boreholeData.finalDepth}m</span>
        </div>
        
        <div className={styles.profileColumns}>
          <div className={styles.depthColumn}>
            <div className={styles.depthLabel}>Profundidad (m)</div>
            {boreholeData.assignments.map((assignment, index) => (
              <div key={index} className={styles.depthItem}>
                <span>{assignment.depth_from.toFixed(1)}</span>
                <span>{assignment.depth_to.toFixed(1)}</span>
              </div>
            ))}
          </div>
          
          <div className={styles.stratumColumn}>
            <div className={styles.stratumLabel}>Estrato</div>
            {boreholeData.assignments.map((assignment, index) => {
              return (
                <div 
                  key={index} 
                  className={styles.stratumLayer}
                  style={{ 
                    backgroundColor: getStratumColor(assignment.stratum_code),
                    height: `${((assignment.depth_to - assignment.depth_from) / boreholeData.finalDepth) * 200}px`
                  }}
                >
                  <span className={styles.layerCode}>{assignment.stratum_code}</span>
                  <span className={styles.layerThickness}>
                    {(assignment.depth_to - assignment.depth_from).toFixed(1)}m
                  </span>
                </div>
              )
            })}
          </div>
          
          <div className={styles.descriptionColumn}>
            <div className={styles.descriptionLabel}>Descripción</div>
            {boreholeData.assignments.map((assignment, index) => {
              const stratum = availableStrata.find(s => s.name === assignment.stratum_code)
              return (
                <div key={index} className={styles.descriptionItem}>
                  <strong>{stratum?.name}</strong>
                  <span>{stratum?.description}</span>
                  <small>{stratum?.behavior_type}</small>
                </div>
              )
            })}
          </div>
        </div>

        {boreholeData.waterTable && (
          <div 
            className={styles.waterTable}
            style={{ top: `${(boreholeData.waterTable / boreholeData.finalDepth) * 200 + 40}px` }}
          >
            <span>N.F. {boreholeData.waterTable}m</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default BoreholesConfigurationForm