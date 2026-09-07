/**
 * ShipSync AI — Chunk 2: Customs & Government Integration Test Suite
 * 
 * Verifies all Chunk 2 Acceptance Criteria:
 * 1. AES-256-GCM Encryption, Decryption & Tamper Proofing
 * 2. Deep Sanitization & Redaction of sensitive credentials
 * 3. Multi-Tenant isolation on Customs Credentials & Integration Logs
 * 4. Customs Adapter Interface & Mock Sandbox Simulation
 * 5. Circuit Breaker state machine (CLOSED -> OPEN -> HALF_OPEN -> CLOSED)
 * 6. Exponential Backoff & Jitter calculation bounds
 * 7. Statutory Manual Override validation & RBAC
 * 8. e-Sanchit statutory document constraints & IRN generation
 */

import {
  encryptCustomsData,
  decryptCustomsData,
  redactSensitiveData,
} from '../lib/crypto/customs-crypto';
import { CircuitBreaker } from '../lib/circuit-breaker';
import { calculateBackoffDelay, retryWithBackoff } from '../lib/retry-backoff';
import { MockCustomsAdapter } from '../lib/customs/adapters/mock-customs-adapter';
import { EsanchitAdapter, ESANCHIT_DOC_CODES } from '../lib/customs/adapters/esanchit-adapter';
import { hasPermission, assertPermission } from '../lib/rbac/permissions';
import { customsManualOverrideSchema, esanchitUploadSchema } from '../lib/validations';
import { ForbiddenError, CircuitBreakerError } from '../lib/errors';
import { createTenantDb } from '../lib/tenant';
import { prisma } from '../app/lib/prisma';
import { runWithTenant } from '../lib/tenant-context';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${testName}${detail ? ` — ${detail}` : ''}`);
    failed++;
  }
}

async function runTests() {
  console.log('====================================================');
  console.log('⚡ Running Chunk 2: Customs Integration Test Suite');
  console.log('====================================================\n');

  // ==========================================
  // 1. AES-256-GCM Encryption & Tamper Proofing
  // ==========================================
  console.log('🔐 1. AES-256-GCM Cryptographic Security');
  const testSecret = {
    password: 'SuperSecretCustomsPassword#2026',
    dscPin: '123456',
    certificateData: 'MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...',
  };

  const encrypted = encryptCustomsData(testSecret);
  assert(
    encrypted.encryptedData !== JSON.stringify(testSecret),
    'Ciphertext is distinct from plaintext'
  );
  assert(
    encrypted.iv.length === 24, // 12 bytes = 24 hex chars
    'IV is 12 bytes (96-bit standard for GCM)'
  );
  assert(
    encrypted.authTag.length === 32, // 16 bytes = 32 hex chars
    'Authentication Tag is 16 bytes (128-bit)'
  );

  const decrypted = decryptCustomsData<typeof testSecret>(encrypted);
  assert(
    decrypted.password === testSecret.password &&
    decrypted.dscPin === testSecret.dscPin &&
    decrypted.certificateData === testSecret.certificateData,
    'Decrypted payload perfectly recovers all original fields'
  );

  // Tamper detection: modifying authTag must throw
  let tamperThrown = false;
  try {
    const tampered = { ...encrypted, authTag: '0'.repeat(32) };
    decryptCustomsData(tampered);
  } catch {
    tamperThrown = true;
  }
  assert(tamperThrown, 'Tampered authentication tag throws decryption error');

  // Different runs produce different IVs and different ciphertexts
  const encrypted2 = encryptCustomsData(testSecret);
  assert(
    encrypted.iv !== encrypted2.iv,
    'Random IV ensures non-deterministic ciphertexts for same plaintext'
  );

  // ==========================================
  // 2. Sensitive Data Redaction
  // ==========================================
  console.log('\n🛡️ 2. Deep Redaction of Sensitive Payload Data');
  const dirtyObject = {
    icegateId: 'CHA_9921',
    password: 'plain_password',
    token: 'jwt_secret_token',
    headers: {
      authorization: 'Bearer eyJhbGciOiJIUzI1Ni...',
      dscPin: '998811',
    },
    items: [
      { id: 1, secret: 'top_secret' },
      { id: 2, name: 'Normal Item' },
    ],
  };

  const cleanObject: any = redactSensitiveData(dirtyObject);
  assert(cleanObject.password === '[REDACTED]', 'Password key redacted at root');
  assert(cleanObject.token === '[REDACTED]', 'Token key redacted at root');
  assert(cleanObject.headers.dscPin === '[REDACTED]', 'Nested DSC Pin redacted');
  assert(cleanObject.headers.authorization === '[REDACTED_BEARER_TOKEN]', 'Bearer token in header redacted');
  assert(cleanObject.items[0].secret === '[REDACTED]', 'Array item sensitive field redacted');
  assert(cleanObject.items[1].name === 'Normal Item', 'Non-sensitive data preserved untouched');
  assert(cleanObject.icegateId === 'CHA_9921', 'Public metadata preserved untouched');

  // ==========================================
  // 3. Multi-Tenant Boundary Enforcement
  // ==========================================
  console.log('\n🔒 3. Multi-Tenant Data Isolation');
  const companyA = 'test_tenant_alpha_chunk2';
  const companyB = 'test_tenant_beta_chunk2';

  const tenantDbA = createTenantDb(companyA);
  const tenantDbB = createTenantDb(companyB);

  // Clean up any previous test remnants
  await prisma.customsCredential.deleteMany({
    where: { companyId: { in: [companyA, companyB] } },
  });
  await prisma.integrationLog.deleteMany({
    where: { companyId: { in: [companyA, companyB] } },
  });

  // Ensure test companies exist
  await prisma.company.upsert({
    where: { id: companyA },
    update: { name: 'Test Customs Tenant Alpha' },
    create: { id: companyA, name: 'Test Customs Tenant Alpha' },
  });
  await prisma.company.upsert({
    where: { id: companyB },
    update: { name: 'Test Customs Tenant Beta' },
    create: { id: companyB, name: 'Test Customs Tenant Beta' },
  });

  // Create credential for Company A
  const credA = await tenantDbA.customsCredential.create({
    data: {
      service: 'ICEGATE',
      environment: 'SANDBOX',
      encryptedData: encrypted.encryptedData,
      iv: encrypted.iv,
      authTag: encrypted.authTag,
      icegateId: 'ICE_TENANT_A',
      portCode: 'INNSA1',
    },
  });

  // Verify Company A can read its credential
  const foundA = await tenantDbA.customsCredential.findFirst({
    where: { id: credA.id },
  });
  assert(foundA?.icegateId === 'ICE_TENANT_A', 'Company A reads its own customs credential');

  // Verify Company B CANNOT read Company A's credential
  const foundB = await tenantDbB.customsCredential.findFirst({
    where: { id: credA.id },
  });
  assert(foundB === null, 'Company B cannot access Company A customs credential');

  // Middleware cross-tenant violation check
  let crossViolationCaught = false;
  try {
    await runWithTenant(companyA, async () => {
      await prisma.customsCredential.findFirst({
        where: { companyId: companyB },
      });
    });
  } catch (err: any) {
    if (err instanceof ForbiddenError) crossViolationCaught = true;
  }
  assert(crossViolationCaught, 'Prisma tenant middleware blocks explicit cross-tenant credential query');

  // Clean up test credentials
  await prisma.customsCredential.deleteMany({
    where: { companyId: { in: [companyA, companyB] } },
  });

  // ==========================================
  // 4. Customs Adapter Interface & Mock
  // ==========================================
  console.log('\n🚢 4. Customs Adapter Interface & Mock Sandbox');
  const mockAdapter = new MockCustomsAdapter({ simulatedLatencyMs: 10 });

  const pingResult = await mockAdapter.ping();
  assert(pingResult.healthy === true, 'Mock adapter ping reports healthy');
  assert(pingResult.latencyMs >= 10, 'Mock adapter simulates realistic network latency');

  const filingResponse = await mockAdapter.fileBillOfEntry({
    companyId: 'comp_1',
    importShipmentId: 'ship_1',
    importerIEC: '0388123456',
    importerName: 'ACME IMPORTS',
    portOfImport: 'INNSA1',
    hsCode: '84821010',
    invoiceValue: 50000,
    currency: 'USD',
    assessableValue: 50500,
    dutyPayable: 14006.17,
    dutyBreakdown: {},
    beNumber: 'BE-2026-0001',
  });

  assert(filingResponse.success === true, 'Filing response success is true');
  assert(
    filingResponse.ackNumber?.startsWith('ACK-ICEGATE-') === true,
    'Filing generates valid ICEGATE acknowledgment number format'
  );
  assert(
    filingResponse.filingRefNumber.startsWith('REF-SS-'),
    'Filing generates ShipSync internal tracking reference'
  );

  const statusResponse = await mockAdapter.checkFilingStatus({
    service: 'ICEGATE',
    beNumber: 'BE-2026-0001',
  });
  assert(statusResponse.status === 'ASSESSED', 'Mock adapter reports ASSESSED status');

  // ==========================================
  // 5. Circuit Breaker Mechanics
  // ==========================================
  console.log('\n⚡ 5. Circuit Breaker State Machine');
  const breaker = new CircuitBreaker({
    failureThreshold: 3,
    cooldownPeriodMs: 200, // Short cooldown for test
  });

  const svc = 'TEST_GATEWAY';
  assert(breaker.getState(svc) === 'CLOSED', 'Circuit starts in CLOSED state');

  // 1st & 2nd failure — still CLOSED
  breaker.recordFailure(svc);
  assert(breaker.getState(svc) === 'CLOSED', 'Circuit remains CLOSED after 1 failure');
  breaker.recordFailure(svc);
  assert(breaker.getState(svc) === 'CLOSED', 'Circuit remains CLOSED after 2 failures');

  // 3rd failure — transitions to OPEN
  breaker.recordFailure(svc);
  assert(breaker.getState(svc) === 'OPEN', 'Circuit transitions to OPEN after 3 consecutive failures');

  // While OPEN: execute() must immediately throw CircuitBreakerError without invoking fn
  let functionInvoked = false;
  let cbErrorThrown = false;
  try {
    await breaker.execute(svc, async () => {
      functionInvoked = true;
      return 'OK';
    });
  } catch (err: any) {
    if (err instanceof CircuitBreakerError) cbErrorThrown = true;
  }
  assert(cbErrorThrown, 'Circuit Breaker in OPEN state throws CircuitBreakerError (HTTP 503)');
  assert(!functionInvoked, 'Circuit Breaker prevents executing the underlying call while OPEN');

  // Wait for cooldown to expire
  await new Promise((res) => setTimeout(res, 250));
  assert(breaker.getState(svc) === 'HALF_OPEN', 'Circuit transitions to HALF_OPEN after cooldown expires');

  // Successful probe in HALF_OPEN recovers to CLOSED
  await breaker.execute(svc, async () => 'RECOVERED');
  assert(breaker.getState(svc) === 'CLOSED', 'Successful probe in HALF_OPEN resets circuit to CLOSED');

  // ==========================================
  // 6. Exponential Backoff & Jitter
  // ==========================================
  console.log('\n⏱️ 6. Exponential Backoff & Jitter Bounds');
  const delay1NoJitter = calculateBackoffDelay(1, { baseDelayMs: 1000, jitter: false });
  const delay2NoJitter = calculateBackoffDelay(2, { baseDelayMs: 1000, jitter: false });
  const delay3NoJitter = calculateBackoffDelay(3, { baseDelayMs: 1000, jitter: false });

  assert(delay1NoJitter === 1000, 'Attempt 1 base delay is 1,000ms');
  assert(delay2NoJitter === 2000, 'Attempt 2 base delay is 2,000ms (2x)');
  assert(delay3NoJitter === 4000, 'Attempt 3 base delay is 4,000ms (4x)');

  const cappedDelay = calculateBackoffDelay(10, { baseDelayMs: 1000, maxDelayMs: 10000, jitter: false });
  assert(cappedDelay === 10000, 'Delay capped at maxDelayMs (10,000ms)');

  const jitterDelay = calculateBackoffDelay(2, { baseDelayMs: 1000, jitter: true });
  assert(jitterDelay >= 0 && jitterDelay <= 2000, 'Jittered delay lies within [0, 2000ms] bounds');

  // ==========================================
  // 7. Statutory Manual Override & RBAC
  // ==========================================
  console.log('\n⚖️ 7. Statutory Manual Override & RBAC');
  assert(hasPermission('OWNER', 'customs:manual_override'), 'OWNER has customs:manual_override');
  assert(hasPermission('ADMIN', 'customs:manual_override'), 'ADMIN has customs:manual_override');
  assert(!hasPermission('OPS_EXECUTIVE', 'customs:manual_override'), 'OPS_EXECUTIVE denied customs:manual_override');
  assert(!hasPermission('COMPLIANCE_OFFICER', 'customs:manual_override'), 'COMPLIANCE_OFFICER denied customs:manual_override');
  assert(!hasPermission('VIEWER', 'customs:manual_override'), 'VIEWER denied customs:manual_override');

  // Reason length validation
  const invalidOverride = customsManualOverrideSchema.safeParse({
    importShipmentId: 'ship_123',
    newStatus: 'OUT_OF_CHARGE',
    reason: 'Too short', // < 15 chars
  });
  assert(!invalidOverride.success, 'Override reason < 15 characters rejected');

  const validOverride = customsManualOverrideSchema.safeParse({
    importShipmentId: 'ship_123',
    newStatus: 'OUT_OF_CHARGE',
    reason: 'Clearance granted manually by Appraising Officer via Out of Charge order memo.',
    statutoryRef: 'CUS/OOC/2026/09/8812',
  });
  assert(validOverride.success, 'Valid statutory override with reasoned memo accepted');

  // ==========================================
  // 8. e-Sanchit Pipeline Constraints & IRN
  // ==========================================
  console.log('\n📄 8. e-Sanchit Pipeline Rules');
  const esanchitAdapter = new EsanchitAdapter({ environment: 'SANDBOX' });

  // Non-PDF rejection
  const nonPdfValidation = esanchitUploadSchema.safeParse({
    importShipmentId: 'ship_1',
    docTypeCode: '010001',
    docName: 'Invoice',
    fileName: 'invoice.png',
    mimeType: 'image/png',
    fileBase64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    fileSize: 1024,
  });
  assert(!nonPdfValidation.success, 'e-Sanchit rejects non-PDF MIME type');

  // Oversized file (> 5MB) rejection
  const oversizedValidation = esanchitUploadSchema.safeParse({
    importShipmentId: 'ship_1',
    docTypeCode: '010001',
    docName: 'Invoice',
    fileName: 'huge.pdf',
    mimeType: 'application/pdf',
    fileBase64: 'JVBERi0xLjQK...',
    fileSize: 6 * 1024 * 1024, // 6MB
  });
  assert(!oversizedValidation.success, 'e-Sanchit rejects documents exceeding 5MB statutory limit');

  // Official document type code lookup
  assert(ESANCHIT_DOC_CODES['010001'] === 'Commercial Invoice', 'Code 010001 maps to Commercial Invoice');
  assert(ESANCHIT_DOC_CODES['010002'] === 'Packing List', 'Code 010002 maps to Packing List');
  assert(ESANCHIT_DOC_CODES['010003'] === 'Bill of Lading / Airway Bill', 'Code 010003 maps to BL / AWB');

  // IRN generation
  const esanchitRes = await esanchitAdapter.uploadSupportingDocument({
    companyId: 'comp_1',
    importShipmentId: 'ship_1',
    docTypeCode: '010001',
    docName: 'Commercial Invoice',
    fileName: 'commercial_invoice_8819.pdf',
    mimeType: 'application/pdf',
    fileBuffer: 'JVBERi0xLjQK...',
    fileSize: 245000,
  });

  assert(esanchitRes.success === true, 'e-Sanchit upload response is successful');
  assert(
    esanchitRes.irnNumber.startsWith('IRN-'),
    'e-Sanchit generates valid IRN (Image Reference Number)'
  );
  assert(esanchitRes.signatureVerified === true, 'Digital signature verified in upload response');

  // Summary
  console.log('\n====================================================');
  console.log(`🏁 Test Results: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Unhandled test error:', err);
  process.exit(1);
});
