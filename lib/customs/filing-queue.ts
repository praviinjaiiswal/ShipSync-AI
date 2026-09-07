import { prisma } from '@/app/lib/prisma';
import { globalCircuitBreaker } from '@/lib/circuit-breaker';
import { calculateBackoffDelay } from '@/lib/retry-backoff';
import { redactSensitiveData } from '@/lib/crypto/customs-crypto';
import { getCustomsAdapter } from './adapter-factory';
import type { BillOfEntryFilingPayload } from './types';
import type { CustomsJobStatus, IntegrationLogStatus } from '@prisma/client';

export interface EnqueueFilingOptions {
  companyId: string;
  importShipmentId: string;
  userId: string;
  payload: BillOfEntryFilingPayload;
}

/**
 * Dispatches a Bill of Entry filing job through the asynchronous queue.
 */
export async function enqueueBillOfEntryFiling(options: EnqueueFilingOptions): Promise<string> {
  const { companyId, importShipmentId, userId, payload } = options;

  // 1. Create the persistent queue job
  const job = await prisma.customsFilingJob.create({
    data: {
      companyId,
      importShipmentId,
      service: 'ICEGATE',
      jobType: 'BE_FILING',
      status: 'QUEUED',
      payload: redactSensitiveData(payload) as any,
    },
  });

  // 2. Trigger asynchronous background processing (non-blocking)
  executeJobInBackground(job.id, companyId, importShipmentId, userId, payload).catch((err) => {
    console.error(`[CustomsQueue] Unhandled error processing job ${job.id}:`, err);
  });

  return job.id;
}

/**
 * Background worker execution for a filing job.
 */
export async function executeJobInBackground(
  jobId: string,
  companyId: string,
  importShipmentId: string,
  userId: string,
  payload: BillOfEntryFilingPayload
): Promise<void> {
  const startTime = Date.now();
  const serviceKey = `ICEGATE:${companyId}`;

  // Update job to PROCESSING
  await prisma.customsFilingJob.update({
    where: { id: jobId },
    data: { status: 'PROCESSING' },
  });

  try {
    // Execute through circuit breaker
    const adapter = await getCustomsAdapter(companyId, 'ICEGATE');

    const result = await globalCircuitBreaker.execute(serviceKey, async () => {
      return await adapter.fileBillOfEntry(payload);
    });

    const durationMs = Date.now() - startTime;

    // Update job to ACKNOWLEDGED
    await prisma.customsFilingJob.update({
      where: { id: jobId },
      data: {
        status: 'ACKNOWLEDGED',
        filingRefNumber: result.filingRefNumber,
        ackNumber: result.ackNumber,
        response: redactSensitiveData(result.rawResponse || result) as any,
      },
    });

    // Advance import shipment status to BOE_FILED if currently IGM_FILED
    const shipment = await prisma.importShipment.findUnique({
      where: { id: importShipmentId },
    });

    if (shipment && shipment.status === 'IGM_FILED') {
      await prisma.importShipment.update({
        where: { id: importShipmentId },
        data: { status: 'BOE_FILED' },
      });
    }

    // Record statutory audit log
    await prisma.integrationLog.create({
      data: {
        companyId,
        service: 'ICEGATE',
        action: 'BILL_OF_ENTRY_SUBMISSION',
        status: 'SUCCESS',
        durationMs,
        requestSummary: redactSensitiveData({
          beNumber: payload.beNumber,
          iec: payload.importerIEC,
          port: payload.portOfImport,
        }) as any,
        responseSummary: redactSensitiveData({
          filingRefNumber: result.filingRefNumber,
          ackNumber: result.ackNumber,
          status: result.status,
        }) as any,
        initiatedBy: userId,
      },
    });
  } catch (error: any) {
    const durationMs = Date.now() - startTime;
    const isCircuitBroken = error.code === 'CIRCUIT_BREAKER_OPEN';
    const logStatus: IntegrationLogStatus = isCircuitBroken ? 'CIRCUIT_BROKEN' : 'FAILED';
    const jobStatus: CustomsJobStatus = isCircuitBroken ? 'CIRCUIT_BROKEN' : 'FAILED';

    const currentJob = await prisma.customsFilingJob.findUnique({ where: { id: jobId } });
    const retryCount = (currentJob?.retryCount || 0) + 1;
    const maxRetries = currentJob?.maxRetries || 5;

    // Calculate next retry time with exponential backoff
    const backoffMs = calculateBackoffDelay(retryCount, { baseDelayMs: 2000, maxDelayMs: 60000 });
    const nextRetryAt = retryCount <= maxRetries ? new Date(Date.now() + backoffMs) : null;

    await prisma.customsFilingJob.update({
      where: { id: jobId },
      data: {
        status: jobStatus,
        retryCount,
        nextRetryAt,
        lastError: error.message,
      },
    });

    await prisma.integrationLog.create({
      data: {
        companyId,
        service: 'ICEGATE',
        action: 'BILL_OF_ENTRY_SUBMISSION',
        status: logStatus,
        durationMs,
        requestSummary: redactSensitiveData({
          beNumber: payload.beNumber,
          iec: payload.importerIEC,
        }) as any,
        errorCode: error.code || 'GATEWAY_ERROR',
        errorMessage: error.message,
        initiatedBy: userId,
      },
    });
  }
}
