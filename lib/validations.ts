import { z } from "zod";

// ===== Business Rule Validators =====

/**
 * GSTIN validation: 15-character alphanumeric with checksum.
 * Format: 2-digit state code + 10-char PAN + 1-char entity code + 1-char Z + 1-char checksum
 */
const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

/**
 * IEC (Import Export Code): exactly 10 digits.
 */
const IEC_REGEX = /^[0-9]{10}$/;

/**
 * PAN: 10-character alphanumeric (5 letters + 4 digits + 1 letter).
 */
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

/**
 * HS Code: exactly 8 numeric digits.
 */
const HS_CODE_REGEX = /^\d{8}$/;

const ALLOWED_CURRENCIES = ["USD", "EUR", "GBP", "INR", "AED"] as const;
const ALLOWED_INCOTERMS = ["FOB", "CIF", "DDP", "EXW", "DAP", "CFR", "FCA"] as const;

// ===== Schemas =====

export const waitlistSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  company: z.string().min(2, "Company name is required"),
  category: z.enum(["engineering", "textiles", "pharma", "agriculture", "chemicals", "other"]),
  volume: z.enum(["1-5", "6-20", "21-50", "50+"]),
});

export const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  company: z.string().optional(),
  subject: z.enum(["general", "partnership", "media", "support"]),
  message: z.string().min(20, "Message must be at least 20 characters"),
});

export type WaitlistFormData = z.infer<typeof waitlistSchema>;
export type ContactFormData = z.infer<typeof contactSchema>;

export const shipmentSchema = z.object({
  buyerName: z.string().min(2, "Buyer name must be at least 2 characters"),
  buyerCountry: z.string().min(1, "Buyer country is required"),
  buyerEmail: z.string().email("Please enter a valid email address").optional().or(z.literal("")),
  productDesc: z.string().min(10, "Product description must be at least 10 characters"),
  hsCode: z.string().regex(HS_CODE_REGEX, "HS Code must be exactly 8 digits"),
  value: z.coerce.number().positive("Value must be a positive number"),
  currency: z.enum(ALLOWED_CURRENCIES),
  incoterm: z.enum(ALLOWED_INCOTERMS),
});

export type ShipmentFormData = z.infer<typeof shipmentSchema>;

export const licenseSchema = z.object({
  type: z.enum(["IEC", "RCMC", "LUT", "BIS_CERTIFICATE", "GST_CERTIFICATE", "OTHER"]),
  name: z.string().min(2, "Name must be at least 2 characters"),
  licenseNumber: z.string().optional(),
  issueDate: z.string().optional(),
  expiryDate: z.string().min(1, "Expiry date is required"),
});

export type LicenseFormData = z.infer<typeof licenseSchema>;

// ===== New Schemas for Chunk 0 =====

export const companySchema = z.object({
  name: z.string().min(2, "Company name must be at least 2 characters").max(200),
  gstNumber: z
    .string()
    .regex(GSTIN_REGEX, "GSTIN must be a valid 15-character format (e.g., 27AAPFU0939F1ZV)")
    .optional()
    .or(z.literal("")),
  ieCode: z
    .string()
    .regex(IEC_REGEX, "IEC must be exactly 10 digits")
    .optional()
    .or(z.literal("")),
  panNumber: z
    .string()
    .regex(PAN_REGEX, "PAN must be a valid 10-character format (e.g., ABCDE1234F)")
    .optional()
    .or(z.literal("")),
  address: z.string().max(500).optional().or(z.literal("")),
});

export type CompanyFormData = z.infer<typeof companySchema>;

export const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{6,14}$/, "Phone must be a valid number with country code")
    .optional()
    .or(z.literal("")),
  designation: z.string().max(100).optional().or(z.literal("")),
  profileImageUrl: z.string().url().optional().or(z.literal("")),
});

export type ProfileFormData = z.infer<typeof profileSchema>;

export const teamInviteSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  role: z.enum(["ADMIN", "COMPLIANCE_OFFICER", "OPS_EXECUTIVE", "VIEWER"], {
    errorMap: () => ({ message: "Invalid role — OWNER cannot be assigned via invite" }),
  }),
});

export type TeamInviteFormData = z.infer<typeof teamInviteSchema>;

export const roleChangeSchema = z.object({
  role: z.enum(["OWNER", "ADMIN", "COMPLIANCE_OFFICER", "OPS_EXECUTIVE", "VIEWER"]),
});

export type RoleChangeFormData = z.infer<typeof roleChangeSchema>;

export const profileUploadSchema = z.object({
  fileType: z.enum(["image/jpeg", "image/png", "image/webp"], {
    errorMap: () => ({ message: "Only JPEG, PNG, and WebP images are allowed" }),
  }),
  fileSize: z.number().max(2 * 1024 * 1024, "File size must be under 2MB"),
  fileName: z.string().min(1),
});

export type ProfileUploadData = z.infer<typeof profileUploadSchema>;

export const statusTransitionSchema = z.object({
  status: z.enum(["DRAFT", "DOCUMENTS_READY", "UNDER_REVIEW", "CLEARED", "SHIPPED", "DELIVERED"]),
});

// ===== Validation Helpers =====

/**
 * Validate GSTIN checksum (last character).
 * Returns true if the checksum is valid.
 */
export function validateGSTINChecksum(gstin: string): boolean {
  if (!GSTIN_REGEX.test(gstin)) return false;

  const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    const idx = chars.indexOf(gstin[i]);
    const factor = i % 2 === 0 ? 1 : 2;
    const product = idx * factor;
    sum += Math.floor(product / 36) + (product % 36);
  }
  const remainder = sum % 36;
  const checkChar = chars[(36 - remainder) % 36];
  return gstin[14] === checkChar;
}

/**
 * Validate that a status transition is legal.
 * Returns true if the transition from `current` to `next` is allowed.
 */
const ALLOWED_STATUS_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ["DOCUMENTS_READY"],
  DOCUMENTS_READY: ["UNDER_REVIEW"],
  UNDER_REVIEW: ["SHIPPING_BILL_GENERATED", "CLEARED"],
  SHIPPING_BILL_GENERATED: ["CUSTOMS_CLEARED", "CLEARED"],
  CUSTOMS_CLEARED: ["GATE_IN", "SHIPPED"],
  GATE_IN: ["SHIPPED"],
  CLEARED: ["GATE_IN", "SHIPPED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
};

export function isValidStatusTransition(current: string, next: string): boolean {
  const allowed = ALLOWED_STATUS_TRANSITIONS[current];
  if (!allowed) return false;
  return allowed.includes(next);
}

// ===== Chunk 1: Import Module Schemas =====

export const importShipmentSchema = z.object({
  importerName: z.string().min(2, "Importer name must be at least 2 characters"),
  importerIEC: z.string().regex(IEC_REGEX, "Importer IEC must be exactly 10 digits"),
  supplierName: z.string().min(2, "Supplier name must be at least 2 characters"),
  supplierCountry: z.string().min(1, "Supplier country is required"),
  portOfImport: z.string().min(2, "Port of import is required (e.g. INNSA1 / Nhava Sheva)"),
  igmNumber: z.string().optional().or(z.literal("")),
  blOrAwbNumber: z.string().optional().or(z.literal("")),
  hsCode: z.string().regex(HS_CODE_REGEX, "HS Code must be exactly 8 digits"),
  invoiceValue: z.coerce.number().positive("Invoice value must be a positive number"),
  currency: z.enum(ALLOWED_CURRENCIES),
  incoterm: z.enum(ALLOWED_INCOTERMS),
});

export type ImportShipmentFormData = z.infer<typeof importShipmentSchema>;

export const importAmendmentSchema = z.object({
  reason: z.string().min(5, "Amendment reason must be at least 5 characters"),
  invoiceValue: z.coerce.number().positive("Invoice value must be a positive number").optional(),
  hsCode: z.string().regex(HS_CODE_REGEX, "HS Code must be exactly 8 digits").optional(),
  importerName: z.string().min(2).optional(),
  supplierName: z.string().min(2).optional(),
  portOfImport: z.string().min(2).optional(),
});

export type ImportAmendmentFormData = z.infer<typeof importAmendmentSchema>;

export const importDutyRateSchema = z.object({
  hsCode: z.string().regex(HS_CODE_REGEX, "HS Code must be exactly 8 digits"),
  description: z.string().optional().or(z.literal("")),
  bcdRate: z.coerce.number().min(0, "BCD rate must be non-negative").max(1, "BCD rate must be a fraction between 0 and 1 (e.g. 0.075 for 7.5%)"),
  igstRate: z.coerce.number().min(0, "IGST rate must be non-negative").max(1, "IGST rate must be a fraction between 0 and 1 (e.g. 0.18 for 18%)"),
  cessRate: z.coerce.number().min(0).max(1).default(0),
  sourceNotificationRef: z.string().min(2, "Source notification ref is required"),
});

export type ImportDutyRateFormData = z.infer<typeof importDutyRateSchema>;

export const restrictedItemSchema = z.object({
  hsCode: z.string().regex(HS_CODE_REGEX, "HS Code must be exactly 8 digits"),
  description: z.string().optional(),
  policy: z.enum(["FREE", "RESTRICTED", "PROHIBITED", "STE"]),
  policyCondition: z.string().optional(),
  requiredLicenseType: z.string().optional(),
});

export type RestrictedItemFormData = z.infer<typeof restrictedItemSchema>;

export const importStatusTransitionSchema = z.object({
  status: z.enum([
    "IGM_FILED",
    "BOE_FILED",
    "ASSESSED",
    "DUTY_PAID",
    "EXAMINED",
    "OUT_OF_CHARGE",
    "DELIVERED",
  ]),
});

const ALLOWED_IMPORT_STATUS_TRANSITIONS: Record<string, string[]> = {
  IGM_FILED: ["BOE_FILED"],
  BOE_FILED: ["ASSESSED"],
  ASSESSED: ["DUTY_PAID"],
  DUTY_PAID: ["EXAMINED"],
  EXAMINED: ["OUT_OF_CHARGE"],
  OUT_OF_CHARGE: ["DELIVERED"],
  DELIVERED: [],
};

export function isValidImportStatusTransition(current: string, next: string): boolean {
  const allowed = ALLOWED_IMPORT_STATUS_TRANSITIONS[current];
  if (!allowed) return false;
  return allowed.includes(next);
}

// ===== Chunk 2: Customs Integration Schemas =====

export const customsCredentialSchema = z.object({
  service: z.enum(["ICEGATE", "DGFT", "ESANCHIT"]),
  environment: z.enum(["SANDBOX", "PRODUCTION"]).default("SANDBOX"),
  icegateId: z.string().min(3, "ICEGATE ID must be at least 3 characters").optional().or(z.literal("")),
  iecCode: z.string().regex(IEC_REGEX, "IEC must be exactly 10 alphanumeric characters").optional().or(z.literal("")),
  portCode: z.string().min(5, "Port code must be at least 5 alphanumeric characters (e.g. INNSA1)").max(10).optional().or(z.literal("")),
  password: z.string().min(4, "Password or Secret Key must be at least 4 characters").optional().or(z.literal("")),
  dscPin: z.string().min(4, "DSC PIN must be at least 4 digits").optional().or(z.literal("")),
  certificateData: z.string().optional().or(z.literal("")),
  dscExpiry: z.string().datetime().optional().or(z.literal("")),
});

export type CustomsCredentialFormData = z.infer<typeof customsCredentialSchema>;

export const customsFilingRequestSchema = z.object({
  importShipmentId: z.string().min(1, "Import Shipment ID is required"),
  beNumber: z.string().min(3, "Bill of Entry number is required"),
  mode: z.enum(["SYNC", "ASYNC"]).default("ASYNC"),
});

export type CustomsFilingRequestFormData = z.infer<typeof customsFilingRequestSchema>;

export const customsManualOverrideSchema = z.object({
  importShipmentId: z.string().min(1, "Import Shipment ID is required"),
  newStatus: z.enum([
    "IGM_FILED",
    "BOE_FILED",
    "ASSESSED",
    "DUTY_PAID",
    "EXAMINED",
    "OUT_OF_CHARGE",
    "DELIVERED",
  ]),
  reason: z.string().min(15, "Mandatory statutory reason must be at least 15 characters"),
  statutoryRef: z.string().optional().or(z.literal("")),
});

export type CustomsManualOverrideFormData = z.infer<typeof customsManualOverrideSchema>;

export const esanchitUploadSchema = z.object({
  importShipmentId: z.string().min(1, "Import Shipment ID is required"),
  docTypeCode: z.string().min(4, "Document Type Code is required (e.g. 010001)"),
  docName: z.string().min(2, "Document Name is required"),
  fileName: z.string().min(3, "File Name is required"),
  mimeType: z.literal("application/pdf", {
    errorMap: () => ({ message: "e-Sanchit only supports PDF documents" }),
  }),
  fileBase64: z.string().min(10, "Base64 encoded PDF content is required"),
  fileSize: z.number().max(5 * 1024 * 1024, "File size exceeds 5MB statutory limit"),
});

export type EsanchitUploadFormData = z.infer<typeof esanchitUploadSchema>;

// ===== Chunk 4: Export Module & Shipping Bill Schemas =====

export const shippingBillGenerateSchema = z.object({
  portOfLoading: z.string().min(2, "Port of loading is required (e.g. INNSA1 / Nhava Sheva)"),
  portOfDischarge: z.string().min(2, "Port of discharge is required"),
  countryOfDestination: z.string().min(2, "Country of destination is required"),
  containerNumbers: z.array(z.string()).optional().default([]),
  sealNumbers: z.array(z.string()).optional().default([]),
});

export type ShippingBillGenerateFormData = z.infer<typeof shippingBillGenerateSchema>;

export const leoIssueSchema = z.object({
  leoNumber: z.string().min(3, "LEO number must be at least 3 characters"),
  leoDate: z.string().datetime("Valid ISO datetime required for LEO date"),
  leoOfficer: z.string().min(2, "Customs Officer name or badge ID is required"),
  inspectionRemarks: z.string().optional().or(z.literal("")),
});

export type LeoIssueFormData = z.infer<typeof leoIssueSchema>;

export const egmFileSchema = z.object({
  egmNumber: z.string().min(3, "EGM number must be at least 3 characters"),
  rotationNumber: z.string().min(3, "Vessel rotation number is required"),
  shippingLineCode: z.string().min(2, "Shipping line code is required"),
  sailingDate: z.string().datetime("Valid ISO datetime required for sailing date"),
});

export type EgmFileFormData = z.infer<typeof egmFileSchema>;

export const exportAmendmentSchema = z.object({
  reason: z.string().min(5, "Statutory amendment reason must be at least 5 characters"),
  fobValue: z.coerce.number().positive("FOB value must be a positive number").optional(),
  hsCode: z.string().regex(HS_CODE_REGEX, "HS Code must be exactly 8 digits").optional(),
  buyerName: z.string().min(2, "Buyer name must be at least 2 characters").optional(),
  portOfDischarge: z.string().min(2).optional(),
  countryOfDestination: z.string().min(2).optional(),
});

export type ExportAmendmentFormData = z.infer<typeof exportAmendmentSchema>;

export const exportIncentiveCalculateSchema = z.object({
  hsCode: z.string().regex(HS_CODE_REGEX, "HS Code must be exactly 8 digits"),
  fobValue: z.coerce.number().positive("FOB value must be positive"),
  currency: z.enum(ALLOWED_CURRENCIES).default("INR"),
  quantity: z.coerce.number().positive().optional(),
  unit: z.string().optional(),
});

export type ExportIncentiveCalculateFormData = z.infer<typeof exportIncentiveCalculateSchema>;

export const ALLOWED_EXPORT_STATUS_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ["DOCUMENTS_READY"],
  DOCUMENTS_READY: ["UNDER_REVIEW"],
  UNDER_REVIEW: ["SHIPPING_BILL_GENERATED", "CLEARED"],
  SHIPPING_BILL_GENERATED: ["CUSTOMS_CLEARED", "CLEARED"],
  CUSTOMS_CLEARED: ["GATE_IN", "SHIPPED"],
  GATE_IN: ["SHIPPED"],
  CLEARED: ["GATE_IN", "SHIPPED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
};

export function isValidExportStatusTransition(current: string, next: string): boolean {
  const allowed = ALLOWED_EXPORT_STATUS_TRANSITIONS[current];
  if (!allowed) return false;
  return allowed.includes(next);
}

// ===== Chunk 5: Physical Logistics Coordination Schemas =====

export const LOGISTICS_EVENT_TYPES = [
  "PORT_ARRIVAL",
  "EXAMINATION_SCHEDULED",
  "EXAMINATION_COMPLETED",
  "STUFFING_SCHEDULED",
  "STUFFING_COMPLETED",
  "LOADED_ON_VESSEL",
  "LEO_ISSUED",
  "OUT_OF_CHARGE_ISSUED",
] as const;

export const TRANSPORTER_BOOKING_STATUSES = [
  "BOOKED",
  "PICKED_UP",
  "IN_TRANSIT",
  "DELIVERED",
  "CANCELLED",
] as const;

export const logisticsEventCreateSchema = z
  .object({
    shipmentId: z.string().optional().or(z.literal("")),
    importShipmentId: z.string().optional().or(z.literal("")),
    eventType: z.enum(LOGISTICS_EVENT_TYPES),
    timestamp: z.string().datetime("Valid ISO datetime required").optional(),
    location: z.string().min(2, "Location is required (e.g. CFS Dronagiri / Port Buffer Gate)"),
    remarks: z.string().optional().or(z.literal("")),
    attachments: z.array(z.string()).optional().default([]),
    officerOrInspectorName: z.string().optional().or(z.literal("")),
    containerNumber: z.string().optional().or(z.literal("")),
    sealNumber: z.string().optional().or(z.literal("")),
  })
  .refine(
    (data) => !!(data.shipmentId || data.importShipmentId),
    { message: "Either shipmentId or importShipmentId must be provided" }
  );

export type LogisticsEventCreateFormData = z.infer<typeof logisticsEventCreateSchema>;

export const transporterBookingCreateSchema = z
  .object({
    shipmentId: z.string().optional().or(z.literal("")),
    importShipmentId: z.string().optional().or(z.literal("")),
    transporterName: z.string().min(2, "Transporter name must be at least 2 characters"),
    contactNumber: z.string().min(8, "Contact phone must be at least 8 characters"),
    contactPerson: z.string().optional().or(z.literal("")),
    vehicleNumber: z.string().min(4, "Vehicle registration number is required (e.g. MH-46-AR-1234)"),
    vehicleType: z.string().optional().default("40ft Multi-Axle Trailer"),
    driverName: z.string().optional().or(z.literal("")),
    driverPhone: z.string().optional().or(z.literal("")),
    driverLicense: z.string().optional().or(z.literal("")),
    pickupLocation: z.string().min(2, "Pickup location is required"),
    deliveryLocation: z.string().min(2, "Delivery location is required"),
    scheduledTime: z.string().datetime("Valid ISO scheduled datetime is required"),
    ewayBillNumber: z.string().optional().or(z.literal("")),
    notes: z.string().optional().or(z.literal("")),
  })
  .refine(
    (data) => !!(data.shipmentId || data.importShipmentId),
    { message: "Either shipmentId or importShipmentId must be provided" }
  );

export type TransporterBookingCreateFormData = z.infer<typeof transporterBookingCreateSchema>;

export const transporterStatusUpdateSchema = z.object({
  status: z.enum(TRANSPORTER_BOOKING_STATUSES),
  actualTime: z.string().datetime().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

export type TransporterStatusUpdateFormData = z.infer<typeof transporterStatusUpdateSchema>;

// ===== Chunk 6: Financial Closure Loop Schemas =====

export const EXPORT_REALISATION_STATUSES = [
  "PENDING",
  "PARTIALLY_REALISED",
  "FULLY_REALISED",
  "OVERDUE",
] as const;

export const exportRealisationCreateSchema = z.object({
  shipmentId: z.string().min(1, "Shipment ID is required"),
  amountRealised: z.number().min(0, "Realised amount cannot be negative").default(0),
  realisationDate: z.string().datetime("Valid ISO datetime required").optional().or(z.literal("")),
  bankReferenceNumber: z.string().optional().or(z.literal("")),
  brcDocumentUrl: z.string().optional().or(z.literal("")),
  remarks: z.string().optional().or(z.literal("")),
});

export type ExportRealisationCreateFormData = z.infer<typeof exportRealisationCreateSchema>;

export const exportRealisationConfirmSchema = z.object({
  status: z.enum(["PARTIALLY_REALISED", "FULLY_REALISED"]),
  remarks: z.string().optional().or(z.literal("")),
});

export type ExportRealisationConfirmFormData = z.infer<typeof exportRealisationConfirmSchema>;

export const DUTY_PAYMENT_MODES = [
  "ICEGATE_E_PAYMENT",
  "NEFT_RTGS",
  "NET_BANKING",
  "OTHER",
] as const;

export const DUTY_PAYMENT_STATUSES = [
  "PENDING",
  "VERIFIED",
  "MISMATCH",
  "REJECTED",
] as const;

export const dutyPaymentRecordSchema = z.object({
  importShipmentId: z.string().min(1, "Import shipment ID is required"),
  challanNumber: z.string().min(3, "Challan number must be at least 3 characters"),
  amountPaid: z.number().positive("Amount paid must be greater than zero"),
  paymentDate: z.string().datetime("Valid ISO datetime required").optional().or(z.literal("")),
  paymentReference: z.string().optional().or(z.literal("")),
  paymentMode: z.enum(DUTY_PAYMENT_MODES).default("ICEGATE_E_PAYMENT"),
  receiptDocumentUrl: z.string().optional().or(z.literal("")),
});

export type DutyPaymentRecordFormData = z.infer<typeof dutyPaymentRecordSchema>;

export const dutyPaymentConfirmSchema = z.object({
  confirmAction: z.enum(["CONFIRM", "REJECT"]),
  notes: z.string().optional().or(z.literal("")),
});

export type DutyPaymentConfirmFormData = z.infer<typeof dutyPaymentConfirmSchema>;

export const INCENTIVE_SCHEMES = ["RODTEP", "DRAWBACK"] as const;

export const INCENTIVE_CLAIM_STATUSES = [
  "DRAFT",
  "FILED",
  "SANCTIONED",
  "CREDITED",
  "REJECTED",
] as const;

export const incentiveClaimCreateSchema = z.object({
  shipmentId: z.string().min(1, "Shipment ID is required"),
  scheme: z.enum(INCENTIVE_SCHEMES),
  claimedAmount: z.number().positive("Claimed amount must be greater than zero"),
});

export type IncentiveClaimCreateFormData = z.infer<typeof incentiveClaimCreateSchema>;

export const incentiveClaimFileSchema = z.object({
  notes: z.string().optional().or(z.literal("")),
});

export type IncentiveClaimFileFormData = z.infer<typeof incentiveClaimFileSchema>;

export const incentiveClaimSanctionSchema = z.object({
  sanctionedAmount: z.number().min(0, "Sanctioned amount cannot be negative"),
  scrollNumber: z.string().min(3, "Scroll number must be at least 3 characters"),
  scrollDate: z.string().datetime("Valid ISO scroll date required").optional().or(z.literal("")),
  status: z.enum(["SANCTIONED", "CREDITED"]).default("SANCTIONED"),
  creditDate: z.string().datetime("Valid ISO credit date required").optional().or(z.literal("")),
  bankAccountRef: z.string().optional().or(z.literal("")),
  remarks: z.string().optional().or(z.literal("")),
});

export type IncentiveClaimSanctionFormData = z.infer<typeof incentiveClaimSanctionSchema>;



