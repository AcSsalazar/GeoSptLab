/**
 * 🧮 CALCULATIONS SERVICE - Cálculos de parámetros SPT
 * 
 * ENDPOINTS:
 * - POST /calculations/project/{id}/calculate → Calcular parámetros
 * - GET  /calculations/project/{id}/results   → Ver resultados
 * - GET  /calculations/interval/{id}/result   → Ver resultado de intervalo
 */

import axios from 'axios';
import type { CalculatedResult } from '@/types/project';
import type {
  CalculationRequest,
  CalculationResponse,
  ProjectResultsResponse,
} from '@/types/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export const calculationsService = {
  /**
   * Calcular parámetros SPT para un proyecto
   * POST /calculations/project/{projectId}/calculate
   */
  async calculateProject(
    projectId: number, 
    options: CalculationRequest = {}
  ): Promise<CalculationResponse> {
    const response = await axios.post(
      `${API_BASE_URL}/calculations/project/${projectId}/calculate`,
      options
    );
    return response.data;
  },

  /**
   * Obtener resultados calculados de un proyecto con análisis de regresión
   * GET /calculations/project/{projectId}/results
   */
  async getProjectResults(projectId: number): Promise<ProjectResultsResponse> {
    const response = await axios.get(`${API_BASE_URL}/calculations/project/${projectId}/results`);
    return response.data;
  },

  /**
   * Obtener resultado de un intervalo específico
   * GET /calculations/interval/{intervalId}/result
   */
  async getIntervalResult(intervalId: number): Promise<CalculatedResult> {
    const response = await axios.get(`${API_BASE_URL}/calculations/interval/${intervalId}/result`);
    return response.data;
  },

  /**
   * Eliminar resultados de un proyecto
   * DELETE /calculations/project/{projectId}/results
   */
  async deleteProjectResults(projectId: number): Promise<void> {
    await axios.delete(`${API_BASE_URL}/calculations/project/${projectId}/results`);
  },
};
