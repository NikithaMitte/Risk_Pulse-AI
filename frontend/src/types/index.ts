export interface User {
  id: number;
  name: string;
  email: string;
  organization: string;
  role: string;
  created_at: string;
}

export interface Customer {
  id: number;
  customer_code: string;
  name: string;
  email: string;
  country: string;
  city: string;
  typical_amount_min: number;
  typical_amount_max: number;
  typical_locations: string[];
  known_device_ids: string[];
  avg_daily_txns: number;
}

export interface RiskAssessment {
  id: number;
  score: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  amount_score: number;
  device_score: number;
  location_score: number;
  velocity_score: number;
  ip_score: number;
  time_score: number;
  behavior_score: number;
  reasons: string[];
  factor_breakdown: Record<string, number>;
  summary?: string;
}

export interface Transaction {
  id: number;
  txn_id: string;
  customer_id: number;
  merchant: string;
  merchant_category: string;
  amount: number;
  currency: string;
  timestamp: string;
  country: string;
  city: string;
  payment_method: string;
  device_id: string;
  is_new_device: boolean;
  ip_risk_score: number;
  transaction_velocity: number;
  status: 'PENDING' | 'APPROVED' | 'BLOCKED' | 'REVIEW';
  risk_score: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  decision: 'ALLOW' | 'REVIEW' | 'BLOCK';
  created_at: string;
  customer?: Customer;
  assessment?: RiskAssessment;
}

export interface RiskAlert {
  id: number;
  alert_code: string;
  transaction_id: number;
  risk_score: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  primary_signal: string;
  status: 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED';
  created_at: string;
  resolved_at?: string;
  resolved_by?: string;
  transaction?: Transaction;
}

export interface AuditLog {
  id: number;
  timestamp: string;
  user_name: string;
  user_email: string;
  action: string;
  entity: string;
  entity_id: string;
  description: string;
}

export interface DashboardSummary {
  total_monitored: number;
  high_risk_count: number;
  blocked_count: number;
  amount_at_risk: number;
  medium_risk_count: number;
  low_risk_count: number;
  risk_detection_rate: number;
  avg_risk_score: number;
  total_volume_amount: number;
}

export interface RiskSettings {
  settings: Record<string, string>;
}
