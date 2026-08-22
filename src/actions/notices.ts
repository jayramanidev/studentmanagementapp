"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-utils";
import type { ActionResponse } from "@/types/auth";
import { NoticePriority, NoticeAudience } from "@prisma/client";

// ─── Zod Schema ──────────────────────────────────────────

const NoticeSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(150),
  content: z.string().min(5, "Content must be at least 5 characters"),
  priority: z.enum(["INFO", "IMPORTANT", "URGENT"]).default("INFO"),
  audience: z.enum(["ALL", "STUDENTS_ONLY", "PARENTS_ONLY", "FACULTY_ONLY"]).default("ALL"),
  batchId: z.string().uuid().optional().or(z.literal("")),
  isPinned: z.boolean().default(false),
});

export type NoticeInput = z.infer<typeof NoticeSchema>;

export interface NoticeListItem {
  id: string;
  title: string;
  content: string;
  priority: NoticePriority;
  audience: NoticeAudience;
  isPinned: boolean;
  createdAt: Date;
  batch: {
    id: string;
    name: string;
    targetExam: string;
  } | null;
  publisher: {
    fullName: string;
    role: string;
  } | null;
}

// ─── Server Actions ─────────────────────────────────────

/**
 * Fetch all notices visible to the logged-in user role.
 */
export async function getNoticesAction(filters?: {
  priority?: NoticePriority;
  batchId?: string;
}): Promise<ActionResponse<NoticeListItem[]>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Unauthorized." };
    }

    const { priority, batchId } = filters ?? {};

    const whereClause: any = {};
    if (priority) whereClause.priority = priority;
    if (batchId && batchId !== "ALL") whereClause.batchId = batchId;

    // Filter by audience based on role
    if (user.role === "STUDENT") {
      whereClause.audience = { in: ["ALL", "STUDENTS_ONLY"] };
    } else if (user.role === "PARENT") {
      whereClause.audience = { in: ["ALL", "PARENTS_ONLY"] };
    } else if (user.role === "TEACHER") {
      whereClause.audience = { in: ["ALL", "FACULTY_ONLY"] };
    }

    const notices = await db.notice.findMany({
      where: whereClause,
      include: {
        batch: { select: { id: true, name: true, targetExam: true } },
        publisher: { select: { fullName: true, role: true } },
      },
      orderBy: [
        { isPinned: "desc" },
        { createdAt: "desc" },
      ],
    });

    return { success: true, data: notices };
  } catch (error) {
    console.error("[getNoticesAction Error]:", error);
    return { success: false, error: "Failed to load announcements." };
  }
}

/**
 * Create / Broadcast a new notice or announcement.
 */
export async function createNoticeAction(
  data: NoticeInput
): Promise<ActionResponse<{ id: string }>> {
  try {
    const user = await getCurrentUser();
    if (!user || !["ADMIN", "COORDINATOR", "TEACHER"].includes(user.role)) {
      return { success: false, error: "Forbidden. Admin, Coordinator or Faculty role required." };
    }

    const parsed = NoticeSchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Invalid notice input",
      };
    }

    const created = await db.notice.create({
      data: {
        title: parsed.data.title,
        content: parsed.data.content,
        priority: parsed.data.priority as NoticePriority,
        audience: parsed.data.audience as NoticeAudience,
        batchId: parsed.data.batchId || null,
        isPinned: parsed.data.isPinned,
        publishedBy: user.id,
      },
    });

    revalidatePath("/admin/notices");
    revalidatePath("/student/notices");
    revalidatePath("/parent/notices");
    revalidatePath("/admin");
    revalidatePath("/student");
    revalidatePath("/parent");

    return { success: true, data: { id: created.id } };
  } catch (error) {
    console.error("[createNoticeAction Error]:", error);
    return { success: false, error: "Failed to post announcement." };
  }
}

/**
 * Delete a notice.
 */
export async function deleteNoticeAction(
  noticeId: string
): Promise<ActionResponse<boolean>> {
  try {
    const user = await getCurrentUser();
    if (!user || !["ADMIN", "COORDINATOR"].includes(user.role)) {
      return { success: false, error: "Forbidden. Admin role required." };
    }

    await db.notice.delete({
      where: { id: noticeId },
    });

    revalidatePath("/admin/notices");
    revalidatePath("/student/notices");
    revalidatePath("/parent/notices");

    return { success: true, data: true };
  } catch (error) {
    console.error("[deleteNoticeAction Error]:", error);
    return { success: false, error: "Failed to delete notice." };
  }
}
