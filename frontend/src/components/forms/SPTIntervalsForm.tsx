"use client"

import React, { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Trash2, Target, AlertCircle, Loader2 } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { useSPTIntervalsWorkflow } from '@/features/spt/hooks/useSPTIntervalsHooks'
import styles from '@/styles/SPTIntervalsForm.module.css'

// Schema for individual SPT test interval
const sptIntervalSchema = z.object({
  borehole_id: z.number().int().positive(),
  borehole_stratum_id: z.number().int().positive(),
  depth_from: z.number().min(0, "Profundidad >= 0"),
  depth_to: z.number().min(0, "Profundidad >= 0"),
  nspt_field: z.number().int().min(0, "N >= 0").max(200, "N máx 200"),
  description: z.string().optional()
}).refine(
  (data) => data.depth_to > data.depth_from,
  {
    message: "Profundidad final debe ser mayor que inicial",
    path: ["depth_to"],
  }
)

const sptIntervalsFormSchema = z.object({
  intervals: z.array(sptIntervalSchema).min(1, "Al menos un ensayo SPT requerido")
})

type SPTIntervalsFormData = z.infer<typeof sptIntervalsFormSchema>

interface BoreholeStratumInfo {
  id: number
  borehole_id: number
  borehole_name: string
  stratum_name: string
  initial_depth: number
  final_depth: number
}

const SPTIntervalsForm: React.FC = () => {
  // ============================================
  // HOOKS - Zustand Store
  // ============================================
  const project = useAppStore((state) => state.project);
  const boreholes = useAppStore((state) => state.boreholes);
  const boreholeStrata = useAppStore((state) => state.boreholeStrata);
  const strata = useAppStore((state) => state.strata);
  
  // ============================================
  // HOOKS - React Query Workflow
  // ============================================
  const { submit, isLoading: isSubmitting } = useSPTIntervalsWorkflow();
  
  // ============================================
  // LOCAL STATE
  // ============================================
  const [selectedBorehole, setSelectedBorehole] = useState<number | null>(
    boreholes.length > 0 ? boreholes[0].id : null
  );

  // ============================================
  // PREPARE BOREHOLE-STRATUM OPTIONS
  // ============================================
  const boreholeStratumOptions: BoreholeStratumInfo[] = boreholeStrata
    .filter(bs => bs.borehole_id === selectedBorehole)
    .map(bs => {
      const borehole = boreholes.find(b => b.id === bs.borehole_id);
      const stratum = strata.find(s => s.id === bs.stratum_definition_id);
      
      return {
        id: bs.id,
        borehole_id: bs.borehole_id,
        borehole_name: borehole?.borehole_name || 'Unknown',
        stratum_name: stratum?.name || 'Unknown',
        initial_depth: bs.initial_depth,
        final_depth: bs.final_depth
      };
    })
    .sort((a, b) => a.initial_depth - b.initial_depth);

  // ============================================
  // FORM SETUP
  // ============================================
  const {
    control,
    register,
    watch,
    formState: { errors, isValid },
    handleSubmit,
    reset
  } = useForm<SPTIntervalsFormData>({
    resolver: zodResolver(sptIntervalsFormSchema),
    defaultValues: {
      intervals: []
    },
    mode: 'onChange'
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'intervals'
  })

  // ============================================
  // HELPER FUNCTIONS
  // ============================================
  
  const addInterval = () => {
    if (!selectedBorehole || boreholeStratumOptions.length === 0) return;
    
    // Default to first stratum of selected borehole
    const firstStratum = boreholeStratumOptions[0];
    const midpoint = (firstStratum.initial_depth + firstStratum.final_depth) / 2;
    
    append({
      borehole_id: selectedBorehole,
      borehole_stratum_id: firstStratum.id,
      depth_from: midpoint,
      depth_to: midpoint + 0.5, // Standard 50cm interval
      nspt_field: 0,
      description: ''
    });
  };

  const handleBoreholeChange = (boreholeId: number) => {
    setSelectedBorehole(boreholeId);
    // Clear intervals when changing borehole
    reset({ intervals: [] });
  };

  const getStratumInfo = (boreholeStratumId: number): BoreholeStratumInfo | undefined => {
    return boreholeStratumOptions.find(bs => bs.id === boreholeStratumId);
  };

  // ============================================
  // FORM SUBMIT
  // ============================================
  const onSubmit = (data: SPTIntervalsFormData) => {
    if (!project?.id) {
      console.error('No project ID available');
      return;
    }

    // Submit intervals to API
    submit(data.intervals);
  };

  // ============================================
  // GUARDS
  // ============================================
  
  if (!project) {
    return (
      <div className={styles.placeholderContainer}>
        <Target size={48} className={styles.placeholderIcon} />
        <h3>No hay proyecto activo</h3>
        <p>Debes crear un proyecto primero.</p>
      </div>
    );
  }

  if (boreholes.length === 0) {
    return (
      <div className={styles.placeholderContainer}>
        <Target size={48} className={styles.placeholderIcon} />
        <h3>No hay perforaciones configuradas</h3>
        <p>Debes configurar al menos una perforación antes de ingresar ensayos SPT.</p>
      </div>
    );
  }

  if (boreholeStrata.length === 0) {
    return (
      <div className={styles.placeholderContainer}>
        <AlertCircle size={48} className={styles.placeholderIcon} />
        <h3>No hay asignación de estratos</h3>
        <p>Debes asignar estratos a las perforaciones primero.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.formContainer}>
      <div className={styles.formHeader}>
        <div className={styles.headerContent}>
          <div className={styles.titleSection}>
            <Target className={styles.titleIcon} size={24} />
            <div>
              <h2 className={styles.formTitle}>Ensayos SPT</h2>
              <p className={styles.formSubtitle}>
                Ingrese los valores de N campo (golpes/30cm) para cada intervalo ensayado
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Borehole Selector */}
      <div className={styles.boreholeSelector}>
        <label>Seleccionar Perforación:</label>
        <select 
          value={selectedBorehole || ''} 
          onChange={(e) => handleBoreholeChange(Number(e.target.value))}
          className={styles.boreholeSelect}
        >
          {boreholes.map(borehole => (
            <option key={borehole.id} value={borehole.id}>
              {borehole.borehole_name} (Profundidad: {borehole.final_depth}m)
            </option>
          ))}
        </select>
      </div>

      {/* Stratum Reference Table */}
      {selectedBorehole && boreholeStratumOptions.length > 0 && (
        <div className={styles.stratumReference}>
          <h4>Estratos en esta perforación:</h4>
          <table className={styles.referenceTable}>
            <thead>
              <tr>
                <th>Estrato</th>
                <th>Prof. Inicial (m)</th>
                <th>Prof. Final (m)</th>
              </tr>
            </thead>
            <tbody>
              {boreholeStratumOptions.map(bs => (
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

      {/* SPT Intervals List */}
      <div className={styles.intervalsSection}>
        <div className={styles.sectionHeader}>
          <h3>Ensayos SPT</h3>
          <button
            type="button"
            onClick={addInterval}
            className={styles.addButton}
            disabled={!selectedBorehole}
          >
            <Plus size={16} />
            Agregar Ensayo
          </button>
        </div>

        {fields.length === 0 ? (
          <div className={styles.emptyState}>
            <Target size={32} />
            <p>No hay ensayos SPT agregados</p>
            <p className={styles.hint}>Haz clic en "Agregar Ensayo" para comenzar</p>
          </div>
        ) : (
          <div className={styles.intervalsList}>
            {fields.map((field, index) => {
              const stratumInfo = getStratumInfo(watch(`intervals.${index}.borehole_stratum_id`));
              
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
                        {...register(`intervals.${index}.borehole_stratum_id`, { valueAsNumber: true })}
                        className={styles.input}
                      >
                        {boreholeStratumOptions.map(bs => (
                          <option key={bs.id} value={bs.id}>
                            {bs.stratum_name} ({bs.initial_depth}-{bs.final_depth}m)
                          </option>
                        ))}
                      </select>
                      {errors.intervals?.[index]?.borehole_stratum_id && (
                        <span className={styles.error}>
                          {errors.intervals[index]?.borehole_stratum_id?.message}
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
                          {...register(`intervals.${index}.depth_from`, { valueAsNumber: true })}
                          className={styles.input}
                          min={stratumInfo?.initial_depth}
                          max={stratumInfo?.final_depth}
                        />
                        {errors.intervals?.[index]?.depth_from && (
                          <span className={styles.error}>
                            {errors.intervals[index]?.depth_from?.message}
                          </span>
                        )}
                      </div>

                      <div className={styles.formGroup}>
                        <label>Prof. Final (m)</label>
                        <input
                          type="number"
                          step="0.1"
                          {...register(`intervals.${index}.depth_to`, { valueAsNumber: true })}
                          className={styles.input}
                          min={stratumInfo?.initial_depth}
                          max={stratumInfo?.final_depth}
                        />
                        {errors.intervals?.[index]?.depth_to && (
                          <span className={styles.error}>
                            {errors.intervals[index]?.depth_to?.message}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* N Field Value */}
                    <div className={styles.formGroup}>
                      <label>N Campo (golpes/30cm)</label>
                      <input
                        type="number"
                        {...register(`intervals.${index}.nspt_field`, { valueAsNumber: true })}
                        className={styles.inputLarge}
                        min={0}
                        max={200}
                      />
                      {errors.intervals?.[index]?.nspt_field && (
                        <span className={styles.error}>
                          {errors.intervals[index]?.nspt_field?.message}
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    <div className={styles.formGroup}>
                      <label>Descripción (opcional)</label>
                      <input
                        type="text"
                        {...register(`intervals.${index}.description`)}
                        className={styles.input}
                        placeholder="Ej: Muestra M-1, profundidad 3.5m"
                      />
                    </div>

                    {/* Hidden borehole_id */}
                    <input
                      type="hidden"
                      {...register(`intervals.${index}.borehole_id`, { valueAsNumber: true })}
                      value={selectedBorehole || 0}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Form Actions */}
      <div className={styles.formActions}>
        <button
          type="submit"
          disabled={!isValid || isSubmitting || fields.length === 0}
          className={styles.submitButton}
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

      {/* Form Errors */}
      {errors.intervals && typeof errors.intervals.message === 'string' && (
        <div className={styles.globalError}>
          <AlertCircle size={16} />
          {errors.intervals.message}
        </div>
      )}
    </form>
  )
}

export default SPTIntervalsForm
