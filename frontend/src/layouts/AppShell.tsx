import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ShieldAlert,
  Activity,
  LayoutDashboard,
  Radio,
  Receipt,
  Bell,
  BarChart3,
  Search,
  FileCheck,
  Settings,
  LogOut,
  User,
  Sliders,
  Sparkles,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { api } from '../services/api';

interface AppShellProps {
  currentView: string;
  onNavigate: (view: string, param?: string) => void;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ currentView, onNavigate, children }) => {
  const { user, logout } = useAuth();
  const [openUserMenu, setOpenUserMenu] = useState(false);
  const [openNotifs, setOpenNotifs] = useState(false);
  const [alertCount, setAlertCount] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    async function fetchOpenAlerts() {
      try {
        const alerts = await api.getAlerts('OPEN');
        setAlertCount(alerts.length);
      } catch (e) {
        console.error("Failed to load alert badge count:", e);
      }
    }
    fetchOpenAlerts();
    const interval = setInterval(fetchOpenAlerts, 10000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'live-monitor', label: 'Live Monitor', icon: Radio, badge: 'REALTIME' },
    { id: 'transactions', label: 'Transactions', icon: Receipt },
    { id: 'alerts', label: 'Risk Alerts', icon: Bell, count: alertCount },
    { id: 'intelligence', label: 'Risk Intelligence', icon: BarChart3 },
    { id: 'investigation', label: 'Investigation', icon: Search },
    { id: 'analytics', label: 'Analytics', icon: Activity },
    { id: 'audit-log', label: 'Audit Log', icon: FileCheck },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onNavigate('transactions', searchQuery.trim());
    }
  };

  return (
    <div className="flex h-screen bg-[#060A12] text-slate-100 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0B132B] border-r border-slate-800/80 flex flex-col flex-shrink-0 z-20">
        {/* Logo Header */}
        <div className="h-16 flex items-center px-5 border-b border-slate-800/80 justify-between">
          <div 
            onClick={() => onNavigate('overview')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <ShieldAlert className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-bold text-lg tracking-wider text-white">
                RISKPULSE <span className="text-xs px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">AI</span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium tracking-tight">Payment Risk Intelligence</p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`h-4 w-4 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse">
                    {item.badge}
                  </span>
                )}
                {item.count !== undefined && item.count > 0 && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom User Profile Section */}
        <div className="p-3 border-t border-slate-800/80 bg-[#0A1024]">
          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="h-8 w-8 rounded-full bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-xs font-bold text-indigo-300 flex-shrink-0">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-white truncate">{user?.name || 'Risk Analyst'}</p>
                <p className="text-[10px] text-slate-400 truncate">{user?.organization || 'RiskOps Global'}</p>
              </div>
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-[#0B132B]/90 backdrop-blur border-b border-slate-800/80 px-6 flex items-center justify-between flex-shrink-0 z-10">
          {/* Global Search */}
          <form onSubmit={handleSearchSubmit} className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search TXN ID, Customer, Merchant..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-slate-900/80 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition-all"
            />
          </form>

          {/* Environment Indicator & Badges */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span className="text-xs font-medium text-slate-300">SANDBOX / LIVE SIMULATION</span>
            </div>

            <div className="h-4 w-[1px] bg-slate-800"></div>

            {/* Notification Bell */}
            <button
              onClick={() => onNavigate('alerts')}
              className="relative p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/50 transition-colors"
              title="Risk Alerts"
            >
              <Bell className="h-5 w-5" />
              {alertCount > 0 && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-[#0B132B]"></span>
              )}
            </button>

            {/* Role Badge */}
            <span className="text-xs font-semibold px-2.5 py-1 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {user?.role || 'Risk Analyst'}
            </span>
          </div>
        </header>

        {/* Dynamic Page View Container */}
        <main className="flex-1 overflow-y-auto bg-[#060A12] p-6">
          {children}
        </main>
      </div>
    </div>
  );
};
