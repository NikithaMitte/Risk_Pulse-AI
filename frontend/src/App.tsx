import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppShell } from './layouts/AppShell';
import { LandingPage } from './pages/LandingPage';
import { SignInPage } from './pages/SignInPage';
import { RegisterPage } from './pages/RegisterPage';
import { VerifyEmailPage } from './pages/VerifyEmailPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { DashboardOverview } from './pages/DashboardOverview';
import { LiveMonitorPage } from './pages/LiveMonitorPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { InvestigationWorkspace } from './pages/InvestigationWorkspace';
import { RiskAlertsPage } from './pages/RiskAlertsPage';
import { RiskIntelligencePage } from './pages/RiskIntelligencePage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { AuditLogPage } from './pages/AuditLogPage';
import { SettingsPage } from './pages/SettingsPage';

const MainAppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState<string>('landing');
  const [viewParam, setViewParam] = useState<string | undefined>(undefined);
  const [extraData, setExtraData] = useState<any>(undefined);

  useEffect(() => {
    // Check URL parameters for direct email links like /verify-email?token=... or /reset-password?token=...
    const path = window.location.pathname;
    const params = new URLSearchParams(window.location.search);
    if (path.includes('verify-email') || params.has('token') && !path.includes('reset-password')) {
      setCurrentView('verify-email');
    } else if (path.includes('reset-password') || params.has('token') && path.includes('reset-password')) {
      setCurrentView('reset-password');
    } else if (path.includes('forgot-password')) {
      setCurrentView('forgot-password');
    }
  }, []);

  const handleNavigate = (view: string, param?: string, extra?: any) => {
    setCurrentView(view);
    setViewParam(param);
    setExtraData(extra);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060A12] flex items-center justify-center text-slate-400 font-sans">
        <div className="flex items-center gap-3">
          <span className="h-3 w-3 rounded-full bg-blue-500 animate-ping"></span>
          <span className="text-sm font-semibold text-white">Initializing RISKPULSE AI...</span>
        </div>
      </div>
    );
  }

  // Public Unauthenticated Auth Pages
  if (currentView === 'landing' && !user) {
    return <LandingPage onNavigate={handleNavigate} />;
  }

  if (currentView === 'signin' && !user) {
    return <SignInPage onNavigate={handleNavigate} />;
  }

  if (currentView === 'register' && !user) {
    return <RegisterPage onNavigate={handleNavigate} />;
  }

  if (currentView === 'verify-email') {
    return <VerifyEmailPage userEmail={viewParam} devLink={extraData?.devLink} onNavigate={handleNavigate} />;
  }

  if (currentView === 'forgot-password' && !user) {
    return <ForgotPasswordPage onNavigate={handleNavigate} />;
  }

  if (currentView === 'reset-password') {
    return <ResetPasswordPage onNavigate={handleNavigate} />;
  }

  // If not logged in and attempting to access an authenticated view, show signin
  if (!user) {
    return <SignInPage onNavigate={handleNavigate} />;
  }

  // Authenticated App Shell Routing
  const renderView = () => {
    switch (currentView) {
      case 'landing':
        return <LandingPage onNavigate={handleNavigate} />;
      case 'overview':
      case 'dashboard':
        return <DashboardOverview onNavigate={handleNavigate} />;
      case 'live-monitor':
        return <LiveMonitorPage onNavigate={handleNavigate} />;
      case 'transactions':
        return <TransactionsPage initialSearch={viewParam} onNavigate={handleNavigate} />;
      case 'investigation':
        return <InvestigationWorkspace txnIdParam={viewParam} onNavigate={handleNavigate} />;
      case 'alerts':
        return <RiskAlertsPage onNavigate={handleNavigate} />;
      case 'intelligence':
        return <RiskIntelligencePage />;
      case 'analytics':
        return <AnalyticsPage />;
      case 'audit-log':
        return <AuditLogPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardOverview onNavigate={handleNavigate} />;
    }
  };

  return (
    <AppShell currentView={currentView === 'dashboard' ? 'overview' : currentView} onNavigate={handleNavigate}>
      {renderView()}
    </AppShell>
  );
};

export function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}

export default App;
