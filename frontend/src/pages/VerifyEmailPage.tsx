import React, { useState, useEffect } from 'react';
import { ShieldAlert, Mail, CheckCircle2, AlertCircle, RefreshCw, ArrowRight, ExternalLink } from 'lucide-react';
import { api } from '../services/api';

interface VerifyEmailPageProps {
  userEmail?: string;
  devLink?: string;
  onNavigate: (view: string) => void;
}

export const VerifyEmailPage: React.FC<VerifyEmailPageProps> = ({ userEmail, devLink, onNavigate }) => {
  const [token, setToken] = useState<string | null>(null);
  const [verifying, setVerifying] = useState<boolean>(false);
  const [verifiedSuccess, setVerifiedSuccess] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [resendLoading, setResendLoading] = useState<boolean>(false);
  const [resendSuccess, setResendSuccess] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tok = params.get('token');
    if (tok) {
      setToken(tok);
      executeVerification(tok);
    }
  }, []);

  const executeVerification = async (tokenStr: string) => {
    try {
      setVerifying(true);
      setErrorMsg(null);
      await api.verifyEmail(tokenStr);
      setVerifiedSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Verification link is invalid or has expired.');
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    const emailToUse = userEmail || prompt('Enter your registered work email:');
    if (!emailToUse) return;
    try {
      setResendLoading(true);
      setResendSuccess(null);
      const res = await api.resendVerification(emailToUse);
      setResendSuccess(res.message);
    } catch (err: any) {
      alert(err.message || 'Failed to resend verification email.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060A12] text-slate-100 flex flex-col justify-center items-center px-6 py-12 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/10 blur-[140px] rounded-full pointer-events-none"></div>

      <div className="w-full max-w-md space-y-8 z-10 text-center">
        {/* Brand Header */}
        <div className="space-y-2">
          <div 
            onClick={() => onNavigate('landing')}
            className="inline-flex items-center gap-3 cursor-pointer group"
          >
            <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <ShieldAlert className="h-7 w-7 text-white" />
            </div>
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">RISKPULSE AI</h2>
          <p className="text-xs text-slate-400">Payment Risk Intelligence Platform</p>
        </div>

        {/* Verification Status Card */}
        <div className="bg-[#0B132B] border border-slate-800 rounded-2xl p-8 shadow-2xl shadow-blue-950/40 space-y-6">
          {verifying ? (
            <div className="space-y-4 py-6">
              <RefreshCw className="h-10 w-10 text-blue-400 animate-spin mx-auto" />
              <h3 className="text-lg font-bold text-white">Verifying your email address...</h3>
              <p className="text-xs text-slate-400">Validating cryptographic security token.</p>
            </div>
          ) : verifiedSuccess ? (
            <div className="space-y-4 py-4">
              <div className="h-12 w-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-extrabold text-white">Email Verified Successfully</h3>
              <p className="text-xs text-slate-300">Your RiskPulse account is now active and ready for use.</p>

              <button
                onClick={() => onNavigate('signin')}
                className="w-full py-3 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all mt-4"
              >
                <span>Continue to Sign In</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          ) : errorMsg ? (
            <div className="space-y-4 py-4">
              <div className="h-12 w-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/30">
                <AlertCircle className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-extrabold text-white">Verification Link Expired</h3>
              <p className="text-xs text-rose-300">{errorMsg}</p>

              <button
                onClick={handleResend}
                disabled={resendLoading}
                className="w-full py-3 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all mt-4"
              >
                <RefreshCw className={`h-4 w-4 ${resendLoading ? 'animate-spin' : ''}`} />
                <span>Send New Verification Email</span>
              </button>
            </div>
          ) : (
            /* Default Inbox Waiting Screen */
            <div className="space-y-4">
              <div className="h-12 w-12 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center mx-auto border border-blue-500/30">
                <Mail className="h-6 w-6" />
              </div>

              <h3 className="text-xl font-extrabold text-white">Check Your Inbox</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                We've sent a verification link to your email address:
                {userEmail && <strong className="block text-white font-mono mt-1">{userEmail}</strong>}
              </p>

              {resendSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
                  {resendSuccess}
                </div>
              )}

              {/* DEV MODE Notification & Direct Verification Trigger */}
              {devLink && (
                <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/40 text-left space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-amber-400 font-bold">
                    <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping"></span>
                    <span>DEV MODE — Development Email Mode</span>
                  </div>
                  <p className="text-amber-200/80 text-[11px]">
                    No external mail server required. Click below to verify immediately in your browser:
                  </p>
                  <a
                    href={devLink}
                    onClick={(e) => {
                      e.preventDefault();
                      const tok = devLink.split('token=')[1];
                      if (tok) {
                        setToken(tok);
                        executeVerification(tok);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-amber-500 text-slate-950 font-bold text-[11px] hover:bg-amber-400 transition-colors"
                  >
                    <span>Click to Complete Verification</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}

              <div className="space-y-2 pt-2">
                <button
                  onClick={handleResend}
                  disabled={resendLoading}
                  className="w-full py-2.5 rounded-xl font-bold text-xs bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 transition-colors"
                >
                  {resendLoading ? 'Sending...' : 'Resend Verification Email'}
                </button>
                <button
                  onClick={() => onNavigate('signin')}
                  className="text-xs text-blue-400 font-semibold hover:underline block mx-auto pt-1"
                >
                  Back to Sign In
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
