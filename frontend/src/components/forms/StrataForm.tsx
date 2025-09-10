/**
 * Strata definition form component
 */
import React, { useState, useEffect } from 'react';
import { StratumCreate } from '../../types/stratum';
import { ProjectCreate } from '../../types/project';

interface StrataFormProps {
  projectData?: ProjectCreate;
  initialData: StratumCreate[];
  onSubmit: (data: StratumCreate[]) => void;
  onBack: () => void;
}

const StrataForm: React.FC<StrataFormProps> = ({
  projectData,
  initialData,
  onSubmit,
  onBack
}) => {
  const [strata, setStrata] = useState<StratumCreate[]>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Initialize with empty strata based on project configuration
    if (strata.length === 0 && projectData) {
      const newStrata = Array.from({ length: projectData.number_of_strata }, (_, i) => ({
        project_id: 0, // Will be set when project is created
        stratum_code: `E${i + 1}`,
        description: `Estrato ${i + 1}`,
        initial_depth: i * 2,
        final_depth: (i + 1) * 2,
        gamma_humid: 18,
        gamma_saturated: 20,
        behavior_type: 'granular' as const,
        plasticity_index: undefined
      }));
      setStrata(newStrata);
    }
  }, [projectData, strata.length]);

  const validateStrata = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    strata.forEach((stratum, index) => {
      if (!stratum.stratum_code.trim()) {
        newErrors[`${index}_code`] = 'Código de estrato requerido';
      }
      
      if (stratum.final_depth <= stratum.initial_depth) {
        newErrors[`${index}_depths`] = 'Profundidad final debe ser mayor que inicial';
      }
      
      if (stratum.gamma_humid <= 0 || stratum.gamma_humid > 40) {
        newErrors[`${index}_gamma_humid`] = 'Peso unitario húmedo debe estar entre 0 y 40 kN/m³';
      }
      
      if (stratum.gamma_saturated <= 0 || stratum.gamma_saturated > 40) {
        newErrors[`${index}_gamma_saturated`] = 'Peso unitario saturado debe estar entre 0 y 40 kN/m³';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const updateStratum = (index: number, field: keyof StratumCreate, value: any) => {
    const newStrata = [...strata];
    newStrata[index] = { ...newStrata[index], [field]: value };
    setStrata(newStrata);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStrata()) {
      onSubmit(strata);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="strata-form">
      <div className="strata-list">
        {strata.map((stratum, index) => (
          <div key={index} className="stratum-card">
            <h4>Estrato {index + 1}</h4>
            
            <div className="form-grid">
              <div className="form-group">
                <label>Código</label>
                <input
                  type="text"
                  value={stratum.stratum_code}
                  onChange={(e) => updateStratum(index, 'stratum_code', e.target.value)}
                  className={errors[`${index}_code`] ? 'error' : ''}
                />
                {errors[`${index}_code`] && <span className="error-text">{errors[`${index}_code`]}</span>}
              </div>

              <div className="form-group">
                <label>Descripción</label>
                <input
                  type="text"
                  value={stratum.description || ''}
                  onChange={(e) => updateStratum(index, 'description', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Profundidad inicial (m)</label>
                <input
                  type="number"
                  value={stratum.initial_depth}
                  onChange={(e) => updateStratum(index, 'initial_depth', parseFloat(e.target.value))}
                  step="0.1"
                />
              </div>

              <div className="form-group">
                <label>Profundidad final (m)</label>
                <input
                  type="number"
                  value={stratum.final_depth}
                  onChange={(e) => updateStratum(index, 'final_depth', parseFloat(e.target.value))}
                  step="0.1"
                  className={errors[`${index}_depths`] ? 'error' : ''}
                />
                {errors[`${index}_depths`] && <span className="error-text">{errors[`${index}_depths`]}</span>}
              </div>

              <div className="form-group">
                <label>γh (kN/m³)</label>
                <input
                  type="number"
                  value={stratum.gamma_humid}
                  onChange={(e) => updateStratum(index, 'gamma_humid', parseFloat(e.target.value))}
                  step="0.1"
                  className={errors[`${index}_gamma_humid`] ? 'error' : ''}
                />
                {errors[`${index}_gamma_humid`] && <span className="error-text">{errors[`${index}_gamma_humid`]}</span>}
              </div>

              <div className="form-group">
                <label>γsat (kN/m³)</label>
                <input
                  type="number"
                  value={stratum.gamma_saturated}
                  onChange={(e) => updateStratum(index, 'gamma_saturated', parseFloat(e.target.value))}
                  step="0.1"
                  className={errors[`${index}_gamma_saturated`] ? 'error' : ''}
                />
                {errors[`${index}_gamma_saturated`] && <span className="error-text">{errors[`${index}_gamma_saturated`]}</span>}
              </div>

              <div className="form-group">
                <label>Tipo de comportamiento</label>
                <select
                  value={stratum.behavior_type}
                  onChange={(e) => updateStratum(index, 'behavior_type', e.target.value as 'cohesive' | 'granular')}
                >
                  <option value="granular">Granular</option>
                  <option value="cohesive">Cohesivo</option>
                </select>
              </div>

              {stratum.behavior_type === 'cohesive' && (
                <div className="form-group">
                  <label>Índice de plasticidad (%)</label>
                  <input
                    type="number"
                    value={stratum.plasticity_index || ''}
                    onChange={(e) => updateStratum(index, 'plasticity_index', e.target.value ? parseFloat(e.target.value) : undefined)}
                    step="0.1"
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="form-actions">
        <button type="button" onClick={onBack} className="btn-secondary">
          Anterior
        </button>
        <button type="submit" className="btn-primary">
          Siguiente
        </button>
      </div>
    </form>
  );
};

export default StrataForm;