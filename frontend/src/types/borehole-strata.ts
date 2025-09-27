/**
 * TypeScript interfaces for borehole-specific strata management
 * Hybrid approach that works with existing backend while providing tab-based UX
 */

import type { Project, Stratum, StratumCreate, Borehole, BoreholeCreate } from './project';

/**
 * Interface for managing strata within a specific borehole context
 * This maps to existing backend Stratum model but organized by borehole
 */
export interface BoreholeStratumAssignment {
  boreholeIndex: number;
  boreholeName: string;
  assignedStrata: {
    stratumId?: number; // Existing stratum ID if already created
    stratum: StratumCreate; // Stratum data
    depthInBorehole: {
      initialDepth: number; // Depth where this stratum starts in THIS borehole
      finalDepth: number;   // Depth where this stratum ends in THIS borehole
    };
  }[];
}

/**
 * Interface for the complete borehole-strata form data
 */
export interface BoreholeStrataFormData {
  projectData: Project;
  boreholeAssignments: BoreholeStratumAssignment[];
}

/**
 * Interface for the tab-based form state
 */
export interface BoreholeTabState {
  activeTab: number;
  tabs: {
    id: number;
    name: string;
    isValid: boolean;
    strataCount: number;
    strata: StratumCreate[];
  }[];
}

/**
 * Payload structure for backend submission
 * Transforms tab-based data into backend-compatible format
 */
export interface BoreholeStrataSubmissionPayload {
  // First, create all unique strata (project-level)
  projectStrata: StratumCreate[];
  
  // Then, create boreholes
  boreholes: (BoreholeCreate & {
    strataAssignments: {
      stratumCode: number; // References the project stratum
      depthFrom: number;   // Depth in this specific borehole
      depthTo: number;     // Depth in this specific borehole
    }[];
  })[];
}

/**
 * Helper interface for stratum depth management across boreholes
 */
export interface StratumDepthRange {
  stratumCode: number;
  name: string;
  description: string;
  behavior_type: 'cohesive' | 'granular';
  gamma_humid: number;
  gamma_saturated: number;
  plasticity_index?: number;
  
  // Depth ranges per borehole
  boreholeDepths: {
    boreholeIndex: number;
    boreholeName: string;
    initialDepth: number;
    finalDepth: number;
    isPresent: boolean; // Some strata might not exist in all boreholes
  }[];
}