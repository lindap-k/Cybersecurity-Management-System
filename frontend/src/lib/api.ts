import type { AttackType, DashboardSummary, Incident, LoginResponse, SystemAsset } from '@/types';
import { storage } from './storage';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

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
  getAttackTypes: () => request<AttackType[]>('/attack-types'),
  getSystems: () => request<SystemAsset[]>('/systems'),
  getIncidents: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return request<Incident[]>(`/incidents${query}`);
  },
  createIncident: (payload: {
    title: string;
    description: string;
    severity: string;
    department_id?: number;
    attack_type_ids?: number[];
    system_ids?: number[];
  }) => request<Incident>('/incidents', { method: 'POST', body: JSON.stringify(payload) }),
  getDashboardSummary: () => request<DashboardSummary>('/dashboard/summary'),
};
