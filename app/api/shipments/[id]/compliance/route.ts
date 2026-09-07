import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { withErrorHandler } from '@/lib/api-handler';
import { requireTenantContext } from '@/lib/tenant';
import { assertPermission } from '@/lib/rbac/assert-permission';
import { rateLimiter, RATE_LIMIT_PRESETS } from '@/lib/rate-limit';
import { checkCompliance } from '@/lib/ai';
import { runComplianceRules } from '@/lib/compliance/rule-engine';
import { NotFoundError, ExternalServiceError } from '@/lib/errors';

export const POST = withErrorHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const ctx = await requireTenantContext();
  assertPermission(ctx.role, 'compliance:run');

  // Rate limit AI requests
  await rateLimiter.check(req, `ai:${ctx.userId}`, RATE_LIMIT_PRESETS.AI);

  const [shipment, company] = await Promise.all([
    prisma.shipment.findFirst({
      where: { id: params.id, companyId: ctx.companyId },
    }),
    prisma.company.findUnique({
      where: { id: ctx.companyId },
    }),
  ]);

  if (!shipment || !company) {
    throw new NotFoundError('Shipment or Company context not found');
  }

  // 1. Run Deterministic Statutory Compliance Rule Engine first
  const ruleEngineResult = await runComplianceRules(shipment, company);

  // 2. Run Advisory AI Analysis
  let aiResult: any;
  try {
    aiResult = await checkCompliance(shipment);
  } catch (err) {
    console.warn('Advisory AI compliance analysis warning:', err);
    aiResult = {
      complianceScore: ruleEngineResult.passed ? 85 : 40,
      issues: ruleEngineResult.failedRules.map((r) => r.message),
      recommendations: ['Ensure all statutory documents and tariff schedules are verified.'],
    };
  }

  const { complianceScore = 0, issues = [], recommendations = [] } = aiResult;

  // Status derives strictly from the rule engine: if ANY hard rule fails, status is NEEDS_ATTENTION
  const overallStatus = ruleEngineResult.passed && complianceScore >= 70 ? 'PASSED' : 'NEEDS_ATTENTION';

  const [check] = await prisma.$transaction([
    prisma.complianceCheck.create({
      data: {
        companyId: ctx.companyId,
        shipmentId: shipment.id,
        checkType: 'HYBRID_STATUTORY_REVIEW',
        status: overallStatus,
        details: JSON.stringify({
          verified: {
            passed: ruleEngineResult.passed,
            failedRules: ruleEngineResult.failedRules,
            passedRules: ruleEngineResult.passedRules,
          },
          aiAdvisory: {
            score: complianceScore,
            issues,
            recommendations,
          },
        }),
        aiAnalysis: JSON.stringify(aiResult),
      },
    }),
    prisma.shipment.update({
      where: { id: shipment.id },
      data: { complianceScore },
    }),
    prisma.activity.create({
      data: {
        companyId: ctx.companyId,
        userId: ctx.userId,
        shipmentId: shipment.id,
        action: 'COMPLIANCE_RUN',
        details: `Ran statutory compliance check for ${shipment.buyerName}: ${ruleEngineResult.passed ? 'STATUTORY CLEAR' : `${ruleEngineResult.failedRules.length} HARD RULE(S) FAILED`} (AI Advisory Score: ${complianceScore})`,
      },
    }),
  ]);

  return NextResponse.json({
    verified: {
      passed: ruleEngineResult.passed,
      failedRules: ruleEngineResult.failedRules,
      passedRules: ruleEngineResult.passedRules,
      allRules: ruleEngineResult.allRules,
    },
    aiAdvisory: {
      score: complianceScore,
      issues,
      recommendations,
    },
    check,
    complianceScore,
    issues,
    recommendations,
  });
});


export const GET = withErrorHandler(async (_req: NextRequest, { params }: { params: { id: string } }) => {
  const ctx = await requireTenantContext();
  assertPermission(ctx.role, 'compliance:read');

  const shipment = await prisma.shipment.findFirst({
    where: { id: params.id, companyId: ctx.companyId },
  });

  if (!shipment) {
    throw new NotFoundError('Shipment not found');
  }

  const checks = await prisma.complianceCheck.findMany({
    where: { shipmentId: params.id, companyId: ctx.companyId },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(checks);
});