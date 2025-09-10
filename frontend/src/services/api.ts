/**
 * API service for communicating with the backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

// Generic API error
export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

// Generic fetch wrapper
async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new ApiError(response.status, errorText || `HTTP ${response.status}`);
  }

  return response.json();
}

// Project API
export const projectApi = {
  list: () => apiFetch<Project[]>('/projects'),
  
  get: (id: number) => apiFetch<Project>(`/projects/${id}`),
  
  getByCode: (code: string) => apiFetch<Project>(`/projects/code/${code}`),
  
  getDetails: (id: number) => apiFetch<ProjectWithRelations>(`/projects/${id}/details`),
  
  create: (project: ProjectCreate) => 
    apiFetch<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify(project),
    }),
  
  update: (id: number, project: ProjectUpdate) =>
    apiFetch<Project>(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(project),
    }),
  
  delete: (id: number) =>
    apiFetch<{message: string}>(`/projects/${id}`, {
      method: 'DELETE',
    }),
};

// Stratum API
export const stratumApi = {
  create: (stratum: StratumCreate) =>
    apiFetch<Stratum>('/strata', {
      method: 'POST',
      body: JSON.stringify(stratum),
    }),
  
  update: (id: number, stratum: StratumUpdate) =>
    apiFetch<Stratum>(`/strata/${id}`, {
      method: 'PUT',
      body: JSON.stringify(stratum),
    }),
  
  delete: (id: number) =>
    apiFetch<{message: string}>(`/strata/${id}`, {
      method: 'DELETE',
    }),
};

// Borehole API
export const boreholeApi = {
  create: (borehole: BoreholeCreate) =>
    apiFetch<Borehole>('/boreholes', {
      method: 'POST',
      body: JSON.stringify(borehole),
    }),
  
  update: (id: number, borehole: BoreholeUpdate) =>
    apiFetch<Borehole>(`/boreholes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(borehole),
    }),
  
  delete: (id: number) =>
    apiFetch<{message: string}>(`/boreholes/${id}`, {
      method: 'DELETE',
    }),
};

// SPT Interval API
export const sptIntervalApi = {
  create: (interval: SPTIntervalCreate) =>
    apiFetch<SPTInterval>('/spt-intervals', {
      method: 'POST',
      body: JSON.stringify(interval),
    }),
  
  update: (id: number, interval: Partial<SPTIntervalCreate>) =>
    apiFetch<SPTInterval>(`/spt-intervals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(interval),
    }),
  
  delete: (id: number) =>
    apiFetch<{message: string}>(`/spt-intervals/${id}`, {
      method: 'DELETE',
    }),
};

// Calculation API
export const calculationApi = {
  calculate: (request: CalculationRequest) =>
    apiFetch<CalculationResponse>('/calculations/calculate', {
      method: 'POST',
      body: JSON.stringify(request),
    }),
  
  getProjectResults: (projectId: number) =>
    apiFetch<CalculatedResult[]>(`/calculations/project/${projectId}/results`),
  
  getIntervalResult: (intervalId: number) =>
    apiFetch<CalculatedResult>(`/calculations/interval/${intervalId}/result`),
};

// Health check
export const healthApi = {
  check: () => apiFetch<{status: string; message: string; version: string}>('/health'),
};

// Type imports
import { 
  Project, 
  ProjectCreate, 
  ProjectUpdate 
} from '../types/project';
import { 
  Stratum, 
  StratumCreate, 
  StratumUpdate 
} from '../types/stratum';
import { 
  Borehole, 
  BoreholeCreate, 
  BoreholeUpdate,
  SPTInterval,
  SPTIntervalCreate 
} from '../types/borehole';
import { 
  CalculatedResult,
  CalculationRequest,
  CalculationResponse 
} from '../types/calculations';

// Extended project type with relations (should match backend schema)
interface ProjectWithRelations extends Project {
  strata?: Stratum[];
  boreholes?: Borehole[];
}