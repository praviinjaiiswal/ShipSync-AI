# Multi-Tenant Isolation & Security Checklist

This document outlines the security architecture, multi-tenant isolation patterns, and developer guidelines for ShipSync AI.

---

## Core Architecture Principles

1. **Root Entity**: Every business object in ShipSync belongs to a `Company`. The `Company` is the single root boundary for all tenant data.
2. **Never Trust Client Company IDs**: Never read or trust a `companyId` passed in query parameters or the request body. Always resolve `companyId` server-side from the authenticated session using `requireTenantContext()`.
3. **Fail-Closed RBAC**: All endpoints must enforce role-based access control with `assertPermission(role, action)` before executing data modifications.
4. **Structured Error Handling**: API endpoints are wrapped with `withErrorHandler()`, ensuring stack traces, SQL errors, and internal paths never leak to the client.
5. **Scoped Storage**: All cloud storage keys (e.g. Supabase Storage) are prefixed with `companies/${companyId}/`.
6. **Namespaced Caching**: In-memory and distributed cache keys are namespaced with `company:${companyId}:` to prevent cross-tenant cache leaks.

---

## Permission Matrix (5-Tier RBAC)

| Role | Scope & Description |
| :--- | :--- |
| **OWNER** | Full administrative control, billing management, organization settings, team member role changes, and account deletion. |
| **ADMIN** | Full management of shipments, documents, team invitations, and licenses. Cannot remove the owner or manage billing. |
| **COMPLIANCE_OFFICER** | Audit, verify, and run DGFT compliance and sanctions checks. Read access to all shipments and documents. Cannot delete shipments. |
| **OPS_EXECUTIVE** | Create and edit export shipments, upload commercial invoices and packing lists, and trigger HS code suggestions. |
| **VIEWER** | Read-only access to company shipments, reports, and compliance overview. Mutating actions are blocked. |

---

## API Route Implementation Template

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { withErrorHandler } from '@/lib/api-handler';
import { requireTenantContext } from '@/lib/tenant';
import { assertPermission } from '@/lib/rbac/assert-permission';
import { shipmentSchema } from '@/lib/validations';
import { ValidationError, NotFoundError } from '@/lib/errors';

export const GET = withErrorHandler(async (req: NextRequest) => {
  // 1. Resolve tenant context server-side
  const ctx = await requireTenantContext();

  // 2. Assert role-based permission (throws ForbiddenError if disallowed)
  assertPermission(ctx.role, 'shipment:read');

  // 3. Query strictly within the tenant boundary
  const data = await prisma.shipment.findMany({
    where: { companyId: ctx.companyId },
  });

  return NextResponse.json(data);
});
```

---

## Verification & Audit Checklist

- [x] Every database query includes `where: { companyId: ctx.companyId }`.
- [x] Every mutation sets `companyId: ctx.companyId`.
- [x] Every file upload is stored under `companies/${companyId}/...`.
- [x] Every cache key for business data is prefixed with `company:${companyId}:...`.
- [x] Every mutating route is wrapped in `withErrorHandler`.
- [x] Rate limiting is applied to all AI, search, and upload endpoints.
