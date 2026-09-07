import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { sendLicenseExpiryReminder } from "@/lib/email";
import { withErrorHandler } from "@/lib/api-handler";
import { AuthError } from "@/lib/errors";

const REMINDER_DAYS = [30, 15, 7];

export const GET = withErrorHandler(async (req: NextRequest) => {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    throw new AuthError("Unauthorized cron invocation");
  }

  const now = new Date();
  let sent = 0;

  for (const days of REMINDER_DAYS) {
    const targetDate = new Date(now);
    targetDate.setDate(targetDate.getDate() + days);

    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    const licenses = await prisma.license.findMany({
      where: { expiryDate: { gte: startOfDay, lte: endOfDay } },
      include: { user: true },
    });

    for (const license of licenses) {
      await sendLicenseExpiryReminder(license.user.email, license.name, days);
      sent++;
    }
  }

  return NextResponse.json({ success: true, remindersSent: sent });
});