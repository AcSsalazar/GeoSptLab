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
import type { BoreholeStratum, BoreholeStratumCreate } from '@/types/project';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

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

  /**
   * Eliminar todas las asignaciones de un borehole
   * Helper function for re-submission
   */
  async deleteByBorehole(boreholeId: number): Promise<void> {
    const assignments = await this.getByBorehole(boreholeId);
    await Promise.all(assignments.map(a => this.delete(a.id)));
  },

  /**
   * Obtener todas las asignaciones de múltiples boreholes
   * Helper para cargar todos los strata de un proyecto
   */
  async getByBoreholes(boreholeIds: number[]): Promise<BoreholeStratum[]> {
    const promises = boreholeIds.map(id => this.getByBorehole(id));
    const results = await Promise.all(promises);
    return results.flat(); // Flatten array of arrays
  },
};
