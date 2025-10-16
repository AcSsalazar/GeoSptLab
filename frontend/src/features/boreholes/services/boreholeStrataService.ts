/**
 * 🔗 BOREHOLE-STRATA SERVICE - Asignar estratos a perforaciones con profundidades
 * 
 * ESTRUCTURA:
 * - BoreholeStratum relaciona un borehole con un stratum_definition
 * - Incluye initial_depth y final_depth específicos para esa perforación
 * 
 * ENDPOINTS:
 * - POST /borehole-strata/          → Crear asignación
 * - GET  /borehole-strata/borehole/{id} → Por perforación
 * - PUT  /borehole-strata/{id}      → Actualizar
 * - DELETE /borehole-strata/{id}    → Eliminar
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export interface BoreholeStratumCreate {
  borehole_id: number;
  stratum_definition_id: number;
  stratum_code: number; // Added: required by backend
  initial_depth: number;
  final_depth: number;
}

export interface BoreholeStratum extends BoreholeStratumCreate {
  id: number;
  created_at: string;
  updated_at: string;
}

export const boreholeStrataService = {
  /**
   * Crear una asignación borehole-stratum
   * POST /borehole-strata/
   */
  async create(boreholeStratum: BoreholeStratumCreate): Promise<BoreholeStratum> {
    const response = await axios.post(`${API_BASE_URL}/borehole-strata/`, boreholeStratum);
    return response.data;
  },

  /**
   * Crear múltiples asignaciones
   */
  async createMultiple(boreholeStrata: BoreholeStratumCreate[]): Promise<BoreholeStratum[]> {
    const promises = boreholeStrata.map(bs => boreholeStrataService.create(bs));
    return Promise.all(promises);
  },

  /**
   * Obtener asignaciones por perforación
   * GET /borehole-strata/borehole/{boreholeId}
   */
  async getByBorehole(boreholeId: number): Promise<BoreholeStratum[]> {
    const response = await axios.get(`${API_BASE_URL}/borehole-strata/borehole/${boreholeId}`);
    return response.data;
  },

  /**
   * Actualizar una asignación
   * PUT /borehole-strata/{id}
   */
  async update(id: number, data: Partial<BoreholeStratumCreate>): Promise<BoreholeStratum> {
    const response = await axios.put(`${API_BASE_URL}/borehole-strata/${id}`, data);
    return response.data;
  },

  /**
   * Eliminar una asignación
   * DELETE /borehole-strata/{id}
   */
  async delete(id: number): Promise<void> {
    await axios.delete(`${API_BASE_URL}/borehole-strata/${id}`);
  },
};
