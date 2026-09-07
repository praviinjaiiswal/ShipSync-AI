'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Search, ArrowDownToLine, FileText, ChevronLeft, ChevronRight, Anchor } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { ImportStatusBadge } from '@/components/imports/ImportStatusBadge';
import type { ImportShipmentStatus } from '@prisma/client';

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: '', label: 'All Statuses' },
  { value: 'IGM_FILED', label: 'IGM Filed' },
  { value: 'BOE_FILED', label: 'BOE Filed' },
  { value: 'ASSESSED', label: 'Assessed' },
  { value: 'DUTY_PAID', label: 'Duty Paid' },
  { value: 'EXAMINED', label: 'Examined' },
  { value: 'OUT_OF_CHARGE', label: 'Out of Charge' },
  { value: 'DELIVERED', label: 'Delivered' },
];

export default function ImportsPage() {
  const [shipments, setShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const debouncedSearch = useDebounce(search, 350);

  useEffect(() => {
    setLoading(true);
    setError(false);

    const params = new URLSearchParams({ page: String(page), limit: '10' });
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (status) params.set('status', status);

    fetch(`/api/import-shipments?${params.toString()}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load imports');
        return res.json();
      })
      .then((data) => {
        setShipments(data.shipments || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalCount(data.pagination?.total || 0);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [debouncedSearch, status, page]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Import Shipments
            </h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900">
              CHA Import Clearance
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage Bill of Entry filings, CBIC statutory duty assessments, and port customs clearance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/settings/duty-rates"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors shadow-sm"
          >
            Tariff Duty Rates
          </Link>
          <Link
            href="/imports/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-sm shadow-blue-500/20"
          >
            <Plus className="w-4 h-4" />
            New Import Filing
          </Link>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search supplier, HS code, IGM, BL..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm"
          />
        </div>

        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 text-xs bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm"
        >
          {STATUS_FILTERS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">Loading import shipments...</div>
        ) : error ? (
          <div className="py-16 text-center text-xs text-red-500">
            Failed to load import shipments. Please try refreshing.
          </div>
        ) : shipments.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="h-10 w-10 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
              <Anchor className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">No import shipments found</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {search || status ? 'Try clearing your search filters.' : 'Get started by creating your first import declaration.'}
              </p>
            </div>
            {!search && !status && (
              <Link
                href="/imports/new"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="w-3.5 h-3.5" /> File New Import
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                <tr>
                  <th className="py-3 px-4">Supplier / Country</th>
                  <th className="py-3 px-4">Port / IGM</th>
                  <th className="py-3 px-4">HS Code</th>
                  <th className="py-3 px-4">CIF Value</th>
                  <th className="py-3 px-4">Bill of Entry</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {shipments.map((s) => (
                  <tr
                    key={s.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{s.supplierName}</p>
                      <p className="text-[11px] text-slate-400">{s.supplierCountry}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-medium text-slate-700 dark:text-slate-300">{s.portOfImport}</p>
                      <p className="text-[11px] text-slate-400">IGM: {s.igmNumber || '—'}</p>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-800 dark:text-slate-200">
                      {s.hsCode}
                    </td>
                    <td className="py-3.5 px-4 font-medium">
                      {s.currency} {s.invoiceValue.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">
                      {s.billOfEntry ? (
                        <div>
                          <p className="font-mono font-semibold text-blue-600 dark:text-blue-400">
                            {s.billOfEntry.beNumber}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            Duty: {s.currency} {s.billOfEntry.totalDutyPayable?.toLocaleString()}
                          </p>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Not Generated</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <ImportStatusBadge status={s.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/imports/${s.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
            <span>
              Showing {shipments.length} of {totalCount} imports
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-2 font-medium">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
