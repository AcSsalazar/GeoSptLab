/**
 * TypeScript types for SPT Project entities
 */

export const FormulationType = {
  KISHIDA: 'kishida',
  JRB: 'jrb'
} as const;

export type FormulationType = typeof FormulationType[keyof typeof FormulationType];

export interface Project {
  id: number;
  project_code: string;
  number_of_boreholes: number;
  number_of_strata: number;
  formulation: FormulationType;
  field_energy_percent: number;
  borehole_diameter?: number;
  rod_length?: number;
  water_table_depth?: number;
  created_at: string;
  updated_at: string;
}

export interface ProjectCreate {
  project_code: string;
  number_of_boreholes: number;
  number_of_strata: number;
  formulation: FormulationType;
  field_energy_percent: number;
  borehole_diameter?: number;
  rod_length?: number;
  water_table_depth?: number;
}

export interface ProjectWithDetails extends Project {
  strata: Stratum[];
  boreholes: Borehole[];
}

export const BehaviorType = {
  COHESIVE: 'cohesive',
  GRANULAR: 'granular'
} as const;

export type BehaviorType = typeof BehaviorType[keyof typeof BehaviorType];

export interface Stratum {
  id: number;
  project_id: number;
  stratum_code: string;
  description: string;
  initial_depth: number;
  final_depth: number;
  gamma_humid: number;
  gamma_saturated: number;
  behavior_type: BehaviorType;
  plasticity_index?: number;
}

export interface StratumCreate {
  project_id: number;
  stratum_code: string;
  description: string;
  initial_depth: number;
  final_depth: number;
  gamma_humid: number;
  gamma_saturated: number;
  behavior_type: BehaviorType;
  plasticity_index?: number;
}

export interface Borehole {
  id: number;
  project_id: number;
  borehole_name: string;
  final_depth: number;
  diameter_mm: number;
  field_energy_percent: number;
  rod_length: number;
}

export interface BoreholeCreate {
  project_id: number;
  borehole_name: string;
  final_depth: number;
  diameter_mm: number;
  field_energy_percent: number;
  rod_length: number;
}

export interface SPTInterval {
  id: number;
  borehole_id: number;
  stratum_id: number;
  depth_from: number;
  depth_to: number;
  midpoint_depth: number;
  nspt_field: number;
  description?: string;
}

export interface SPTIntervalCreate {
  borehole_id: number;
  stratum_id: number;
  depth_from: number;
  depth_to: number;
  nspt_field: number;
  description?: string;
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
  elastic_modulus?: number;
  tau_resistance?: number;
  su_undrained?: number;
}