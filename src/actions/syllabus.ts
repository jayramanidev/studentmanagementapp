"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-utils";
import type { ActionResponse } from "@/types/auth";
import { TopicStatus } from "@prisma/client";

// ─── Types ───────────────────────────────────────────────

export interface SyllabusChapter {
  chapterName: string;
  topics: SyllabusTopicItem[];
  completedCount: number;
  inProgressCount: number;
  totalCount: number;
  completionPct: number;
}

export interface SyllabusTopicItem {
  id: string;
  topicName: string;
  orderIndex: number;
  subjectName: string | null;
  status: TopicStatus; // For the current viewing student
  completedAt: Date | null;
}

export interface SubjectSyllabusOverview {
  subjectId: string;
  subjectName: string;
  totalTopics: number;
  completedTopics: number;
  completionPct: number;
  chapters: SyllabusChapter[];
}

// ─── Zod Schemas ─────────────────────────────────────────

const CreateTopicSchema = z.object({
  batchId: z.string().uuid(),
  subjectId: z.string().uuid().optional().or(z.literal("")),
  chapterName: z.string().min(2, "Chapter name required").max(150),
  topics: z.array(z.string().min(1)).min(1, "At least one topic required"),
});

export type CreateTopicInput = z.infer<typeof CreateTopicSchema>;

// ─── Server Actions ─────────────────────────────────────

/**
 * Fetch syllabus topics grouped by subject and chapter with completion stats.
 * If `studentId` is provided (or inferred from role), shows that student's progress.
 */
export async function getSyllabusAction(
  batchId: string,
  subjectIdFilter?: string,
  targetStudentId?: string
): Promise<ActionResponse<SubjectSyllabusOverview[]>> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: "Unauthorized." };

    let studentId = targetStudentId;
    if (user.role === "STUDENT") {
      studentId = user.id;
    }

    const whereClause: any = { batchId };
    if (subjectIdFilter && subjectIdFilter !== "ALL") {
      whereClause.subjectId = subjectIdFilter;
    }

    const topics = await db.syllabusTopic.findMany({
      where: whereClause,
      include: {
        subject: { select: { id: true, name: true } },
        progress: studentId
          ? { where: { studentId } }
          : { take: 0 },
      },
      orderBy: [{ subject: { name: "asc" } }, { orderIndex: "asc" }],
    });

    // Group by subject → chapters
    const subjectMap = new Map<string, {
      subjectId: string;
      subjectName: string;
      chapterMap: Map<string, SyllabusTopicItem[]>;
    }>();

    for (const t of topics) {
      const subId = t.subjectId ?? "general";
      const subName = t.subject?.name ?? "General Studies";

      if (!subjectMap.has(subId)) {
        subjectMap.set(subId, {
          subjectId: subId,
          subjectName: subName,
          chapterMap: new Map(),
        });
      }

      const entry = subjectMap.get(subId)!;
      if (!entry.chapterMap.has(t.chapterName)) {
        entry.chapterMap.set(t.chapterName, []);
      }

      const progressRecord = t.progress[0];
      entry.chapterMap.get(t.chapterName)!.push({
        id: t.id,
        topicName: t.topicName,
        orderIndex: t.orderIndex,
        subjectName: subName,
        status: progressRecord?.status ?? TopicStatus.NOT_STARTED,
        completedAt: progressRecord?.completedAt ?? null,
      });
    }

    // Build final structure
    const result: SubjectSyllabusOverview[] = [];

    for (const [, sub] of subjectMap) {
      const chapters: SyllabusChapter[] = [];
      let subCompleted = 0;
      let subTotal = 0;

      for (const [chName, chTopics] of sub.chapterMap) {
        const completed = chTopics.filter((t) => t.status === "COMPLETED").length;
        const inProgress = chTopics.filter((t) => t.status === "IN_PROGRESS").length;
        const total = chTopics.length;

        subCompleted += completed;
        subTotal += total;

        chapters.push({
          chapterName: chName,
          topics: chTopics,
          completedCount: completed,
          inProgressCount: inProgress,
          totalCount: total,
          completionPct: total > 0 ? Math.round((completed / total) * 100) : 0,
        });
      }

      result.push({
        subjectId: sub.subjectId,
        subjectName: sub.subjectName,
        totalTopics: subTotal,
        completedTopics: subCompleted,
        completionPct: subTotal > 0 ? Math.round((subCompleted / subTotal) * 100) : 0,
        chapters,
      });
    }

    return { success: true, data: result };
  } catch (error) {
    console.error("[getSyllabusAction Error]:", error);
    return { success: false, error: "Failed to load syllabus data." };
  }
}

/**
 * Create syllabus topics for a batch (Admin/Faculty).
 */
export async function createSyllabusTopicsAction(
  data: CreateTopicInput
): Promise<ActionResponse<{ count: number }>> {
  try {
    const user = await getCurrentUser();
    if (!user || !["ADMIN", "COORDINATOR", "TEACHER"].includes(user.role)) {
      return { success: false, error: "Forbidden." };
    }

    const parsed = CreateTopicSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
    }

    // Get current max orderIndex for this chapter
    const existingMax = await db.syllabusTopic.aggregate({
      where: {
        batchId: parsed.data.batchId,
        chapterName: parsed.data.chapterName,
      },
      _max: { orderIndex: true },
    });

    let nextIdx = (existingMax._max.orderIndex ?? -1) + 1;

    const createData = parsed.data.topics.map((topicName) => ({
      batchId: parsed.data.batchId,
      subjectId: parsed.data.subjectId || null,
      chapterName: parsed.data.chapterName,
      topicName,
      orderIndex: nextIdx++,
      createdBy: user.id,
    }));

    await db.syllabusTopic.createMany({ data: createData });

    revalidatePath("/admin/syllabus");
    revalidatePath("/faculty/syllabus");
    revalidatePath("/student/syllabus");

    return { success: true, data: { count: createData.length } };
  } catch (error) {
    console.error("[createSyllabusTopicsAction Error]:", error);
    return { success: false, error: "Failed to create syllabus topics." };
  }
}

/**
 * Update a student's progress on a specific topic.
 */
export async function upsertTopicProgressAction(
  topicId: string,
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED",
  targetStudentId?: string
): Promise<ActionResponse<{ status: TopicStatus }>> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: "Unauthorized." };

    const studentId = targetStudentId ?? user.id;

    // Faculty/Admin can update any student; students can only update their own
    if (user.role === "STUDENT" && studentId !== user.id) {
      return { success: false, error: "Students can only update their own progress." };
    }

    const upserted = await db.topicProgress.upsert({
      where: {
        topicId_studentId: { topicId, studentId },
      },
      create: {
        topicId,
        studentId,
        status: status as TopicStatus,
        completedAt: status === "COMPLETED" ? new Date() : null,
        updatedBy: user.id,
      },
      update: {
        status: status as TopicStatus,
        completedAt: status === "COMPLETED" ? new Date() : null,
        updatedBy: user.id,
      },
    });

    revalidatePath("/student/syllabus");
    revalidatePath("/faculty/syllabus");
    revalidatePath("/admin/syllabus");

    return { success: true, data: { status: upserted.status } };
  } catch (error) {
    console.error("[upsertTopicProgressAction Error]:", error);
    return { success: false, error: "Failed to update topic progress." };
  }
}

/**
 * Batch-mark all topics in a chapter as COMPLETED for all students in a batch (Faculty "Mark Taught").
 */
export async function markChapterTaughtAction(
  batchId: string,
  chapterName: string,
  subjectId?: string
): Promise<ActionResponse<{ updatedCount: number }>> {
  try {
    const user = await getCurrentUser();
    if (!user || !["ADMIN", "COORDINATOR", "TEACHER"].includes(user.role)) {
      return { success: false, error: "Forbidden." };
    }

    const whereClause: any = { batchId, chapterName };
    if (subjectId) whereClause.subjectId = subjectId;

    const topics = await db.syllabusTopic.findMany({
      where: whereClause,
      select: { id: true },
    });

    const students = await db.studentProfile.findMany({
      where: { batchId },
      select: { userId: true },
    });

    let count = 0;

    for (const topic of topics) {
      for (const student of students) {
        await db.topicProgress.upsert({
          where: {
            topicId_studentId: { topicId: topic.id, studentId: student.userId },
          },
          create: {
            topicId: topic.id,
            studentId: student.userId,
            status: "COMPLETED",
            completedAt: new Date(),
            updatedBy: user.id,
          },
          update: {
            status: "COMPLETED",
            completedAt: new Date(),
            updatedBy: user.id,
          },
        });
        count++;
      }
    }

    revalidatePath("/faculty/syllabus");
    revalidatePath("/student/syllabus");
    revalidatePath("/admin/syllabus");

    return { success: true, data: { updatedCount: count } };
  } catch (error) {
    console.error("[markChapterTaughtAction Error]:", error);
    return { success: false, error: "Failed to mark chapter as taught." };
  }
}

/**
 * Delete a syllabus topic (Admin only).
 */
export async function deleteSyllabusTopicAction(
  topicId: string
): Promise<ActionResponse<{ deleted: boolean }>> {
  try {
    const user = await getCurrentUser();
    if (!user || !["ADMIN", "COORDINATOR"].includes(user.role)) {
      return { success: false, error: "Forbidden." };
    }

    await db.syllabusTopic.delete({ where: { id: topicId } });

    revalidatePath("/admin/syllabus");
    revalidatePath("/faculty/syllabus");
    revalidatePath("/student/syllabus");

    return { success: true, data: { deleted: true } };
  } catch (error) {
    console.error("[deleteSyllabusTopicAction Error]:", error);
    return { success: false, error: "Failed to delete topic." };
  }
}
