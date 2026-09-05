import React from 'react';
import {
  ShieldAlert,
  Radio,
  Zap,
  Activity,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Brain,
  Lock,
  FileText,
  Sliders,
  Play
} from 'lucide-react';

interface LandingPageProps {
  onNavigate: (view: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-[#060A12] text-slate-100 selection:bg-blue-600 selection:text-white overflow-x-hidden">
      {/* Navigation Header */}
      <header className="border-b border-slate-800/80 bg-[#0B132B]/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <ShieldAlert className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 font-extrabold text-xl tracking-wider text-white">
                RISKPULSE <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 font-bold">AI</span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium tracking-tight">Payment Risk Intelligence</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => onNavigate('signin')}
              className="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => onNavigate('register')}
              className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 transition-all hover:scale-105"
            >
              Create Account
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-28 px-6 overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-blue-600/15 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Text */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
              <Radio className="h-3.5 w-3.5 animate-pulse text-emerald-400" />
              <span>Real-Time Payment Risk Intelligence Engine</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.15]">
              Detect suspicious payment behavior <br className="hidden sm:block"/>
              <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-emerald-400 bg-clip-text text-transparent">
                before it becomes financial loss.
              </span>
            </h1>

            <p className="text-lg text-slate-300 max-w-2xl font-normal leading-relaxed">
              RISKPULSE AI evaluates payment transactions in real time, computes multi-factor explainable risk scores, flags behavioral anomalies against customer baselines, and equips risk teams with automated decisioning tools.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-4">
              <button
                onClick={() => onNavigate('dashboard')}
                className="px-6 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-xl shadow-blue-600/25 flex items-center gap-2.5 transition-all hover:-translate-y-0.5"
              >
                <Play className="h-4 w-4 fill-white" />
                Start Monitoring
              </button>
              <button
                onClick={() => onNavigate('signin')}
                className="px-6 py-3.5 rounded-xl font-semibold text-sm bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-200 flex items-center gap-2 transition-colors"
              >
                Sign In to Platform
              </button>
            </div>

            {/* Trust Badges */}
            <div className="pt-8 border-t border-slate-800/60 flex flex-wrap items-center gap-6 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Zero Cloud External Keys Required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Sub-10ms Scoring Latency</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Deterministic Explainability</span>
              </div>
            </div>
          </div>

          {/* Right Interactive Visualization Preview */}
          <div className="lg:col-span-5 relative">
            <div className="rounded-2xl bg-[#0B132B] border border-slate-800 p-5 shadow-2xl shadow-blue-900/20 relative">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-ping"></span>
                  <span className="text-xs font-bold text-slate-200 tracking-wider">LIVE TRANSACTION STREAM</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  ● SIMULATION ACTIVE
                </span>
              </div>

              {/* Sample Stream Cards */}
              <div className="mt-4 space-y-3">
                {/* Card 1: Critical */}
                <div className="p-3.5 rounded-xl bg-slate-900/90 border border-rose-500/40 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-rose-400">TXN-8F31A2</span>
                    <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold text-[10px]">
                      CRITICAL • 91 RISK
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-base font-extrabold text-white">₹84,500</span>
                    <span className="text-xs text-slate-400">ElectroMart (Electronics)</span>
                  </div>
                  <p className="text-[11px] text-rose-200 bg-rose-950/40 p-2 rounded border border-rose-900/50">
                    ⚠ Amount is 16.9× above customer profile max + unassociated device (DEV-NEW-8849).
                  </p>
                </div>

                {/* Card 2: Low */}
                <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800 space-y-1.5 opacity-90">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-slate-400">TXN-4B991C</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                      LOW • 12 RISK
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm font-bold text-white">₹1,850</span>
                    <span className="text-xs text-slate-400">Starbucks Coffee</span>
                  </div>
                </div>

                {/* Card 3: Medium */}
                <div className="p-3.5 rounded-xl bg-slate-900/50 border border-amber-500/30 space-y-1.5 opacity-80">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-slate-400">TXN-2C104D</span>
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold text-[10px]">
                      MEDIUM • 48 RISK
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm font-bold text-white">₹12,400</span>
                    <span className="text-xs text-slate-400">Apex Crypto Exchange</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5 Core Feature Pillars */}
      <section className="py-20 px-6 border-t border-slate-800/80 bg-[#0B132B]/40">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-extrabold text-white tracking-tight">
              Enterprise Risk Intelligence Architecture
            </h2>
            <p className="text-slate-400 text-sm max-w-xl mx-auto">
              Built for high-volume banking & fintech operations centers requiring deterministic scoring and complete auditability.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* 1. Real-Time Detection */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-blue-500/40 transition-all space-y-4">
              <div className="h-12 w-12 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white">1. Real-Time Detection</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Stream live transaction payloads via WebSockets with continuous risk calculations, immediate threshold triggers, and dynamic alert pushes.
              </p>
            </div>

            {/* 2. Explainable Risk Scoring */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-blue-500/40 transition-all space-y-4">
              <div className="h-12 w-12 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Brain className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white">2. Explainable Risk Scoring</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Transparent 0-100 risk score breakdown across amount anomalies, device novelty, location mismatches, velocity spikes, and IP risk.
              </p>
            </div>

            {/* 3. Behavioral Intelligence */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-blue-500/40 transition-all space-y-4">
              <div className="h-12 w-12 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Activity className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white">3. Behavioral Intelligence</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Maintains rolling customer profiles tracking average spending range, typical locations, device fingerprints, and transaction velocity.
              </p>
            </div>

            {/* 4. Risk Operations Workspace */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-blue-500/40 transition-all space-y-4">
              <div className="h-12 w-12 rounded-xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Sliders className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white">4. Fraud Investigation Workspace</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Empowers risk analysts to review flagged payments, inspect detailed behavioral metrics, write investigation notes, and execute Approve/Block decisions.
              </p>
            </div>

            {/* 5. Audit & Compliance */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-blue-500/40 transition-all space-y-4">
              <div className="h-12 w-12 rounded-xl bg-rose-600/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white">5. Audit & Compliance</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Immutable system audit trails logging analyst logins, threshold adjustments, alert resolutions, and transaction overrides for financial regulatory compliance.
              </p>
            </div>

            {/* Platform Feature Highlight */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-900/40 to-indigo-900/40 border border-blue-500/30 flex flex-col justify-between space-y-4">
              <div>
                <h3 className="text-lg font-bold text-white">Ready to Monitor?</h3>
                <p className="text-xs text-slate-300 mt-2">
                  Launch the full interactive Risk Operations Center sandbox with pre-configured customer archetypes and real-time transaction streaming.
                </p>
              </div>
              <button
                onClick={() => onNavigate('dashboard')}
                className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2"
              >
                Launch Sandbox Console
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-slate-800/80 text-center text-xs text-slate-500">
        <p>RISKPULSE AI — Real-Time Payment Risk Intelligence & Fraud Prevention Platform Sandbox.</p>
        <p className="mt-1">Built with React, Vite, TypeScript, Tailwind CSS, FastAPI & SQLite.</p>
      </footer>
    </div>
  );
};
