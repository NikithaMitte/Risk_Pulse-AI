import React, { useState, useEffect } from 'react';
import { Settings, Sliders, Shield, User, Building, Save, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [highRiskThreshold, setHighRiskThreshold] = useState('60');
  const [criticalRiskThreshold, setCriticalRiskThreshold] = useState('80');
  const [velocityWindow, setVelocityWindow] = useState('10');
  const [largeTxnThreshold, setLargeTxnThreshold] = useState('50000');
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await api.getRiskSettings();
        if (res.settings) {
          if (res.settings.high_risk_threshold) setHighRiskThreshold(res.settings.high_risk_threshold);
          if (res.settings.critical_risk_threshold) setCriticalRiskThreshold(res.settings.critical_risk_threshold);
          if (res.settings.velocity_window_minutes) setVelocityWindow(res.settings.velocity_window_minutes);
          if (res.settings.large_transaction_threshold) setLargeTxnThreshold(res.settings.large_transaction_threshold);
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
      }
    }
    loadSettings();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setSuccessMsg(null);
      await api.updateRiskSettings({
        high_risk_threshold: highRiskThreshold,
        critical_risk_threshold: criticalRiskThreshold,
        velocity_window_minutes: velocityWindow,
        large_transaction_threshold: largeTxnThreshold
      });
      setSuccessMsg('Risk Engine settings updated and saved to database successfully.');
    } catch (err: any) {
      alert(err.message || "Failed to update settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="pb-4 border-b border-slate-800/80">
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Platform Settings</h1>
        <p className="text-xs text-slate-400 mt-1">
          Configure risk engine thresholds, behavioral windows, and analyst profile parameters.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-emerald-400 flex-shrink-0" />
          <span className="font-semibold">{successMsg}</span>
        </div>
      )}

      {/* Settings Form */}
      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Risk Engine Rules */}
        <div className="bg-[#0B132B] border border-slate-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
            <Sliders className="h-5 w-5 text-blue-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Risk Engine Thresholds</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">High Risk Threshold (0-100)</label>
              <input
                type="number"
                value={highRiskThreshold}
                onChange={(e) => setHighRiskThreshold(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                min={1}
                max={100}
              />
              <p className="text-[10px] text-slate-400">Score &gt;= this value flags transaction as HIGH risk (REVIEW).</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Critical Risk Threshold (0-100)</label>
              <input
                type="number"
                value={criticalRiskThreshold}
                onChange={(e) => setCriticalRiskThreshold(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                min={1}
                max={100}
              />
              <p className="text-[10px] text-slate-400">Score &gt;= this value flags transaction as CRITICAL risk (BLOCK).</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Velocity Monitoring Window (Minutes)</label>
              <input
                type="number"
                value={velocityWindow}
                onChange={(e) => setVelocityWindow(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-blue-500"
              />
              <p className="text-[10px] text-slate-400">Time window for counting rapid customer payment velocity.</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Large Transaction Threshold (₹)</label>
              <input
                type="number"
                value={largeTxnThreshold}
                onChange={(e) => setLargeTxnThreshold(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-blue-500"
              />
              <p className="text-[10px] text-slate-400">Fixed single-transaction amount limit for auto anomaly scoring.</p>
            </div>
          </div>
        </div>

        {/* Profile Details */}
        <div className="bg-[#0B132B] border border-slate-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
            <User className="h-5 w-5 text-indigo-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Analyst Account Profile</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-300">
            <div>
              <span className="text-slate-400">Name:</span>
              <p className="font-bold text-white text-sm mt-0.5">{user?.name || 'Alex Vance'}</p>
            </div>
            <div>
              <span className="text-slate-400">Work Email:</span>
              <p className="font-bold text-white text-sm mt-0.5">{user?.email || 'analyst@riskpulse.ai'}</p>
            </div>
            <div>
              <span className="text-slate-400">Organization:</span>
              <p className="font-bold text-white text-sm mt-0.5">{user?.organization || 'RiskOps Global Enterprise'}</p>
            </div>
            <div>
              <span className="text-slate-400">Role & Security Level:</span>
              <p className="font-bold text-indigo-400 text-sm mt-0.5">{user?.role || 'Lead Risk Analyst'}</p>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-3 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all"
        >
          <Save className="h-4 w-4" />
          <span>{saving ? 'Saving Settings...' : 'Save Configuration Changes'}</span>
        </button>
      </form>
    </div>
  );
};
