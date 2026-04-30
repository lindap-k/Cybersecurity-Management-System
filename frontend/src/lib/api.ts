import type { AttackType, AuthUser, DashboardSummary, Department, Incident, LoginResponse, RoleOption, SystemAsset } from '@/types';
import { storage } from './storage';

const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';
const API_BASE_URL = rawApiBaseUrl
  .replace('http://localhost:5000/api', 'http://localhost:5001/api')
  .replace('http://127.0.0.1:5000/api', 'http://127.0.0.1:5001/api');

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = storage.getToken();
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }
  return data as T;
}

export const api = {
  health: () => request<{ status: string; service: string }>('/health'),
  login: (payload: { email: string; password: string }) => request<LoginResponse>('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  getRoles: () => request<RoleOption[]>('/roles'),
  getDepartments: () => request<Department[]>('/departments'),
  getAttackTypes: () => request<AttackType[]>('/attack-types'),
  getSystems: () => request<SystemAsset[]>('/systems'),
  getIncidents: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return request<Incident[]>(`/incidents${query}`);
  },
  updateIncident: (incidentId: number, payload: Partial<{
    title: string;
    description: string;
    severity: string;
    status: string;
    assigned_to: number | null;
    department_id: number | null;
    resolution_notes: string | null;
    attack_type_ids: number[];
    system_ids: number[];
  }>) => request<Incident>(`/incidents/${incidentId}`, { method: 'PUT', body: JSON.stringify(payload) }),
  assignIncident: (incidentId: number, assigned_to?: number) => request<Incident>(`/incidents/${incidentId}/assign`, {
    method: 'PATCH',
    body: JSON.stringify(assigned_to ? { assigned_to } : {}),
  }),
  createIncident: (payload: {
    title: string;
    description: string;
    severity: string;
    department_id?: number;
    attack_type_ids?: number[];
    system_ids?: number[];
  }) => request<Incident>('/incidents', { method: 'POST', body: JSON.stringify(payload) }),
  getDashboardSummary: () => request<DashboardSummary>('/dashboard/summary'),
  getUsers: () => request<AuthUser[]>('/users'),
  createUser: (payload: {
    name: string;
    email: string;
    password: string;
    role: string;
    department_id?: number;
  }) => request<AuthUser>('/users', { method: 'POST', body: JSON.stringify(payload) }),
  deleteUser: (userId: number) => request<{ message: string }>(`/users/${userId}`, { method: 'DELETE' }),
};
