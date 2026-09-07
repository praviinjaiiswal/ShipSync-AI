import { PrismaClient } from '@prisma/client';
import { hasPermission, assertPermission } from '../lib/rbac/permissions';
import { withErrorHandler } from '../lib/api-handler';
import { rateLimiter, RATE_LIMIT_PRESETS } from '../lib/rate-limit';
import { encryptCustomsData, decryptCustomsData } from '../lib/crypto/customs-crypto';
import { createTenantKey, hashKey, getCached, setCached } from '../lib/cache';
import {
  ValidationError,
  AuthError,
  ForbiddenError,
  NotFoundError,
  RateLimitError,
} from '../lib/errors';
import { NextRequest } from 'next/server';

const prisma = new PrismaClient();

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log('===========================================================');
  console.log('🛡️  Running Chunk 7: Final Security & Performance Audit Suite');
  console.log('===========================================================');

  const runId = Date.now();
  const tenantAlpha = `tenant_audit_alpha_${runId}`;
  const tenantBeta = `tenant_audit_beta_${runId}`;
  const userAlphaId = `user_audit_alpha_${runId}`;
  const userBetaId = `user_audit_beta_${runId}`;

  try {
    // ==========================================
    // 1. Multi-Tenant Data Isolation Audit
    // ==========================================
    console.log('\n🏢 1. Testing Multi-Tenant Data Isolation & Query Scoping');

    await prisma.company.createMany({
      data: [
        {
          id: tenantAlpha,
          name: 'Alpha Exports Global Pvt Ltd',
          panNumber: `PAN${runId.toString().slice(-7)}X`,
          gstNumber: `27${runId.toString().slice(-10)}1ZA`,
        },
        {
          id: tenantBeta,
          name: 'Beta Maritime Freight Ltd',
          panNumber: `PAN${runId.toString().slice(-7)}Y`,
          gstNumber: `27${runId.toString().slice(-10)}2ZB`,
        },
      ],
    });

    await prisma.user.createMany({
      data: [
        {
          id: userAlphaId,
          clerkId: `clerk_${userAlphaId}`,
          email: `alpha_${runId}@shipsync.test`,
          companyId: tenantAlpha,
          role: 'OPS_EXECUTIVE',
        },
        {
          id: userBetaId,
          clerkId: `clerk_${userBetaId}`,
          email: `beta_${runId}@shipsync.test`,
          companyId: tenantBeta,
          role: 'OPS_EXECUTIVE',
        },
      ],
    });

    // Create shipments for both tenants
    const shipmentAlpha = await prisma.shipment.create({
      data: {
        companyId: tenantAlpha,
        userId: userAlphaId,
        buyerName: 'Alpha Customer Overseas',
        buyerCountry: 'USA',
        productDesc: 'Industrial Stainless Steel Bearings',
        hsCode: '84821011',
        value: 750000,
        status: 'DRAFT',
      },
    });

    const shipmentBeta = await prisma.shipment.create({
      data: {
        companyId: tenantBeta,
        userId: userBetaId,
        buyerName: 'Beta Customer Overseas',
        buyerCountry: 'UK',
        productDesc: 'Aluminium Castings',
        hsCode: '76020010',
        value: 450000,
        status: 'DRAFT',
      },
    });

    // Tenant Alpha queries scoped by companyId cannot see Tenant Beta's shipment
    const alphaShipments = await prisma.shipment.findMany({
      where: { companyId: tenantAlpha },
    });
    assert(
      alphaShipments.length === 1 && alphaShipments[0].id === shipmentAlpha.id,
      'Tenant Alpha query returns strictly Alpha shipment'
    );
    assert(
      !alphaShipments.some((s) => s.id === shipmentBeta.id),
      'Tenant Alpha query strictly isolates and excludes Beta shipment'
    );

    // Cross-tenant lookup attempt returns null
    const crossTenantSearch = await prisma.shipment.findFirst({
      where: { id: shipmentBeta.id, companyId: tenantAlpha },
    });
    assert(
      crossTenantSearch === null,
      'Cross-tenant shipment lookup with foreign companyId returns null (strict segregation)'
    );

    // Documents cross-tenant test
    const docAlpha = await prisma.document.create({
      data: {
        companyId: tenantAlpha,
        shipmentId: shipmentAlpha.id,
        docType: 'COMMERCIAL_INVOICE',
        fileName: 'alpha_invoice.pdf',
        fileSize: 204800,
        status: 'PENDING',
      },
    });

    const docBetaLookup = await prisma.document.findFirst({
      where: { id: docAlpha.id, companyId: tenantBeta },
    });
    assert(
      docBetaLookup === null,
      'Tenant Beta cannot query Tenant Alpha document'
    );

    // Logistics cross-tenant test
    const logAlpha = await prisma.logisticsEvent.create({
      data: {
        companyId: tenantAlpha,
        shipmentId: shipmentAlpha.id,
        eventType: 'EXAMINATION_COMPLETED',
        location: 'JNPT CFS Area 4',
        recordedBy: userAlphaId,
      },
    });


    const logBetaLookup = await prisma.logisticsEvent.findFirst({
      where: { id: logAlpha.id, companyId: tenantBeta },
    });
    assert(
      logBetaLookup === null,
      'Tenant Beta cannot query Tenant Alpha logistics event'
    );

    // Financial Realisations cross-tenant test
    const realAlpha = await prisma.exportRealisation.create({
      data: {
        companyId: tenantAlpha,
        shipmentId: shipmentAlpha.id,
        invoiceValue: 750000,
        amountRealised: 750000,
        overdueDate: new Date(Date.now() + 270 * 86400000),
        status: 'FULLY_REALISED',
        recordedBy: userAlphaId,
      },
    });


    const realBetaLookup = await prisma.exportRealisation.findFirst({
      where: { id: realAlpha.id, companyId: tenantBeta },
    });
    assert(
      realBetaLookup === null,
      'Tenant Beta cannot query Tenant Alpha export proceeds realisation'
    );

    // Transporter bookings cross-tenant test
    const bookingAlpha = await prisma.transporterBooking.create({
      data: {
        companyId: tenantAlpha,
        shipmentId: shipmentAlpha.id,
        transporterName: 'Safexpress Logistics',
        contactNumber: '9876543210',
        vehicleNumber: 'MH04AB1234',
        vehicleType: '40ft Trailer',
        pickupLocation: 'Warehouse Alpha',
        deliveryLocation: 'Nhava Sheva Port',
        scheduledTime: new Date(),
        bookedBy: userAlphaId,
      },
    });

    const bookingBetaLookup = await prisma.transporterBooking.findFirst({
      where: { id: bookingAlpha.id, companyId: tenantBeta },
    });
    assert(
      bookingBetaLookup === null,
      'Tenant Beta cannot query Tenant Alpha transporter booking'
    );

    // ==========================================
    // 2. RBAC & Fail-Closed Access Control Audit
    // ==========================================
    console.log('\n🔒 2. Testing RBAC Fail-Closed Enforcement & Segregation of Duties');

    // 2.1 Deny-by-default on unauthorized actions
    assert(
      hasPermission('VIEWER', 'shipment:read') === true,
      'VIEWER has permission to read shipments'
    );
    assert(
      hasPermission('VIEWER', 'shipment:create') === false,
      'VIEWER is strictly denied shipment creation'
    );
    assert(
      hasPermission('VIEWER', 'shipment:delete') === false,
      'VIEWER is strictly denied shipment deletion'
    );

    // 2.2 Dual-control segregation of duties: Financial confirmations
    assert(
      hasPermission('OPS_EXECUTIVE', 'export_realisation:create') === true,
      'OPS_EXECUTIVE can record export realisation'
    );
    assert(
      hasPermission('OPS_EXECUTIVE', 'export_realisation:confirm') === false,
      'OPS_EXECUTIVE cannot confirm export realisation (Dual-Control enforced)'
    );
    assert(
      hasPermission('ADMIN', 'export_realisation:confirm') === true,
      'ADMIN can confirm export realisation'
    );
    assert(
      hasPermission('OWNER', 'export_realisation:confirm') === true,
      'OWNER can confirm export realisation'
    );

    // 2.3 Dual-control segregation of duties: Duty payment confirmations
    assert(
      hasPermission('OPS_EXECUTIVE', 'duty_payment:record') === true,
      'OPS_EXECUTIVE can record customs duty challan'
    );
    assert(
      hasPermission('OPS_EXECUTIVE', 'duty_payment:confirm') === false,
      'OPS_EXECUTIVE cannot confirm customs duty payment (Dual-Control enforced)'
    );
    assert(
      hasPermission('ADMIN', 'duty_payment:confirm') === true,
      'ADMIN can confirm customs duty payment'
    );

    // 2.4 Incentive claims sanctioning
    assert(
      hasPermission('OPS_EXECUTIVE', 'incentive_claim:create') === true,
      'OPS_EXECUTIVE can create incentive claim'
    );
    assert(
      hasPermission('OPS_EXECUTIVE', 'incentive_claim:sanction') === false,
      'OPS_EXECUTIVE cannot sanction incentive claim'
    );
    assert(
      hasPermission('ADMIN', 'incentive_claim:sanction') === true,
      'ADMIN can sanction incentive claim'
    );

    // 2.5 Customs credential security
    assert(
      hasPermission('OPS_EXECUTIVE', 'customs:credentials_manage') === false,
      'OPS_EXECUTIVE cannot manage customs API credentials'
    );
    assert(
      hasPermission('ADMIN', 'customs:credentials_manage') === true,
      'ADMIN can manage customs API credentials'
    );

    // 2.6 assertPermission throw verification
    let threwForbidden = false;
    try {
      assertPermission('VIEWER', 'shipment:delete');
    } catch (err: any) {
      threwForbidden = err instanceof ForbiddenError;
    }
    assert(
      threwForbidden,
      'assertPermission throws ForbiddenError for unauthorized roles'
    );

    // ==========================================
    // 3. Centralized API Error Handling Audit
    // ==========================================
    console.log('\n🛑 3. Testing Centralized Error Handling & Data Leak Prevention');

    // 3.1 Masking unknown errors and generating requestId
    const mockFaultyHandler = withErrorHandler(async () => {
      throw new Error('DATABASE_INTERNAL_SOCKET_CRASH_UNEXPECTED: root@10.0.0.4:5432');
    });

    const mockReq = new NextRequest('http://localhost:3000/api/test-fault');
    const response = await mockFaultyHandler(mockReq, { params: {} });
    const responseBody = await response.json();

    assert(
      response.status === 500,
      'Unhandled internal exception maps to HTTP 500 status'
    );
    assert(
      responseBody.error?.code === 'INTERNAL_ERROR',
      'Unhandled error returns code INTERNAL_ERROR'
    );
    assert(
      responseBody.error?.message === 'An unexpected error occurred',
      'Internal stack trace and DB details are masked from response'
    );
    assert(
      !JSON.stringify(responseBody).includes('DATABASE_INTERNAL_SOCKET_CRASH_UNEXPECTED'),
      'Sensitive internal exception text is NEVER leaked to client'
    );
    assert(
      typeof responseBody.error?.requestId === 'string' &&
        responseBody.error?.requestId.startsWith('req_'),
      'Response includes sanitized log correlation requestId'
    );

    // 3.2 ValidationError status code mapping
    const mockValidationHandler = withErrorHandler(async () => {
      throw new ValidationError('HS code must be 8 digits', { field: 'hsCode' });
    });
    const valRes = await mockValidationHandler(mockReq, { params: {} });
    const valBody = await valRes.json();
    assert(valRes.status === 400, 'ValidationError maps to HTTP 400');
    assert(valBody.error?.code === 'VALIDATION_ERROR', 'Validation error code preserved');

    // 3.3 AuthError status code mapping
    const mockAuthHandler = withErrorHandler(async () => {
      throw new AuthError('Token expired');
    });
    const authRes = await mockAuthHandler(mockReq, { params: {} });
    assert(authRes.status === 401, 'AuthError maps to HTTP 401');

    // 3.4 NotFoundError status code mapping
    const mockNotFoundHandler = withErrorHandler(async () => {
      throw new NotFoundError('Shipment record not found');
    });
    const nfRes = await mockNotFoundHandler(mockReq, { params: {} });
    assert(nfRes.status === 404, 'NotFoundError maps to HTTP 404');

    // ==========================================
    // 4. Rate Limiting Audit
    // ==========================================
    console.log('\n⏱️  4. Testing Token Bucket Rate Limiting & 429 Responses');

    const testRateKey = `audit_test_rate_${runId}`;
    const strictPreset = { maxRequests: 3, windowMs: 60_000 }; // 3 requests per minute

    // First 3 requests should pass
    let req1Passed = false;
    let req2Passed = false;
    let req3Passed = false;
    let req4Blocked = false;
    let retryAfterSeconds = 0;

    try {
      await rateLimiter.check(mockReq, testRateKey, strictPreset);
      req1Passed = true;
      await rateLimiter.check(mockReq, testRateKey, strictPreset);
      req2Passed = true;
      await rateLimiter.check(mockReq, testRateKey, strictPreset);
      req3Passed = true;
    } catch {
      // should not fail
    }

    assert(
      req1Passed && req2Passed && req3Passed,
      'Initial requests within token capacity pass successfully'
    );

    try {
      await rateLimiter.check(mockReq, testRateKey, strictPreset);
    } catch (err: any) {
      if (err instanceof RateLimitError) {
        req4Blocked = true;
        retryAfterSeconds = err.retryAfter;
      }
    }

    assert(
      req4Blocked,
      'Excess request triggers RateLimitError'
    );
    assert(
      retryAfterSeconds > 0,
      'RateLimitError provides positive Retry-After duration'
    );

    // Test withErrorHandler wraps RateLimitError with 429 and Retry-After header
    const mockRateLimitRoute = withErrorHandler(async () => {
      throw new RateLimitError(15);
    });
    const rateLimitRes = await mockRateLimitRoute(mockReq, { params: {} });
    assert(rateLimitRes.status === 429, 'Rate limit error maps to HTTP 429');
    assert(
      rateLimitRes.headers.get('Retry-After') === '15',
      'Rate limit response includes statutory Retry-After header'
    );

    // ==========================================
    // 5. Cryptography & Credentials Security Audit
    // ==========================================
    console.log('\n🔐 5. Testing AES-256-GCM Encryption & Credential Isolation');

    const sensitiveCredentials = {
      icegateUsername: 'APEX_CHA_2026',
      icegatePassword: 'P@ssword!Secure#992',
      dscPin: '849201',
      apiKey: 'sec_live_99f2b84e01a84c',
    };

    const encrypted = encryptCustomsData(sensitiveCredentials);
    assert(
      encrypted.encryptedData !== JSON.stringify(sensitiveCredentials),
      'Ciphertext is strongly obfuscated from plaintext'
    );
    assert(
      encrypted.iv.length === 24, // 12 bytes = 24 hex
      'Initialization Vector (IV) is 12 bytes / 24 hex characters'
    );
    assert(
      encrypted.authTag.length === 32, // 16 bytes = 32 hex
      'Authentication Tag (MAC) is 16 bytes / 32 hex characters'
    );

    // Round-trip decryption
    const decrypted = decryptCustomsData<typeof sensitiveCredentials>(encrypted);
    assert(
      decrypted.icegateUsername === sensitiveCredentials.icegateUsername &&
        decrypted.dscPin === sensitiveCredentials.dscPin,
      'Decrypted payload matches original sensitive secrets with 100% fidelity'
    );

    // Tamper resistance test
    let tamperDetected = false;
    try {
      const tampered = { ...encrypted, authTag: 'f'.repeat(32) };
      decryptCustomsData(tampered);
    } catch {
      tamperDetected = true;
    }
    assert(
      tamperDetected,
      'AES-256-GCM rejects tampered ciphertext or modified authentication tag'
    );

    // IV uniqueness test across repeated encryptions
    const encryptedSecondTime = encryptCustomsData(sensitiveCredentials);
    assert(
      encrypted.iv !== encryptedSecondTime.iv,
      'Each encryption invocation uses an unpredictable, unique cryptographic nonce/IV'
    );

    // ==========================================
    // 6. Performance, Pagination & Caching Audit
    // ==========================================
    console.log('\n⚡ 6. Testing Performance, Pagination Caps & Tenant Caching');

    // 6.1 Bounded pagination check
    // Create 15 items in Alpha with versioning (only newest isLatest)
    const docData = Array.from({ length: 15 }, (_, i) => ({
      companyId: tenantAlpha,
      shipmentId: shipmentAlpha.id,
      docType: 'OTHER' as const,
      fileName: `test_doc_${i + 1}.pdf`,
      status: 'PENDING' as const,
      version: i + 1,
      isLatest: i === 14,
    }));
    await prisma.document.createMany({ data: docData });

    // Page 1 with limit 5
    const pagedDocs = await prisma.document.findMany({
      where: { companyId: tenantAlpha },
      take: 5,
      skip: 0,
    });
    assert(
      pagedDocs.length === 5,
      'Query pagination respects take/limit parameter (take: 5)'
    );

    // Page 2 with limit 5 and skip 5
    const pagedDocs2 = await prisma.document.findMany({
      where: { companyId: tenantAlpha },
      take: 5,
      skip: 5,
    });
    assert(
      pagedDocs2.length === 5 && pagedDocs2[0].id !== pagedDocs[0].id,
      'Query pagination respects skip parameter with non-overlapping result sets'
    );

    // 6.2 Tenant-namespaced caching test
    const tenantKeyAlpha = createTenantKey(tenantAlpha, 'hs-lookup', hashKey('car battery 12v'));
    const tenantKeyBeta = createTenantKey(tenantBeta, 'hs-lookup', hashKey('car battery 12v'));

    assert(
      tenantKeyAlpha !== tenantKeyBeta,
      'Tenant cache keys are uniquely namespaced by companyId'
    );

    setCached(tenantKeyAlpha, { hsCode: '85071000', rate: 18.0 }, 10000);
    const alphaCached = getCached(tenantKeyAlpha);
    const betaCached = getCached(tenantKeyBeta);

    assert(
      alphaCached !== null && (alphaCached as any).hsCode === '85071000',
      'Tenant Alpha retrieves its own cached HS classification'
    );
    assert(
      betaCached === null,
      'Tenant Beta receives cache miss for Tenant Alpha cached key (Zero Cache Leakage)'
    );

    // ==========================================
    // Summary
    // ==========================================
    console.log('\n===========================================================');
    console.log(`CHUNK 7 AUDIT RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('===========================================================');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Test suite execution failed with unhandled exception:', error);
    process.exit(1);
  } finally {
    try {
      await prisma.document.deleteMany({ where: { companyId: { in: [tenantAlpha, tenantBeta] } } });
      await prisma.logisticsEvent.deleteMany({ where: { companyId: { in: [tenantAlpha, tenantBeta] } } });
      await prisma.transporterBooking.deleteMany({ where: { companyId: { in: [tenantAlpha, tenantBeta] } } });
      await prisma.exportRealisation.deleteMany({ where: { companyId: { in: [tenantAlpha, tenantBeta] } } });
      await prisma.shipment.deleteMany({ where: { companyId: { in: [tenantAlpha, tenantBeta] } } });
      await prisma.user.deleteMany({ where: { companyId: { in: [tenantAlpha, tenantBeta] } } });
      await prisma.company.deleteMany({ where: { id: { in: [tenantAlpha, tenantBeta] } } });
    } catch (cleanupErr) {
      // Ignore cleanup error
    }
    await prisma.$disconnect();
  }
}

runTests();
