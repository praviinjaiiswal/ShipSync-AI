import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { withErrorHandler } from '@/lib/api-handler';
import { requireTenantContext } from '@/lib/tenant';
import { assertPermission } from '@/lib/rbac/assert-permission';
import { rateLimiter, RATE_LIMIT_PRESETS } from '@/lib/rate-limit';
import { invalidateByPrefix } from '@/lib/cache';
import { ValidationError } from '@/lib/errors';
import { z } from 'zod';

const tariffRowSchema = z.object({
  hsCode: z
    .string()
    .trim()
    .regex(/^\d{8}$/, 'HS Code must be an exact 8-digit numeric string (e.g. 84821011)'),
  description: z
    .string()
    .trim()
    .min(2, 'Description must be at least 2 characters long'),
  unit: z.string().trim().optional(),
  chapterHeading: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  source: z.string().trim().optional(),
  effectiveFrom: z
    .string()
    .or(z.date())
    .optional()
    .transform((val) => (val ? new Date(val) : new Date())),
  effectiveTo: z
    .string()
    .or(z.date())
    .optional()
    .nullable()
    .transform((val) => (val ? new Date(val) : null)),
});

function parseCsv(csvText: string): Record<string, string>[] {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) return [];

  const headers = lines[0]
    .split(',')
    .map((h) => h.trim().replace(/^["']|["']$/g, ''));

  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map((v) => v.trim().replace(/^["']|["']$/g, ''));
    const rowObj: Record<string, string> = {};
    headers.forEach((header, idx) => {
      rowObj[header] = values[idx] ?? '';
    });
    rows.push(rowObj);
  }

  return rows;
}

export const POST = withErrorHandler(async (req: NextRequest) => {
  const ctx = await requireTenantContext();
  assertPermission(ctx.role, 'tariff_schedule:import');

  // Strict rate limit for bulk admin imports
  await rateLimiter.check(req, `tariff-import:${ctx.userId}`, RATE_LIMIT_PRESETS.UPLOAD);

  const contentType = req.headers.get('content-type') || '';
  let rawRows: any[] = [];

  if (contentType.includes('text/csv')) {
    const text = await req.text();
    rawRows = parseCsv(text);
  } else {
    const body = await req.json().catch(() => ({}));
    if (Array.isArray(body)) {
      rawRows = body;
    } else if (Array.isArray(body.rows)) {
      rawRows = body.rows;
    } else if (typeof body.csv === 'string') {
      rawRows = parseCsv(body.csv);
    } else {
      throw new ValidationError('Expected JSON array of tariff rows or { rows: [...] } or { csv: string }');
    }
  }

  if (rawRows.length === 0) {
    throw new ValidationError('Import payload is empty. Provide at least one tariff schedule row.');
  }

  // Row-by-row Zod validation
  const validationErrors: { row: number; hsCode?: string; errors: string[] }[] = [];
  const validRecords: z.infer<typeof tariffRowSchema>[] = [];

  rawRows.forEach((row, index) => {
    const parsed = tariffRowSchema.safeParse(row);
    if (!parsed.success) {
      validationErrors.push({
        row: index + 1,
        hsCode: typeof row?.hsCode === 'string' ? row.hsCode : undefined,
        errors: parsed.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
      });
    } else {
      validRecords.push(parsed.data);
    }
  });

  // Atomic rejection: If ANY row fails, reject entire batch with full row-level details
  if (validationErrors.length > 0) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: `Tariff schedule batch import rejected: ${validationErrors.length} row(s) failed validation.`,
          details: validationErrors,
        },
      },
      { status: 400 }
    );
  }

  // All rows valid — Upsert records into TariffSchedule
  let importedCount = 0;
  for (const record of validRecords) {
    await prisma.tariffSchedule.upsert({
      where: { hsCode: record.hsCode },
      update: {
        description: record.description,
        unit: record.unit || null,
        chapterHeading: record.chapterHeading || record.hsCode.slice(0, 4),
        notes: record.notes || null,
        source: record.source || 'Admin CSV Import',
        effectiveFrom: record.effectiveFrom,
        effectiveTo: record.effectiveTo,
      },
      create: {
        hsCode: record.hsCode,
        description: record.description,
        unit: record.unit || null,
        chapterHeading: record.chapterHeading || record.hsCode.slice(0, 4),
        notes: record.notes || null,
        source: record.source || 'Admin CSV Import',
        effectiveFrom: record.effectiveFrom,
        effectiveTo: record.effectiveTo,
      },
    });
    importedCount++;
  }

  await prisma.activity.create({
    data: {
      companyId: ctx.companyId,
      userId: ctx.userId,
      action: 'TARIFF_SCHEDULE_IMPORTED',
      details: `Imported ${importedCount} statutory tariff schedule items into ground-truth database.`,
    },
  });

  // Invalidate any cached tariff schedule lookups
  invalidateByPrefix('global:tariff');
  invalidateByPrefix('company:');

  return NextResponse.json({
    success: true,
    message: `Successfully imported and verified ${importedCount} tariff schedule records.`,
    count: importedCount,
  });
});
