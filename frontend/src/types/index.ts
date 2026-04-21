export interface AuthUser {
  user_id: number;
  name: string;
  email: string;
  role: string | null;
  department: string | null;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export interface AttackType {
  attack_type_id: number;
  name: string;
  mitre_code?: string | null;
  description?: string | null;
}

export interface SystemAsset {
  system_id: number;
  system_name: string;
  criticality_level: string;
  owner_id?: number | null;
}

export interface Incident {
  incident_id: number;
  title: string;
  description: string;
  severity: string;
  status: string;
  reported_by: string | null;
  assigned_to: string | null;
  department: string | null;
  reported_at: string | null;
  resolved_at: string | null;
  attack_types: AttackType[];
  systems: SystemAsset[];
}

export interface DashboardSummary {
  cards: {
    total_incidents: number;
    open_incidents: number;
    critical_incidents: number;
    resolved_incidents: number;
    avg_resolution_hours: number | null;
  };
  incidents_by_severity: { severity: string; count: number }[];
  incidents_by_status: { status: string; count: number }[];
}
