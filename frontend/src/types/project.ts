/**
 * Project-related type definitions
 */

export interface Project {
  id: number;
  project_code: string;
  number_of_boreholes: number;
  number_of_strata: number;
  formulation: 'kishida' | 'jrb';
  field_energy_percent: number;
  borehole_diameter: number; // mm
  rod_length: number; // meters
  water_table_depth: number; // meters
  created_at: string;
  updated_at: string;
}

export interface ProjectCreate {
  project_code: string;
  number_of_boreholes: number;
  number_of_strata: number;
  formulation: 'kishida' | 'jrb';
  field_energy_percent: number;
  borehole_diameter: number;
  rod_length: number;
  water_table_depth: number;
}

export interface ProjectUpdate {
  project_code?: string;
  number_of_boreholes?: number;
  number_of_strata?: number;
  formulation?: 'kishida' | 'jrb';
  field_energy_percent?: number;
  borehole_diameter?: number;
  rod_length?: number;
  water_table_depth?: number;
}