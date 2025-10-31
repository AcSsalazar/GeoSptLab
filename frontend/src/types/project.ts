/**
 * TypeScript types for SPT Project entities
 */

export const StrataType = {
  CEVOL: 'Ceniza volcánica',
  DEPO: 'Depósito antrópico',
  HV: 'Horizonte V',
  HVI: 'Horizonte VI', 
  

} as const;

export type StrataType = typeof StrataType[keyof typeof StrataType]


export const FormulationType = {
  KISHIDA: 'kishida',
  JRB: 'jrb'
} as const;

export type FormulationType = typeof FormulationType[keyof typeof FormulationType];

export interface Project {
  id: number;
  project_name: string,
  project_code: string;
  number_of_boreholes: number;
  number_of_strata: number;
  formulation: FormulationType;
  created_at: string;
  updated_at: string;
}

export interface ProjectCreate {
  project_name: string;
  //project_code: string;
  number_of_boreholes: number;
  number_of_strata: number;
  formulation: FormulationType;

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
  name: string;
  description: string;
  gamma_humid: number;
  gamma_saturated: number;
  behavior_type: BehaviorType;
  plasticity_index?: number;
  created_at: string;
  updated_at: string;
}

export interface StratumCreate {
  project_id: number;
  stratum_code: string;  // Fixed: Should be string, not number
  name: string;
  description: string;
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
  water_table_depth?: number;
  formulation?: FormulationType;
  created_at: string;
  updated_at: string;
}

export interface BoreholeCreate {
  project_id: number;          // Fixed: Required field
  borehole_name: string;       // Fixed: Required field
  final_depth: number;
  diameter_mm: number;         // Fixed: Required field
  field_energy_percent: number; // Fixed: Required field
  water_table_depth?: number;
  formulation?: FormulationType;
}

export interface SPTInterval {
  id: number;
  project_id: number;
  borehole_id: number;
  borehole_stratum_id: number;  // Fixed: Uses borehole_stratum relationship
  depth_from: number;
  depth_to: number;
  midpoint_depth: number;
  nspt_field: number;
  created_at: string;
  updated_at: string;
}

export interface SPTIntervalCreate {
  borehole_stratum_id: number;  // Fixed: Uses borehole_stratum relationship
  depth_from: number;
  depth_to: number;
  nspt_field: number;
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
  elastic_modulus: number;   // Fixed: Backend always calculates this
  tau_resistance: number;    // Fixed: Backend always calculates this
  su_undrained: number;      // Fixed: Backend always calculates this
}

// === BOREHOLE-STRATUM RELATIONSHIP ===
// Added: This type was missing from central types file
export interface BoreholeStratumCreate {
  borehole_id: number;
  stratum_definition_id: number;
  stratum_code: string;  // ✅ Fixed: Should be string, not number
  initial_depth: number;
  final_depth: number;
}

export interface BoreholeStratum extends BoreholeStratumCreate {
  id: number;
  created_at: string;
  updated_at: string;
}