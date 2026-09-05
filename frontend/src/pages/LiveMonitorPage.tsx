import React, { useState, useEffect, useRef } from 'react';
import {
  Radio,
  Play,
  Square,
  ShieldAlert,
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  XCircle,
  Clock,
  Laptop,
  MapPin,
  RefreshCw,
  Sliders,
  DollarSign
} from 'lucide-react';
import { Transaction, RiskAlert } from '../types';
import { api } from '../services/api';

interface LiveMonitorPageProps {
  onNavigate: (view: string, param?: string) => void;
}

export const LiveMonitorPage: React.FC<LiveMonitorPageProps> = ({ onNavigate }) => {
  const [connectionStatus, setConnectionStatus] = useState<'CONNECTED' | 'DISCONNECTED' | 'CONNECTING'>('CONNECTING');
  const [isMonitoring, setIsMonitoring] = useState<boolean>(false);
  const [liveStream, setLiveStream] = useState<Transaction[]>([]);
  const [activePopupAlert, setActivePopupAlert] = useState<{ txn: Transaction; alert?: RiskAlert } | null>(null);

  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Initial fetch of recent txns
    api.getTransactions({ limit: 12 }).then(setLiveStream).catch(console.error);

    // Setup WebSocket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/risk-monitor`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnectionStatus('CONNECTED');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.event === 'STATUS' || data.event === 'MONITORING_STARTED' || data.event === 'MONITORING_STOPPED') {
          setIsMonitoring(data.is_monitoring ?? false);
        } else if (data.event === 'NEW_TRANSACTION' && data.transaction) {
          const newTxn: Transaction = data.transaction;
          setLiveStream((prev) => [newTxn, ...prev.slice(0, 49)]);

          // If High or Critical, show instant alert popup!
          if (newTxn.risk_level === 'HIGH' || newTxn.risk_level === 'CRITICAL') {
            setActivePopupAlert({ txn: newTxn, alert: data.alert });
          }
        }
      } catch (err) {
        console.error("WS message parse error:", err);
      }
    };

    ws.onerror = () => {
      setConnectionStatus('DISCONNECTED');
    };

    ws.onclose = () => {
      setConnectionStatus('DISCONNECTED');
      setIsMonitoring(false);
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, []);

  const toggleMonitoring = () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    if (isMonitoring) {
      wsRef.current.send(JSON.stringify({ action: 'stop_monitoring' }));
    } else {
      wsRef.current.send(JSON.stringify({ action: 'start_monitoring' }));
    }
  };

  const handleQuickApprove = async (txnId: number) => {
    try {
      await api.approveTransaction(txnId, "Quick approve from Live Monitor");
      setActivePopupAlert(null);
      // update local state
      setLiveStream((prev) =>
        prev.map((t) => (t.id === txnId ? { ...t, status: 'APPROVED', decision: 'ALLOW' } : t))
      );
    } catch (e) {
      console.error(e);
    }
  };

  const handleQuickBlock = async (txnId: number) => {
    try {
      await api.blockTransaction(txnId, "Quick block from Live Monitor");
      setActivePopupAlert(null);
      setLiveStream((prev) =>
        prev.map((t) => (t.id === txnId ? { ...t, status: 'BLOCKED', decision: 'BLOCK' } : t))
      );
    } catch (e) {
      console.error(e);
    }
  };

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
    <div className="space-y-6 relative">
      {/* High-Risk Alert Popup Modal */}
      {activePopupAlert && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-[#0B132B] border-2 border-rose-500 rounded-2xl p-6 max-w-lg w-full shadow-2xl shadow-rose-950/80 space-y-4 relative">
            <button
              onClick={() => setActivePopupAlert(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              ✕
            </button>

            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">⚠ HIGH-RISK TRANSACTION DETECTED</h3>
                <p className="text-xs text-rose-300/90">Immediate risk officer action required</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between items-baseline">
                <span className="font-mono font-bold text-slate-300">{activePopupAlert.txn.txn_id}</span>
                <span className="text-lg font-black text-white">₹{activePopupAlert.txn.amount.toLocaleString('en-IN')}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-slate-400 pt-2 border-t border-slate-800">
                <div>Merchant: <strong className="text-slate-200">{activePopupAlert.txn.merchant}</strong></div>
                <div>Location: <strong className="text-slate-200">{activePopupAlert.txn.city}</strong></div>
                <div>Device: <strong className="text-slate-200">{activePopupAlert.txn.device_id}</strong></div>
                <div>Risk Score: <strong className="text-rose-400 font-bold">{activePopupAlert.txn.risk_score}/100 ({activePopupAlert.txn.risk_level})</strong></div>
              </div>

              {activePopupAlert.txn.assessment?.reasons && (
                <div className="mt-2 p-2.5 rounded bg-rose-950/40 border border-rose-900/60 text-rose-200 text-[11px] space-y-1">
                  <span className="font-bold">Primary Risk Signals:</span>
                  <ul className="list-disc list-inside space-y-0.5">
                    {activePopupAlert.txn.assessment.reasons.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              <button
                onClick={() => handleQuickApprove(activePopupAlert.txn.id)}
                className="py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
              >
                Allow Payment
              </button>
              <button
                onClick={() => handleQuickBlock(activePopupAlert.txn.id)}
                className="py-2.5 rounded-xl font-bold text-xs bg-rose-600 hover:bg-rose-500 text-white transition-colors"
              >
                Block Transaction
              </button>
              <button
                onClick={() => {
                  const id = activePopupAlert.txn.txn_id;
                  setActivePopupAlert(null);
                  onNavigate('investigation', id);
                }}
                className="py-2.5 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-500 text-white transition-colors"
              >
                Investigate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Real-Time Transaction Stream</h1>
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border ${
              connectionStatus === 'CONNECTED'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
            }`}>
              <span className={`h-2 w-2 rounded-full ${connectionStatus === 'CONNECTED' ? 'bg-emerald-400 animate-ping' : 'bg-rose-400'}`}></span>
              {connectionStatus === 'CONNECTED' ? '● LIVE WEBSOCKET' : '● DISCONNECTED'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Stream synthetic payments in real time to test risk evaluation models and alert policies.
          </p>
        </div>

        {/* Start / Stop Control Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleMonitoring}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-lg ${
              isMonitoring
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
            }`}
          >
            {isMonitoring ? (
              <>
                <Square className="h-4 w-4 fill-white" />
                Stop Live Simulation
              </>
            ) : (
              <>
                <Play className="h-4 w-4 fill-white" />
                Start Live Simulation
              </>
            )}
          </button>
        </div>
      </div>

      {/* Sandbox Notice Banner */}
      <div className="p-3.5 rounded-xl bg-blue-950/40 border border-blue-500/30 text-xs text-blue-300 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Radio className="h-4 w-4 text-blue-400 animate-pulse" />
          <span className="font-semibold">Synthetic Transaction Data — Risk Engine Demonstration</span>
        </div>
        <span className="text-[11px] text-blue-400 font-mono">Frequency: 1 Event / 3 Seconds</span>
      </div>

      {/* Live Stream Stream Cards */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-300">Live Transaction Feed ({liveStream.length})</h2>

        {liveStream.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-slate-800 rounded-2xl space-y-3">
            <Radio className="h-10 w-10 text-slate-500 mx-auto" />
            <p className="text-sm font-bold text-slate-300">No Transactions Received Yet</p>
            <p className="text-xs text-slate-500">Click "Start Live Simulation" above to stream payment payloads.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {liveStream.map((txn) => (
              <div
                key={txn.id}
                onClick={() => onNavigate('investigation', txn.txn_id)}
                className={`p-4 rounded-xl bg-[#0B132B] border transition-all cursor-pointer space-y-3 hover:-translate-y-0.5 ${
                  txn.risk_level === 'CRITICAL'
                    ? 'border-rose-600/70 shadow-lg shadow-rose-950/30'
                    : txn.risk_level === 'HIGH'
                    ? 'border-rose-500/40'
                    : txn.risk_level === 'MEDIUM'
                    ? 'border-amber-500/30'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-slate-200">{txn.txn_id}</span>
                  {getRiskBadge(txn.risk_level)}
                </div>

                <div className="flex justify-between items-baseline">
                  <span className="text-xl font-extrabold text-white">₹{txn.amount.toLocaleString('en-IN')}</span>
                  <span className="text-xs font-semibold text-slate-400">{txn.merchant}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-slate-500" />
                    <span>{txn.city}, {txn.country}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Laptop className="h-3.5 w-3.5 text-slate-500" />
                    <span className="truncate">{txn.device_id}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 text-xs">
                  <span className="text-slate-400 text-[11px]">Score: <strong className="text-white">{txn.risk_score}/100</strong></span>
                  <span className="text-blue-400 font-semibold text-[11px] flex items-center gap-1 group-hover:underline">
                    Investigate <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
