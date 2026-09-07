'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import type { ImportShipmentStatus } from '@prisma/client';

const STATUS_CONFIG: Record<
  ImportShipmentStatus,
  { label: string; bg: string; text: string; border: string }
> = {
  IGM_FILED: {
    label: 'IGM Filed',
    bg: 'bg-blue-500/10 dark:bg-blue-500/20',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-500/30',
  },
  BOE_FILED: {
    label: 'BOE Filed',
    bg: 'bg-indigo-500/10 dark:bg-indigo-500/20',
    text: 'text-indigo-600 dark:text-indigo-400',
    border: 'border-indigo-500/30',
  },
  ASSESSED: {
    label: 'Assessed',
    bg: 'bg-purple-500/10 dark:bg-purple-500/20',
    text: 'text-purple-600 dark:text-purple-400',
    border: 'border-purple-500/30',
  },
  DUTY_PAID: {
    label: 'Duty Paid',
    bg: 'bg-amber-500/10 dark:bg-amber-500/20',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-500/30',
  },
  EXAMINED: {
    label: 'Examined',
    bg: 'bg-sky-500/10 dark:bg-sky-500/20',
    text: 'text-sky-600 dark:text-sky-400',
    border: 'border-sky-500/30',
  },
  OUT_OF_CHARGE: {
    label: 'Out of Charge (OOC)',
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-500/30',
  },
  DELIVERED: {
    label: 'Delivered',
    bg: 'bg-green-500/10 dark:bg-green-500/20',
    text: 'text-green-600 dark:text-green-400',
    border: 'border-green-500/30',
  },
};

export function ImportStatusBadge({
  status,
  className,
}: {
  status: ImportShipmentStatus;
  className?: string;
}) {
  const config = STATUS_CONFIG[status] || {
    label: status,
    bg: 'bg-slate-500/10',
    text: 'text-slate-500',
    border: 'border-slate-500/20',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border',
        config.bg,
        config.text,
        config.border,
        className
      )}
    >
      {config.label}
    </span>
  );
}
