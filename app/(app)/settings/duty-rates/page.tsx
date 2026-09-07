'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Search, Plus, Save, History, ShieldCheck, RefreshCw, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/toast';

export default function DutyRatesMaintenancePage() {
  const { success, error } = useToast();
  const [rates, setRates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedRate, setSelectedRate] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [hsCode, setHsCode] = useState('');
  const [description, setDescription] = useState('');
  const [bcdRate, setBcdRate] = useState('0.075');
  const [igstRate, setIgstRate] = useState('0.18');
  const [cessRate, setCessRate] = useState('0');
  const [sourceRef, setSourceRef] = useState('Customs Notification No. 50/2017-Customs');

  const fetchRates = () => {
    setLoading(true);
    fetch(`/api/import-duty-rates?search=${encodeURIComponent(search)}`)
      .then((res) => res.json())
      .then((data) => setRates(data.rates || []))
      .catch(() => error('Failed to load duty rates'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRates();
  }, [search]);

  const handleOpenAdd = () => {
    setHsCode('');
    setDescription('');
    setBcdRate('0.075');
    setIgstRate('0.18');
    setCessRate('0');
    setSourceRef('Customs Notification No. 50/2017-Customs');
    setIsEditing(true);
  };

  const handleOpenEdit = (rate: any) => {
    setHsCode(rate.hsCode);
    setDescription(rate.description || '');
    setBcdRate(String(rate.bcdRate));
    setIgstRate(String(rate.igstRate));
    setCessRate(String(rate.cessRate || 0));
    setSourceRef(rate.sourceNotificationRef || 'Customs Notification No. 50/2017-Customs');
    setIsEditing(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch('/api/import-duty-rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hsCode: hsCode.trim(),
          description: description.trim(),
          bcdRate: parseFloat(bcdRate),
          igstRate: parseFloat(igstRate),
          cessRate: parseFloat(cessRate),
          sourceNotificationRef: sourceRef.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message || 'Failed to save duty rate');
      }

      success(`Duty rate for HS Code ${hsCode} updated and audited successfully!`);
      setIsEditing(false);
      fetchRates();
    } catch (err: unknown) {
      error(err instanceof Error ? err.message : 'Error updating duty rate');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Link
        href="/settings"
        className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Settings
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Customs Tariff & Duty Rate Maintenance
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Admin/Owner controlled CBIC statutory tariff rates. All modifications are append-only audit logged.
          </p>
        </div>

        <Button
          onClick={handleOpenAdd}
          className="text-xs bg-blue-600 hover:bg-blue-700 text-white gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add / Update Tariff Code
        </Button>
      </div>

      {/* Editor Modal / Panel */}
      {isEditing && (
        <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-5 space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-blue-500/20">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Tariff Schedule Record Editor (Audited Action)
            </h3>
            <button
              onClick={() => setIsEditing(false)}
              className="text-xs text-slate-500 hover:text-slate-800"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">8-Digit HS Code *</Label>
              <Input
                required
                maxLength={8}
                value={hsCode}
                onChange={(e) => setHsCode(e.target.value.replace(/\D/g, ''))}
                placeholder="e.g. 84821010"
                className="text-xs font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">BCD Rate (Fraction, e.g. 0.075 for 7.5%) *</Label>
              <Input
                required
                type="number"
                step="0.001"
                min="0"
                max="1"
                value={bcdRate}
                onChange={(e) => setBcdRate(e.target.value)}
                className="text-xs font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">IGST Rate (Fraction, e.g. 0.18 for 18%) *</Label>
              <Input
                required
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={igstRate}
                onChange={(e) => setIgstRate(e.target.value)}
                className="text-xs font-mono"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs font-semibold">Product Description</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Industrial ball bearings"
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Source Notification Ref *</Label>
              <Input
                required
                value={sourceRef}
                onChange={(e) => setSourceRef(e.target.value)}
                placeholder="e.g. Customs Notification No. 50/2017-Customs"
                className="text-xs"
              />
            </div>

            <div className="sm:col-span-3 flex justify-end gap-2 pt-2">
              <Button
                type="submit"
                disabled={isSaving}
                className="text-xs bg-blue-600 hover:bg-blue-700 text-white gap-2"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save & Audit Tariff Record
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Search & Rates Table */}
      <div className="space-y-3">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search HS Code, description, notification..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm"
          />
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading tariff rates...</div>
          ) : rates.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">No duty rates found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                  <tr>
                    <th className="py-3 px-4">HS Code</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4">BCD</th>
                    <th className="py-3 px-4">SWS</th>
                    <th className="py-3 px-4">IGST</th>
                    <th className="py-3 px-4">Source Notification</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {rates.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                        {r.hsCode}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                        {r.description || '—'}
                      </td>
                      <td className="py-3 px-4 font-semibold text-blue-600 dark:text-blue-400">
                        {(r.bcdRate * 100).toFixed(1)}%
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-medium">
                        10% of BCD
                      </td>
                      <td className="py-3 px-4 font-semibold text-purple-600 dark:text-purple-400">
                        {(r.igstRate * 100).toFixed(1)}%
                      </td>
                      <td className="py-3 px-4 text-[11px] text-slate-400 max-w-[200px] truncate">
                        {r.sourceNotificationRef}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleOpenEdit(r)}
                          className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          Edit Rate
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
