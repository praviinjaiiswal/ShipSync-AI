import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { sendLicenseExpiryReminder } from "@/lib/email";

const REMINDER_DAYS = [30, 15, 7];

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
}