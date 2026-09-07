import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import nodemailer from "nodemailer";
import { withErrorHandler } from "@/lib/api-handler";
import { rateLimiter, RATE_LIMIT_PRESETS } from "@/lib/rate-limit";

// Proper Backend Validation
const contactSchema = z.object({
  name: z.string().trim().min(2, "Name is required"),
  email: z.string().trim().toLowerCase().email("Invalid email address"),
  company: z.string().optional(),
  subject: z.enum(["general", "partnership", "media", "support"]),
  message: z.string().trim().min(5, "Message is too short"),
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  await rateLimiter.check(request, `contact:${ip}`, RATE_LIMIT_PRESETS.AUTH);

  const body = await request.json();
  const validated = contactSchema.parse(body);

  console.log("New Contact Submission:", validated);

  // Email Sending Logic
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: "animusitmanagement@gmail.com",
    subject: `ShipSync AI: New Inquiry - ${validated.subject.toUpperCase()}`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #0E151B; padding: 20px; border: 1px solid #EEF2FB; border-radius: 10px;">
        <h2 style="color: #2A495B;">New Contact Request</h2>
        <p><strong>Name:</strong> ${validated.name}</p>
        <p><strong>Email:</strong> ${validated.email}</p>
        <p><strong>Company:</strong> ${validated.company || "N/A"}</p>
        <p><strong>Subject:</strong> ${validated.subject}</p>
        <hr style="border: 1px solid #EEF2FB; margin: 20px 0;" />
        <p><strong>Message:</strong></p>
        <p style="white-space: pre-wrap; background: #f9f9f9; padding: 15px; border-radius: 5px;">${validated.message}</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);

  // API Optimization: Ensure no caching for mutations
  const headers = {
    "Cache-Control": "no-store, max-age=0",
    "Pragma": "no-cache",
  };

  return NextResponse.json(
    {
      success: true,
      message: "Message received successfully",
      data: validated,
    },
    { status: 201, headers }
  );
});