/**
 * Borehole-related type definitions
 */

export interface Borehole {
  id: number;
  project_id: number;
  borehole_name: string;
  final_depth: number; // meters
  diameter_mm: number; // millimeters
  field_energy_percent: number;
  rod_length: number; // meters
  created_at: string;
  updated_at: string;
}

export interface BoreholeCreate {
  project_id: number;
  borehole_name: string;
  final_depth: number;
  diameter_mm: number;
  field_energy_percent: number;
  rod_length: number;
}

export interface BoreholeUpdate {
  borehole_name?: string;
  final_depth?: number;
  diameter_mm?: number;
  field_energy_percent?: number;
  rod_length?: number;
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
  created_at: string;
  updated_at: string;
}

export interface SPTIntervalCreate {
  borehole_id: number;
  stratum_id: number;
  depth_from: number;
  depth_to: number;
  midpoint_depth: number;
  nspt_field: number;
  description?: string;
}