import { z } from "zod";

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
  hsCode: z.string().regex(/^\d{8}$/, "HS Code must be exactly 8 digits"),
  value: z.coerce.number().positive("Value must be a positive number"),
  currency: z.enum(["USD", "EUR", "GBP", "INR", "AED"]),
  incoterm: z.enum(["FOB", "CIF", "DDP", "EXW", "DAP"]),
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
