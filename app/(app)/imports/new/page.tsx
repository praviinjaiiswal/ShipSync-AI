'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Anchor, Calculator, ShieldAlert, CheckCircle2, AlertTriangle, ArrowDownToLine, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useDebounce } from '@/hooks/useDebounce';
import { useToast } from '@/components/ui/toast';
import { PolicyNoticeBanner } from '@/components/imports/PolicyNoticeBanner';

const MAJOR_INDIAN_PORTS = [
  { code: 'INNSA1', name: 'Nhava Sheva (JNPT), Maharashtra' },
  { code: 'INMAA1', name: 'Chennai Port, Tamil Nadu' },
  { code: 'INMUN1', name: 'Mundra Port, Gujarat' },
  { code: 'INBOM1', name: 'Mumbai Sea / Air Cargo, Maharashtra' },
  { code: 'INDEL4', name: 'Delhi Air Cargo (IGI), New Delhi' },
  { code: 'INKAT1', name: 'Kattupalli Port, Tamil Nadu' },
  { code: 'INCCU1', name: 'Kolkata Port, West Bengal' },
];

export default function NewImportPage() {
  const router = useRouter();
  const { success, error } = useToast();

  const [importerName, setImporterName] = useState('');
  const [importerIEC, setImporterIEC] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [supplierCountry, setSupplierCountry] = useState('');
  const [portOfImport, setPortOfImport] = useState('INNSA1 / Nhava Sheva');
  const [igmNumber, setIgmNumber] = useState('');
  const [blOrAwbNumber, setBlOrAwbNumber] = useState('');
  const [hsCode, setHsCode] = useState('84821010');
  const [invoiceValue, setInvoiceValue] = useState('50000');
  const [currency, setCurrency] = useState('USD');
  const [incoterm, setIncoterm] = useState('CIF');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dutyPreview, setDutyPreview] = useState<any>(null);
  const [policyInfo, setPolicyInfo] = useState<any>(null);
  const [dutyLoading, setDutyLoading] = useState(false);

  // Debounce HS Code and Invoice value for live preview
  const debouncedHsCode = useDebounce(hsCode, 400);
  const debouncedValue = useDebounce(invoiceValue, 400);

  // Fetch company profile IEC / name on mount as default
  useEffect(() => {
    fetch('/api/profile')
      .then((res) => res.json())
      .then((data) => {
        if (data.user?.company) {
          if (data.user.company.name) setImporterName(data.user.company.name);
          if (data.user.company.ieCode) setImporterIEC(data.user.company.ieCode);
        }
      })
      .catch(() => {});
  }, []);

  // Live Duty & Policy estimation
  useEffect(() => {
    if (debouncedHsCode && debouncedHsCode.length === 8 && parseFloat(debouncedValue) > 0) {
      setDutyLoading(true);

      // 1. Check Duty Rate
      fetch(`/api/import-duty-rates?hsCode=${debouncedHsCode}`)
        .then((res) => res.json())
        .then((data) => {
          const rate = data.rates?.find((r: any) => r.hsCode === debouncedHsCode);
          if (rate) {
            const val = parseFloat(debouncedValue);
            const landing = val * 0.01;
            const assessable = val + landing;
            const bcd = assessable * rate.bcdRate;
            const sws = bcd * 0.10;
            const igst = (assessable + bcd + sws) * rate.igstRate;
            const total = bcd + sws + igst;

            setDutyPreview({
              bcdRate: rate.bcdRate,
              igstRate: rate.igstRate,
              assessableValue: assessable,
              bcdAmount: bcd,
              swsAmount: sws,
              igstAmount: igst,
              totalDuty: total,
            });
          } else {
            setDutyPreview(null);
          }
        })
        .catch(() => setDutyPreview(null))
        .finally(() => setDutyLoading(false));
    }
  }, [debouncedHsCode, debouncedValue]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importerIEC || importerIEC.length !== 10) {
      error('Importer IEC must be exactly 10 digits');
      return;
    }

    if (!hsCode || hsCode.length !== 8) {
      error('HS Code must be exactly 8 digits');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/import-shipments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          importerName,
          importerIEC,
          supplierName,
          supplierCountry,
          portOfImport,
          igmNumber: igmNumber || undefined,
          blOrAwbNumber: blOrAwbNumber || undefined,
          hsCode,
          invoiceValue: parseFloat(invoiceValue),
          currency,
          incoterm,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message || 'Failed to create import shipment');
      }

      success('Import declaration registered successfully!');
      router.push(`/imports/${data.shipment.id}`);
    } catch (err: unknown) {
      error(err instanceof Error ? err.message : 'Error creating import shipment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Link
        href="/imports"
        className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Imports
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          New Import Declaration (Bill of Entry Filing)
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Provide manifest details, supplier information, and commercial tariff classification for Indian customs clearance.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">
          {/* Importer Information */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 pb-2 border-b border-slate-100 dark:border-slate-800">
              1. Indian Importer of Record
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  Importer / Consignee Entity <span className="text-red-500">*</span>
                </Label>
                <Input
                  required
                  value={importerName}
                  onChange={(e) => setImporterName(e.target.value)}
                  placeholder="e.g. Apex Engineering Ltd"
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  Importer IEC (10 Digits) <span className="text-red-500">*</span>
                </Label>
                <Input
                  required
                  maxLength={10}
                  value={importerIEC}
                  onChange={(e) => setImporterIEC(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 0123456789"
                  className="text-xs font-mono"
                />
              </div>
            </div>
          </div>

          {/* Supplier & Port Information */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 pb-2 border-b border-slate-100 dark:border-slate-800">
              2. Foreign Supplier & Port Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  Supplier Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  required
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  placeholder="e.g. Tokyo Precision Bearings Co."
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  Supplier Country of Export <span className="text-red-500">*</span>
                </Label>
                <Input
                  required
                  value={supplierCountry}
                  onChange={(e) => setSupplierCountry(e.target.value)}
                  placeholder="e.g. Japan"
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  Indian Port of Import <span className="text-red-500">*</span>
                </Label>
                <select
                  value={portOfImport}
                  onChange={(e) => setPortOfImport(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {MAJOR_INDIAN_PORTS.map((p) => (
                    <option key={p.code} value={`${p.code} / ${p.name.split(',')[0]}`}>
                      {p.code} — {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">IGM Number (Import General Manifest)</Label>
                <Input
                  value={igmNumber}
                  onChange={(e) => setIgmNumber(e.target.value)}
                  placeholder="e.g. IGM-2026-9941"
                  className="text-xs font-mono"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs font-semibold">Bill of Lading (B/L) / AWB Number</Label>
                <Input
                  value={blOrAwbNumber}
                  onChange={(e) => setBlOrAwbNumber(e.target.value)}
                  placeholder="e.g. MAEU129481928"
                  className="text-xs font-mono"
                />
              </div>
            </div>
          </div>

          {/* Commodity & Value */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 pb-2 border-b border-slate-100 dark:border-slate-800">
              3. Tariff Classification & Valuation
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  8-Digit ITC-HS Code <span className="text-red-500">*</span>
                </Label>
                <Input
                  required
                  maxLength={8}
                  value={hsCode}
                  onChange={(e) => setHsCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 84821010"
                  className="text-xs font-mono"
                />
                <p className="text-[11px] text-slate-400">Sample active codes: 84821010, 84713010, 85044090, 87082900</p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  CIF Invoice Value <span className="text-red-500">*</span>
                </Label>
                <Input
                  required
                  type="number"
                  step="0.01"
                  value={invoiceValue}
                  onChange={(e) => setInvoiceValue(e.target.value)}
                  placeholder="e.g. 50000"
                  className="text-xs font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Invoice Currency</Label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="INR">INR (₹)</option>
                  <option value="AED">AED (د.إ)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Incoterm</Label>
                <select
                  value={incoterm}
                  onChange={(e) => setIncoterm(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="CIF">CIF (Cost, Insurance & Freight)</option>
                  <option value="FOB">FOB (Free on Board)</option>
                  <option value="CFR">CFR (Cost & Freight)</option>
                  <option value="EXW">EXW (Ex Works)</option>
                  <option value="DAP">DAP (Delivered at Place)</option>
                </select>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2.5 gap-2 shadow-md shadow-blue-500/20"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ArrowDownToLine className="w-4 h-4" />
            )}
            {isSubmitting ? 'Registering Import Declaration...' : 'Create Import Declaration & Proceed'}
          </Button>
        </form>

        {/* Live Duty Preview Sidebar */}
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <Calculator className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                Live CBIC Duty Estimation
              </h3>
            </div>

            {dutyLoading ? (
              <div className="py-6 text-center text-xs text-slate-400">Calculating statutory duty...</div>
            ) : dutyPreview ? (
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <p className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold">Estimated Total Duty</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                    {currency} {dutyPreview.totalDuty.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </p>
                </div>

                <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Assessable Value (CIF+1%)</span>
                    <span className="font-semibold">{currency} {dutyPreview.assessableValue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">BCD ({(dutyPreview.bcdRate * 100).toFixed(1)}%)</span>
                    <span className="font-semibold">{currency} {dutyPreview.bcdAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">SWS (10% of BCD)</span>
                    <span className="font-semibold">{currency} {dutyPreview.swsAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">IGST ({(dutyPreview.igstRate * 100).toFixed(1)}%)</span>
                    <span className="font-semibold">{currency} {dutyPreview.igstAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-slate-400">
                Enter an 8-digit HS code to calculate customs duty live.
              </div>
            )}
          </div>

          <PolicyNoticeBanner
            policy={hsCode === '05080010' ? 'PROHIBITED' : hsCode === '84713010' ? 'RESTRICTED' : hsCode === '71081200' ? 'STE' : 'FREE'}
            policyCondition={
              hsCode === '84713010'
                ? 'Requires DGFT Import Management System authorization prior to arrival'
                : hsCode === '05080010'
                ? 'Prohibited wildlife item under CITES and Wildlife Act'
                : 'Freely importable under Open General Licence'
            }
            requiredLicenseType={hsCode === '84713010' ? 'DGFT_IMPORT_AUTHORIZATION' : null}
          />
        </div>
      </div>
    </div>
  );
}
