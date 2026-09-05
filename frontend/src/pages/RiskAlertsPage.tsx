import React, { useState, useEffect } from 'react';
import {
  Bell,
  CheckCircle,
  AlertTriangle,
  Clock,
  ChevronRight,
  Filter,
  ShieldAlert,
  Search,
  Check
} from 'lucide-react';
import { RiskAlert } from '../types';
import { api } from '../services/api';

interface RiskAlertsPageProps {
  onNavigate: (view: string, param?: string) => void;
}

export const RiskAlertsPage: React.FC<RiskAlertsPageProps> = ({ onNavigate }) => {
  const [alerts, setAlerts] = useState<RiskAlert[]>([]);
  const [statusFilter, setStatusFilter] = useState('OPEN');
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState<number | null>(null);

  useEffect(() => {
    async function loadAlerts() {
      try {
        setLoading(true);
        const res = await api.getAlerts(statusFilter);
        setAlerts(res);
      } catch (err) {
        console.error("Failed to load risk alerts:", err);
      } finally {
        setLoading(false);
      }
    }
    loadAlerts();
  }, [statusFilter]);

  const handleResolveAlert = async (id: number) => {
    try {
      setResolvingId(id);
      await api.resolveAlert(id, 'RESOLVED', 'Resolved after risk officer inspection.');
      setAlerts((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error("Failed to resolve alert:", err);
    } finally {
      setResolvingId(null);
    }
  };

  const getSeverityBadge = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return <span className="px-2.5 py-0.5 rounded text-xs font-extrabold bg-rose-950 text-rose-300 border border-rose-700">CRITICAL</span>;
      case 'HIGH':
        return <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">HIGH</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">MEDIUM</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Active Risk Alerts</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time security notifications for anomalous high-value and high-velocity payments.
          </p>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-900 border border-slate-800 self-start sm:self-auto">
          {['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'ALL'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                statusFilter === st
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400">Loading risk alerts stream...</div>
      ) : alerts.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-slate-800 rounded-2xl space-y-3">
          <CheckCircle className="h-10 w-10 text-emerald-400 mx-auto" />
          <h3 className="text-base font-bold text-white">No Risk Alerts Found</h3>
          <p className="text-xs text-slate-400">There are currently no alerts matching status filter "{statusFilter}".</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="p-5 rounded-xl bg-[#0B132B] border border-slate-800 space-y-4 shadow-lg hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-blue-400">{alert.alert_code}</span>
                  {getSeverityBadge(alert.risk_level)}
                </div>

                <div className="flex justify-between items-baseline border-b border-slate-800/80 pb-3">
                  <div>
                    <p className="text-xs text-slate-400">Transaction ID</p>
                    <p className="text-sm font-bold text-white font-mono">{alert.transaction?.txn_id || `TXN #${alert.transaction_id}`}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">Amount</p>
                    <p className="text-sm font-extrabold text-white">₹{alert.transaction?.amount?.toLocaleString('en-IN')}</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-slate-400">Primary Risk Signal:</span>
                  <p className="text-xs text-slate-200 bg-slate-900/90 p-3 rounded-lg border border-slate-800 leading-relaxed">
                    {alert.primary_signal}
                  </p>
                </div>
              </div>

              {/* Alert Actions */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <button
                  onClick={() => onNavigate('investigation', alert.transaction?.txn_id)}
                  className="px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-semibold flex items-center gap-1"
                >
                  Investigate <ChevronRight className="h-3.5 w-3.5" />
                </button>

                {alert.status !== 'RESOLVED' && (
                  <button
                    onClick={() => handleResolveAlert(alert.id)}
                    disabled={resolvingId === alert.id}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 transition-colors"
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>Resolve Alert</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
