'use client';

import React, { useState } from 'react';
import { X, CheckCircle2, FileSearch, Save, RefreshCw, AlertCircle } from 'lucide-react';

interface DocumentExtractionInspectorProps {
  isOpen: boolean;
  onClose: () => void;
  document: any;
  onVerified: (updated: any) => void;
}

export function DocumentExtractionInspector({
  isOpen,
  onClose,
  document,
  onVerified,
}: DocumentExtractionInspectorProps) {
  const [extractedData, setExtractedData] = useState<any>(document?.extractedData || {});
  const [saving, setSaving] = useState(false);
  const [reExtracting, setReExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !document) return null;

  const docType = document.docType;

  async function handleReExtract() {
    setReExtracting(true);
    setError(null);
    try {
      const res = await fetch(`/api/documents/${document.id}/ocr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Extraction failed');
      setExtractedData(data.data.extractedData);
    } catch (err: any) {
      setError(err.message || 'Failed to re-extract document');
    } finally {
      setReExtracting(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/documents/${document.id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ extractedData }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Verification failed');

      onVerified(data.data);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error saving verified fields');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative text-slate-100 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
          <div className="flex items-center space-x-3 text-purple-400">
            <div className="p-2 bg-purple-500/10 rounded-xl border border-purple-500/20">
              <FileSearch className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-white">Canonical Document Inspector</h3>
              <p className="text-xs text-slate-400">
                {document.fileName || document.docType} ({document.docTypeCode || 'Statutory Code'})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleReExtract}
            disabled={reExtracting}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors flex items-center space-x-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${reExtracting ? 'animate-spin' : ''}`} />
            <span>Re-run OCR</span>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-4">
          {/* COMMERCIAL INVOICE FIELDS */}
          {docType === 'COMMERCIAL_INVOICE' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Invoice Number</label>
                <input
                  type="text"
                  value={extractedData.invoiceNumber || ''}
                  onChange={(e) => setExtractedData({ ...extractedData, invoiceNumber: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Invoice Date</label>
                <input
                  type="date"
                  value={extractedData.invoiceDate || ''}
                  onChange={(e) => setExtractedData({ ...extractedData, invoiceDate: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Supplier / Exporter</label>
                <input
                  type="text"
                  value={extractedData.sellerName || ''}
                  onChange={(e) => setExtractedData({ ...extractedData, sellerName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Importer / Buyer</label>
                <input
                  type="text"
                  value={extractedData.buyerName || ''}
                  onChange={(e) => setExtractedData({ ...extractedData, buyerName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Currency</label>
                <input
                  type="text"
                  value={extractedData.currency || 'USD'}
                  onChange={(e) => setExtractedData({ ...extractedData, currency: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white font-mono"
                  maxLength={3}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Total Invoice Amount</label>
                <input
                  type="number"
                  step="0.01"
                  value={extractedData.totalAmount || 0}
                  onChange={(e) => setExtractedData({ ...extractedData, totalAmount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Incoterm</label>
                <input
                  type="text"
                  value={extractedData.incoterm || 'CIF'}
                  onChange={(e) => setExtractedData({ ...extractedData, incoterm: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Total Quantity</label>
                <input
                  type="number"
                  value={extractedData.totalQuantity || 1}
                  onChange={(e) => setExtractedData({ ...extractedData, totalQuantity: parseInt(e.target.value, 10) || 1 })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white font-mono"
                />
              </div>
            </div>
          )}

          {/* PACKING LIST FIELDS */}
          {docType === 'PACKING_LIST' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Packing List Number</label>
                <input
                  type="text"
                  value={extractedData.packingListNumber || ''}
                  onChange={(e) => setExtractedData({ ...extractedData, packingListNumber: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Total Packages</label>
                <input
                  type="number"
                  value={extractedData.totalPackages || 1}
                  onChange={(e) => setExtractedData({ ...extractedData, totalPackages: parseInt(e.target.value, 10) || 1 })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Gross Weight (KGS)</label>
                <input
                  type="number"
                  step="0.01"
                  value={extractedData.grossWeightKg || 0}
                  onChange={(e) => setExtractedData({ ...extractedData, grossWeightKg: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Net Weight (KGS)</label>
                <input
                  type="number"
                  step="0.01"
                  value={extractedData.netWeightKg || 0}
                  onChange={(e) => setExtractedData({ ...extractedData, netWeightKg: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white font-mono"
                  required
                />
              </div>
            </div>
          )}

          {/* BILL OF LADING FIELDS */}
          {docType === 'BILL_OF_LADING' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">BL / AWB Number</label>
                <input
                  type="text"
                  value={extractedData.blNumber || ''}
                  onChange={(e) => setExtractedData({ ...extractedData, blNumber: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Vessel / Carrier Name</label>
                <input
                  type="text"
                  value={extractedData.vesselName || ''}
                  onChange={(e) => setExtractedData({ ...extractedData, vesselName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Port of Loading</label>
                <input
                  type="text"
                  value={extractedData.portOfLoading || ''}
                  onChange={(e) => setExtractedData({ ...extractedData, portOfLoading: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Port of Discharge</label>
                <input
                  type="text"
                  value={extractedData.portOfDischarge || ''}
                  onChange={(e) => setExtractedData({ ...extractedData, portOfDischarge: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">BL Gross Weight (KGS)</label>
                <input
                  type="number"
                  step="0.01"
                  value={extractedData.grossWeightKg || 0}
                  onChange={(e) => setExtractedData({ ...extractedData, grossWeightKg: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white font-mono"
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-medium text-sm rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Verify & Approve Extraction</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
