'use client';

import React, { useState } from 'react';
import { X, UploadCloud, CheckCircle2, FileText } from 'lucide-react';
import { ESANCHIT_DOC_CODES } from '@/lib/customs/adapters/esanchit-adapter';

interface EsanchitUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  shipmentId: string;
  onSuccess: (result: { irnNumber: string; fileName: string; docTypeCode: string }) => void;
}

export function EsanchitUploadModal({
  isOpen,
  onClose,
  shipmentId,
  onSuccess,
}: EsanchitUploadModalProps) {
  const [docTypeCode, setDocTypeCode] = useState('010001');
  const [docName, setDocName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (selected.type !== 'application/pdf') {
      setError('e-Sanchit strictly mandates PDF format.');
      setFile(null);
      return;
    }

    if (selected.size > 5 * 1024 * 1024) {
      setError('Document exceeds the 5MB statutory size limit.');
      setFile(null);
      return;
    }

    setError(null);
    setFile(selected);
    if (!docName) {
      setDocName(selected.name.replace(/\.[^/.]+$/, ''));
    }
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
      // Read file as Base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const res = reader.result as string;
          // Strip data:application/pdf;base64, prefix
          const base64Content = res.split(',')[1] || res;
          resolve(base64Content);
        };
        reader.onerror = reject;
      });
      reader.readAsDataURL(file);
      const fileBase64 = await base64Promise;

      const res = await fetch('/api/customs/esanchit/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          importShipmentId: shipmentId,
          docTypeCode,
          docName: docName.trim(),
          fileName: file.name,
          mimeType: 'application/pdf',
          fileBase64,
          fileSize: file.size,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'e-Sanchit upload failed');
      }

      onSuccess({
        irnNumber: data.data.irnNumber,
        fileName: file.name,
        docTypeCode,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error occurred uploading to e-Sanchit.');
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
            <h3 className="font-semibold text-lg text-white">e-Sanchit Document Upload</h3>
            <p className="text-xs text-slate-400">Generate Image Reference Number (IRN) for Customs Filing</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Statutory Document Type <span className="text-rose-400">*</span>
            </label>
            <select
              value={docTypeCode}
              onChange={(e) => setDocTypeCode(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
              required
            >
              {Object.entries(ESANCHIT_DOC_CODES).map(([code, name]) => (
                <option key={code} value={code}>
                  {code} — {name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Document Label / Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={docName}
              onChange={(e) => setDocName(e.target.value)}
              placeholder="e.g. Commercial Invoice CI-2026-889"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 transition-colors placeholder:text-slate-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Select PDF File (Max 5MB) <span className="text-rose-400">*</span>
            </label>
            <div className="border-2 border-dashed border-slate-700 hover:border-blue-500/60 rounded-xl p-4 text-center cursor-pointer transition-colors bg-slate-800/40">
              <input
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                className="hidden"
                id="esanchit-file-input"
              />
              <label htmlFor="esanchit-file-input" className="cursor-pointer block">
                {file ? (
                  <div className="flex items-center justify-center space-x-2 text-blue-400">
                    <FileText className="w-5 h-5" />
                    <span className="text-xs font-medium text-slate-200 truncate max-w-xs">{file.name}</span>
                    <span className="text-[11px] text-slate-400">({(file.size / 1024).toFixed(0)} KB)</span>
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 space-y-1">
                    <p className="text-slate-300 font-medium">Click to select PDF document</p>
                    <p className="text-[11px] text-slate-500">Class 3 Digital Signing & IRN generation</p>
                  </div>
                )}
              </label>
            </div>
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
              disabled={loading || !file}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Uploading to e-Sanchit...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Upload & Generate IRN</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
