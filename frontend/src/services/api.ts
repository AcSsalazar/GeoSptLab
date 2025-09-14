/**
 * API service for SPT Parameters Calculator
 */
import axios from 'axios';
import type{
  Project,
  ProjectCreate,
  ProjectWithDetails,
  Stratum,
  StratumCreate,
  Borehole,
  BoreholeCreate,
  SPTInterval,
  SPTIntervalCreate,
  CalculatedResult
} from '../types/project';

const API_BASE_URL = 'http://localhost:8000/api/v1';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Project API
export const projectAPI = {
  // Get all projects
  getAll: async (): Promise<Project[]> => {
    const response = await api.get('/projects/');
    return response.data;
  },

  // Get project by ID
  getById: async (id: number): Promise<Project> => {
    const response = await api.get(`/projects/${id}`);
    return response.data;
  },

  // Get project with details (strata and boreholes)
  getWithDetails: async (id: number): Promise<ProjectWithDetails> => {
    const response = await api.get(`/projects/${id}/details`);
    return response.data;
  },

  // Create new project
  create: async (projectData: ProjectCreate): Promise<Project> => {
    const response = await api.post('/projects/', projectData);
    return response.data;
  },

  // Update project
  update: async (id: number, projectData: Partial<ProjectCreate>): Promise<Project> => {
    const response = await api.put(`/projects/${id}`, projectData);
    return response.data;
  },

  // Delete project
  delete: async (id: number): Promise<void> => {
    await api.delete(`/projects/${id}`);
  },
};

// Strata API
export const strataAPI = {
  // Get strata for project
  getByProject: async (projectId: number): Promise<Stratum[]> => {
    const response = await api.get(`/strata/project/${projectId}`);
    return response.data;
  },

  // Get stratum by ID
  getById: async (id: number): Promise<Stratum> => {
    const response = await api.get(`/strata/${id}`);
    return response.data;
  },

  // Create new stratum
  create: async (stratumData: StratumCreate): Promise<Stratum> => {
    const response = await api.post('/strata/', stratumData);
    return response.data;
  },

  // Update stratum
  update: async (id: number, stratumData: Partial<StratumCreate>): Promise<Stratum> => {
    const response = await api.put(`/strata/${id}`, stratumData);
    return response.data;
  },

  // Delete stratum
  delete: async (id: number): Promise<void> => {
    await api.delete(`/strata/${id}`);
  },

  // Get stratum at specific depth
  getAtDepth: async (projectId: number, depth: number): Promise<Stratum> => {
    const response = await api.get(`/strata/project/${projectId}/depth/${depth}`);
    return response.data;
  },
};

// Boreholes API
export const boreholesAPI = {
  // Get boreholes for project
  getByProject: async (projectId: number): Promise<Borehole[]> => {
    const response = await api.get(`/boreholes/project/${projectId}`);
    return response.data;
  },

  // Get borehole by ID
  getById: async (id: number): Promise<Borehole> => {
    const response = await api.get(`/boreholes/${id}`);
    return response.data;
  },

  // Create new borehole
  create: async (boreholeData: BoreholeCreate): Promise<Borehole> => {
    const response = await api.post('/boreholes/', boreholeData);
    return response.data;
  },

  // Update borehole
  update: async (id: number, boreholeData: Partial<BoreholeCreate>): Promise<Borehole> => {
    const response = await api.put(`/boreholes/${id}`, boreholeData);
    return response.data;
  },

  // Delete borehole
  delete: async (id: number): Promise<void> => {
    await api.delete(`/boreholes/${id}`);
  },
};

// SPT Intervals API
export const sptIntervalsAPI = {
  // Get intervals for project
  getByProject: async (projectId: number): Promise<SPTInterval[]> => {
    const response = await api.get(`/spt-intervals/project/${projectId}`);
    return response.data;
  },

  // Get intervals for borehole
  getByBorehole: async (boreholeId: number): Promise<SPTInterval[]> => {
    const response = await api.get(`/spt-intervals/borehole/${boreholeId}`);
    return response.data;
  },

  // Get interval by ID
  getById: async (id: number): Promise<SPTInterval> => {
    const response = await api.get(`/spt-intervals/${id}`);
    return response.data;
  },

  // Create new interval
  create: async (intervalData: SPTIntervalCreate): Promise<SPTInterval> => {
    const response = await api.post('/spt-intervals/', intervalData);
    return response.data;
  },

  // Update interval
  update: async (id: number, intervalData: Partial<SPTIntervalCreate>): Promise<SPTInterval> => {
    const response = await api.put(`/spt-intervals/${id}`, intervalData);
    return response.data;
  },

  // Delete interval
  delete: async (id: number): Promise<void> => {
    await api.delete(`/spt-intervals/${id}`);
  },
};

// Calculations API
export const calculationsAPI = {
  // Calculate SPT parameters for project
  calculateProject: async (projectId: number, recalculateAll = false): Promise<{ 
    project_id: number; 
    calculated_intervals: number; 
    updated_intervals: number; 
    message: string; 
  }> => {
    const response = await api.post('/calculations/calculate', {
      project_id: projectId,
      recalculate_all: recalculateAll
    });
    return response.data;
  },

  // Get calculated results for project
  getProjectResults: async (projectId: number): Promise<CalculatedResult[]> => {
    const response = await api.get(`/calculations/project/${projectId}/results`);
    return response.data;
  },

  // Get result for specific interval
  getIntervalResult: async (intervalId: number): Promise<CalculatedResult> => {
    const response = await api.get(`/calculations/interval/${intervalId}/result`);
    return response.data;
  },

  // Calculate single interval
  calculateInterval: async (intervalId: number): Promise<CalculatedResult> => {
    const response = await api.post(`/calculations/interval/${intervalId}/calculate`);
    return response.data;
  },

  // Delete project results
  deleteProjectResults: async (projectId: number): Promise<void> => {
    await api.delete(`/calculations/project/${projectId}/results`);
  },
};

// Health check
export const healthCheck = async (): Promise<{ status: string; message: string; version: string }> => {
  const response = await api.get('/health');
  return response.data;
};