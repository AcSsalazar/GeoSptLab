/**
 * 🌍 STRATA SERVICE - API calls para Stratum Definitions
 * 
 * ENDPOINTS:
 * - POST /stratum-definitions/     → Crear estratos
 * - GET  /stratum-definitions/     → Listar todos
 * - GET  /stratum-definitions/{id} → Ver uno
 * - PUT  /stratum-definitions/{id} → Actualizar
 * - DELETE /stratum-definitions/{id} → Eliminar
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export interface StratumCreate {
  project_id: number;
  stratum_code: string;
  name: string;
  description: string;
  gamma_humid: number;
  gamma_saturated: number;
  behavior_type: 'granular' | 'cohesive';
  plasticity_index?: number;
}

export interface Stratum extends StratumCreate {
  id: number;
  created_at: string;
  updated_at: string;
}

export const strataService = {
  /**
   * Crear múltiples estratos en batch
   * POST /stratum-definitions/bulk
   * 
   * Backend expects: { project_id: number, strata: StratumDefinitionBase[] }
   */
  async createBulk(strata: StratumCreate[]): Promise<Stratum[]> {
    if (strata.length === 0) {
      throw new Error('No strata to create');
    }
    
    // Extract project_id from first stratum (all should have same project_id)
    const project_id = strata[0].project_id;
    
    // Remove project_id from each stratum object (backend expects it at top level)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const strataWithoutProjectId = strata.map(({ project_id, ...rest }) => rest);
    
    // Build the request body according to backend schema
    const requestBody = {
      project_id,
      strata: strataWithoutProjectId
    };
    
    const response = await axios.post(`${API_BASE_URL}/stratum-definitions/bulk`, requestBody);
    return response.data;
  },

  /**
   * Crear un estrato individual
   * POST /stratum-definitions/
   */
  async create(stratum: StratumCreate): Promise<Stratum> {
    const response = await axios.post(`${API_BASE_URL}/stratum-definitions/`, stratum);
    return response.data;
  },

  /**
   * Obtener estratos por proyecto
   * GET /stratum-definitions/project/{projectId}
   */
  async getByProject(projectId: number): Promise<Stratum[]> {
    const response = await axios.get(`${API_BASE_URL}/stratum-definitions/project/${projectId}`);
    return response.data;
  },

  /**
   * Obtener todos los estratos
   * GET /stratum-definitions/
   */
  async getAll(): Promise<Stratum[]> {
    const response = await axios.get(`${API_BASE_URL}/stratum-definitions/`);
    return response.data;
  },

  /**
   * Obtener un estrato por ID
   * GET /stratum-definitions/{id}
   */
  async getById(id: number): Promise<Stratum> {
    const response = await axios.get(`${API_BASE_URL}/stratum-definitions/${id}`);
    return response.data;
  },

  /**
   * Actualizar un estrato
   * PUT /stratum-definitions/{id}
   */
  async update(id: number, data: Partial<StratumCreate>): Promise<Stratum> {
    const response = await axios.put(`${API_BASE_URL}/stratum-definitions/${id}`, data);
    return response.data;
  },

  /**
   * Eliminar un estrato
   * DELETE /stratum-definitions/{id}
   */
  async delete(id: number): Promise<void> {
    await axios.delete(`${API_BASE_URL}/stratum-definitions/${id}`);
  },
};
