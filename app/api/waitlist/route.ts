import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import nodemailer from "nodemailer";
import { withErrorHandler } from "@/lib/api-handler";
import { rateLimiter, RATE_LIMIT_PRESETS } from "@/lib/rate-limit";

const waitlistSchema = z.object({
  name: z.string().trim().min(2, "Name is required"),
  email: z.string().trim().toLowerCase().email("Invalid business email"),
  company: z.string().trim().min(2, "Company name is required"),
  category: z.enum(["engineering", "textiles", "pharma", "agriculture", "chemicals", "other"]),
  volume: z.enum(["1-5", "6-20", "21-50", "50+"]),
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  await rateLimiter.check(request, `waitlist:${ip}`, RATE_LIMIT_PRESETS.AUTH);

  const body = await request.json();
  const validated = waitlistSchema.parse(body);

  console.log("New waitlist entry:", validated);

  // Email Sending Logic for Waitlist
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
    subject: `ShipSync AI: New Waitlist Join - ${validated.company}`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #0E151B; padding: 20px; border: 1px solid #EEF2FB; border-radius: 10px;">
        <h2 style="color: #2A495B;">New Waitlist Registration</h2>
        <p><strong>Name:</strong> ${validated.name}</p>
        <p><strong>Email:</strong> ${validated.email}</p>
        <p><strong>Company:</strong> ${validated.company}</p>
        <p><strong>Category:</strong> ${validated.category}</p>
        <p><strong>Monthly Volume:</strong> ${validated.volume}</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);

  // API Optimization: Ensure no caching for mutation routes
  const headers = {
    "Cache-Control": "no-store, max-age=0",
    "Pragma": "no-cache",
  };

  return NextResponse.json(
    {
      success: true,
      message: "Successfully added to waitlist",
      data: validated,
    },
    { status: 201, headers }
  );
});

