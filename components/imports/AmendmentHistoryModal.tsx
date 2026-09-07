'use client';

import React, { useState } from 'react';
import { History, FileEdit, AlertTriangle, Check, X, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/toast';

interface AmendmentItem {
  id: string;
  version: number;
  reason: string;
  previousValues: any;
  newValues: any;
  createdAt: string | Date;
}

interface AmendmentHistoryModalProps {
  shipmentId: string;
  amendments: AmendmentItem[];
  currentValues: {
    invoiceValue: number;
    hsCode: string;
    importerName: string;
    supplierName: string;
  };
  currency: string;
  onAmended?: () => void;
}

export function AmendmentHistoryModal({
  shipmentId,
  amendments,
  currentValues,
  currency,
  onAmended,
}: AmendmentHistoryModalProps) {
  const { success, error } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [reason, setReason] = useState('');
  const [newInvoiceValue, setNewInvoiceValue] = useState(String(currentValues.invoiceValue));
  const [newHsCode, setNewHsCode] = useState(currentValues.hsCode);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim() || reason.trim().length < 5) {
      error('Reason is mandatory and must be at least 5 characters');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/import-shipments/${shipmentId}/amend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: reason.trim(),
          invoiceValue: parseFloat(newInvoiceValue) || undefined,
          hsCode: newHsCode.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message || 'Failed to file amendment');
      }

      success(`Amendment v${data.amendment.version} filed successfully!`);
      setShowForm(false);
      setIsOpen(false);
      if (onAmended) {
        onAmended();
      } else {
        window.location.reload();
      }
    } catch (err: unknown) {
      error(err instanceof Error ? err.message : 'Error filing amendment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="gap-2 text-xs border-slate-300 dark:border-slate-700"
      >
        <History className="h-3.5 w-3.5" />
        Amendment History {amendments.length > 0 && `(v${amendments.length + 1})`}
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-xl max-h-[85vh] flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                  <FileEdit className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Customs Bill of Entry Amendments
                  </h3>
                  <p className="text-xs text-slate-400">Immutable version history & declared value revisions</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {!showForm ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Audit Trail ({amendments.length} amendments filed)
                    </span>
                    <Button
                      size="sm"
                      onClick={() => setShowForm(true)}
                      className="text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <FileEdit className="h-3 w-3" /> File New Amendment
                    </Button>
                  </div>

                  {amendments.length === 0 ? (
                    <div className="py-10 text-center text-slate-400 text-xs border border-dashed rounded-xl border-slate-200 dark:border-slate-800">
                      No amendments filed yet. Original declared values remain in effect.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {amendments.map((item) => (
                        <div
                          key={item.id}
                          className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-900">
                              Version {item.version}
                            </span>
                            <span className="text-slate-400">
                              {new Date(item.createdAt).toLocaleString()}
                            </span>
                          </div>

                          <div>
                            <p className="text-slate-400 text-[11px]">Reason for Amendment:</p>
                            <p className="font-medium text-slate-800 dark:text-slate-200">{item.reason}</p>
                          </div>

                          <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 grid grid-cols-2 gap-2 text-[11px]">
                            <div>
                              <p className="text-slate-400">Invoice Value:</p>
                              <div className="flex items-center gap-1 font-mono">
                                <span className="line-through text-slate-400">
                                  {currency} {item.previousValues?.invoiceValue}
                                </span>
                                <ArrowRight className="h-3 w-3 text-slate-400" />
                                <span className="font-bold text-slate-900 dark:text-slate-100">
                                  {currency} {item.newValues?.invoiceValue}
                                </span>
                              </div>
                            </div>

                            <div>
                              <p className="text-slate-400">HS Code:</p>
                              <div className="flex items-center gap-1 font-mono">
                                <span className="line-through text-slate-400">
                                  {item.previousValues?.hsCode}
                                </span>
                                <ArrowRight className="h-3 w-3 text-slate-400" />
                                <span className="font-bold text-slate-900 dark:text-slate-100">
                                  {item.newValues?.hsCode}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-200 text-xs flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
                    <p>
                      Filing a Bill of Entry amendment updates the assessable value and recalculates statutory customs duty automatically.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">
                      Reason for Amendment <span className="text-red-500">*</span>
                    </Label>
                    <textarea
                      required
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="e.g. Revised commercial invoice received with revised CIF freight charges"
                      className="w-full h-20 p-2.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Revised Invoice Value ({currency})</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={newInvoiceValue}
                        onChange={(e) => setNewInvoiceValue(e.target.value)}
                        className="text-xs font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Revised 8-Digit HS Code</Label>
                      <Input
                        maxLength={8}
                        value={newHsCode}
                        onChange={(e) => setNewHsCode(e.target.value)}
                        className="text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowForm(false)}
                      className="text-xs"
                    >
                      Back to History
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={isSubmitting}
                      className="text-xs bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {isSubmitting ? 'Recording Amendment...' : 'Submit Amendment'}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
