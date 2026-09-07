'use client';

import React from 'react';
import { ShieldCheck, Users, Zap } from 'lucide-react';

export function SocialProof() {
  return (
    <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-blue-500" />
        <span>DGFT & ICEGATE Compliant</span>
      </div>
      <div className="flex items-center gap-2">
        <Users className="w-4 h-4 text-indigo-500" />
        <span>150+ Exporters in Early Access</span>
      </div>
      <div className="flex items-center gap-2">
        <Zap className="w-4 h-4 text-amber-500" />
        <span>Zero Setup Cost</span>
      </div>
    </div>
  );
}
