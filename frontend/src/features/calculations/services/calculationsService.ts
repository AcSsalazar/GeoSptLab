/*
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
  RegressionData,
  StatisticalSummary
} from '@/types/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

// Helper to safely convert string/number to number
const toNum = (val: any): number => {
  if (typeof val === 'number') return val;
  if (typeof val === 'string') return parseFloat(val);
  return 0;
};

// Transformer functions
const transformCalculatedResult = (res: any): CalculatedResult => ({
  ...res,
  sigma_prime: toNum(res.sigma_prime),
  cb_factor: toNum(res.cb_factor),
  cs_factor: toNum(res.cs_factor),
  cr_factor: toNum(res.cr_factor),
  cn_factor: toNum(res.cn_factor),
  n45: toNum(res.n45),
  n55: toNum(res.n55),
  n60: toNum(res.n60),
  n145: toNum(res.n145),
  phi_prime_eq: toNum(res.phi_prime_eq),
  elastic_modulus: toNum(res.elastic_modulus),
  tau_resistance: toNum(res.tau_resistance),
  su_undrained: toNum(res.su_undrained),
});

const transformRegressionData = (data: any): RegressionData => ({
  ...data,
  slope: toNum(data.slope),
  intercept: toNum(data.intercept),
  r_squared: toNum(data.r_squared),
  phi_degrees: toNum(data.phi_degrees),
  cohesion: toNum(data.cohesion),
  data_points: toNum(data.data_points),
});

const transformStatisticalSummary = (data: any): StatisticalSummary => ({
  ...data,
  count: toNum(data.count),
  phi_mean: toNum(data.phi_mean),
  phi_std: toNum(data.phi_std),
  phi_lower: toNum(data.phi_lower),
  phi_upper: toNum(data.phi_upper),
  modulus_mean: toNum(data.modulus_mean),
  modulus_std: toNum(data.modulus_std),
  modulus_lower: toNum(data.modulus_lower),
  modulus_upper: toNum(data.modulus_upper),
});

export const calculationsService = {

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
    const data = response.data;

    // Transform raw data (strings) to numbers
    return {
      results: data.results.map(transformCalculatedResult),
      regression_by_stratum: Object.entries(data.regression_by_stratum).reduce((acc, [key, val]) => ({
        ...acc,
        [key]: transformRegressionData(val)
      }), {}),
      statistical_summary_by_stratum: Object.entries(data.statistical_summary_by_stratum).reduce((acc, [key, val]) => ({
        ...acc,
        [key]: transformStatisticalSummary(val)
      }), {})
    };
  },

  /**
   * Obtener resultado de un intervalo específico
   * GET /calculations/interval/{intervalId}/result
   */
  async getIntervalResult(intervalId: number): Promise<CalculatedResult> {
    const response = await axios.get(`${API_BASE_URL}/calculations/interval/${intervalId}/result`);
    return transformCalculatedResult(response.data);
  },

  /**
   * Eliminar resultados de un proyecto
   * DELETE /calculations/project/{projectId}/results
   */
  async deleteProjectResults(projectId: number): Promise<void> {
    await axios.delete(`${API_BASE_URL}/calculations/project/${projectId}/results`);
  },
};
