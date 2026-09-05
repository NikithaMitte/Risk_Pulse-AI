import React, { useState, useEffect } from 'react';
import { Activity, Calendar, ShieldCheck, Ban, DollarSign, PieChart as RePieChart } from 'lucide-react';
import { api } from '../services/api';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export const AnalyticsPage: React.FC = () => {
  const [period, setPeriod] = useState('7d');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        setLoading(true);
        const res = await api.getAnalytics(period);
        setData(res);
      } catch (err) {
        console.error("Failed to fetch analytics:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, [period]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Executive Risk Analytics</h1>
          <p className="text-xs text-slate-400 mt-1">
            Performance metrics, decision ratios, and historical fraud mitigation trends.
          </p>
        </div>

        {/* Time Period Filter */}
        <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-900 border border-slate-800 self-start sm:self-auto">
          {[
            { id: 'today', label: 'Today' },
            { id: '7d', label: '7 Days' },
            { id: '30d', label: '30 Days' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setPeriod(item.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                period === item.id
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {loading || !data ? (
        <div className="p-12 text-center text-slate-400">Loading period analytics...</div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#0B132B] border border-slate-800 rounded-xl p-5 space-y-2">
              <span className="text-xs font-semibold text-slate-400">Total Volume</span>
              <p className="text-2xl font-extrabold text-white">{data.total_volume.toLocaleString()}</p>
              <p className="text-[11px] text-slate-400">Amount: ₹{data.total_amount?.toLocaleString('en-IN')}</p>
            </div>

            <div className="bg-[#0B132B] border border-slate-800 rounded-xl p-5 space-y-2">
              <span className="text-xs font-semibold text-slate-400">Risk Detection Rate</span>
              <p className="text-2xl font-extrabold text-rose-400">{data.detection_rate}%</p>
              <p className="text-[11px] text-slate-400">{data.high_risk_count} High-Risk Payments Flagged</p>
            </div>

            <div className="bg-[#0B132B] border border-slate-800 rounded-xl p-5 space-y-2">
              <span className="text-xs font-semibold text-slate-400">Blocked Fraud Volume</span>
              <p className="text-2xl font-extrabold text-amber-300">₹{data.blocked_amount?.toLocaleString('en-IN')}</p>
              <p className="text-[11px] text-slate-400">{data.blocked_count} Transactions Prevented</p>
            </div>

            <div className="bg-[#0B132B] border border-slate-800 rounded-xl p-5 space-y-2">
              <span className="text-xs font-semibold text-slate-400">Avg Risk Score</span>
              <p className="text-2xl font-extrabold text-white">{data.avg_risk_score}/100</p>
              <p className="text-[11px] text-slate-400">Average Risk Score across Period</p>
            </div>
          </div>

          {/* Decision Breakdown Chart */}
          <div className="bg-[#0B132B] border border-slate-800 rounded-xl p-6 space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Risk Engine Decision Ratio</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.decision_distribution}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                  >
                    {data.decision_distribution.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#090D16', borderColor: '#1E293B', borderRadius: '8px', color: '#fff' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
