/**
 * Calculation-related type definitions
 */

export interface CalculatedResult {
  id: number;
  spt_interval_id: number;
  sigma_prime?: number;
  cb_factor?: number;
  cs_factor?: number;
  cr_factor?: number;
  cn_factor?: number;
  n45?: number;
  n55?: number;
  n60?: number;
  n145?: number;
  phi_prime_eq?: number; // degrees
  elastic_modulus?: number; // kPa
  tau_resistance?: number; // kPa
  su_undrained?: number; // kPa
  created_at: string;
  updated_at: string;
}

export interface CalculationRequest {
  project_id: number;
  recalculate_all?: boolean;
}

export interface CalculationResponse {
  project_id: number;
  calculated_intervals: number;
  success: boolean;
  message: string;
}

export interface CalculationSummary {
  project_id: number;
  total_intervals: number;
  calculated_intervals: number;
  pending_intervals: number;
  calculation_complete: boolean;
  statistics: {
    n60_avg?: number;
    n60_min?: number;
    n60_max?: number;
    phi_avg?: number;
    phi_min?: number;
    phi_max?: number;
  };
}

// Form wizard step types
export type WizardStep = 'project' | 'strata' | 'boreholes' | 'results';

export interface WizardData {
  project?: ProjectCreate;
  strata?: StratumCreate[];
  boreholes?: BoreholeCreate[];
  sptIntervals?: SPTIntervalCreate[];
}

// Import other types
import { ProjectCreate } from './project';
import { StratumCreate } from './stratum';
import { BoreholeCreate, SPTIntervalCreate } from './borehole';