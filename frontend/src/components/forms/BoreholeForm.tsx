/**
 * Borehole and SPT intervals form component
 */
import React, { useState, useEffect } from 'react';
import { BoreholeCreate, SPTIntervalCreate } from '../../types/borehole';
import { StratumCreate } from '../../types/stratum';
import { ProjectCreate } from '../../types/project';

interface BoreholeFormProps {
  projectData?: ProjectCreate;
  strataData: StratumCreate[];
  initialData: BoreholeCreate[];
  onSubmit: (boreholes: BoreholeCreate[], intervals: SPTIntervalCreate[]) => void;
  onBack: () => void;
}

const BoreholeForm: React.FC<BoreholeFormProps> = ({
  projectData,
  strataData,
  initialData,
  onSubmit,
  onBack
}) => {
  const [boreholes, setBoreholes] = useState<BoreholeCreate[]>(initialData);
  const [sptIntervals, setSptIntervals] = useState<SPTIntervalCreate[]>([]);
  const [selectedBorehole, setSelectedBorehole] = useState<number>(0);

  useEffect(() => {
    // Initialize boreholes based on project configuration
    if (boreholes.length === 0 && projectData) {
      const newBoreholes = Array.from({ length: projectData.number_of_boreholes }, (_, i) => ({
        project_id: 0,
        borehole_name: `S-${i + 1}`,
        final_depth: 15,
        diameter_mm: projectData.borehole_diameter,
        field_energy_percent: projectData.field_energy_percent,
        rod_length: projectData.rod_length
      }));
      setBoreholes(newBoreholes);
    }
  }, [projectData, boreholes.length]);

  const updateBorehole = (index: number, field: keyof BoreholeCreate, value: any) => {
    const newBoreholes = [...boreholes];
    newBoreholes[index] = { ...newBoreholes[index], [field]: value };
    setBoreholes(newBoreholes);
  };

  const addSptInterval = () => {
    if (selectedBorehole >= 0) {
      const newInterval: SPTIntervalCreate = {
        borehole_id: selectedBorehole,
        stratum_id: 0,
        depth_from: 0,
        depth_to: 0.45,
        midpoint_depth: 0.225,
        nspt_field: 10,
        description: ''
      };
      setSptIntervals(prev => [...prev, newInterval]);
    }
  };

  const updateSptInterval = (index: number, field: keyof SPTIntervalCreate, value: any) => {
    const newIntervals = [...sptIntervals];
    newIntervals[index] = { ...newIntervals[index], [field]: value };
    
    // Auto-calculate midpoint when depths change
    if (field === 'depth_from' || field === 'depth_to') {
      const interval = newIntervals[index];
      interval.midpoint_depth = (interval.depth_from + interval.depth_to) / 2;
    }
    
    setSptIntervals(newIntervals);
  };

  const removeSptInterval = (index: number) => {
    setSptIntervals(prev => prev.filter((_, i) => i !== index));
  };

  const getIntervalsByBorehole = (boreholeIndex: number) => {
    return sptIntervals.filter(interval => interval.borehole_id === boreholeIndex);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(boreholes, sptIntervals);
  };

  return (
    <form onSubmit={handleSubmit} className="borehole-form">
      {/* Boreholes Configuration */}
      <div className="boreholes-section">
        <h3>Configuración de Perforaciones</h3>
        <div className="boreholes-grid">
          {boreholes.map((borehole, index) => (
            <div key={index} className="borehole-card">
              <h4>Perforación {index + 1}</h4>
              
              <div className="form-group">
                <label>Nombre</label>
                <input
                  type="text"
                  value={borehole.borehole_name}
                  onChange={(e) => updateBorehole(index, 'borehole_name', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Profundidad final (m)</label>
                <input
                  type="number"
                  value={borehole.final_depth}
                  onChange={(e) => updateBorehole(index, 'final_depth', parseFloat(e.target.value))}
                  step="0.1"
                />
              </div>

              <div className="form-group">
                <label>Diámetro (mm)</label>
                <input
                  type="number"
                  value={borehole.diameter_mm}
                  onChange={(e) => updateBorehole(index, 'diameter_mm', parseFloat(e.target.value))}
                />
              </div>

              <div className="form-group">
                <label>Energía (%)</label>
                <input
                  type="number"
                  value={borehole.field_energy_percent}
                  onChange={(e) => updateBorehole(index, 'field_energy_percent', parseFloat(e.target.value))}
                  step="0.1"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SPT Intervals */}
      <div className="intervals-section">
        <div className="section-header">
          <h3>Intervalos SPT</h3>
          <div className="controls">
            <select 
              value={selectedBorehole} 
              onChange={(e) => setSelectedBorehole(parseInt(e.target.value))}
            >
              {boreholes.map((borehole, index) => (
                <option key={index} value={index}>
                  {borehole.borehole_name}
                </option>
              ))}
            </select>
            <button type="button" onClick={addSptInterval} className="btn-add">
              Agregar Intervalo
            </button>
          </div>
        </div>

        <div className="intervals-list">
          {sptIntervals.length === 0 && (
            <p className="no-intervals">No hay intervalos SPT definidos</p>
          )}
          
          {sptIntervals.map((interval, index) => (
            <div key={index} className="interval-card">
              <div className="card-header">
                <h5>Intervalo {index + 1} - {boreholes[interval.borehole_id]?.borehole_name}</h5>
                <button 
                  type="button" 
                  onClick={() => removeSptInterval(index)}
                  className="btn-remove"
                >
                  ×
                </button>
              </div>
              
              <div className="form-grid">
                <div className="form-group">
                  <label>Estrato</label>
                  <select
                    value={interval.stratum_id}
                    onChange={(e) => updateSptInterval(index, 'stratum_id', parseInt(e.target.value))}
                  >
                    <option value={0}>Seleccionar estrato</option>
                    {strataData.map((stratum, stratumIndex) => (
                      <option key={stratumIndex} value={stratumIndex}>
                        {stratum.stratum_code} ({stratum.initial_depth}m - {stratum.final_depth}m)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Desde (m)</label>
                  <input
                    type="number"
                    value={interval.depth_from}
                    onChange={(e) => updateSptInterval(index, 'depth_from', parseFloat(e.target.value))}
                    step="0.1"
                  />
                </div>

                <div className="form-group">
                  <label>Hasta (m)</label>
                  <input
                    type="number"
                    value={interval.depth_to}
                    onChange={(e) => updateSptInterval(index, 'depth_to', parseFloat(e.target.value))}
                    step="0.1"
                  />
                </div>

                <div className="form-group">
                  <label>Punto medio (m)</label>
                  <input
                    type="number"
                    value={interval.midpoint_depth}
                    readOnly
                    className="readonly"
                  />
                </div>

                <div className="form-group">
                  <label>N SPT (campo)</label>
                  <input
                    type="number"
                    value={interval.nspt_field}
                    onChange={(e) => updateSptInterval(index, 'nspt_field', parseInt(e.target.value))}
                    min="0"
                  />
                </div>

                <div className="form-group full-width">
                  <label>Descripción</label>
                  <input
                    type="text"
                    value={interval.description || ''}
                    onChange={(e) => updateSptInterval(index, 'description', e.target.value)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
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

export default BoreholeForm;