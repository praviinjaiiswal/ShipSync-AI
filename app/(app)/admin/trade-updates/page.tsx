'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Edit3,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Sparkles,
  User,
  AlertTriangle,
  Globe,
  FileText,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/toast';

interface TradeUpdate {
  id: string;
  title: string;
  summary: string;
  category: 'TARIFF' | 'DGFT_NOTIFICATION' | 'FTA' | 'LOGISTICS' | 'SANCTIONS' | 'OTHER';
  country?: string | null;
  sourceName: string;
  sourceUrl: string;
  status: 'PENDING_REVIEW' | 'PUBLISHED' | 'REJECTED';
  draftedBy: 'AI' | 'ADMIN';
  reviewedByUserId?: string | null;
  reviewNotes?: string | null;
  publishedAt?: string | null;
  createdAt: string;
}

const CATEGORIES = [
  { value: 'ALL', label: 'All Categories' },
  { value: 'TARIFF', label: 'Tariff & Customs' },
  { value: 'DGFT_NOTIFICATION', label: 'DGFT Notifications' },
  { value: 'FTA', label: 'Trade Agreements (FTA)' },
  { value: 'LOGISTICS', label: 'Logistics & Ports' },
  { value: 'SANCTIONS', label: 'Sanctions & Denied Entities' },
  { value: 'OTHER', label: 'Other Trade Policy' },
];

export default function TradeUpdatesAdminPage() {
  const { success, error } = useToast();
  const [updates, setUpdates] = useState<TradeUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'PENDING_REVIEW' | 'PUBLISHED' | 'REJECTED' | 'ALL'>('PENDING_REVIEW');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [totalCount, setTotalCount] = useState(0);

  // Edit Modal State
  const [editingItem, setEditingItem] = useState<TradeUpdate | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    summary: '',
    category: 'TARIFF' as TradeUpdate['category'],
    country: '',
    sourceName: '',
    sourceUrl: '',
  });
  const [savingEdit, setSavingEdit] = useState(false);

  // Reject Modal State
  const [rejectingItem, setRejectingItem] = useState<TradeUpdate | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [submittingReject, setSubmittingReject] = useState(false);

  // Manual Create Modal State
  const [isCreating, setIsCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '',
    summary: '',
    category: 'DGFT_NOTIFICATION' as TradeUpdate['category'],
    country: '',
    sourceName: 'DGFT',
    sourceUrl: '',
  });
  const [submittingCreate, setSubmittingCreate] = useState(false);

  // Action loading states
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchUpdates = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (categoryFilter !== 'ALL') params.set('category', categoryFilter);
      if (search.trim()) params.set('search', search.trim());

      const res = await fetch(`/api/admin/trade-updates?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message || 'Failed to fetch trade updates');
      }
      setUpdates(data.tradeUpdates || []);
      setTotalCount(data.pagination?.total || 0);
    } catch (err: unknown) {
      error(err instanceof Error ? err.message : 'Failed to load updates');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, categoryFilter, search, error]);

  useEffect(() => {
    fetchUpdates();
  }, [fetchUpdates]);

  const handleApprove = async (id: string) => {
    setActionLoadingId(id);
    try {
      const res = await fetch(`/api/admin/trade-updates/${id}/approve`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message || 'Failed to approve update');
      }
      success('Trade update approved and published live!');
      fetchUpdates();
    } catch (err: unknown) {
      error(err instanceof Error ? err.message : 'Error approving update');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleOpenReject = (item: TradeUpdate) => {
    setRejectingItem(item);
    setRejectReason('');
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingItem || !rejectReason.trim()) return;

    setSubmittingReject(true);
    try {
      const res = await fetch(`/api/admin/trade-updates/${rejectingItem.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewNotes: rejectReason.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message || 'Failed to reject update');
      }
      success('Trade update marked as rejected.');
      setRejectingItem(null);
      fetchUpdates();
    } catch (err: unknown) {
      error(err instanceof Error ? err.message : 'Error rejecting update');
    } finally {
      setSubmittingReject(false);
    }
  };

  const handleOpenEdit = (item: TradeUpdate) => {
    setEditingItem(item);
    setEditForm({
      title: item.title,
      summary: item.summary,
      category: item.category,
      country: item.country || '',
      sourceName: item.sourceName,
      sourceUrl: item.sourceUrl,
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    setSavingEdit(true);
    try {
      const res = await fetch(`/api/admin/trade-updates/${editingItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editForm.title.trim(),
          summary: editForm.summary.trim(),
          category: editForm.category,
          country: editForm.country.trim() || null,
          sourceName: editForm.sourceName.trim(),
          sourceUrl: editForm.sourceUrl.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message || 'Failed to update draft');
      }
      success('Trade update draft edited successfully.');
      setEditingItem(null);
      fetchUpdates();
    } catch (err: unknown) {
      error(err instanceof Error ? err.message : 'Error saving draft');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleCreateManual = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingCreate(true);
    try {
      const res = await fetch('/api/admin/trade-updates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: createForm.title.trim(),
          summary: createForm.summary.trim(),
          category: createForm.category,
          country: createForm.country.trim() || null,
          sourceName: createForm.sourceName.trim(),
          sourceUrl: createForm.sourceUrl.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message || 'Failed to create manual update');
      }
      success('Manual trade update created and added to review queue!');
      setIsCreating(false);
      setCreateForm({
        title: '',
        summary: '',
        category: 'DGFT_NOTIFICATION',
        country: '',
        sourceName: 'DGFT',
        sourceUrl: '',
      });
      fetchUpdates();
    } catch (err: unknown) {
      error(err instanceof Error ? err.message : 'Error creating update');
    } finally {
      setSubmittingCreate(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Dashboard
          </Link>
          <h1 className="text-2xl font-heading font-bold text-navy-deep dark:text-white flex items-center gap-2.5">
            Trade Intelligence Review Queue
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
              {totalCount} Total
            </span>
          </h1>
          <p className="text-sm text-ocean-muted mt-1 max-w-2xl">
            Review and approve AI-drafted notifications before publishing to the public feed. Never auto-publish; verify statutory figures at the official source.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchUpdates}
            className="gap-1.5"
            disabled={loading}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => setIsCreating(true)}
            className="gap-1.5 bg-navy-deep hover:bg-ocean-deep text-white"
          >
            <Plus className="w-4 h-4" />
            New Manual Update
          </Button>
        </div>
      </div>

      {/* Status Filter Tabs & Search Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          {(['PENDING_REVIEW', 'PUBLISHED', 'REJECTED', 'ALL'] as const).map((status) => {
            const labels = {
              PENDING_REVIEW: 'Pending Review',
              PUBLISHED: 'Published',
              REJECTED: 'Rejected',
              ALL: 'All Updates',
            };
            const active = statusFilter === status;
            return (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  active
                    ? 'bg-white dark:bg-slate-800 text-navy-deep dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
              >
                {labels[status]}
              </button>
            );
          })}
        </div>

        {/* Search & Category Filter */}
        <div className="flex items-center gap-3">
          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search title, source, country..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Updates List */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <RefreshCw className="w-8 h-8 mx-auto text-ocean-deep animate-spin" />
          <p className="text-sm text-ocean-muted font-medium">Loading trade intelligence feed...</p>
        </div>
      ) : updates.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-border/80 rounded-2xl bg-white/50 dark:bg-slate-900/50 p-8 space-y-3">
          <FileText className="w-10 h-10 mx-auto text-slate-400" />
          <h3 className="text-base font-bold text-navy-deep dark:text-white">
            No trade updates found in this view
          </h3>
          <p className="text-xs text-ocean-muted max-w-sm mx-auto">
            {statusFilter === 'PENDING_REVIEW'
              ? 'The automated scan queue is currently clear. Click "New Manual Update" to post an urgent trade bulletin.'
              : 'Try switching filters or search terms.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {updates.map((item) => {
            const isPending = item.status === 'PENDING_REVIEW';
            const isPublished = item.status === 'PUBLISHED';
            const isRejected = item.status === 'REJECTED';

            return (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-900 border border-border/70 rounded-2xl p-5 sm:p-6 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all space-y-4"
              >
                {/* Header row: Badges, Date, Drafted By */}
                <div className="flex flex-wrap items-center justify-between gap-2.5 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Category badge */}
                    <span className="px-2.5 py-1 rounded-md font-semibold text-[11px] bg-slate-100 dark:bg-slate-800 text-ocean-deep border border-ocean-muted/20">
                      {item.category.replace('_', ' ')}
                    </span>

                    {/* Status badge */}
                    {isPending && (
                      <span className="px-2.5 py-1 rounded-md font-semibold text-[11px] bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
                        Pending Review
                      </span>
                    )}
                    {isPublished && (
                      <span className="px-2.5 py-1 rounded-md font-semibold text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                        Published Live
                      </span>
                    )}
                    {isRejected && (
                      <span className="px-2.5 py-1 rounded-md font-semibold text-[11px] bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800">
                        Rejected
                      </span>
                    )}

                    {/* Drafted by indicator */}
                    <span className="inline-flex items-center gap-1 text-slate-500 font-medium">
                      {item.draftedBy === 'AI' ? (
                        <>
                          <Sparkles className="w-3 h-3 text-indigo-500" />
                          <span>AI Drafted</span>
                        </>
                      ) : (
                        <>
                          <User className="w-3 h-3 text-slate-600" />
                          <span>Admin Manual</span>
                        </>
                      )}
                    </span>

                    {/* Country tag */}
                    {item.country && (
                      <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-400 font-medium">
                        <Globe className="w-3 h-3" />
                        <span>{item.country}</span>
                      </span>
                    )}
                  </div>

                  {/* Date info */}
                  <div className="flex items-center gap-1.5 text-slate-400 font-medium">
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      {isPublished && item.publishedAt
                        ? `Published ${new Date(item.publishedAt).toLocaleDateString('en-IN')}`
                        : `Drafted ${new Date(item.createdAt).toLocaleDateString('en-IN')}`}
                    </span>
                  </div>
                </div>

                {/* Title & Summary */}
                <div className="space-y-2">
                  <h3 className="text-base sm:text-lg font-heading font-bold text-navy-deep dark:text-white leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-sm text-ocean-muted leading-relaxed">
                    {item.summary}
                  </p>
                </div>

                {/* Rejection Notes if applicable */}
                {item.reviewNotes && isRejected && (
                  <div className="p-3 rounded-xl bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
                    <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold">Rejection Reason: </span>
                      {item.reviewNotes}
                    </div>
                  </div>
                )}

                {/* Bottom Bar: Source Attribution + Action Buttons */}
                <div className="pt-3 border-t border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  {/* Source link */}
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 font-medium">Official Source:</span>
                    <a
                      href={item.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-ocean-deep hover:underline font-semibold"
                    >
                      <span>{item.sourceName} Notification</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEdit(item)}
                      className="h-8 gap-1 text-xs"
                    >
                      <Edit3 className="w-3 h-3" />
                      Edit Copy
                    </Button>

                    {isPending && (
                      <>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleOpenReject(item)}
                          className="h-8 gap-1 text-xs"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleApprove(item.id)}
                          disabled={actionLoadingId === item.id}
                          className="h-8 gap-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {actionLoadingId === item.id ? 'Publishing...' : 'Approve & Publish'}
                        </Button>
                      </>
                    )}

                    {isRejected && (
                      <Button
                        size="sm"
                        onClick={() => handleApprove(item.id)}
                        disabled={actionLoadingId === item.id}
                        className="h-8 gap-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Re-Approve & Publish
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Modal Dialog */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-border rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h3 className="font-heading font-bold text-lg text-navy-deep dark:text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-ocean-deep" />
                Edit Trade Update Draft
              </h3>
              <button
                onClick={() => setEditingItem(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <Label htmlFor="edit-title">Headline / Title *</Label>
                <Input
                  id="edit-title"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-summary">Summary (2-4 sentences, plain language) *</Label>
                <textarea
                  id="edit-summary"
                  rows={4}
                  value={editForm.summary}
                  onChange={(e) => setEditForm({ ...editForm, summary: e.target.value })}
                  required
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-category">Category *</Label>
                  <select
                    id="edit-category"
                    value={editForm.category}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        category: e.target.value as TradeUpdate['category'],
                      })
                    }
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs"
                  >
                    {CATEGORIES.filter((c) => c.value !== 'ALL').map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="edit-country">Country / Partner (Optional)</Label>
                  <Input
                    id="edit-country"
                    placeholder="e.g. UAE, China, US (or leave blank for India-wide)"
                    value={editForm.country}
                    onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-source-name">Source Authority *</Label>
                  <Input
                    id="edit-source-name"
                    placeholder="e.g. DGFT, CBIC, Ministry of Commerce"
                    value={editForm.sourceName}
                    onChange={(e) => setEditForm({ ...editForm, sourceName: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="edit-source-url">Official Notification URL *</Label>
                  <Input
                    id="edit-source-url"
                    type="url"
                    placeholder="https://..."
                    value={editForm.sourceUrl}
                    onChange={(e) => setEditForm({ ...editForm, sourceUrl: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-border/60 flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingItem(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={savingEdit}
                  className="bg-navy-deep hover:bg-ocean-deep text-white"
                >
                  {savingEdit ? 'Saving Changes...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Modal Dialog */}
      {rejectingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-border rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-heading font-bold text-lg text-navy-deep dark:text-white">
                Reject Trade Update Draft
              </h3>
            </div>
            <p className="text-xs text-ocean-muted">
              Provide a clear audit reason why this notification draft is rejected (e.g., duplicated, irrelevant to export/import audience, or factual discrepancy).
            </p>

            <form onSubmit={handleConfirmReject} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <Label htmlFor="reject-reason">Rejection Reason (Audit Notes) *</Label>
                <textarea
                  id="reject-reason"
                  rows={3}
                  required
                  placeholder="e.g. Rate revision superseded by circular No. 12; not applicable to engineering exporters."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setRejectingItem(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  size="sm"
                  disabled={submittingReject}
                >
                  {submittingReject ? 'Rejecting...' : 'Confirm Rejection'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Create Modal Dialog */}
      {isCreating && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-border rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h3 className="font-heading font-bold text-lg text-navy-deep dark:text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-ocean-deep" />
                Post Manual Trade Update
              </h3>
              <button
                onClick={() => setIsCreating(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateManual} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <Label htmlFor="create-title">Title / Headline *</Label>
                <Input
                  id="create-title"
                  placeholder="e.g. DGFT Extends Interest Equalisation Scheme for MSME Exporters"
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="create-summary">Summary (2-4 sentences, plain language) *</Label>
                <textarea
                  id="create-summary"
                  rows={4}
                  required
                  placeholder="Explain clearly who is impacted, what changed, and the action exporters should take."
                  value={createForm.summary}
                  onChange={(e) => setCreateForm({ ...createForm, summary: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="create-category">Category *</Label>
                  <select
                    id="create-category"
                    value={createForm.category}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        category: e.target.value as TradeUpdate['category'],
                      })
                    }
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs"
                  >
                    {CATEGORIES.filter((c) => c.value !== 'ALL').map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="create-country">Country / Partner (Optional)</Label>
                  <Input
                    id="create-country"
                    placeholder="e.g. UAE, EU, Global"
                    value={createForm.country}
                    onChange={(e) => setCreateForm({ ...createForm, country: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="create-source-name">Source Authority *</Label>
                  <Input
                    id="create-source-name"
                    placeholder="e.g. DGFT, CBIC, Ministry of Commerce"
                    value={createForm.sourceName}
                    onChange={(e) => setCreateForm({ ...createForm, sourceName: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="create-source-url">Official Notification URL *</Label>
                  <Input
                    id="create-source-url"
                    type="url"
                    placeholder="https://content.dgft.gov.in/..."
                    value={createForm.sourceUrl}
                    onChange={(e) => setCreateForm({ ...createForm, sourceUrl: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-border/60 flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreating(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={submittingCreate}
                  className="bg-navy-deep hover:bg-ocean-deep text-white"
                >
                  {submittingCreate ? 'Creating Draft...' : 'Add to Review Queue'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
