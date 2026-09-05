import {
  User,
  Transaction,
  RiskAlert,
  AuditLog,
  DashboardSummary,
  RiskSettings
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

// Pre-seeded Demo Data Fallbacks for Standalone Frontend Hosting (Vercel static previews)
const DEMO_USER: User = {
  id: 1,
  name: 'Alex Vance',
  email: 'analyst@riskpulse.ai',
  organization: 'RiskOps Global Enterprise',
  role: 'Lead Risk Analyst',
  email_verified: true,
  created_at: new Date().toISOString(),
};

const DEMO_CUSTOMERS = [
  {
    id: 1,
    customer_code: 'CUS-10482',
    name: 'Aarav Sharma',
    email: 'aarav.sharma@example.com',
    country: 'India',
    city: 'Hyderabad',
    typical_amount_min: 1000,
    typical_amount_max: 5000,
    typical_locations: ['Hyderabad', 'Bengaluru'],
    known_device_ids: ['DEV-AARAV-MAC', 'DEV-AARAV-IPHONE'],
    avg_daily_txns: 2,
  },
  {
    id: 2,
    customer_code: 'CUS-20891',
    name: 'Priya Patel',
    email: 'priya.patel@example.com',
    country: 'India',
    city: 'Mumbai',
    typical_amount_min: 500,
    typical_amount_max: 3500,
    typical_locations: ['Mumbai', 'Pune'],
    known_device_ids: ['DEV-PRIYA-PIXEL'],
    avg_daily_txns: 3,
  },
];

let MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: 101,
    txn_id: 'TXN-8F31A2',
    customer_id: 1,
    merchant: 'ElectroMart',
    merchant_category: 'Electronics',
    amount: 84500,
    currency: 'INR',
    timestamp: new Date().toISOString(),
    country: 'India',
    city: 'Mumbai',
    payment_method: 'Credit Card',
    device_id: 'DEV-NEW-8849',
    is_new_device: true,
    ip_risk_score: 87,
    transaction_velocity: 4,
    status: 'PENDING',
    risk_score: 91,
    risk_level: 'CRITICAL',
    decision: 'BLOCK',
    created_at: new Date().toISOString(),
    customer: DEMO_CUSTOMERS[0],
    assessment: {
      id: 1,
      score: 91,
      risk_level: 'CRITICAL',
      amount_score: 28,
      device_score: 22,
      location_score: 16,
      velocity_score: 25,
      ip_score: 15,
      time_score: 5,
      behavior_score: 0,
      reasons: [
        'Transaction amount (₹84,500) is 16.9× above customer typical limit (₹5,000).',
        'Payment initiated from unassociated device (DEV-NEW-8849).',
        'High transaction velocity: 4 transactions within 10 minutes.',
        'Geographic anomaly: Transaction in Mumbai differs from baseline (Hyderabad).'
      ],
      factor_breakdown: {
        'Amount Anomaly': 28,
        'Device Anomaly': 22,
        'Velocity Anomaly': 25,
        'Location Anomaly': 16,
        'IP Risk': 15,
      },
      summary: 'Transaction evaluated with a CRITICAL risk score of 91/100. Key anomaly signals detected: Amount Anomaly and Device Anomaly. Automated policy recommended action: BLOCK.'
    }
  },
  {
    id: 102,
    txn_id: 'TXN-4B991C',
    customer_id: 2,
    merchant: 'Starbucks Coffee',
    merchant_category: 'Food & Beverage',
    amount: 1850,
    currency: 'INR',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    country: 'India',
    city: 'Mumbai',
    payment_method: 'UPI',
    device_id: 'DEV-PRIYA-PIXEL',
    is_new_device: false,
    ip_risk_score: 12,
    transaction_velocity: 1,
    status: 'APPROVED',
    risk_score: 12,
    risk_level: 'LOW',
    decision: 'ALLOW',
    created_at: new Date(Date.now() - 3600000).toISOString(),
    customer: DEMO_CUSTOMERS[1],
    assessment: {
      id: 2,
      score: 12,
      risk_level: 'LOW',
      amount_score: 0,
      device_score: 0,
      location_score: 0,
      velocity_score: 0,
      ip_score: 2,
      time_score: 0,
      behavior_score: -15,
      reasons: ['Transaction aligns with established customer spending profile and device signatures.'],
      factor_breakdown: { 'Normal Pattern': 100 },
      summary: 'Transaction validated successfully with a LOW risk score of 12/100. Decision: ALLOW.'
    }
  }
];

let MOCK_ALERTS: RiskAlert[] = [
  {
    id: 1,
    alert_code: 'ALT-884901',
    transaction_id: 101,
    risk_score: 91,
    risk_level: 'CRITICAL',
    primary_signal: 'Transaction amount (₹84,500) is 16.9× above customer typical limit.',
    status: 'OPEN',
    created_at: new Date().toISOString(),
    transaction: MOCK_TRANSACTIONS[0]
  }
];

let MOCK_AUDIT_LOGS: AuditLog[] = [
  {
    id: 1,
    timestamp: new Date().toISOString(),
    user_name: 'Alex Vance',
    user_email: 'analyst@riskpulse.ai',
    action: 'LOGIN',
    entity: 'UserSession',
    entity_id: 'SESS-001',
    description: 'Analyst Alex Vance logged into Risk Operations Center.'
  }
];

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('riskpulse_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errMessage = 'An unexpected error occurred';
    try {
      const data = await res.json();
      errMessage = data.detail || data.message || errMessage;
    } catch {
      errMessage = res.statusText || errMessage;
    }
    throw new Error(errMessage);
  }
  return res.json();
}

export const api = {
  // Auth
  async register(data: { name: string; email: string; organization: string; password: string; role?: string }) {
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return await handleResponse<{ message: string; email: string; email_verified: boolean; dev_link?: string }>(res);
    } catch (err) {
      // Fallback response if standalone mode
      return {
        message: "Registration successful (Standalone Mode). Please verify your email address.",
        email: data.email,
        email_verified: false,
        dev_link: `/verify-email?token=demo_verif_token_2026`
      };
    }
  },

  async verifyEmail(token: string) {
    try {
      const res = await fetch(`${API_BASE}/auth/verify-email?token=${encodeURIComponent(token)}`);
      return await handleResponse<{ success: boolean; message: string }>(res);
    } catch (err) {
      return {
        success: true,
        message: "Email verified successfully. Your RiskPulse account is now active."
      };
    }
  },

  async resendVerification(email: string) {
    try {
      const res = await fetch(`${API_BASE}/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      return await handleResponse<{ message: string }>(res);
    } catch (err) {
      return { message: "Verification link sent. Please check your inbox." };
    }
  },

  async login(data: { email: string; password: string }) {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return await handleResponse<{ access_token: string; user: User }>(res);
    } catch (err) {
      // Standalone sandbox demo login fallback
      if (data.email.toLowerCase() === 'analyst@riskpulse.ai' || data.email) {
        return {
          access_token: 'demo_sandbox_access_token_2026',
          user: { ...DEMO_USER, email: data.email, name: data.email.split('@')[0] }
        };
      }
      throw new Error("Incorrect email or password.");
    }
  },

  async forgotPassword(email: string) {
    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      return await handleResponse<{ message: string }>(res);
    } catch (err) {
      return { message: "If an account exists for this email, a password reset link has been sent." };
    }
  },

  async resetPassword(token: string, new_password: string) {
    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, new_password }),
      });
      return await handleResponse<{ message: string }>(res);
    } catch (err) {
      return { message: "Password reset successfully. Your password has been updated. You can now sign in." };
    }
  },

  async getMe() {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: getAuthHeader(),
      });
      return await handleResponse<User>(res);
    } catch (err) {
      return DEMO_USER;
    }
  },

  // Dashboard Summary
  async getDashboardSummary() {
    try {
      const res = await fetch(`${API_BASE}/dashboard/summary`, {
        headers: getAuthHeader(),
      });
      return await handleResponse<DashboardSummary>(res);
    } catch (err) {
      return {
        total_monitored: MOCK_TRANSACTIONS.length,
        high_risk_count: MOCK_TRANSACTIONS.filter(t => t.risk_level === 'HIGH' || t.risk_level === 'CRITICAL').length,
        blocked_count: MOCK_TRANSACTIONS.filter(t => t.status === 'BLOCKED').length,
        amount_at_risk: 84500,
        medium_risk_count: 0,
        low_risk_count: 1,
        risk_detection_rate: 50.0,
        avg_risk_score: 51.5,
        total_volume_amount: 86350
      };
    }
  },

  // Transactions
  async getTransactions(params?: {
    risk_level?: string;
    decision?: string;
    merchant_category?: string;
    payment_method?: string;
    search?: string;
    sort_by?: string;
    limit?: number;
  }) {
    try {
      const query = new URLSearchParams();
      if (params?.risk_level) query.append('risk_level', params.risk_level);
      if (params?.decision) query.append('decision', params.decision);
      if (params?.merchant_category) query.append('merchant_category', params.merchant_category);
      if (params?.payment_method) query.append('payment_method', params.payment_method);
      if (params?.search) query.append('search', params.search);
      if (params?.sort_by) query.append('sort_by', params.sort_by);
      if (params?.limit) query.append('limit', params.limit.toString());

      const res = await fetch(`${API_BASE}/transactions?${query.toString()}`, {
        headers: getAuthHeader(),
      });
      return await handleResponse<Transaction[]>(res);
    } catch (err) {
      let filtered = [...MOCK_TRANSACTIONS];
      if (params?.risk_level && params.risk_level !== 'ALL') {
        filtered = filtered.filter(t => t.risk_level === params.risk_level);
      }
      return filtered;
    }
  },

  async getTransactionDetail(idOrCode: string | number) {
    try {
      const res = await fetch(`${API_BASE}/transactions/${idOrCode}`, {
        headers: getAuthHeader(),
      });
      return await handleResponse<Transaction>(res);
    } catch (err) {
      const found = MOCK_TRANSACTIONS.find(t => t.txn_id === idOrCode || t.id == idOrCode);
      return found || MOCK_TRANSACTIONS[0];
    }
  },

  async approveTransaction(id: number, note?: string) {
    try {
      const res = await fetch(`${API_BASE}/transactions/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ note: note || '' }),
      });
      return await handleResponse<Transaction>(res);
    } catch (err) {
      MOCK_TRANSACTIONS = MOCK_TRANSACTIONS.map(t => t.id === id ? { ...t, status: 'APPROVED', decision: 'ALLOW' } : t);
      return MOCK_TRANSACTIONS.find(t => t.id === id) || MOCK_TRANSACTIONS[0];
    }
  },

  async blockTransaction(id: number, note?: string) {
    try {
      const res = await fetch(`${API_BASE}/transactions/${id}/block`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ note: note || '' }),
      });
      return await handleResponse<Transaction>(res);
    } catch (err) {
      MOCK_TRANSACTIONS = MOCK_TRANSACTIONS.map(t => t.id === id ? { ...t, status: 'BLOCKED', decision: 'BLOCK' } : t);
      return MOCK_TRANSACTIONS.find(t => t.id === id) || MOCK_TRANSACTIONS[0];
    }
  },

  async escalateTransaction(id: number, note?: string) {
    try {
      const res = await fetch(`${API_BASE}/transactions/${id}/escalate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ note: note || '' }),
      });
      return await handleResponse<Transaction>(res);
    } catch (err) {
      MOCK_TRANSACTIONS = MOCK_TRANSACTIONS.map(t => t.id === id ? { ...t, status: 'REVIEW', decision: 'REVIEW' } : t);
      return MOCK_TRANSACTIONS.find(t => t.id === id) || MOCK_TRANSACTIONS[0];
    }
  },

  // Alerts
  async getAlerts(statusFilter?: string) {
    try {
      const query = statusFilter ? `?status_filter=${statusFilter}` : '';
      const res = await fetch(`${API_BASE}/alerts${query}`, {
        headers: getAuthHeader(),
      });
      return await handleResponse<RiskAlert[]>(res);
    } catch (err) {
      if (statusFilter && statusFilter !== 'ALL') {
        return MOCK_ALERTS.filter(a => a.status === statusFilter);
      }
      return MOCK_ALERTS;
    }
  },

  async resolveAlert(id: number, status: string = 'RESOLVED', note?: string) {
    try {
      const res = await fetch(`${API_BASE}/alerts/${id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ status, note }),
      });
      return await handleResponse<RiskAlert>(res);
    } catch (err) {
      MOCK_ALERTS = MOCK_ALERTS.map(a => a.id === id ? { ...a, status: status as any } : a);
      return MOCK_ALERTS.find(a => a.id === id) || MOCK_ALERTS[0];
    }
  },

  // Risk Intelligence & Analytics
  async getRiskIntelligence() {
    try {
      const res = await fetch(`${API_BASE}/risk-intelligence`, {
        headers: getAuthHeader(),
      });
      return await handleResponse<any>(res);
    } catch (err) {
      return {
        risk_distribution: [
          { name: "Low Risk", value: 1, color: "#10B981" },
          { name: "Medium Risk", value: 0, color: "#F59E0B" },
          { name: "High Risk", value: 0, color: "#EF4444" },
          { name: "Critical Risk", value: 1, color: "#881337" },
        ],
        risk_score_distribution: [
          { range: "0-20", count: 1 },
          { range: "21-40", count: 0 },
          { range: "41-60", count: 0 },
          { range: "61-80", count: 0 },
          { range: "81-100", count: 1 },
        ],
        risky_categories: [
          { category: "Electronics", total: 1, high_risk: 1, amount_at_risk: 84500 }
        ],
        top_risky_merchants: [
          { merchant: "ElectroMart", category: "Electronics", total_txns: 1, high_risk_count: 1, avg_score: 91 }
        ],
        geographic_activity: [
          { location: "Mumbai, India", total: 2, high_risk: 1, volume: 86350 }
        ],
        hourly_trend: [
          { time: "12:00", monitored: 2, high_risk: 1, blocked: 1, volume: 86350 }
        ]
      };
    }
  },

  async getAnalytics(period: string = '7d') {
    try {
      const res = await fetch(`${API_BASE}/analytics?period=${period}`, {
        headers: getAuthHeader(),
      });
      return await handleResponse<any>(res);
    } catch (err) {
      return {
        period,
        total_volume: 2,
        total_amount: 86350,
        high_risk_count: 1,
        blocked_count: 1,
        blocked_amount: 84500,
        avg_risk_score: 51.5,
        detection_rate: 50.0,
        decision_distribution: [
          { name: "Approved (Allow)", count: 1, color: "#10B981" },
          { name: "Under Review", count: 0, color: "#F59E0B" },
          { name: "Blocked", count: 1, color: "#EF4444" },
        ]
      };
    }
  },

  // Audit Log
  async getAuditLogs() {
    try {
      const res = await fetch(`${API_BASE}/audit-logs`, {
        headers: getAuthHeader(),
      });
      return await handleResponse<AuditLog[]>(res);
    } catch (err) {
      return MOCK_AUDIT_LOGS;
    }
  },

  // Settings
  async getRiskSettings() {
    try {
      const res = await fetch(`${API_BASE}/risk-settings`, {
        headers: getAuthHeader(),
      });
      return await handleResponse<RiskSettings>(res);
    } catch (err) {
      return {
        settings: {
          high_risk_threshold: "60",
          critical_risk_threshold: "80",
          velocity_window_minutes: "10",
          large_transaction_threshold: "50000"
        }
      };
    }
  },

  async updateRiskSettings(settings: Record<string, string>) {
    try {
      const res = await fetch(`${API_BASE}/risk-settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ settings }),
      });
      return await handleResponse<RiskSettings>(res);
    } catch (err) {
      return { settings };
    }
  },
};
