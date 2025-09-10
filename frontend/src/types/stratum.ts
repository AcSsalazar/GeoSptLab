/**
 * Stratum-related type definitions
 */

export interface Stratum {
  id: number;
  project_id: number;
  stratum_code: string;
  description?: string;
  initial_depth: number; // meters
  final_depth: number; // meters
  gamma_humid: number; // kN/m³
  gamma_saturated: number; // kN/m³
  behavior_type: 'cohesive' | 'granular';
  plasticity_index?: number;
  created_at: string;
  updated_at: string;
}

export interface StratumCreate {
  project_id: number;
  stratum_code: string;
  description?: string;
  initial_depth: number;
  final_depth: number;
  gamma_humid: number;
  gamma_saturated: number;
  behavior_type: 'cohesive' | 'granular';
  plasticity_index?: number;
}

export interface StratumUpdate {
  stratum_code?: string;
  description?: string;
  initial_depth?: number;
  final_depth?: number;
  gamma_humid?: number;
  gamma_saturated?: number;
  behavior_type?: 'cohesive' | 'granular';
  plasticity_index?: number;
}