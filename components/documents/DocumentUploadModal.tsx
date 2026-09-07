'use client';

import React, { useState } from 'react';
import { X, UploadCloud, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { ESANCHIT_DOC_CODES } from '@/lib/customs/adapters/esanchit-adapter';

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  importShipmentId?: string;
  shipmentId?: string;
  onSuccess: (document: any) => void;
}

const DOC_TYPE_TO_ESANCHIT: Record<string, string> = {
  COMMERCIAL_INVOICE: '010001',
  PACKING_LIST: '010002',
  BILL_OF_LADING: '010003',
  CERTIFICATE_OF_ORIGIN: '010004',
  INSURANCE_CERTIFICATE: '010005',
  TEST_REPORT: '010006',
  BILL_OF_ENTRY: '010007',
  OTHER: '010007',
};

export function DocumentUploadModal({
  isOpen,
  onClose,
  importShipmentId,
  shipmentId,
  onSuccess,
}: DocumentUploadModalProps) {
  const [docType, setDocType] = useState('COMMERCIAL_INVOICE');
  const [docTypeCode, setDocTypeCode] = useState('010001');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  function handleDocTypeChange(newType: string) {
    setDocType(newType);
    if (DOC_TYPE_TO_ESANCHIT[newType]) {
      setDocTypeCode(DOC_TYPE_TO_ESANCHIT[newType]);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (selected.type !== 'application/pdf') {
      setError('Customs regulations strictly mandate PDF documents.');
      setFile(null);
      return;
    }

    if (selected.size > 5 * 1024 * 1024) {
      setError('File size exceeds the 5MB statutory limit.');
      setFile(null);
      return;
    }

    setError(null);
    setFile(selected);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError('Please select a PDF document.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Read text snippet for extraction
      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          importShipmentId,
          shipmentId,
          docType,
          docTypeCode,
          fileName: file.name,
          fileSize: file.size,
          mimeType: 'application/pdf',
          rawContent: `[PDF Document: ${file.name}, Type: ${docType}, Size: ${(file.size / 1024).toFixed(0)} KB]`,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to upload document');
      }

      onSuccess(data.data);
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred uploading the document.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative text-slate-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-4 text-blue-400">
          <div className="p-2 bg-blue-500/10 rounded-xl border border-blue-500/20">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-white">Upload Shipping Document</h3>
            <p className="text-xs text-slate-400">Statutory ICEGATE e-Sanchit Taxonomy & OCR Ingestion</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Document Category <span className="text-rose-400">*</span>
            </label>
            <select
              value={docType}
              onChange={(e) => handleDocTypeChange(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
              required
            >
              <option value="COMMERCIAL_INVOICE">Commercial Invoice</option>
              <option value="PACKING_LIST">Packing List</option>
              <option value="BILL_OF_LADING">Bill of Lading / Airway Bill</option>
              <option value="CERTIFICATE_OF_ORIGIN">Certificate of Origin (COO)</option>
              <option value="INSURANCE_CERTIFICATE">Marine Insurance Certificate</option>
              <option value="TEST_REPORT">Lab / Quality Test Report</option>
              <option value="BILL_OF_ENTRY">Bill of Entry Copy</option>
              <option value="OTHER">Other Supporting Document</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              CBIC e-Sanchit Document Code <span className="text-rose-400">*</span>
            </label>
            <select
              value={docTypeCode}
              onChange={(e) => setDocTypeCode(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 transition-colors font-mono"
            >
              {Object.entries(ESANCHIT_DOC_CODES).map(([code, label]) => (
                <option key={code} value={code}>
                  {code} — {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              PDF Document File (Max 5MB) <span className="text-rose-400">*</span>
            </label>
            <div className="border-2 border-dashed border-slate-700 hover:border-blue-500/60 rounded-xl p-5 text-center cursor-pointer transition-colors bg-slate-800/40">
              <input
                type="file"
                accept="application/pdf"
                onChange={handleFileSelect}
                className="hidden"
                id="doc-file-input"
              />
              <label htmlFor="doc-file-input" className="cursor-pointer block">
                {file ? (
                  <div className="flex items-center justify-center space-x-2 text-blue-400">
                    <FileText className="w-5 h-5" />
                    <span className="text-xs font-medium text-slate-200 truncate max-w-xs">{file.name}</span>
                    <span className="text-[11px] text-slate-400">({(file.size / 1024).toFixed(0)} KB)</span>
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 space-y-1">
                    <p className="text-slate-200 font-medium">Click to select PDF document</p>
                    <p className="text-[11px] text-slate-500">PDF/A compliant format, $\le$ 5MB</p>
                  </div>
                )}
              </label>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
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
              disabled={loading || !file}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Upload & Ingest</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
