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
const toNum = (val: unknown): number => {
  if (typeof val === 'number') return val;
  if (typeof val === 'string') return parseFloat(val);
  return 0;
};

// Transformer functions
const transformCalculatedResult = (res: unknown): CalculatedResult => {
  const r = res as Record<string, unknown>;
  return {
    ...(r as unknown as CalculatedResult),
    sigma_prime: toNum(r.sigma_prime),
    cb_factor: toNum(r.cb_factor),
    cs_factor: toNum(r.cs_factor),
    cr_factor: toNum(r.cr_factor),
    cn_factor: toNum(r.cn_factor),
    n45: toNum(r.n45),
    n55: toNum(r.n55),
    n60: toNum(r.n60),
    n145: toNum(r.n145),
    phi_prime_eq: toNum(r.phi_prime_eq),
    elastic_modulus: toNum(r.elastic_modulus),
    tau_resistance: toNum(r.tau_resistance),
    su_undrained: toNum(r.su_undrained),
  };
};

const transformRegressionData = (data: unknown): RegressionData => {
  const d = data as Record<string, unknown>;
  return {
    ...(d as unknown as RegressionData),
    slope: toNum(d.slope),
    intercept: toNum(d.intercept),
    r_squared: toNum(d.r_squared),
    phi_degrees: toNum(d.phi_degrees),
    cohesion: toNum(d.cohesion),
    data_points: toNum(d.data_points),
  };
};

const transformStatisticalSummary = (data: unknown): StatisticalSummary => {
  const d = data as Record<string, unknown>;
  return {
    ...(d as unknown as StatisticalSummary),
    count: toNum(d.count),
    phi_mean: toNum(d.phi_mean),
    phi_std: toNum(d.phi_std),
    phi_lower: toNum(d.phi_lower),
    phi_upper: toNum(d.phi_upper),
    modulus_mean: toNum(d.modulus_mean),
    modulus_std: toNum(d.modulus_std),
    modulus_lower: toNum(d.modulus_lower),
    modulus_upper: toNum(d.modulus_upper),
  };
};

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
