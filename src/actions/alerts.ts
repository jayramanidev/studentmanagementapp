"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-utils";
import type { ActionResponse } from "@/types/auth";
import { AlertChannel, AlertType, AlertStatus } from "@prisma/client";
import { sendSmsViaGateway } from "@/lib/sms";

// ─── Zod Schema ──────────────────────────────────────────

const CustomBroadcastSchema = z.object({
  batchId: z.string().uuid().optional().or(z.literal("")),
  recipientPhone: z.string().min(10, "Valid 10-digit phone required").max(15).optional().or(z.literal("")),
  recipientName: z.string().min(2, "Recipient name required").optional().or(z.literal("")),
  message: z.string().min(5, "Message must be at least 5 characters"),
  channel: z.enum(["WHATSAPP", "SMS"]).default("WHATSAPP"),
  alertType: z.enum(["TEST_RESULT", "ATTENDANCE_ABSENT", "FEE_REMINDER", "CUSTOM_BROADCAST"]).default("CUSTOM_BROADCAST"),
});

export type CustomBroadcastInput = z.infer<typeof CustomBroadcastSchema>;

export interface AlertLogItem {
  id: string;
  recipientPhone: string;
  recipientName: string;
  studentName: string | null;
  batchName: string | null;
  message: string;
  channel: AlertChannel;
  alertType: AlertType;
  status: AlertStatus;
  createdAt: Date;
  senderName: string | null;
}

// ─── Server Actions ─────────────────────────────────────

/**
 * Fetch notification and dispatch logs.
 */
export async function getAlertLogsAction(filters?: {
  studentId?: string;
  channel?: AlertChannel;
}): Promise<ActionResponse<AlertLogItem[]>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Unauthorized." };
    }

    const whereClause: any = {};
    if (filters?.channel) {
      whereClause.channel = filters.channel;
    }

    // If PARENT, show only alerts for their linked children
    if (user.role === "PARENT") {
      const links = await db.parentStudentLink.findMany({
        where: { parentUserId: user.id },
      });
      const studentIds = links.map((l) => l.studentUserId);
      whereClause.studentId = { in: studentIds };
    } else if (user.role === "STUDENT") {
      whereClause.studentId = user.id;
    }

    const logs = await db.alertNotification.findMany({
      where: whereClause,
      include: {
        student: { select: { fullName: true } },
        batch: { select: { name: true } },
        sender: { select: { fullName: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const formatted: AlertLogItem[] = logs.map((l) => ({
      id: l.id,
      recipientPhone: l.recipientPhone,
      recipientName: l.recipientName,
      studentName: l.student?.fullName ?? null,
      batchName: l.batch?.name ?? null,
      message: l.message,
      channel: l.channel,
      alertType: l.alertType,
      status: l.status,
      createdAt: l.createdAt,
      senderName: l.sender?.fullName ?? "System Automator",
    }));

    return { success: true, data: formatted };
  } catch (error) {
    console.error("[getAlertLogsAction Error]:", error);
    return { success: false, error: "Failed to load notification logs." };
  }
}

/**
 * Dispatch automated WhatsApp/SMS test score cards to parents of all students in a test.
 */
export async function dispatchMarkAlertAction(
  testId: string
): Promise<ActionResponse<{ dispatchedCount: number }>> {
  try {
    const user = await getCurrentUser();
    if (!user || !["ADMIN", "COORDINATOR", "TEACHER"].includes(user.role)) {
      return { success: false, error: "Forbidden." };
    }

    const test = await db.offlineTest.findUnique({
      where: { id: testId },
      include: {
        batch: true,
        subject: true,
        testMarks: {
          include: {
            student: {
              include: {
                studentProfile: true,
                childLinks: {
                  include: {
                    parent: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!test) {
      return { success: false, error: "Test not found." };
    }

    const notificationsToCreate: any[] = [];

    for (const mark of test.testMarks) {
      const student = mark.student;
      const parentLink = student.childLinks[0];
      const parent = parentLink?.parent;
      const recipientPhone = parent?.phone ?? student.phone ?? "9876500000";
      const recipientName = parent?.fullName ?? student.fullName;

      const scoreText = mark.isAbsent
        ? "ABSENT"
        : `${Number(mark.marksObtained)} / ${Number(test.totalMarks)}`;

      const rankText = mark.calculatedRank ? `Rank: #${mark.calculatedRank}` : "";
      const statusText =
        !mark.isAbsent && Number(mark.marksObtained) >= Number(test.passingMarks)
          ? "PASSED ✅"
          : "NEEDS ATTENTION ⚠️";

      const message = `📢 *InstituteOps Exam Score Alert*\n\nDear ${recipientName},\nYour ward *${student.fullName}* (Roll: ${student.studentProfile?.rollNumber ?? "N/A"}) appeared for:\n📝 *${test.title}* (${test.subject.name})\n🎯 Score: *${scoreText}* (${statusText})\n🏆 ${rankText}\n\nReview complete performance & solution key on the student portal: http://localhost:3000/student`;

      notificationsToCreate.push({
        recipientPhone,
        recipientName,
        studentId: student.id,
        batchId: test.batchId,
        message,
        channel: AlertChannel.SMS,
        alertType: AlertType.TEST_RESULT,
        status: AlertStatus.SENT,
        sentBy: user.id,
      });
    }

    if (notificationsToCreate.length > 0) {
      const createdAlerts = await db.$transaction(
        notificationsToCreate.map((data) => db.alertNotification.create({ data }))
      );

      // Fire and forget SMS dispatch to Gateway
      for (const alert of createdAlerts) {
        sendSmsViaGateway(alert.recipientPhone, alert.message, alert.id).catch(console.error);
      }
    }

    revalidatePath("/admin/alerts");
    revalidatePath("/parent/alerts");
    revalidatePath("/admin");

    return { success: true, data: { dispatchedCount: notificationsToCreate.length } };
  } catch (error) {
    console.error("[dispatchMarkAlertAction Error]:", error);
    return { success: false, error: "Failed to dispatch test score alerts." };
  }
}

/**
 * Dispatch automated Absent alerts to parents of students marked ABSENT for a specific batch and date.
 */
export async function dispatchAttendanceAlertAction(
  batchId: string,
  dateString: string
): Promise<ActionResponse<{ dispatchedCount: number }>> {
  try {
    const user = await getCurrentUser();
    if (!user || !["ADMIN", "COORDINATOR", "TEACHER"].includes(user.role)) {
      return { success: false, error: "Forbidden." };
    }

    const targetDate = new Date(dateString);
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59);

    const absentRecords = await db.attendance.findMany({
      where: {
        batchId,
        date: { gte: startOfDay, lte: endOfDay },
        status: "ABSENT",
      },
      include: {
        batch: true,
        student: {
          include: {
            studentProfile: true,
            childLinks: { include: { parent: true } },
          },
        },
      },
    });

    if (absentRecords.length === 0) {
      return { success: true, data: { dispatchedCount: 0 } };
    }

    const dateFormatted = targetDate.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    const notificationsToCreate: any[] = [];

    for (const record of absentRecords) {
      const student = record.student;
      const parentLink = student.childLinks[0];
      const parent = parentLink?.parent;
      const recipientPhone = parent?.phone ?? student.phone ?? "9876500000";
      const recipientName = parent?.fullName ?? "Parent / Guardian";

      const message = `⚠️ *Attendance Alert — InstituteOps*\n\nDear ${recipientName},\nThis is to notify that *${student.fullName}* (Roll: ${student.studentProfile?.rollNumber ?? "N/A"}) was marked *ABSENT* today (${dateFormatted}) for *${record.batch.name}*.\n\nRegularity is critical for competitive exam success. Please contact academy office if this was unplanned.`;

      notificationsToCreate.push({
        recipientPhone,
        recipientName,
        studentId: student.id,
        batchId,
        message,
        channel: AlertChannel.SMS,
        alertType: AlertType.ATTENDANCE_ABSENT,
        status: AlertStatus.SENT,
        sentBy: user.id,
      });
    }

    if (notificationsToCreate.length > 0) {
      const createdAlerts = await db.$transaction(
        notificationsToCreate.map((data) => db.alertNotification.create({ data }))
      );

      for (const alert of createdAlerts) {
        sendSmsViaGateway(alert.recipientPhone, alert.message, alert.id).catch(console.error);
      }
    }

    revalidatePath("/admin/alerts");
    revalidatePath("/parent/alerts");

    return { success: true, data: { dispatchedCount: notificationsToCreate.length } };
  } catch (error) {
    console.error("[dispatchAttendanceAlertAction Error]:", error);
    return { success: false, error: "Failed to dispatch absent alerts." };
  }
}

/**
 * Send a custom broadcast message via WhatsApp/SMS gateway simulator.
 */
export async function sendCustomBroadcastAction(
  data: CustomBroadcastInput
): Promise<ActionResponse<{ count: number }>> {
  try {
    const user = await getCurrentUser();
    if (!user || !["ADMIN", "COORDINATOR", "TEACHER"].includes(user.role)) {
      return { success: false, error: "Forbidden." };
    }

    const parsed = CustomBroadcastSchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Invalid alert input",
      };
    }

    const notificationsToCreate: any[] = [];

    if (parsed.data.batchId) {
      // Send to all students/parents in batch
      const students = await db.studentProfile.findMany({
        where: { batchId: parsed.data.batchId },
        include: {
          user: {
            include: {
              childLinks: { include: { parent: true } },
            },
          },
        },
      });

      for (const sp of students) {
        const parent = sp.user.childLinks[0]?.parent;
        const recipientPhone = parent?.phone ?? sp.user.phone ?? "9876500000";
        const recipientName = parent?.fullName ?? sp.user.fullName;

        // Interpolate variables
        let personalized = parsed.data.message
          .replace(/{student_name}/g, sp.user.fullName)
          .replace(/{recipient_name}/g, recipientName)
          .replace(/{roll_number}/g, sp.rollNumber);

        notificationsToCreate.push({
          recipientPhone,
          recipientName,
          studentId: sp.userId,
          batchId: parsed.data.batchId,
          message: personalized,
          channel: parsed.data.channel as AlertChannel,
          alertType: parsed.data.alertType as AlertType,
          status: AlertStatus.SENT,
          sentBy: user.id,
        });
      }
    } else if (parsed.data.recipientPhone) {
      // Single phone dispatch
      notificationsToCreate.push({
        recipientPhone: parsed.data.recipientPhone,
        recipientName: parsed.data.recipientName || "Recipient",
        message: parsed.data.message,
        channel: parsed.data.channel as AlertChannel,
        alertType: parsed.data.alertType as AlertType,
        status: AlertStatus.SENT,
        sentBy: user.id,
      });
    } else {
      return { success: false, error: "Please specify either a batch or a recipient phone." };
    }

    if (notificationsToCreate.length > 0) {
      const createdAlerts = await db.$transaction(
        notificationsToCreate.map((data) => db.alertNotification.create({ data }))
      );

      for (const alert of createdAlerts) {
        sendSmsViaGateway(alert.recipientPhone, alert.message, alert.id).catch(console.error);
      }
    }

    revalidatePath("/admin/alerts");
    revalidatePath("/parent/alerts");

    return { success: true, data: { count: notificationsToCreate.length } };
  } catch (error) {
    console.error("[sendCustomBroadcastAction Error]:", error);
    return { success: false, error: "Failed to broadcast message." };
  }
}
