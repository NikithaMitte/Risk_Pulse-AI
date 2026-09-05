import React, { useState, useEffect } from 'react';
import {
  PieChart as RePieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area,
  Legend
} from 'recharts';
import { BarChart3, TrendingUp, ShieldAlert, Globe, MapPin, Building } from 'lucide-react';
import { api } from '../services/api';

export const RiskIntelligencePage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadIntelligence() {
      try {
        setLoading(true);
        const res = await api.getRiskIntelligence();
        setData(res);
      } catch (err) {
        console.error("Failed to load risk intelligence data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadIntelligence();
  }, []);

  if (loading || !data) {
    return <div className="p-12 text-center text-slate-400">Computing risk intelligence charts from database...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-slate-800/80">
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Risk Intelligence Center</h1>
        <p className="text-xs text-slate-400 mt-1">
          Macro analytical insights, risk score distributions, and merchant category risk metrics.
        </p>
      </div>

      {/* Grid 1: Risk Distribution Pie & Score Histogram */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Risk Distribution Donut */}
        <div className="lg:col-span-5 bg-[#0B132B] border border-slate-800 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Risk Level Distribution</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie
                  data={data.risk_distribution}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={4}
                >
                  {data.risk_distribution.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#090D16', borderColor: '#1E293B', borderRadius: '8px', color: '#fff' }}
                />
                <Legend />
              </RePieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Score Histogram */}
        <div className="lg:col-span-7 bg-[#0B132B] border border-slate-800 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Risk Score Frequency Histogram</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.risk_score_distribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="range" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#090D16', borderColor: '#1E293B', borderRadius: '8px', color: '#fff' }} />
                <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Grid 2: Hourly Transaction Volume & Risk Trend */}
      <div className="bg-[#0B132B] border border-slate-800 rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider">Hourly Transaction & High-Risk Trend</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.hourly_trend}>
              <defs>
                <linearGradient id="colorMonitored" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorHighRisk" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.5}/>
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
              <XAxis dataKey="time" stroke="#64748B" fontSize={11} />
              <YAxis stroke="#64748B" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: '#090D16', borderColor: '#1E293B', borderRadius: '8px', color: '#fff' }} />
              <Legend />
              <Area type="monotone" dataKey="monitored" name="Total Monitored" stroke="#3B82F6" fillOpacity={1} fill="url(#colorMonitored)" />
              <Area type="monotone" dataKey="high_risk" name="High Risk Flagged" stroke="#EF4444" fillOpacity={1} fill="url(#colorHighRisk)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grid 3: Top Risky Merchants & Geographic Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Top Risky Merchants Table */}
        <div className="lg:col-span-6 bg-[#0B132B] border border-slate-800 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Top Risky Merchants</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Merchant</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3 text-center">Txns</th>
                  <th className="py-2.5 px-3 text-right">Avg Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {data.top_risky_merchants.map((m: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-semibold text-slate-200">{m.merchant}</td>
                    <td className="py-2.5 px-3 text-slate-400">{m.category}</td>
                    <td className="py-2.5 px-3 text-center font-bold text-white">{m.total_txns}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-400">{m.avg_score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Geographic Activity Table */}
        <div className="lg:col-span-6 bg-[#0B132B] border border-slate-800 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Geographic Activity Breakdown</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Location</th>
                  <th className="py-2.5 px-3 text-center">Volume</th>
                  <th className="py-2.5 px-3 text-center">High Risk</th>
                  <th className="py-2.5 px-3 text-right">Total Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {data.geographic_activity.map((g: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-semibold text-slate-200">{g.location}</td>
                    <td className="py-2.5 px-3 text-center text-slate-300">{g.total}</td>
                    <td className="py-2.5 px-3 text-center font-bold text-rose-400">{g.high_risk}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-white">₹{g.volume?.toLocaleString('en-IN')}</td>
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
