'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Zap,
  Lock,
  Server,
  Activity,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  Eye,
  EyeOff,
  Radio,
} from 'lucide-react';

interface CredentialData {
  id: string;
  service: string;
  environment: string;
  icegateId: string | null;
  iecCode: string | null;
  portCode: string | null;
  dscExpiry: string | null;
  isActive: boolean;
  updatedAt: string;
}

interface IntegrationLog {
  id: string;
  service: string;
  action: string;
  status: string;
  durationMs: number;
  requestSummary: any;
  responseSummary: any;
  errorCode: string | null;
  errorMessage: string | null;
  createdAt: string;
}

export default function CustomsSettingsPage() {
  const [credentials, setCredentials] = useState<CredentialData[]>([]);
  const [logs, setLogs] = useState<IntegrationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pinging, setPinging] = useState(false);
  const [pingResult, setPingResult] = useState<{
    healthy: boolean;
    latencyMs: number;
    message: string;
  } | null>(null);
  const [showSecrets, setShowSecrets] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  // Form state
  const [formData, setFormData] = useState({
    service: 'ICEGATE',
    environment: 'SANDBOX',
    icegateId: '',
    iecCode: '',
    portCode: 'INNSA1',
    password: '',
    dscPin: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [credsRes, logsRes] = await Promise.all([
        fetch('/api/customs/credentials'),
        fetch('/api/customs/logs?limit=10'),
      ]);

      const credsData = await credsRes.json();
      const logsData = await logsRes.json();

      if (credsData.success) {
        setCredentials(credsData.data);
        const activeIcegate = credsData.data.find(
          (c: CredentialData) => c.service === 'ICEGATE'
        );
        if (activeIcegate) {
          setFormData((prev) => ({
            ...prev,
            icegateId: activeIcegate.icegateId || '',
            iecCode: activeIcegate.iecCode || '',
            portCode: activeIcegate.portCode || 'INNSA1',
            environment: activeIcegate.environment || 'SANDBOX',
          }));
        }
      }

      if (logsData.success) {
        setLogs(logsData.data.logs);
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: 'Failed to load customs settings' });
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveCredentials(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/customs/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service: formData.service,
          environment: formData.environment,
          icegateId: formData.icegateId || undefined,
          iecCode: formData.iecCode || undefined,
          portCode: formData.portCode || undefined,
          password: formData.password || undefined,
          dscPin: formData.dscPin || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to save credentials');
      }

      setFeedback({ type: 'success', message: data.message });
      setFormData((prev) => ({ ...prev, password: '', dscPin: '' }));
      fetchData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setSaving(false);
    }
  }

  async function handlePing() {
    setPinging(true);
    setPingResult(null);

    try {
      const res = await fetch('/api/customs/ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service: formData.service }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        setPingResult(data.data);
      }
    } catch (err: any) {
      setPingResult({
        healthy: false,
        latencyMs: 0,
        message: err.message || 'Ping request failed',
      });
    } finally {
      setPinging(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Customs Gateway & EDI Settings
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Configure electronic transmission credentials for ICEGATE 2.0, DGFT, and e-Sanchit.
        </p>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl border text-sm flex items-center space-x-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Grid: Credentials Form + Live Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Credentials Form (2 cols) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-semibold text-white text-base">Gateway Credentials</h2>
                <p className="text-xs text-slate-400">AES-256-GCM encrypted write-only credentials</p>
              </div>
            </div>

            <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono rounded-lg">
              Encrypted at Rest
            </span>
          </div>

          <form onSubmit={handleSaveCredentials} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Target Service
                </label>
                <select
                  value={formData.service}
                  onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="ICEGATE">ICEGATE (Bill of Entry & EDI)</option>
                  <option value="DGFT">DGFT (IEC & Licenses)</option>
                  <option value="ESANCHIT">e-Sanchit (IRN & Documents)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Environment
                </label>
                <select
                  value={formData.environment}
                  onChange={(e) => setFormData({ ...formData, environment: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="SANDBOX">Sandbox / Testing (Simulated)</option>
                  <option value="PRODUCTION">Production (Class 3 DSC Required)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  ICEGATE User ID / Registered Email
                </label>
                <input
                  type="text"
                  value={formData.icegateId}
                  onChange={(e) => setFormData({ ...formData, icegateId: e.target.value })}
                  placeholder="e.g. CHA_MUM_88192"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 transition-colors placeholder:text-slate-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Importer Exporter Code (IEC)
                </label>
                <input
                  type="text"
                  value={formData.iecCode}
                  onChange={(e) => setFormData({ ...formData, iecCode: e.target.value.toUpperCase() })}
                  placeholder="e.g. 0388123456"
                  maxLength={10}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 transition-colors placeholder:text-slate-500 uppercase font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Default Customs Port Code (UN/LOCODE)
                </label>
                <input
                  type="text"
                  value={formData.portCode}
                  onChange={(e) => setFormData({ ...formData, portCode: e.target.value.toUpperCase() })}
                  placeholder="e.g. INNSA1 (Nhava Sheva)"
                  maxLength={10}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 transition-colors placeholder:text-slate-500 uppercase font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  DSC Token Hardware PIN
                </label>
                <input
                  type={showSecrets ? 'text' : 'password'}
                  value={formData.dscPin}
                  onChange={(e) => setFormData({ ...formData, dscPin: e.target.value })}
                  placeholder="Leave blank to preserve existing"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 transition-colors placeholder:text-slate-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-slate-300">
                  Gateway Password / API Key Secret
                </label>
                <button
                  type="button"
                  onClick={() => setShowSecrets(!showSecrets)}
                  className="text-xs text-slate-400 hover:text-white flex items-center space-x-1"
                >
                  {showSecrets ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showSecrets ? 'Hide' : 'Show'}</span>
                </button>
              </div>
              <input
                type={showSecrets ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Enter password to update, or leave blank to keep current"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 transition-colors placeholder:text-slate-500"
              />
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs rounded-xl shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Encrypting & Saving...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Save Customs Credentials</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Gateway Health & Live Ping (1 col) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center space-x-3 pb-4 border-b border-slate-800">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold text-white text-base">Gateway Connectivity</h2>
              <p className="text-xs text-slate-400">Live ping & latency monitor</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="p-3 bg-slate-800/60 border border-slate-700/60 rounded-xl">
              <span className="text-[11px] font-medium text-slate-400 block mb-1">Current Adapter</span>
              <span className="text-sm font-semibold text-white">
                {formData.environment === 'SANDBOX' ? 'Sandbox Mock Adapter' : 'Live Gateway Adapter'}
              </span>
            </div>

            <div className="p-3 bg-slate-800/60 border border-slate-700/60 rounded-xl">
              <span className="text-[11px] font-medium text-slate-400 block mb-1">Circuit Breaker</span>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-xs text-emerald-400 font-medium">CLOSED (Healthy)</span>
              </div>
            </div>

            {pingResult && (
              <div
                className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                  pingResult.healthy
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
                }`}
              >
                <div className="flex items-center justify-between font-semibold">
                  <span>{pingResult.healthy ? 'Gateway Reachable' : 'Gateway Unreachable'}</span>
                  <span>{pingResult.latencyMs}ms</span>
                </div>
                <p className="text-[11px] opacity-90">{pingResult.message}</p>
              </div>
            )}
          </div>

          <button
            onClick={handlePing}
            disabled={pinging}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium rounded-xl transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {pinging ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Pinging Gateway...</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Test Gateway Connectivity</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Integration Logs Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold text-white text-base">Customs Integration Audit Logs</h2>
              <p className="text-xs text-slate-400">Immutable trace of electronic EDI transmissions</p>
            </div>
          </div>
          <button
            onClick={fetchData}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            title="Refresh logs"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {logs.length === 0 ? (
          <p className="text-xs text-slate-500 py-6 text-center italic">
            No integration transmissions logged yet. Filings and document uploads will be recorded here.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/50 text-slate-400 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5 px-3 rounded-l-lg">Timestamp</th>
                  <th className="py-2.5 px-3">Service</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Latency</th>
                  <th className="py-2.5 px-3 rounded-r-lg">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-3 font-mono text-slate-400 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-semibold text-white">{log.service}</span>
                    </td>
                    <td className="py-3 px-3 text-slate-300">{log.action}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          log.status === 'SUCCESS'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : log.status === 'CIRCUIT_BROKEN'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-400">{log.durationMs}ms</td>
                    <td className="py-3 px-3 text-slate-400 max-w-xs truncate">
                      {log.errorMessage || (log.responseSummary?.ackNumber ? `Ack: ${log.responseSummary.ackNumber}` : 'Completed')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
