/**
 * API-specific types for SPT Application
 * 
 * These types represent API request/response structures
 * that are specific to service layer operations.
 */

import type { CalculatedResult } from './project';

// === CALCULATION SERVICE TYPES ===

export interface CalculationRequest {
  recalculate_all?: boolean;
}

export interface CalculationResponse {
  project_id: number;
  
  calculated_intervals: number;
  updated_intervals: number;
  message: string;
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
  regression_by_stratum: Record<string, RegressionData>;
  statistical_summary_by_stratum: Record<string, StatisticalSummary>;
}
