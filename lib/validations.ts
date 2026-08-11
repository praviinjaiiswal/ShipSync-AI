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
