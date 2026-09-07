import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { withErrorHandler } from '@/lib/api-handler';
import { requireTenantContext } from '@/lib/tenant';
import { assertPermission } from '@/lib/rbac/assert-permission';
import { invalidateByPrefix } from '@/lib/cache';
import { ValidationError } from '@/lib/errors';

export const POST = withErrorHandler(async (req: NextRequest) => {
  const ctx = await requireTenantContext();
  assertPermission(ctx.role, 'duty_rate:import');

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  if (!file) {
    throw new ValidationError('CSV file is required');
  }

  const text = await file.text();
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);

  if (lines.length < 2) {
    throw new ValidationError('CSV file is empty or missing headers');
  }

  const header = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const hsCodeIdx = header.indexOf('hs_code');
  const descIdx = header.indexOf('description');
  const rodtepIdx = header.indexOf('rodtep_rate');
  const capIdx = header.indexOf('rodtep_cap');
  const drawbackIdx = header.indexOf('duty_drawback_rate');

  if (hsCodeIdx === -1) {
    throw new ValidationError(
      "CSV must contain 'hs_code' column. Expected headers: hs_code, description, rodtep_rate, rodtep_cap, duty_drawback_rate"
    );
  }

  let imported = 0;
  const rows = lines.slice(1);

  for (const line of rows) {
    const cols = line.split(',').map((c) => c.trim());
    const hsCode = cols[hsCodeIdx];
    if (!hsCode) continue;

    await prisma.dutyIncentiveRate.upsert({
      where: { hsCode },
      update: {
        description: descIdx > -1 ? cols[descIdx] : undefined,
        rodtepRate: rodtepIdx > -1 && cols[rodtepIdx] ? parseFloat(cols[rodtepIdx]) : undefined,
        rodtepCapPerUnit: capIdx > -1 && cols[capIdx] ? parseFloat(cols[capIdx]) : undefined,
        dutyDrawbackRate: drawbackIdx > -1 && cols[drawbackIdx] ? parseFloat(cols[drawbackIdx]) : undefined,
        source: 'DGFT_IMPORT',
      },
      create: {
        hsCode,
        description: descIdx > -1 ? cols[descIdx] : null,
        rodtepRate: rodtepIdx > -1 && cols[rodtepIdx] ? parseFloat(cols[rodtepIdx]) : null,
        rodtepCapPerUnit: capIdx > -1 && cols[capIdx] ? parseFloat(cols[capIdx]) : null,
        dutyDrawbackRate: drawbackIdx > -1 && cols[drawbackIdx] ? parseFloat(cols[drawbackIdx]) : null,
        source: 'DGFT_IMPORT',
      },
    });
    imported++;
  }

  // Bust reference duty rates cache
  invalidateByPrefix('global:duty-rate');

  await prisma.activity.create({
    data: {
      companyId: ctx.companyId,
      userId: ctx.userId,
      action: 'DUTY_RATES_IMPORTED',
      details: `Imported ${imported} duty & incentive rates from CSV`,
    },
  });

  return NextResponse.json({ success: true, imported });
});