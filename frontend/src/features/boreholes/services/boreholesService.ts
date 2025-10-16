/**
 * 🕳️ BOREHOLES SERVICE - API calls para Boreholes
 * 
 * ENDPOINTS:
 * - POST /boreholes/            → Crear perforación
 * - GET  /boreholes/            → Listar todas
 * - GET  /boreholes/{id}        → Ver una
 * - GET  /boreholes/project/{id} → Por proyecto
 * - PUT  /boreholes/{id}        → Actualizar
 * - DELETE /boreholes/{id}      → Eliminar
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export interface BoreholeCreate {
  project_id: number;
  borehole_name: string;
  final_depth: number;
  diameter_mm: number;
  field_energy_percent: number;
  water_table_depth?: number;
  formulation?: 'kishida' | 'jrb';
}

export interface Borehole extends BoreholeCreate {
  id: number;
  created_at: string;
  updated_at: string;
}

export const boreholesService = {
  /**
   * Crear una perforación
   * POST /boreholes/
   */
  async create(borehole: BoreholeCreate): Promise<Borehole> {
    const response = await axios.post(`${API_BASE_URL}/boreholes/`, borehole);
    return response.data;
  },

  /**
   * Crear múltiples perforaciones
   * (Loop de crear individual - backend no tiene bulk endpoint)
   */
  async createMultiple(boreholes: BoreholeCreate[]): Promise<Borehole[]> {
    const promises = boreholes.map(b => boreholesService.create(b));
    return Promise.all(promises);
  },

  /**
   * Obtener perforaciones por proyecto
   * GET /boreholes/project/{projectId}
   */
  async getByProject(projectId: number): Promise<Borehole[]> {
    const response = await axios.get(`${API_BASE_URL}/boreholes/project/${projectId}`);
    return response.data;
  },

  /**
   * Obtener todas las perforaciones
   * GET /boreholes/
   */
  async getAll(): Promise<Borehole[]> {
    const response = await axios.get(`${API_BASE_URL}/boreholes/`);
    return response.data;
  },

  /**
   * Obtener una perforación por ID
   * GET /boreholes/{id}
   */
  async getById(id: number): Promise<Borehole> {
    const response = await axios.get(`${API_BASE_URL}/boreholes/${id}`);
    return response.data;
  },

  /**
   * Actualizar una perforación
   * PUT /boreholes/{id}
   */
  async update(id: number, data: Partial<BoreholeCreate>): Promise<Borehole> {
    const response = await axios.put(`${API_BASE_URL}/boreholes/${id}`, data);
    return response.data;
  },

  /**
   * Eliminar una perforación
   * DELETE /boreholes/{id}
   */
  async delete(id: number): Promise<void> {
    await axios.delete(`${API_BASE_URL}/boreholes/${id}`);
  },
};
