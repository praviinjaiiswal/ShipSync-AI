'use client';

import React, { useState } from 'react';
import { AlertTriangle, X, CheckCircle2, ShieldAlert } from 'lucide-react';

interface ManualOverrideModalProps {
  isOpen: boolean;
  onClose: () => void;
  shipmentId: string;
  currentStatus: string;
  onSuccess: (newStatus: string) => void;
}

const STATUTORY_STATUSES = [
  { value: 'IGM_FILED', label: 'IGM Filed' },
  { value: 'BOE_FILED', label: 'Bill of Entry Filed' },
  { value: 'ASSESSED', label: 'Customs Duty Assessed' },
  { value: 'DUTY_PAID', label: 'Customs Duty Paid' },
  { value: 'EXAMINED', label: 'Cargo Examined' },
  { value: 'OUT_OF_CHARGE', label: 'Out of Charge (OOC)' },
  { value: 'DELIVERED', label: 'Delivered / Cleared' },
];

export function ManualOverrideModal({
  isOpen,
  onClose,
  shipmentId,
  currentStatus,
  onSuccess,
}: ManualOverrideModalProps) {
  const [newStatus, setNewStatus] = useState('');
  const [reason, setReason] = useState('');
  const [statutoryRef, setStatutoryRef] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newStatus) {
      setError('Please select a target status.');
      return;
    }
    if (reason.trim().length < 15) {
      setError('Statutory justification reason must be at least 15 characters.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/customs/manual-override', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          importShipmentId: shipmentId,
          newStatus,
          reason: reason.trim(),
          statutoryRef: statutoryRef.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to apply manual override');
      }

      onSuccess(newStatus);
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred during status override.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-amber-500/30 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative text-slate-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-4 text-amber-400">
          <div className="p-2 bg-amber-500/10 rounded-xl border border-amber-500/20">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-white">Statutory Manual Override</h3>
            <p className="text-xs text-amber-300/80">Admin / Compliance Authority Authorization Required</p>
          </div>
        </div>

        <div className="bg-amber-950/30 border border-amber-500/20 rounded-xl p-3 mb-5 text-xs text-amber-200/90 leading-relaxed flex items-start space-x-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
          <span>
            <strong>Statutory Audit Warning:</strong> Manual status overrides bypass automated gateway reconciliation. This action, along with your user ID and timestamp, is recorded permanently in the Customs Override Audit register.
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Current Shipment Status
            </label>
            <div className="px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-xs font-mono text-slate-300">
              {currentStatus}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Target Customs Status <span className="text-rose-400">*</span>
            </label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
              required
            >
              <option value="">Select target status...</option>
              {STATUTORY_STATUSES.filter((s) => s.value !== currentStatus).map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label} ({s.value})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Mandatory Statutory Reason (min 15 chars) <span className="text-rose-400">*</span>
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Clearance memo issued manually at port due to ICEGATE gateway maintenance downtime..."
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-amber-500 transition-colors placeholder:text-slate-500"
              required
            />
            <div className="text-[11px] text-slate-400 mt-1 flex justify-between">
              <span>Must reflect official customs officer communication</span>
              <span className={reason.trim().length >= 15 ? 'text-emerald-400' : 'text-amber-400'}>
                {reason.trim().length}/15 chars
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Customs Office / Memo Reference No. (Optional)
            </label>
            <input
              type="text"
              value={statutoryRef}
              onChange={(e) => setStatutoryRef(e.target.value)}
              placeholder="e.g. CUS/ACC/OOC/2026/09/8812"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-amber-500 transition-colors placeholder:text-slate-500"
            />
          </div>

          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || reason.trim().length < 15 || !newStatus}
              className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white font-medium text-sm rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Applying...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm Override</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
