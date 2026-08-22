import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { AlertStatus } from "@prisma/client";

/**
 * Webhook endpoint for SMS Gateway Status Updates
 * Providers like Twilio will hit this endpoint when an SMS is delivered or failed.
 */
export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const alertId = searchParams.get("alertId");
    
    // Twilio payload comes as form-data or x-www-form-urlencoded
    const formData = await req.formData();
    const smsSid = formData.get("SmsSid") as string;
    const messageStatus = formData.get("MessageStatus") as string; // 'delivered', 'failed', 'undelivered'

    // Also support JSON bodies if we are testing via local mock scripts
    let finalStatus: AlertStatus = AlertStatus.FAILED;
    if (messageStatus === "delivered" || messageStatus === "DELIVERED") {
      finalStatus = AlertStatus.DELIVERED;
    } else if (messageStatus === "sent" || messageStatus === "SENT") {
      finalStatus = AlertStatus.SENT;
    }

    if (!alertId && !smsSid) {
      return NextResponse.json({ error: "Missing required tracking fields" }, { status: 400 });
    }

    if (alertId) {
      // Update by our internal ID passed via query param (e.g. ?alertId=...)
      await db.alertNotification.update({
        where: { id: alertId },
        data: { status: finalStatus },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[SMS Webhook Error]:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
