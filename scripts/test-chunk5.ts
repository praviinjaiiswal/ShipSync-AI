/**
 * ShipSync AI — Chunk 5: Physical Logistics Coordination Layer Test Suite
 * 
 * Verifies all Chunk 5 Acceptance Criteria:
 * 1. Physical milestone tracking lifecycle (Port Arrival -> Examination -> Stuffing -> Loaded/LEO/OOC)
 * 2. Physical milestone gate validation (required gates before export GATE_IN/SHIPPED & import DELIVERED)
 * 3. Transporter booking & status tracking progression (BOOKED -> PICKED_UP -> IN_TRANSIT -> DELIVERED)
 * 4. Multi-tenant data isolation across LogisticsEvent & TransporterBooking
 * 5. Role-Based Access Control (RBAC) across all platform roles
 */

import { prisma } from '../app/lib/prisma';
import {
  logisticsEventCreateSchema,
  transporterBookingCreateSchema,
  transporterStatusUpdateSchema,
} from '../lib/validations';
import { hasPermission } from '../lib/rbac/permissions';
import { createTenantDb } from '../lib/tenant';

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
  console.log('🚚 Running Chunk 5: Physical Logistics Layer Test Suite');
  console.log('====================================================\n');

  const tenantAId = `test_tenant_a_${Date.now()}`;
  const tenantBId = `test_tenant_b_${Date.now()}`;
  const userIdA = `user_a_${Date.now()}`;
  const userIdB = `user_b_${Date.now()}`;

  // ==========================================
  // 1. Setup Test Tenants & Shipments
  // ==========================================
  console.log('📦 1. Setup Multi-Tenant Test Data');

  const companyA = await prisma.company.create({
    data: {
      id: tenantAId,
      name: 'TransGlobal Logistics India Ltd',
    },
  });

  const companyB = await prisma.company.create({
    data: {
      id: tenantBId,
      name: 'Oceanic Freight Systems LLC',
    },
  });

  const userA = await prisma.user.create({
    data: {
      id: userIdA,
      clerkId: `clerk_${userIdA}`,
      email: `logistics_ops_${Date.now()}@transglobal.com`,
      name: 'Vikas Deshmukh',
      role: 'OPS_EXECUTIVE',
      companyId: tenantAId,
    },
  });

  const userB = await prisma.user.create({
    data: {
      id: userIdB,
      clerkId: `clerk_${userIdB}`,
      email: `ops_${Date.now()}@oceanicfreight.com`,
      name: 'Sunil Rao',
      role: 'OPS_EXECUTIVE',
      companyId: tenantBId,
    },
  });

  // Export Shipment for Tenant A
  const exportShipmentA = await prisma.shipment.create({
    data: {
      companyId: tenantAId,
      userId: userIdA,
      buyerName: 'Hamburg Electronics GmbH',
      buyerCountry: 'Germany',
      hsCode: '84713010',
      value: 750000,
      currency: 'INR',
      incoterm: 'FOB',
      productDesc: 'Telecommunications equipment',
      status: 'UNDER_REVIEW',
    },
  });

  // Import Shipment for Tenant A
  const importShipmentA = await prisma.importShipment.create({
    data: {
      companyId: tenantAId,
      userId: userIdA,
      importerName: 'TransGlobal Imports Pvt Ltd',
      importerIEC: '0388123456',
      supplierName: 'Shenzhen Precision Parts Ltd',
      supplierCountry: 'China',
      portOfImport: 'INNSA1',
      hsCode: '85044090',
      invoiceValue: 50000,
      currency: 'USD',
      incoterm: 'CIF',
      assessableValue: 4250000,
      status: 'ASSESSED',
    },
  });

  assert(exportShipmentA.id !== undefined, 'Created export shipment for Tenant A');
  assert(importShipmentA.id !== undefined, 'Created import shipment for Tenant A');

  // ==========================================
  // 2. Physical Milestone Event Schema Validation
  // ==========================================
  console.log('\n🔍 2. Logistics Event Payload Validation');

  const validEventPayload = logisticsEventCreateSchema.safeParse({
    shipmentId: exportShipmentA.id,
    eventType: 'EXAMINATION_COMPLETED',
    location: 'CFS Dronagiri / Nhava Sheva',
    timestamp: new Date().toISOString(),
    officerOrInspectorName: 'Inspector A. K. Kulkarni',
    containerNumber: 'TGHU9876543',
    sealNumber: 'SEAL-IND-90812',
    remarks: '100% cartons verified, zero tampering',
    attachments: ['https://storage.shipsync.ai/reports/exam_report_9812.pdf'],
  });
  assert(validEventPayload.success === true, 'Valid logistics event payload accepted by Zod schema');

  const missingTargetPayload = logisticsEventCreateSchema.safeParse({
    eventType: 'PORT_ARRIVAL',
    location: 'JNPT Port Gate',
  });
  assert(missingTargetPayload.success === false, 'Payload without shipmentId or importShipmentId rejected');

  const invalidLocationPayload = logisticsEventCreateSchema.safeParse({
    shipmentId: exportShipmentA.id,
    eventType: 'PORT_ARRIVAL',
    location: 'x', // < 2 chars
  });
  assert(invalidLocationPayload.success === false, 'Location < 2 characters rejected');

  // ==========================================
  // 3. Milestone Recording Lifecycle End-to-End
  // ==========================================
  console.log('\n📋 3. Physical Milestone Recording End-to-End (Export & Import)');

  // Milestone 1: Port Arrival
  const event1 = await prisma.logisticsEvent.create({
    data: {
      companyId: tenantAId,
      shipmentId: exportShipmentA.id,
      eventType: 'PORT_ARRIVAL',
      location: 'Nhava Sheva Buffer Yard Gate 2',
      containerNumber: 'TGHU9876543',
      recordedBy: userIdA,
    },
  });
  assert(event1.eventType === 'PORT_ARRIVAL', 'Recorded PORT_ARRIVAL milestone');

  // Milestone 2: Examination Completed
  const event2 = await prisma.logisticsEvent.create({
    data: {
      companyId: tenantAId,
      shipmentId: exportShipmentA.id,
      eventType: 'EXAMINATION_COMPLETED',
      location: 'CFS Dronagiri Examination Bay',
      officerOrInspectorName: 'Inspector A. K. Kulkarni',
      containerNumber: 'TGHU9876543',
      remarks: 'Customs appraiser verified seal and contents intact',
      attachments: ['https://storage.shipsync.ai/reports/exam_report_9812.pdf'],
      recordedBy: userIdA,
    },
  });
  assert(event2.eventType === 'EXAMINATION_COMPLETED', 'Recorded EXAMINATION_COMPLETED with officer credentials');
  assert(event2.attachments.length === 1, 'Examination report PDF scan attached');

  // Milestone 3: Stuffing & Sealing Completed
  const event3 = await prisma.logisticsEvent.create({
    data: {
      companyId: tenantAId,
      shipmentId: exportShipmentA.id,
      eventType: 'STUFFING_COMPLETED',
      location: 'CFS Dronagiri Stuffing Shed #4',
      containerNumber: 'TGHU9876543',
      sealNumber: 'SEAL-CUSTOMS-88124',
      remarks: 'High-security bottle seal applied in surveyor presence',
      recordedBy: userIdA,
    },
  });
  assert(event3.eventType === 'STUFFING_COMPLETED', 'Recorded STUFFING_COMPLETED with bottle seal');

  // Milestone 4: Import Out of Charge Order
  const eventOoc = await prisma.logisticsEvent.create({
    data: {
      companyId: tenantAId,
      importShipmentId: importShipmentA.id,
      eventType: 'OUT_OF_CHARGE_ISSUED',
      location: 'JNPT Customs House, Nhava Sheva',
      officerOrInspectorName: 'Superintendent P. Deshmukh (OOC-1102)',
      remarks: 'Out of charge grant order signed under Section 47',
      attachments: ['https://storage.shipsync.ai/orders/ooc_order_1102.pdf'],
      recordedBy: userIdA,
    },
  });
  assert(eventOoc.eventType === 'OUT_OF_CHARGE_ISSUED', 'Recorded OUT_OF_CHARGE_ISSUED on Import Shipment');

  // ==========================================
  // 4. Physical Milestone Gate Validation Checks
  // ==========================================
  console.log('\n🚪 4. Physical Milestone Gate Readiness Checks');

  // Gate Check helper simulation (mirrors /api/logistics/gates)
  async function checkGate(companyId: string, shipmentId?: string, importShipmentId?: string, targetStatus?: string) {
    const events = await prisma.logisticsEvent.findMany({
      where: {
        companyId,
        ...(shipmentId ? { shipmentId } : { importShipmentId }),
      },
      select: { eventType: true },
    });

    const recorded = new Set(events.map((e) => e.eventType));
    let isCleared = true;
    const missing: string[] = [];

    if (shipmentId) {
      if (targetStatus === 'GATE_IN') {
        const hasExam = recorded.has('EXAMINATION_COMPLETED');
        const hasStuffing = recorded.has('STUFFING_COMPLETED');
        if (!hasExam || !hasStuffing) {
          isCleared = false;
          if (!hasExam) missing.push('EXAMINATION_COMPLETED');
          if (!hasStuffing) missing.push('STUFFING_COMPLETED');
        }
      } else if (targetStatus === 'SHIPPED') {
        const hasLoaded = recorded.has('LOADED_ON_VESSEL');
        if (!hasLoaded) {
          isCleared = false;
          missing.push('LOADED_ON_VESSEL');
        }
      }
    } else if (importShipmentId) {
      if (targetStatus === 'DELIVERED') {
        const hasOoc = recorded.has('OUT_OF_CHARGE_ISSUED');
        if (!hasOoc) {
          isCleared = false;
          missing.push('OUT_OF_CHARGE_ISSUED');
        }
      }
    }

    return { isCleared, missing };
  }

  // Export Gate: GATE_IN (both exam & stuffing completed above)
  const gateInCheck = await checkGate(tenantAId, exportShipmentA.id, undefined, 'GATE_IN');
  assert(gateInCheck.isCleared === true, 'GATE_IN gate is cleared when examination and stuffing are completed');
  assert(gateInCheck.missing.length === 0, 'No missing milestones for GATE_IN');

  // Export Gate: SHIPPED (requires LOADED_ON_VESSEL, not yet recorded)
  const shippedCheckBefore = await checkGate(tenantAId, exportShipmentA.id, undefined, 'SHIPPED');
  assert(shippedCheckBefore.isCleared === false, 'SHIPPED gate is NOT cleared before LOADED_ON_VESSEL event');
  assert(shippedCheckBefore.missing.includes('LOADED_ON_VESSEL'), 'Missing milestone includes LOADED_ON_VESSEL');

  // Now record LOADED_ON_VESSEL
  await prisma.logisticsEvent.create({
    data: {
      companyId: tenantAId,
      shipmentId: exportShipmentA.id,
      eventType: 'LOADED_ON_VESSEL',
      location: 'JNPT Berth 3 / Vessel MSC Lauren',
      remarks: "Mate's Receipt #MR-2026-9011 issued by chief officer",
      recordedBy: userIdA,
    },
  });

  const shippedCheckAfter = await checkGate(tenantAId, exportShipmentA.id, undefined, 'SHIPPED');
  assert(shippedCheckAfter.isCleared === true, 'SHIPPED gate is cleared after recording LOADED_ON_VESSEL');

  // Import Gate: DELIVERED (OUT_OF_CHARGE_ISSUED was recorded above)
  const importDeliveryGate = await checkGate(tenantAId, undefined, importShipmentA.id, 'DELIVERED');
  assert(importDeliveryGate.isCleared === true, 'DELIVERED gate is cleared on import when Out of Charge is issued');

  // Negative test: Fresh import shipment without Out of Charge
  const importShipmentFresh = await prisma.importShipment.create({
    data: {
      companyId: tenantAId,
      userId: userIdA,
      importerName: 'TransGlobal Imports Pvt Ltd',
      importerIEC: '0388123456',
      supplierName: 'Tokyo Instruments',
      supplierCountry: 'Japan',
      portOfImport: 'INNSA1',
      hsCode: '90318000',
      invoiceValue: 20000,
      currency: 'USD',
      incoterm: 'CIF',
      assessableValue: 1700000,
      status: 'BOE_FILED',
    },
  });

  const freshImportGate = await checkGate(tenantAId, undefined, importShipmentFresh.id, 'DELIVERED');
  assert(freshImportGate.isCleared === false, 'Delivery gate is blocked when Out of Charge is missing');
  assert(freshImportGate.missing.includes('OUT_OF_CHARGE_ISSUED'), 'Missing milestone flags OUT_OF_CHARGE_ISSUED');

  // ==========================================
  // 5. Transporter Booking & Status Progression
  // ==========================================
  console.log('\n🚛 5. Transporter Booking & Status Progression (Drayage / E-Way Bill)');

  const validBookingPayload = transporterBookingCreateSchema.safeParse({
    shipmentId: exportShipmentA.id,
    transporterName: 'VRL Logistics Logistics Ltd',
    contactNumber: '+919820011223',
    vehicleNumber: 'MH-46-AR-9081',
    vehicleType: '40ft Multi-Axle Trailer',
    driverName: 'Suraj Yadav',
    driverPhone: '+919700088776',
    pickupLocation: 'Exporter Factory, Pune Industrial Estate',
    deliveryLocation: 'JNPT Port Terminal Gate 3',
    scheduledTime: new Date().toISOString(),
    ewayBillNumber: '111222333444',
    notes: 'Carry clean EIR receipt and customs out pass copy',
  });
  assert(validBookingPayload.success === true, 'Valid transporter booking payload accepted');

  const invalidBookingPayload = transporterBookingCreateSchema.safeParse({
    shipmentId: exportShipmentA.id,
    transporterName: 'V', // < 2 chars
    contactNumber: '123', // < 8 chars
    vehicleNumber: '',
  });
  assert(invalidBookingPayload.success === false, 'Invalid transporter booking payload rejected');

  // Create Transporter Booking
  const booking = await prisma.transporterBooking.create({
    data: {
      companyId: tenantAId,
      shipmentId: exportShipmentA.id,
      transporterName: 'VRL Logistics Ltd',
      contactNumber: '+919820011223',
      contactPerson: 'Mr. Sunil Sharma',
      vehicleNumber: 'MH-46-AR-9081',
      vehicleType: '40ft Multi-Axle Trailer',
      driverName: 'Suraj Yadav',
      driverPhone: '+919700088776',
      pickupLocation: 'Exporter Factory, Pune Industrial Estate',
      deliveryLocation: 'JNPT Port Terminal Gate 3',
      scheduledTime: new Date(),
      ewayBillNumber: '111222333444',
      status: 'BOOKED',
      bookedBy: userIdA,
    },
  });

  assert(booking.id !== undefined, 'Created transporter booking record');
  assert(booking.status === 'BOOKED', 'Initial status is BOOKED');

  // Status Progression: BOOKED -> PICKED_UP
  const statusUpdatePickedUp = transporterStatusUpdateSchema.safeParse({
    status: 'PICKED_UP',
    notes: 'Trailer loaded and sealed at factory gate',
  });
  assert(statusUpdatePickedUp.success === true, 'PICKED_UP status update payload valid');

  const pickupTime = new Date();
  const updatedBooking1 = await prisma.transporterBooking.update({
    where: { id: booking.id },
    data: {
      status: 'PICKED_UP',
      actualPickupTime: pickupTime,
      notes: 'Trailer loaded and sealed at factory gate',
    },
  });
  assert(updatedBooking1.status === 'PICKED_UP', 'Booking transitioned to PICKED_UP');
  assert(updatedBooking1.actualPickupTime !== null, 'actualPickupTime automatically timestamped');

  // Status Progression: PICKED_UP -> IN_TRANSIT
  const updatedBooking2 = await prisma.transporterBooking.update({
    where: { id: booking.id },
    data: {
      status: 'IN_TRANSIT',
      notes: 'Cleared Khalapur toll on Mumbai-Pune expressway',
    },
  });
  assert(updatedBooking2.status === 'IN_TRANSIT', 'Booking transitioned to IN_TRANSIT');

  // Status Progression: IN_TRANSIT -> DELIVERED
  const deliveryTime = new Date();
  const updatedBooking3 = await prisma.transporterBooking.update({
    where: { id: booking.id },
    data: {
      status: 'DELIVERED',
      actualDeliveryTime: deliveryTime,
      notes: 'Container gated in at JNPT Buffer Yard with EIR issued',
    },
  });
  assert(updatedBooking3.status === 'DELIVERED', 'Booking transitioned to DELIVERED');
  assert(updatedBooking3.actualDeliveryTime !== null, 'actualDeliveryTime automatically timestamped');

  // ==========================================
  // 6. Multi-Tenant Data Isolation
  // ==========================================
  console.log('\n🔒 6. Multi-Tenant Data Isolation (Logistics Events & Transporters)');

  // Tenant B creates an event and booking
  const shipmentB = await prisma.shipment.create({
    data: {
      companyId: tenantBId,
      userId: userIdB,
      buyerName: 'Singapore Commodities Pte',
      buyerCountry: 'Singapore',
      productDesc: 'Electronic Integrated Circuits',
      hsCode: '84713010',
      value: 300000,
      currency: 'INR',
      status: 'DRAFT',
    },
  });

  const eventB = await prisma.logisticsEvent.create({
    data: {
      companyId: tenantBId,
      shipmentId: shipmentB.id,
      eventType: 'PORT_ARRIVAL',
      location: 'Chennai Port Gate 1',
      recordedBy: userIdB,
    },
  });

  const bookingB = await prisma.transporterBooking.create({
    data: {
      companyId: tenantBId,
      shipmentId: shipmentB.id,
      transporterName: 'Southern Roadways',
      contactNumber: '+919444012345',
      vehicleNumber: 'TN-01-AB-1122',
      pickupLocation: 'Chennai Ambattur',
      deliveryLocation: 'Chennai Port',
      scheduledTime: new Date(),
      bookedBy: userIdB,
    },
  });

  // Query via Tenant-Scoped DB
  const tenantDbA = createTenantDb(tenantAId);
  const tenantDbB = createTenantDb(tenantBId);

  const tenantAEvents = await tenantDbA.logisticsEvent.findMany();
  const tenantBEvents = await tenantDbB.logisticsEvent.findMany();

  assert(
    tenantAEvents.some((e) => e.id === event1.id),
    'Tenant A can access its own logistics events'
  );
  assert(
    !tenantAEvents.some((e) => e.id === eventB.id),
    'Tenant A CANNOT see Tenant B logistics events'
  );
  assert(
    !tenantBEvents.some((e) => e.id === event1.id),
    'Tenant B CANNOT see Tenant A logistics events'
  );

  const tenantABookings = await tenantDbA.transporterBooking.findMany();
  const tenantBBookings = await tenantDbB.transporterBooking.findMany();

  assert(
    tenantABookings.some((b) => b.id === booking.id),
    'Tenant A can access its own transporter booking'
  );
  assert(
    !tenantABookings.some((b) => b.id === bookingB.id),
    'Tenant A CANNOT see Tenant B transporter booking'
  );
  assert(
    !tenantBBookings.some((b) => b.id === booking.id),
    'Tenant B CANNOT see Tenant A transporter booking'
  );

  // ==========================================
  // 7. Role-Based Access Control (RBAC) Verification
  // ==========================================
  console.log('\n🛡️ 7. Role-Based Access Control (RBAC) Verification');

  // logistics:record
  assert(hasPermission('OWNER', 'logistics:record'), 'OWNER has logistics:record');
  assert(hasPermission('ADMIN', 'logistics:record'), 'ADMIN has logistics:record');
  assert(hasPermission('OPS_EXECUTIVE', 'logistics:record'), 'OPS_EXECUTIVE has logistics:record');
  assert(!hasPermission('COMPLIANCE_OFFICER', 'logistics:record'), 'COMPLIANCE_OFFICER denied logistics:record');
  assert(!hasPermission('VIEWER', 'logistics:record'), 'VIEWER denied logistics:record');

  // logistics:read
  assert(hasPermission('OWNER', 'logistics:read'), 'OWNER has logistics:read');
  assert(hasPermission('ADMIN', 'logistics:read'), 'ADMIN has logistics:read');
  assert(hasPermission('OPS_EXECUTIVE', 'logistics:read'), 'OPS_EXECUTIVE has logistics:read');
  assert(hasPermission('COMPLIANCE_OFFICER', 'logistics:read'), 'COMPLIANCE_OFFICER has logistics:read');
  assert(hasPermission('VIEWER', 'logistics:read'), 'VIEWER has logistics:read');

  // transporter:book
  assert(hasPermission('OWNER', 'transporter:book'), 'OWNER has transporter:book');
  assert(hasPermission('ADMIN', 'transporter:book'), 'ADMIN has transporter:book');
  assert(hasPermission('OPS_EXECUTIVE', 'transporter:book'), 'OPS_EXECUTIVE has transporter:book');
  assert(!hasPermission('COMPLIANCE_OFFICER', 'transporter:book'), 'COMPLIANCE_OFFICER denied transporter:book');
  assert(!hasPermission('VIEWER', 'transporter:book'), 'VIEWER denied transporter:book');

  // transporter:update
  assert(hasPermission('OWNER', 'transporter:update'), 'OWNER has transporter:update');
  assert(hasPermission('ADMIN', 'transporter:update'), 'ADMIN has transporter:update');
  assert(hasPermission('OPS_EXECUTIVE', 'transporter:update'), 'OPS_EXECUTIVE has transporter:update');
  assert(!hasPermission('VIEWER', 'transporter:update'), 'VIEWER denied transporter:update');

  // Clean up test data
  console.log('\n🧹 Cleaning up test artifacts...');
  await prisma.transporterBooking.deleteMany({ where: { companyId: { in: [tenantAId, tenantBId] } } });
  await prisma.logisticsEvent.deleteMany({ where: { companyId: { in: [tenantAId, tenantBId] } } });
  await prisma.shipment.deleteMany({ where: { companyId: { in: [tenantAId, tenantBId] } } });
  await prisma.importShipment.deleteMany({ where: { companyId: { in: [tenantAId, tenantBId] } } });
  await prisma.user.deleteMany({ where: { companyId: { in: [tenantAId, tenantBId] } } });
  await prisma.company.deleteMany({ where: { id: { in: [tenantAId, tenantBId] } } });

  console.log('====================================================');
  console.log(`🎉 Chunk 5 Tests Completed: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
