/**
 * 📊 SPT INTERVALS SERVICE - Datos de ensayos SPT
 * 
 * ENDPOINTS:
 * - POST /spt-intervals/            → Crear intervalo
 * - GET  /spt-intervals/project/{id} → Por proyecto
 * - GET  /spt-intervals/{id}        → Ver uno
 * - PUT  /spt-intervals/{id}        → Actualizar
 * - DELETE /spt-intervals/{id}      → Eliminar
 */

import axios from 'axios';
import type { SPTInterval, SPTIntervalCreate } from '@/types/project';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export const sptIntervalsService = {
  /**
   * Crear un intervalo SPT
   * POST /spt-intervals/
   */
  async create(interval: SPTIntervalCreate): Promise<SPTInterval> {
    const response = await axios.post(`${API_BASE_URL}/spt-intervals/`, interval);
    return response.data;
  },

  /**
   * Crear múltiples intervalos
   */
  async createMultiple(intervals: SPTIntervalCreate[]): Promise<SPTInterval[]> {
    const promises = intervals.map(i => sptIntervalsService.create(i));
    return Promise.all(promises);
  },

  /**
   * Obtener intervalos por proyecto
   * GET /spt-intervals/project/{projectId}
   */
  async getByProject(projectId: number): Promise<SPTInterval[]> {
    const response = await axios.get(`${API_BASE_URL}/spt-intervals/project/${projectId}`);
    return response.data;
  },

  /**
   * Obtener un intervalo por ID
   * GET /spt-intervals/{id}
   */
  async getById(id: number): Promise<SPTInterval> {
    const response = await axios.get(`${API_BASE_URL}/spt-intervals/${id}`);
    return response.data;
  },

  /**
   * Actualizar un intervalo
   * PUT /spt-intervals/{id}
   */
  async update(id: number, data: Partial<SPTIntervalCreate>): Promise<SPTInterval> {
    const response = await axios.put(`${API_BASE_URL}/spt-intervals/${id}`, data);
    return response.data;
  },

  /**
   * Eliminar un intervalo
   * DELETE /spt-intervals/{id}
   */
  async delete(id: number): Promise<void> {
    await axios.delete(`${API_BASE_URL}/spt-intervals/${id}`);
  },
};
