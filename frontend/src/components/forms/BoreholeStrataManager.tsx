import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Project, StratumCreate } from '../../types/project';
import type { 
  BoreholeTabState, 
  BoreholeStrataSubmissionPayload 
} from '../../types/borehole-strata';
import styles from './BoreholeStrataManager.module.css';

// Schema for individual stratum within a borehole
const boreholeStratumSchema = z.object({
  stratum_code: z.number().min(1).max(20),
  name: z.string().min(1, 'Nombre requerido').max(100),
  description: z.string().min(1, 'Descripción requerida').max(500),
  initial_depth: z.number().min(0, 'Profundidad >= 0').max(500),
  final_depth: z.number().min(0, 'Profundidad >= 0').max(500),
  gamma_humid: z.number().min(10, 'Gamma mínimo 10 kN/m³').max(40),
  gamma_saturated: z.number().min(10, 'Gamma mínimo 10 kN/m³').max(40),
  behavior_type: z.enum(['cohesive', 'granular']),
  plasticity_index: z.number().min(0).max(100).optional()
}).refine((data) => data.final_depth > data.initial_depth, {
  message: 'Profundidad final debe ser mayor que inicial',
  path: ['final_depth']
});

// Schema for a single borehole tab
const boreholeTabSchema = z.object({
  boreholeName: z.string().min(1, 'Nombre de perforación requerido'),
  strata: z.array(boreholeStratumSchema).min(1, 'Al menos un estrato requerido')
});

// Schema for all borehole tabs
const boreholeStrataFormSchema = z.object({
  boreholes: z.array(boreholeTabSchema)
});

type BoreholeStrataFormType = z.infer<typeof boreholeStrataFormSchema>;

interface BoreholeStrataManagerProps {
  projectData: Project;
  onValidData: (payload: BoreholeStrataSubmissionPayload, isValid: boolean) => void;
}

const BoreholeStrataManager: React.FC<BoreholeStrataManagerProps> = ({
  projectData,
  onValidData
}) => {
  const [tabState, setTabState] = useState<BoreholeTabState>({
    activeTab: 0,
    tabs: Array.from({ length: projectData.number_of_boreholes }, (_, index) => ({
      id: index,
      name: `P${index + 1}`,
      isValid: false,
      strataCount: Math.min(projectData.number_of_strata, 3), // Default to 3 or project max
      strata: []
    }))
  });

  const {
    control,
    register,
    watch,
    formState: { errors, isValid },
    getValues,
    setValue
  } = useForm<BoreholeStrataFormType>({
    resolver: zodResolver(boreholeStrataFormSchema),
    defaultValues: {
      boreholes: Array.from({ length: projectData.number_of_boreholes }, (_, boreholeIndex) => ({
        boreholeName: `P${boreholeIndex + 1}`,
        strata: Array.from({ length: Math.min(projectData.number_of_strata, 3) }, (_, stratumIndex) => ({
          stratum_code: stratumIndex + 1,
          name: `Estrato ${stratumIndex + 1}`,
          description: '',
          initial_depth: stratumIndex === 0 ? 0 : stratumIndex * 2,
          final_depth: (stratumIndex + 1) * 2,
          gamma_humid: 18,
          gamma_saturated: 20,
          behavior_type: 'granular' as const,
          plasticity_index: 0
        }))
      }))
    },
    mode: 'onChange'
  });

  const { fields: boreholeFields } = useFieldArray({
    control,
    name: 'boreholes'
  });

  // Transform form data to submission payload
  const transformToSubmissionPayload = React.useCallback((formData: BoreholeStrataFormType): BoreholeStrataSubmissionPayload => {
    // Extract all unique strata (project-level) by combining from all boreholes
    const allStrataMap = new Map<number, StratumCreate>();
    
    formData.boreholes.forEach((borehole) => {
      borehole.strata.forEach((stratum) => {
        if (!allStrataMap.has(stratum.stratum_code)) {
          allStrataMap.set(stratum.stratum_code, {
            stratum_code: stratum.stratum_code,
            name: stratum.name,
            description: stratum.description,
            initial_depth: 0, // Will be the minimum across all boreholes
            final_depth: 0,   // Will be the maximum across all boreholes
            gamma_humid: stratum.gamma_humid,
            gamma_saturated: stratum.gamma_saturated,
            behavior_type: stratum.behavior_type,
            plasticity_index: stratum.plasticity_index
          });
        }
      });
    });

    // Calculate global depth ranges for project-level strata
    allStrataMap.forEach((stratum, code) => {
      const depths = formData.boreholes
        .flatMap(b => b.strata.filter(s => s.stratum_code === code))
        .map(s => ({ initial: s.initial_depth, final: s.final_depth }));
      
      stratum.initial_depth = Math.min(...depths.map(d => d.initial));
      stratum.final_depth = Math.max(...depths.map(d => d.final));
    });

    const projectStrata = Array.from(allStrataMap.values());

    // Create borehole data with stratum assignments
    const boreholes = formData.boreholes.map((boreholeData) => ({
      project_id: projectData.id,
      borehole_name: boreholeData.boreholeName,
      final_depth: Math.max(...boreholeData.strata.map(s => s.final_depth)),
      diameter_mm: 150, // Default  , // Deleted rod_length from the next linecode
      field_energy_percent: 45, // Default
      water_table_depth: undefined,
      formulation: projectData.formulation,
      strataAssignments: boreholeData.strata.map(stratum => ({
        stratumCode: stratum.stratum_code,
        depthFrom: stratum.initial_depth,
        depthTo: stratum.final_depth
      }))
    }));

    return { projectStrata, boreholes };
  }, [projectData]);

  // Watch form changes and notify parent
  useEffect(() => {
    const subscription = watch(() => {
      const formData = getValues();
      const payload = transformToSubmissionPayload(formData);
      onValidData(payload, isValid);
    });
    return () => subscription.unsubscribe();
  }, [watch, getValues, onValidData, isValid, projectData, transformToSubmissionPayload]);

  // Add stratum to current tab
  const addStratumToTab = (tabIndex: number) => {
    const currentStrata = getValues(`boreholes.${tabIndex}.strata`);
    const newStratumCode = Math.max(...currentStrata.map(s => s.stratum_code), 0) + 1;
    const lastDepth = Math.max(...currentStrata.map(s => s.final_depth), 0);

    const newStratum: z.infer<typeof boreholeStratumSchema> = {
      stratum_code: newStratumCode,
      name: `Estrato ${newStratumCode}`,
      description: '',
      initial_depth: lastDepth,
      final_depth: lastDepth + 2,
      gamma_humid: 18,
      gamma_saturated: 20,
      behavior_type: 'granular',
      plasticity_index: 0
    };

    setValue(`boreholes.${tabIndex}.strata`, [...currentStrata, newStratum]);
  };

  // Remove stratum from current tab
  const removeStratumFromTab = (tabIndex: number, stratumIndex: number) => {
    const currentStrata = getValues(`boreholes.${tabIndex}.strata`);
    if (currentStrata.length > 1) { // Keep at least one stratum
      const updatedStrata = currentStrata.filter((_, index) => index !== stratumIndex);
      setValue(`boreholes.${tabIndex}.strata`, updatedStrata);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>
          Configuración de Estratos por Perforación
        </h3>
        <p className={styles.subtitle}>
          Proyecto: <strong>{projectData.project_name}</strong> | 
          Perforaciones: <strong>{projectData.number_of_boreholes}</strong>
        </p>
      </div>

      {/* Tab Navigation */}
      <div className={styles.tabNav}>
        {tabState.tabs.map((tab, index) => (
          <button
            key={tab.id}
            type="button"
            className={`${styles.tabButton} ${
              tabState.activeTab === index ? styles.activeTab : ''
            }`}
            onClick={() => setTabState(prev => ({ ...prev, activeTab: index }))}
          >
            {tab.name}
            <span className={styles.tabBadge}>
              {watch(`boreholes.${index}.strata`)?.length || 0}
            </span>
          </button>
        ))}
      </div>

      {/* Active Tab Content */}
      {boreholeFields.map((boreholeField, boreholeIndex) => (
        <div
          key={boreholeField.id}
          className={`${styles.tabContent} ${
            tabState.activeTab === boreholeIndex ? styles.activeContent : styles.hiddenContent
          }`}
        >
          <div className={styles.tabHeader}>
            <h4 className={styles.tabTitle}>
              Perforación: {watch(`boreholes.${boreholeIndex}.boreholeName`)}
            </h4>
            <div className={styles.tabActions}>
              <button
                type="button"
                className={styles.addButton}
                onClick={() => addStratumToTab(boreholeIndex)}
              >
                + Agregar Estrato
              </button>
            </div>
          </div>

          {/* Borehole Name Input */}
          <div className={styles.inputGroup}>
            <label className={styles.label}>Nombre de la Perforación</label>
            <input
              type="text"
              {...register(`boreholes.${boreholeIndex}.boreholeName`)}
              className={styles.input}
              placeholder="ej: P1, BH-01, PZ-A"
            />
            {errors.boreholes?.[boreholeIndex]?.boreholeName && (
              <p className={styles.error}>
                {errors.boreholes[boreholeIndex]?.boreholeName?.message}
              </p>
            )}
          </div>

          {/* Strata for this borehole */}
          <div className={styles.strataList}>
            {watch(`boreholes.${boreholeIndex}.strata`)?.map((_, stratumIndex) => (
              <div key={stratumIndex} className={styles.stratumCard}>
                <div className={styles.stratumHeader}>
                  <h5 className={styles.stratumTitle}>
                    Estrato {stratumIndex + 1}
                  </h5>
                  {watch(`boreholes.${boreholeIndex}.strata`).length > 1 && (
                    <button
                      type="button"
                      className={styles.removeButton}
                      onClick={() => removeStratumFromTab(boreholeIndex, stratumIndex)}
                    >
                      ×
                    </button>
                  )}
                </div>

                <div className={styles.stratumFields}>
                  <div className={styles.fieldRow}>
                    <div className={styles.field}>
                      <label className={styles.label}>Código</label>
                      <input
                        type="number"
                        {...register(`boreholes.${boreholeIndex}.strata.${stratumIndex}.stratum_code`, 
                          { valueAsNumber: true })}
                        className={styles.input}
                        min="1"
                      />
                    </div>

                    <div className={styles.field}>
                      <label className={styles.label}>Nombre</label>
                      <input
                        type="text"
                        {...register(`boreholes.${boreholeIndex}.strata.${stratumIndex}.name`)}
                        className={styles.input}
                        placeholder="ej: Arena fina"
                      />
                    </div>
                  </div>

                  <div className={styles.field}>
                    <label className={styles.label}>Descripción</label>
                    <textarea
                      {...register(`boreholes.${boreholeIndex}.strata.${stratumIndex}.description`)}
                      className={styles.textarea}
                      rows={2}
                      placeholder="Descripción detallada del estrato"
                    />
                  </div>

                  <div className={styles.fieldRow}>
                    <div className={styles.field}>
                      <label className={styles.label}>Prof. Inicial (m)</label>
                      <input
                        type="number"
                        step="0.1"
                        {...register(`boreholes.${boreholeIndex}.strata.${stratumIndex}.initial_depth`, 
                          { valueAsNumber: true })}
                        className={styles.input}
                        min="0"
                      />
                    </div>

                    <div className={styles.field}>
                      <label className={styles.label}>Prof. Final (m)</label>
                      <input
                        type="number"
                        step="0.1"
                        {...register(`boreholes.${boreholeIndex}.strata.${stratumIndex}.final_depth`, 
                          { valueAsNumber: true })}
                        className={styles.input}
                        min="0"
                      />
                    </div>
                  </div>

                  <div className={styles.fieldRow}>
                    <div className={styles.field}>
                      <label className={styles.label}>γ Húmedo (kN/m³)</label>
                      <input
                        type="number"
                        step="0.1"
                        {...register(`boreholes.${boreholeIndex}.strata.${stratumIndex}.gamma_humid`, 
                          { valueAsNumber: true })}
                        className={styles.input}
                        min="10"
                        max="40"
                      />
                    </div>

                    <div className={styles.field}>
                      <label className={styles.label}>γ Saturado (kN/m³)</label>
                      <input
                        type="number"
                        step="0.1"
                        {...register(`boreholes.${boreholeIndex}.strata.${stratumIndex}.gamma_saturated`, 
                          { valueAsNumber: true })}
                        className={styles.input}
                        min="10"
                        max="40"
                      />
                    </div>
                  </div>

                  <div className={styles.fieldRow}>
                    <div className={styles.field}>
                      <label className={styles.label}>Comportamiento</label>
                      <select
                        {...register(`boreholes.${boreholeIndex}.strata.${stratumIndex}.behavior_type`)}
                        className={styles.select}
                      >
                        <option value="granular">Granular</option>
                        <option value="cohesive">Cohesivo</option>
                      </select>
                    </div>

                    {watch(`boreholes.${boreholeIndex}.strata.${stratumIndex}.behavior_type`) === 'cohesive' && (
                      <div className={styles.field}>
                        <label className={styles.label}>Índice de Plasticidad (%)</label>
                        <input
                          type="number"
                          step="0.1"
                          {...register(`boreholes.${boreholeIndex}.strata.${stratumIndex}.plasticity_index`, 
                            { valueAsNumber: true })}
                          className={styles.input}
                          min="0"
                          max="100"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Show errors for this stratum */}
                {errors.boreholes?.[boreholeIndex]?.strata?.[stratumIndex] && (
                  <div className={styles.stratumErrors}>
                    {Object.entries(errors.boreholes[boreholeIndex]?.strata?.[stratumIndex] || {}).map(([field, error]) => (
                      <p key={field} className={styles.error}>
                        {typeof error === 'object' && error && 'message' in error ? error.message : String(error)}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Summary Panel */}
      <div className={styles.summary}>
        <h4 className={styles.summaryTitle}>Resumen de Configuración</h4>
        <div className={styles.summaryContent}>
          <p><strong>Estado:</strong> {isValid ? '✅ Válido' : '❌ Revisar errores'}</p>
          <p><strong>Total de Perforaciones:</strong> {projectData.number_of_boreholes}</p>
          <p><strong>Estratos por Perforación:</strong></p>
          <ul className={styles.summaryList}>
            {tabState.tabs.map((tab, index) => (
              <li key={tab.id}>
                <strong>{watch(`boreholes.${index}.boreholeName`)}</strong>: {watch(`boreholes.${index}.strata`)?.length || 0} estratos
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default BoreholeStrataManager;