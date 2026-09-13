import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
import { requireTenantContext } from '@/lib/tenant';
import { hasPermission } from '@/lib/rbac/assert-permission';
import { TradeUpdatesQueueClient } from './TradeUpdatesQueueClient';

export default async function TradeUpdatesAdminPage() {
  let role: string | undefined;
  let hasPublishPermission = false;

  try {
    const ctx = await requireTenantContext();
    role = ctx.role;
    hasPublishPermission = hasPermission(ctx.role, 'tradeupdate:publish');
  } catch {
    hasPublishPermission = false;
  }

  if (!hasPublishPermission) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="border border-border/80 bg-white dark:bg-slate-900 rounded-2xl p-8 sm:p-12 shadow-sm text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-center justify-center mx-auto mb-5 text-amber-600 dark:text-amber-400">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h1 className="text-xl sm:text-2xl font-heading font-bold text-slate-900 dark:text-white mb-3">
            Access Restricted
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed mb-6">
            You don&#39;t have access to trade update moderation. Contact your admin for the required role.
          </p>
          {role && (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300 mb-6">
              <span>Current Role:</span>
              <span className="font-bold text-slate-900 dark:text-white">{role}</span>
            </div>
          )}
          <div>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-navy-deep hover:bg-ocean-deep text-white text-xs font-bold transition-colors shadow-sm"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Dashboard</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <TradeUpdatesQueueClient />;
}
