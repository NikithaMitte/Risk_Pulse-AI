import {
  User,
  Transaction,
  RiskAlert,
  AuditLog,
  DashboardSummary,
  RiskSettings
} from '../types';

const API_BASE = '/api';

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
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<{ message: string; email: string; email_verified: boolean; dev_link?: string }>(res);
  },

  async verifyEmail(token: string) {
    const res = await fetch(`${API_BASE}/auth/verify-email?token=${encodeURIComponent(token)}`);
    return handleResponse<{ success: boolean; message: string }>(res);
  },

  async resendVerification(email: string) {
    const res = await fetch(`${API_BASE}/auth/resend-verification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return handleResponse<{ message: string }>(res);
  },

  async login(data: { email: string; password: string }) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<{ access_token: string; user: User }>(res);
  },

  async forgotPassword(email: string) {
    const res = await fetch(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return handleResponse<{ message: string }>(res);
  },

  async resetPassword(token: string, new_password: string) {
    const res = await fetch(`${API_BASE}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, new_password }),
    });
    return handleResponse<{ message: string }>(res);
  },

  async getMe() {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeader(),
    });
    return handleResponse<User>(res);
  },

  // Dashboard Summary
  async getDashboardSummary() {
    const res = await fetch(`${API_BASE}/dashboard/summary`, {
      headers: getAuthHeader(),
    });
    return handleResponse<DashboardSummary>(res);
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
    return handleResponse<Transaction[]>(res);
  },

  async getTransactionDetail(idOrCode: string | number) {
    const res = await fetch(`${API_BASE}/transactions/${idOrCode}`, {
      headers: getAuthHeader(),
    });
    return handleResponse<Transaction>(res);
  },

  async approveTransaction(id: number, note?: string) {
    const res = await fetch(`${API_BASE}/transactions/${id}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ note: note || '' }),
    });
    return handleResponse<Transaction>(res);
  },

  async blockTransaction(id: number, note?: string) {
    const res = await fetch(`${API_BASE}/transactions/${id}/block`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ note: note || '' }),
    });
    return handleResponse<Transaction>(res);
  },

  async escalateTransaction(id: number, note?: string) {
    const res = await fetch(`${API_BASE}/transactions/${id}/escalate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ note: note || '' }),
    });
    return handleResponse<Transaction>(res);
  },

  // Alerts
  async getAlerts(statusFilter?: string) {
    const query = statusFilter ? `?status_filter=${statusFilter}` : '';
    const res = await fetch(`${API_BASE}/alerts${query}`, {
      headers: getAuthHeader(),
    });
    return handleResponse<RiskAlert[]>(res);
  },

  async resolveAlert(id: number, status: string = 'RESOLVED', note?: string) {
    const res = await fetch(`${API_BASE}/alerts/${id}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ status, note }),
    });
    return handleResponse<RiskAlert>(res);
  },

  // Risk Intelligence & Analytics
  async getRiskIntelligence() {
    const res = await fetch(`${API_BASE}/risk-intelligence`, {
      headers: getAuthHeader(),
    });
    return handleResponse<any>(res);
  },

  async getAnalytics(period: string = '7d') {
    const res = await fetch(`${API_BASE}/analytics?period=${period}`, {
      headers: getAuthHeader(),
    });
    return handleResponse<any>(res);
  },

  // Audit Log
  async getAuditLogs() {
    const res = await fetch(`${API_BASE}/audit-logs`, {
      headers: getAuthHeader(),
    });
    return handleResponse<AuditLog[]>(res);
  },

  // Settings
  async getRiskSettings() {
    const res = await fetch(`${API_BASE}/risk-settings`, {
      headers: getAuthHeader(),
    });
    return handleResponse<RiskSettings>(res);
  },

  async updateRiskSettings(settings: Record<string, string>) {
    const res = await fetch(`${API_BASE}/risk-settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ settings }),
    });
    return handleResponse<RiskSettings>(res);
  },
};
