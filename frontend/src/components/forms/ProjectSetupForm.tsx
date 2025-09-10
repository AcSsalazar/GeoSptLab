/**
 * Project setup form component
 */
import React, { useState, useEffect } from 'react';
import { ProjectCreate } from '../../types/project';

interface ProjectSetupFormProps {
  initialData?: ProjectCreate;
  onSubmit: (data: ProjectCreate) => void;
  onCancel?: () => void;
}

const ProjectSetupForm: React.FC<ProjectSetupFormProps> = ({
  initialData,
  onSubmit,
  onCancel
}) => {
  const [formData, setFormData] = useState<ProjectCreate>({
    project_code: '',
    number_of_boreholes: 1,
    number_of_strata: 1,
    formulation: 'kishida',
    field_energy_percent: 45,
    borehole_diameter: 150, // mm
    rod_length: 6, // meters
    water_table_depth: 3, // meters
    ...initialData
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({ ...prev, ...initialData }));
    }
  }, [initialData]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.project_code.trim()) {
      newErrors.project_code = 'Código de proyecto es requerido';
    }

    if (formData.number_of_boreholes < 1 || formData.number_of_boreholes > 100) {
      newErrors.number_of_boreholes = 'Número de perforaciones debe estar entre 1 y 100';
    }

    if (formData.number_of_strata < 1 || formData.number_of_strata > 50) {
      newErrors.number_of_strata = 'Número de estratos debe estar entre 1 y 50';
    }

    if (formData.field_energy_percent <= 0 || formData.field_energy_percent > 200) {
      newErrors.field_energy_percent = 'Energía de campo debe estar entre 0 y 200%';
    }

    if (formData.borehole_diameter < 50 || formData.borehole_diameter > 500) {
      newErrors.borehole_diameter = 'Diámetro debe estar entre 50 y 500 mm';
    }

    if (formData.rod_length <= 0 || formData.rod_length > 100) {
      newErrors.rod_length = 'Longitud de varilla debe estar entre 0 y 100 metros';
    }

    if (formData.water_table_depth < 0 || formData.water_table_depth > 200) {
      newErrors.water_table_depth = 'Nivel freático debe estar entre 0 y 200 metros';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleInputChange = (field: keyof ProjectCreate, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="project-setup-form">
      <div className="form-grid">
        <div className="form-group">
          <label htmlFor="project_code">Código del Proyecto *</label>
          <input
            type="text"
            id="project_code"
            value={formData.project_code}
            onChange={(e) => handleInputChange('project_code', e.target.value)}
            placeholder="Ej: CP-00630"
            className={errors.project_code ? 'error' : ''}
          />
          {errors.project_code && <span className="error-text">{errors.project_code}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="formulation">Formulación *</label>
          <select
            id="formulation"
            value={formData.formulation}
            onChange={(e) => handleInputChange('formulation', e.target.value as 'kishida' | 'jrb')}
          >
            <option value="kishida">Kishida</option>
            <option value="jrb">JRB</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="number_of_boreholes">Número de Perforaciones *</label>
          <input
            type="number"
            id="number_of_boreholes"
            value={formData.number_of_boreholes}
            onChange={(e) => handleInputChange('number_of_boreholes', parseInt(e.target.value))}
            min="1"
            max="100"
            className={errors.number_of_boreholes ? 'error' : ''}
          />
          {errors.number_of_boreholes && <span className="error-text">{errors.number_of_boreholes}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="number_of_strata">Número de Estratos *</label>
          <input
            type="number"
            id="number_of_strata"
            value={formData.number_of_strata}
            onChange={(e) => handleInputChange('number_of_strata', parseInt(e.target.value))}
            min="1"
            max="50"
            className={errors.number_of_strata ? 'error' : ''}
          />
          {errors.number_of_strata && <span className="error-text">{errors.number_of_strata}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="field_energy_percent">Energía de Campo (%)</label>
          <input
            type="number"
            id="field_energy_percent"
            value={formData.field_energy_percent}
            onChange={(e) => handleInputChange('field_energy_percent', parseFloat(e.target.value))}
            min="0"
            max="200"
            step="0.1"
            className={errors.field_energy_percent ? 'error' : ''}
          />
          {errors.field_energy_percent && <span className="error-text">{errors.field_energy_percent}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="borehole_diameter">Diámetro de Perforación (mm)</label>
          <input
            type="number"
            id="borehole_diameter"
            value={formData.borehole_diameter}
            onChange={(e) => handleInputChange('borehole_diameter', parseFloat(e.target.value))}
            min="50"
            max="500"
            className={errors.borehole_diameter ? 'error' : ''}
          />
          {errors.borehole_diameter && <span className="error-text">{errors.borehole_diameter}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="rod_length">Longitud de Varilla (m)</label>
          <input
            type="number"
            id="rod_length"
            value={formData.rod_length}
            onChange={(e) => handleInputChange('rod_length', parseFloat(e.target.value))}
            min="0"
            max="100"
            step="0.1"
            className={errors.rod_length ? 'error' : ''}
          />
          {errors.rod_length && <span className="error-text">{errors.rod_length}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="water_table_depth">Nivel Freático (m)</label>
          <input
            type="number"
            id="water_table_depth"
            value={formData.water_table_depth}
            onChange={(e) => handleInputChange('water_table_depth', parseFloat(e.target.value))}
            min="0"
            max="200"
            step="0.1"
            className={errors.water_table_depth ? 'error' : ''}
          />
          {errors.water_table_depth && <span className="error-text">{errors.water_table_depth}</span>}
        </div>
      </div>

      <div className="form-actions">
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn-secondary">
            Cancelar
          </button>
        )}
        <button type="submit" className="btn-primary">
          Siguiente
        </button>
      </div>
    </form>
  );
};

export default ProjectSetupForm;