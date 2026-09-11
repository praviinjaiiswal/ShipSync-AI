'use client';

import React, { useState, useEffect } from 'react';
import {
  Send,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Clock,
  ShieldCheck,
  UploadCloud,
  FileText,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { ManualOverrideModal } from './ManualOverrideModal';
import { EsanchitUploadModal } from './EsanchitUploadModal';

interface CustomsFilingCardProps {
  shipmentId: string;
  currentStatus: string;
  beNumber?: string;
  isLocked: boolean;
  userRole?: string;
  onStatusChange?: (newStatus: string) => void;
}

interface IRNItem {
  irnNumber: string;
  fileName: string;
  docTypeCode: string;
}

export function CustomsFilingCard({
  shipmentId,
  currentStatus,
  beNumber,
  isLocked,
  userRole,
  onStatusChange,
}: CustomsFilingCardProps) {
  const [loading, setLoading] = useState(false);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<string | null>(null);
  const [ackNumber, setAckNumber] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isOverrideOpen, setIsOverrideOpen] = useState(false);
  const [isEsanchitOpen, setIsEsanchitOpen] = useState(false);
  const [irns, setIrns] = useState<IRNItem[]>([]);

  const canFile = ['OWNER', 'ADMIN', 'OPS_EXECUTIVE'].includes(userRole || '');
  const canOverride = ['OWNER', 'ADMIN'].includes(userRole || '');

  // Poll for background job status if a job is in progress
  useEffect(() => {
    if (!activeJobId || ['ACKNOWLEDGED', 'FAILED', 'CIRCUIT_BROKEN'].includes(jobStatus || '')) {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/customs/jobs/${activeJobId}`);
        const data = await res.json();
        if (data.success && data.data) {
          setJobStatus(data.data.status);
          if (data.data.ackNumber) {
            setAckNumber(data.data.ackNumber);
          }
          if (data.data.status === 'ACKNOWLEDGED') {
            onStatusChange?.('BOE_FILED');
            setLoading(false);
          } else if (data.data.status === 'FAILED' || data.data.status === 'CIRCUIT_BROKEN') {
            setError(data.data.lastError || 'Filing processing encountered an error.');
            setLoading(false);
          }
        }
      } catch {
        // Continue polling
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [activeJobId, jobStatus, onStatusChange]);

  async function handleTransmit() {
    if (!beNumber) {
      setError('A Bill of Entry must be generated before transmitting to ICEGATE.');
      return;
    }

    setLoading(true);
    setError(null);
    setJobStatus('QUEUED');

    try {
      const res = await fetch('/api/customs/file-boe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          importShipmentId: shipmentId,
          beNumber,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to submit filing');
      }

      setActiveJobId(data.data.jobId);
    } catch (err: any) {
      setError(err.message || 'Transmission request failed');
      setLoading(false);
      setJobStatus(null);
    }
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
      {/* Ambient gradient */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between pb-5 border-b border-slate-800 mb-5">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400">
            <Send className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-base">Customs Gateway Integration</h3>
            <p className="text-xs text-slate-400">Adapter-Based ICEGATE 2.0 & e-Sanchit Transmission (Mock/Testing Mode)</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {canOverride && (
            <button
              onClick={() => setIsOverrideOpen(true)}
              className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-medium rounded-lg transition-colors"
            >
              Manual Override
            </button>
          )}
        </div>
      </div>

      {/* Status Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block mb-1">
            Transmission Channel
          </span>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold text-white">ICEGATE EDI (ICES 1.5)</span>
          </div>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block mb-1">
            Filing Status
          </span>
          <div className="flex items-center space-x-2">
            {jobStatus === 'PROCESSING' || jobStatus === 'QUEUED' ? (
              <span className="inline-flex items-center space-x-1.5 text-xs text-blue-400 font-medium">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>{jobStatus === 'QUEUED' ? 'Queued' : 'Transmitting...'}</span>
              </span>
            ) : ackNumber || currentStatus !== 'IGM_FILED' ? (
              <span className="inline-flex items-center space-x-1 text-xs text-emerald-400 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Acknowledged</span>
              </span>
            ) : (
              <span className="inline-flex items-center space-x-1 text-xs text-slate-400">
                <Clock className="w-3.5 h-3.5" />
                <span>Ready to Transmit</span>
              </span>
            )}
          </div>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block mb-1">
            ICEGATE Acknowledgment No.
          </span>
          <span className="text-xs font-mono font-medium text-slate-200">
            {ackNumber || 'Not Generated Yet'}
          </span>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* e-Sanchit Supporting Documents Subsection */}
      <div className="mb-6 p-4 bg-slate-950/40 border border-slate-800 rounded-xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <UploadCloud className="w-4 h-4 text-blue-400" />
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider">
              e-Sanchit Paperless Documents (IRN)
            </h4>
          </div>
          <button
            onClick={() => setIsEsanchitOpen(true)}
            className="px-2.5 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-xs font-medium rounded-lg transition-colors flex items-center space-x-1.5"
          >
            <span>+ Upload to e-Sanchit</span>
          </button>
        </div>

        {irns.length === 0 ? (
          <p className="text-xs text-slate-500 italic">
            No e-Sanchit IRNs registered yet. Upload supporting commercial invoice or packing list to generate statutory IRN.
          </p>
        ) : (
          <div className="space-y-2">
            {irns.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 bg-slate-900 border border-slate-800 rounded-lg text-xs"
              >
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-blue-400" />
                  <span className="font-medium text-slate-200">{item.fileName}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-emerald-400 font-medium">{item.irnNumber}</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-800">
        <div className="flex items-center space-x-2 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Class 3 Digital Signature Certificate (DSC) Verified</span>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleTransmit}
            disabled={loading || !canFile || !beNumber || currentStatus !== 'IGM_FILED'}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs rounded-xl shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Transmitting to ICEGATE...</span>
              </>
            ) : currentStatus !== 'IGM_FILED' ? (
              <>
                <FileCheck className="w-4 h-4" />
                <span>Filing Transmitted</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Transmit to ICEGATE</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Modals */}
      <ManualOverrideModal
        isOpen={isOverrideOpen}
        onClose={() => setIsOverrideOpen(false)}
        shipmentId={shipmentId}
        currentStatus={currentStatus}
        onSuccess={(newStatus) => onStatusChange?.(newStatus)}
      />

      <EsanchitUploadModal
        isOpen={isEsanchitOpen}
        onClose={() => setIsEsanchitOpen(false)}
        shipmentId={shipmentId}
        onSuccess={(newIrn) => setIrns((prev) => [...prev, newIrn])}
      />
    </div>
  );
}
