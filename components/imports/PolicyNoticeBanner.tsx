'use client';

import React from 'react';
import { ShieldAlert, ShieldCheck, AlertTriangle, Building } from 'lucide-react';
import type { ImportPolicy } from '@prisma/client';

interface PolicyNoticeBannerProps {
  policy?: ImportPolicy | string | null;
  policyCondition?: string | null;
  requiredLicenseType?: string | null;
}

export function PolicyNoticeBanner({
  policy = 'FREE',
  policyCondition,
  requiredLicenseType,
}: PolicyNoticeBannerProps) {
  if (!policy || policy === 'FREE') {
    return (
      <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs flex items-start gap-3">
        <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold">ITC-HS Import Policy: FREE</p>
          <p className="text-[11px] text-emerald-700/80 dark:text-emerald-300/80 mt-0.5">
            {policyCondition || 'Freely importable under Open General Licence (OGL). No prior DGFT authorization required.'}
          </p>
        </div>
      </div>
    );
  }

  if (policy === 'RESTRICTED') {
    return (
      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-bold">ITC-HS Import Policy: RESTRICTED</span>
            {requiredLicenseType && (
              <span className="px-2 py-0.5 rounded bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 font-mono font-bold text-[10px]">
                {requiredLicenseType}
              </span>
            )}
          </div>
          <p className="text-[11px] text-amber-700/90 dark:text-amber-300/90 leading-relaxed">
            {policyCondition || 'Import requires an active authorization from DGFT / regulatory ministry prior to vessel arrival.'}
          </p>
        </div>
      </div>
    );
  }

  if (policy === 'STE') {
    return (
      <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-800 dark:text-purple-300 text-xs flex items-start gap-3">
        <Building className="h-5 w-5 text-purple-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">ITC-HS Import Policy: State Trading Enterprise (STE)</p>
          <p className="text-[11px] text-purple-700/90 dark:text-purple-300/90 leading-relaxed">
            {policyCondition || 'Import is restricted to nominated canalizing agencies (e.g. MMTC, STC, PEC) under RBI / DGFT guidelines.'}
          </p>
        </div>
      </div>
    );
  }

  if (policy === 'PROHIBITED') {
    return (
      <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-800 dark:text-red-300 text-xs flex items-start gap-3">
        <ShieldAlert className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">ITC-HS Import Policy: PROHIBITED</p>
          <p className="text-[11px] text-red-700/90 dark:text-red-300/90 leading-relaxed">
            {policyCondition || 'Strictly prohibited from importation under Customs Act, 1962. Commercial clearance will be rejected and subject to seizure.'}
          </p>
        </div>
      </div>
    );
  }

  return null;
}
