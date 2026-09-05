import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Sparkles,
  User,
  MapPin,
  Laptop,
  Activity,
  ArrowLeft,
  FileText,
  Send,
  Clock,
  CreditCard,
  Building
} from 'lucide-react';
import { Transaction } from '../types';
import { api } from '../services/api';

interface InvestigationWorkspaceProps {
  txnIdParam?: string;
  onNavigate: (view: string, param?: string) => void;
}

export const InvestigationWorkspace: React.FC<InvestigationWorkspaceProps> = ({ txnIdParam, onNavigate }) => {
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [analystNote, setAnalystNote] = useState('');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    async function loadDetail() {
      try {
        setLoading(true);
        if (txnIdParam) {
          const detail = await api.getTransactionDetail(txnIdParam);
          setTransaction(detail);
        } else {
          // Fetch latest high-risk transaction as default for investigation
          const list = await api.getTransactions({ risk_level: 'HIGH', limit: 1 });
          if (list.length > 0) {
            setTransaction(list[0]);
          } else {
            const anyList = await api.getTransactions({ limit: 1 });
            if (anyList.length > 0) setTransaction(anyList[0]);
          }
        }
      } catch (err) {
        console.error("Error loading transaction detail:", err);
      } finally {
        setLoading(false);
      }
    }
    loadDetail();
  }, [txnIdParam]);

  const handleAction = async (actionType: 'approve' | 'block' | 'escalate') => {
    if (!transaction) return;
    try {
      setActionLoading(true);
      setActionSuccess(null);
      let updated: Transaction;
      if (actionType === 'approve') {
        updated = await api.approveTransaction(transaction.id, analystNote);
        setActionSuccess(`Transaction ${updated.txn_id} successfully APPROVED.`);
      } else if (actionType === 'block') {
        updated = await api.blockTransaction(transaction.id, analystNote);
        setActionSuccess(`Transaction ${updated.txn_id} successfully BLOCKED by risk policy.`);
      } else {
        updated = await api.escalateTransaction(transaction.id, analystNote);
        setActionSuccess(`Transaction ${updated.txn_id} ESCALATED for senior review.`);
      }
      setTransaction(updated);
      setAnalystNote('');
    } catch (err: any) {
      alert(err.message || "Failed to execute action.");
    } fontFinally: {
      setActionLoading(false);
    }
  };

  const getRiskBadge = (level?: string) => {
    switch (level) {
      case 'CRITICAL':
        return <span className="px-3 py-1 rounded text-xs font-extrabold bg-rose-950 text-rose-300 border border-rose-700">CRITICAL RISK</span>;
      case 'HIGH':
        return <span className="px-3 py-1 rounded text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">HIGH RISK</span>;
      case 'MEDIUM':
        return <span className="px-3 py-1 rounded text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">MEDIUM RISK</span>;
      default:
        return <span className="px-3 py-1 rounded text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">LOW RISK</span>;
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400">
        Loading investigation workspace details...
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="p-12 text-center space-y-4">
        <ShieldAlert className="h-12 w-12 text-slate-500 mx-auto" />
        <h2 className="text-lg font-bold text-white">No Transaction Selected for Investigation</h2>
        <button
          onClick={() => onNavigate('transactions')}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold"
        >
          Select a Transaction
        </button>
      </div>
    );
  }

  const assessment = transaction.assessment;
  const factorBreakdown = assessment?.factor_breakdown || {};

  return (
    <div className="space-y-6">
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('transactions')}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-extrabold text-white tracking-tight">Transaction Investigation</h1>
              <span className="font-mono text-sm px-2.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-blue-400 font-bold">
                {transaction.txn_id}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Detailed behavioral anomaly analysis and fraud officer decisioning screen.
            </p>
          </div>
        </div>

        <div>
          {getRiskBadge(transaction.risk_level)}
        </div>
      </div>

      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-emerald-400 flex-shrink-0" />
          <span className="font-semibold">{actionSuccess}</span>
        </div>
      )}

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Summary, Risk Copilot, Factors, Behavioral Comparison */}
        <div className="lg:col-span-8 space-y-6">
          {/* Transaction Summary Card */}
          <div className="bg-[#0B132B] border border-slate-800 rounded-xl p-6 space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Payment Transaction Payload</h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <div>
                <span className="text-[11px] text-slate-400">Amount</span>
                <p className="text-xl font-extrabold text-white mt-0.5">₹{transaction.amount.toLocaleString('en-IN')}</p>
              </div>
              <div>
                <span className="text-[11px] text-slate-400">Merchant</span>
                <p className="text-sm font-bold text-slate-200 mt-0.5">{transaction.merchant}</p>
                <span className="text-[10px] text-slate-400">{transaction.merchant_category}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400">Location</span>
                <p className="text-sm font-bold text-slate-200 mt-0.5">{transaction.city}, {transaction.country}</p>
              </div>
              <div>
                <span className="text-[11px] text-slate-400">Payment Method</span>
                <p className="text-sm font-bold text-slate-200 mt-0.5">{transaction.payment_method}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-slate-400 pt-2">
              <div>Device ID: <strong className="text-slate-200 font-mono">{transaction.device_id}</strong></div>
              <div>New Device: <strong className={transaction.is_new_device ? "text-rose-400 font-bold" : "text-emerald-400"}>{transaction.is_new_device ? "YES (New)" : "NO (Known)"}</strong></div>
              <div>IP Risk Score: <strong className={transaction.ip_risk_score > 50 ? "text-rose-400 font-bold" : "text-slate-200"}>{transaction.ip_risk_score}/100</strong></div>
              <div>Velocity (10m): <strong className={transaction.transaction_velocity >= 3 ? "text-rose-400 font-bold" : "text-slate-200"}>{transaction.transaction_velocity} txns</strong></div>
            </div>
          </div>

          {/* Risk Copilot Explanation Panel */}
          <div className="bg-gradient-to-br from-[#0B132B] to-indigo-950/40 border border-indigo-500/30 rounded-xl p-6 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-indigo-400" />
              <h2 className="text-sm font-bold text-white">Risk Copilot Explanation</h2>
              <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono">DETERMINISTIC AI</span>
            </div>

            <p className="text-xs text-slate-200 leading-relaxed bg-slate-950/60 p-4 rounded-xl border border-indigo-500/20">
              {assessment?.summary || "Analyzing transaction signals against baseline behavioral engine..."}
            </p>

            <div className="space-y-2 pt-2">
              <h3 className="text-xs font-bold text-slate-300">Why this transaction was flagged:</h3>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {assessment?.reasons?.map((reason, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-400 mt-1.5 flex-shrink-0"></span>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Risk Factors Breakdown Bars */}
          <div className="bg-[#0B132B] border border-slate-800 rounded-xl p-6 space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Risk Factor Anomaly Breakdown</h2>

            <div className="space-y-3">
              {Object.entries(factorBreakdown).map(([factor, percentage]) => (
                <div key={factor} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-300">{factor}</span>
                    <span className="text-slate-400">{percentage}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        percentage > 30 ? 'bg-rose-500' : percentage > 15 ? 'bg-amber-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${Math.min(100, percentage)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Behavioral Comparison Baseline */}
          <div className="bg-[#0B132B] border border-slate-800 rounded-xl p-6 space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Customer Baseline Comparison</h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                <span className="text-[11px] text-slate-400">Current Txn Amount</span>
                <p className="text-base font-extrabold text-white">₹{transaction.amount.toLocaleString('en-IN')}</p>
                <span className="text-[10px] text-rose-400 font-semibold">
                  {transaction.customer?.typical_amount_max
                    ? `${(transaction.amount / transaction.customer.typical_amount_max).toFixed(1)}× Customer Typical Max`
                    : 'Above Baseline'}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                <span className="text-[11px] text-slate-400">Customer Typical Range</span>
                <p className="text-base font-bold text-slate-200">
                  ₹{transaction.customer?.typical_amount_min?.toLocaleString('en-IN')} – ₹{transaction.customer?.typical_amount_max?.toLocaleString('en-IN')}
                </p>
                <span className="text-[10px] text-slate-400">Historical Spending Envelope</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                <span className="text-[11px] text-slate-400">Typical Locations</span>
                <p className="text-base font-bold text-slate-200 truncate">
                  {transaction.customer?.typical_locations?.join(', ') || transaction.city}
                </p>
                <span className="text-[10px] text-slate-400">Known Operating Cities</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Customer Profile & Action Panel */}
        <div className="lg:col-span-4 space-y-6">
          {/* Customer Profile Card */}
          <div className="bg-[#0B132B] border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
              <div className="h-10 w-10 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-sm">
                {transaction.customer?.name?.charAt(0) || 'C'}
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">{transaction.customer?.name || 'Customer'}</h3>
                <p className="text-[11px] font-mono text-slate-400">{transaction.customer?.customer_code}</p>
              </div>
            </div>

            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">Email:</span>
                <span>{transaction.customer?.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Home City:</span>
                <span>{transaction.customer?.city}, {transaction.customer?.country}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Avg Daily Txns:</span>
                <span>{transaction.customer?.avg_daily_txns} txns/day</span>
              </div>
            </div>
          </div>

          {/* Analyst Action Decision Panel */}
          <div className="bg-[#0B132B] border border-slate-800 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Risk Analyst Action</h2>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">Investigation Note / Rationale</label>
              <textarea
                value={analystNote}
                onChange={(e) => setAnalystNote(e.target.value)}
                placeholder="Enter investigation comments or policy override reasons..."
                rows={3}
                className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => handleAction('approve')}
                disabled={actionLoading}
                className="w-full py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-lg shadow-emerald-600/20"
              >
                Approve Transaction (ALLOW)
              </button>

              <button
                onClick={() => handleAction('block')}
                disabled={actionLoading}
                className="w-full py-2.5 rounded-xl font-bold text-xs bg-rose-600 hover:bg-rose-500 text-white transition-colors shadow-lg shadow-rose-600/20"
              >
                Block Transaction (BLOCK)
              </button>

              <button
                onClick={() => handleAction('escalate')}
                disabled={actionLoading}
                className="w-full py-2.5 rounded-xl font-bold text-xs bg-amber-600 hover:bg-amber-500 text-white transition-colors"
              >
                Escalate for Senior Review
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
