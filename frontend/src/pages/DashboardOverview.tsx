import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Ban,
  DollarSign,
  TrendingUp,
  Radio,
  ArrowUpRight,
  AlertTriangle,
  ChevronRight,
  Clock,
  Activity,
  CheckCircle
} from 'lucide-react';
import { api } from '../services/api';
import { DashboardSummary, Transaction, RiskAlert } from '../types';

interface DashboardOverviewProps {
  onNavigate: (view: string, param?: string) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({ onNavigate }) => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [recentTxns, setRecentTxns] = useState<Transaction[]>([]);
  const [openAlerts, setOpenAlerts] = useState<RiskAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [sumRes, txnsRes, alertsRes] = await Promise.all([
          api.getDashboardSummary(),
          api.getTransactions({ limit: 6 }),
          api.getAlerts('OPEN')
        ]);
        setSummary(sumRes);
        setRecentTxns(txnsRes);
        setOpenAlerts(alertsRes);
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
    const interval = setInterval(loadData, 8000);
    return () => clearInterval(interval);
  }, []);

  const getRiskBadge = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-rose-950/90 text-rose-300 border border-rose-700/80">CRITICAL</span>;
      case 'HIGH':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">HIGH</span>;
      case 'MEDIUM':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">MEDIUM</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">LOW</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Risk Operations Center</h1>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
              Risk Engine Online
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time payment transaction monitoring, behavioral intelligence, and fraud prevention.
          </p>
        </div>

        <button
          onClick={() => onNavigate('live-monitor')}
          className="px-4 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-600/20 flex items-center gap-2 self-start sm:self-auto transition-all"
        >
          <Radio className="h-4 w-4 animate-pulse text-emerald-300" />
          Open Live Monitor
        </button>
      </div>

      {/* Top 4 Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Monitored */}
        <div className="bg-[#0B132B] border border-slate-800 rounded-xl p-5 space-y-3 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Monitored</span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Activity className="h-5 w-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-white">
              {summary ? summary.total_monitored.toLocaleString() : '...'}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Total Payment Transactions</p>
          </div>
        </div>

        {/* KPI 2: High Risk */}
        <div className="bg-[#0B132B] border border-slate-800 rounded-xl p-5 space-y-3 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">High Risk</span>
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <ShieldAlert className="h-5 w-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-rose-400">
              {summary ? summary.high_risk_count.toLocaleString() : '...'}
            </div>
            <p className="text-[11px] text-rose-300/80 mt-1">High & Critical Severity Flagged</p>
          </div>
        </div>

        {/* KPI 3: Blocked */}
        <div className="bg-[#0B132B] border border-slate-800 rounded-xl p-5 space-y-3 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Blocked</span>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Ban className="h-5 w-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-white">
              {summary ? summary.blocked_count.toLocaleString() : '...'}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Transactions Prevented</p>
          </div>
        </div>

        {/* KPI 4: Amount At Risk */}
        <div className="bg-[#0B132B] border border-slate-800 rounded-xl p-5 space-y-3 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Amount At Risk</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-amber-300">
              ₹{summary ? summary.amount_at_risk.toLocaleString('en-IN') : '...'}
            </div>
            <p className="text-[11px] text-amber-200/70 mt-1">Volume in High-Risk Txns</p>
          </div>
        </div>
      </div>

      {/* Secondary Metrics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-900/80 border border-slate-800">
        <div className="text-center sm:text-left">
          <span className="text-[11px] text-slate-400">Risk Detection Rate</span>
          <p className="text-lg font-bold text-white mt-0.5">{summary ? `${summary.risk_detection_rate}%` : '0%'}</p>
        </div>
        <div className="text-center sm:text-left">
          <span className="text-[11px] text-slate-400">Avg Risk Score</span>
          <p className="text-lg font-bold text-white mt-0.5">{summary ? summary.avg_risk_score : 0}/100</p>
        </div>
        <div className="text-center sm:text-left">
          <span className="text-[11px] text-slate-400">Medium Risk Txns</span>
          <p className="text-lg font-bold text-amber-400 mt-0.5">{summary ? summary.medium_risk_count : 0}</p>
        </div>
        <div className="text-center sm:text-left">
          <span className="text-[11px] text-slate-400">Low Risk Txns</span>
          <p className="text-lg font-bold text-emerald-400 mt-0.5">{summary ? summary.low_risk_count : 0}</p>
        </div>
      </div>

      {/* Main Grid: Active Risk Alerts & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Active Alerts Panel */}
        <div className="lg:col-span-5 bg-[#0B132B] border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
              <h2 className="text-sm font-bold text-white">Active Risk Alerts ({openAlerts.length})</h2>
            </div>
            <button
              onClick={() => onNavigate('alerts')}
              className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
            >
              View All <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
            {openAlerts.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl space-y-2">
                <CheckCircle className="h-8 w-8 text-emerald-400 mx-auto" />
                <p className="text-xs font-semibold text-slate-300">No Open High-Risk Alerts</p>
                <p className="text-[11px] text-slate-500">All recent anomalous payments have been resolved.</p>
              </div>
            ) : (
              openAlerts.map((alert) => (
                <div
                  key={alert.id}
                  onClick={() => onNavigate('investigation', alert.transaction?.txn_id)}
                  className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/50 transition-all cursor-pointer space-y-2 group"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-slate-300 group-hover:text-blue-400 transition-colors">
                      {alert.transaction?.txn_id || alert.alert_code}
                    </span>
                    {getRiskBadge(alert.risk_level)}
                  </div>
                  <div className="flex justify-between items-baseline text-xs">
                    <span className="font-extrabold text-white">₹{alert.transaction?.amount?.toLocaleString('en-IN')}</span>
                    <span className="text-[11px] text-slate-400">{alert.transaction?.merchant}</span>
                  </div>
                  <p className="text-[11px] text-slate-300 bg-slate-950/60 p-2 rounded border border-slate-800 line-clamp-2">
                    {alert.primary_signal}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Recent Monitored Transactions */}
        <div className="lg:col-span-7 bg-[#0B132B] border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white">Recent Transactions Stream</h2>
            <button
              onClick={() => onNavigate('transactions')}
              className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
            >
              All Transactions <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">TXN ID</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Merchant</th>
                  <th className="py-2.5 px-3">Location</th>
                  <th className="py-2.5 px-3">Risk Score</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {recentTxns.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 font-mono font-semibold text-slate-200">{t.txn_id}</td>
                    <td className="py-3 px-3 font-bold text-white">₹{t.amount.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-3 text-slate-300">{t.merchant}</td>
                    <td className="py-3 px-3 text-slate-400">{t.city}</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{t.risk_score}</span>
                        {getRiskBadge(t.risk_level)}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => onNavigate('investigation', t.txn_id)}
                        className="px-2.5 py-1 rounded bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[11px] font-semibold transition-colors"
                      >
                        Investigate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
