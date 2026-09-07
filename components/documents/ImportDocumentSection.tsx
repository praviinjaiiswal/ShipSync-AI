'use client';

import React, { useState } from 'react';
import {
  FileText,
  Upload,
  CheckCircle2,
  AlertCircle,
  Eye,
  ShieldCheck,
  Send,
  RefreshCw,
  FileCheck,
} from 'lucide-react';
import { DocumentUploadModal } from './DocumentUploadModal';
import { DocumentExtractionInspector } from './DocumentExtractionInspector';
import { DiscrepancyBanner } from './DiscrepancyBanner';
import type { DiscrepancyReport } from '@/lib/documents/canonical-types';

interface DocumentItem {
  id: string;
  docType: string;
  docTypeCode: string | null;
  fileName: string | null;
  fileSize: number | null;
  status: string;
  irnNumber: string | null;
  extractedData: any;
  discrepancies: any;
  createdAt: string;
}

interface ImportDocumentSectionProps {
  shipmentId: string;
  initialDocuments: DocumentItem[];
  userRole?: string;
}

export function ImportDocumentSection({
  shipmentId,
  initialDocuments,
  userRole,
}: ImportDocumentSectionProps) {
  const [documents, setDocuments] = useState<DocumentItem[]>(initialDocuments);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);
  const [discrepancyReport, setDiscrepancyReport] = useState<DiscrepancyReport | null>(null);
  const [checkingDiscrepancies, setCheckingDiscrepancies] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const canEdit = ['OWNER', 'ADMIN', 'OPS_EXECUTIVE'].includes(userRole || '');

  async function handleRunDiscrepancyCheck() {
    setCheckingDiscrepancies(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/import-shipments/${shipmentId}/discrepancy-check`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Check failed');
      setDiscrepancyReport(data.data);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to check discrepancies' });
    } finally {
      setCheckingDiscrepancies(false);
    }
  }

  async function handlePrepareEsanchit(docId: string) {
    setActionLoading(docId);
    setMessage(null);
    try {
      const res = await fetch(`/api/documents/${docId}/prepare-esanchit`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Validation failed');

      setDocuments((prev) =>
        prev.map((d) => (d.id === docId ? { ...d, status: 'ESANCHIT_READY' } : d))
      );
      setMessage({ type: 'success', text: data.message });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'e-Sanchit validation failed' });
    } finally {
      setActionLoading(null);
    }
  }

  async function handleTransmitEsanchit(docId: string) {
    setActionLoading(docId);
    setMessage(null);
    try {
      const res = await fetch(`/api/documents/${docId}/transmit-esanchit`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Transmission failed');

      setDocuments((prev) =>
        prev.map((d) =>
          d.id === docId
            ? { ...d, status: 'ESANCHIT_UPLOADED', irnNumber: data.data.irnNumber }
            : d
        )
      );
      setMessage({ type: 'success', text: data.message });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Transmission failed' });
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-base">
              Supporting Documents & e-Sanchit Pipeline
            </h3>
            <p className="text-xs text-slate-400">
              Commercial Invoice, Packing List, Bill of Lading & IRN registration
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={handleRunDiscrepancyCheck}
            disabled={checkingDiscrepancies || documents.length === 0}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors flex items-center space-x-1.5 disabled:opacity-50"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>Cross-Check Discrepancies</span>
          </button>

          {canEdit && (
            <button
              onClick={() => setIsUploadOpen(true)}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition-colors flex items-center space-x-1.5 shadow-md shadow-blue-500/20"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>+ Upload Document</span>
            </button>
          )}
        </div>
      </div>

      {/* Discrepancy Banner */}
      <DiscrepancyBanner
        report={discrepancyReport}
        loading={checkingDiscrepancies}
        onRecheck={handleRunDiscrepancyCheck}
      />

      {message && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-center space-x-2 ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Documents List Table */}
      {documents.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-500 italic bg-slate-950/30 rounded-xl border border-slate-800">
          No shipping documents uploaded yet. Upload Commercial Invoice and Packing List to begin OCR extraction and e-Sanchit preparation.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/50 text-slate-400 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-2.5 px-3 rounded-l-lg">Document Type</th>
                <th className="py-2.5 px-3">e-Sanchit Code</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">IRN (Image Ref No.)</th>
                <th className="py-2.5 px-3 text-right rounded-r-lg">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-3">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                      <div>
                        <span className="font-semibold text-white block">{doc.docType}</span>
                        <span className="text-[11px] text-slate-400 truncate max-w-xs block">
                          {doc.fileName || 'document.pdf'}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-3 font-mono text-slate-300">
                    {doc.docTypeCode || '—'}
                  </td>

                  <td className="py-3 px-3">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        doc.status === 'ESANCHIT_UPLOADED'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : doc.status === 'ESANCHIT_READY' || doc.status === 'VERIFIED'
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          : doc.status === 'EXTRACTED'
                          ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {doc.status}
                    </span>
                  </td>

                  <td className="py-3 px-3 font-mono text-emerald-400 text-xs">
                    {doc.irnNumber || 'Not Uploaded Yet'}
                  </td>

                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      {/* Inspect / Verify Button */}
                      <button
                        onClick={() => setSelectedDoc(doc)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 text-[11px] flex items-center space-x-1 transition-colors"
                        title="Inspect canonical extracted fields"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Inspect</span>
                      </button>

                      {/* Prepare for e-Sanchit Button */}
                      {doc.status === 'VERIFIED' && (
                        <button
                          onClick={() => handlePrepareEsanchit(doc.id)}
                          disabled={actionLoading === doc.id}
                          className="px-2.5 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 rounded text-[11px] flex items-center space-x-1 transition-colors"
                        >
                          <FileCheck className="w-3 h-3" />
                          <span>Pre-flight</span>
                        </button>
                      )}

                      {/* Transmit to e-Sanchit Button */}
                      {doc.status === 'ESANCHIT_READY' && (
                        <button
                          onClick={() => handleTransmitEsanchit(doc.id)}
                          disabled={actionLoading === doc.id}
                          className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded text-[11px] flex items-center space-x-1 transition-colors"
                        >
                          <Send className="w-3 h-3" />
                          <span>Transmit</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      <DocumentUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        importShipmentId={shipmentId}
        onSuccess={(newDoc) => setDocuments((prev) => [newDoc, ...prev])}
      />

      <DocumentExtractionInspector
        isOpen={Boolean(selectedDoc)}
        onClose={() => setSelectedDoc(null)}
        document={selectedDoc}
        onVerified={(updated) => {
          setDocuments((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
          setSelectedDoc(null);
        }}
      />
    </div>
  );
}
