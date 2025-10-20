/**
 * 🧮 CALCULATIONS SERVICE - Cálculos de parámetros SPT
 * 
 * ENDPOINTS:
 * - POST /calculations/project/{id}/calculate → Calcular parámetros
 * - GET  /calculations/project/{id}/results   → Ver resultados
 * - GET  /calculations/interval/{id}/result   → Ver resultado de intervalo
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export interface CalculationRequest {
  recalculate_all?: boolean;
}

export interface CalculationResponse {
  project_id: number;
  calculated_intervals: number;
  updated_intervals: number;
  message: string;
}

export interface CalculatedResult {
  id: number;
  spt_interval_id: number;
  sigma_prime: number;
  cb_factor: number;
  cs_factor: number;
  cr_factor: number;
  cn_factor: number;
  n45: number;
  n55: number;
  n60: number;
  n145: number;
  phi_prime_eq: number;
  elastic_modulus: number;
  tau_resistance: number;
  su_undrained: number;
}

export interface RegressionData {
  slope: number;
  intercept: number;
  r_squared: number;
  phi_degrees: number;
  cohesion: number;
  equation: string;
  data_points: number;
}

export interface StatisticalSummary {
  count: number;
  phi_mean: number;
  phi_std: number;
  phi_lower: number;
  phi_upper: number;
  modulus_mean: number;
  modulus_std: number;
  modulus_lower: number;
  modulus_upper: number;
}

export interface ProjectResultsResponse {
  results: CalculatedResult[];
  regression_by_stratum: Record<number, RegressionData>;
  statistical_summary_by_stratum: Record<number, StatisticalSummary>;
}

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
