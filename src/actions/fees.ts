"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-utils";
import type { ActionResponse } from "@/types/auth";
import { PaymentMode, Prisma } from "@prisma/client";
const Decimal = Prisma.Decimal;

// ─── Zod Schema ──────────────────────────────────────────

const FeePaymentSchema = z.object({
  studentId: z.string().uuid("Please select a student"),
  batchId: z.string().uuid("Please select a batch"),
  amountPaid: z.number().min(1, "Amount paid must be greater than 0"),
  totalCourseFee: z.number().min(1, "Total course fee must be greater than 0"),
  paymentMode: z.enum(["CASH", "UPI", "NET_BANKING", "CHEQUE"]).default("UPI"),
  paymentDate: z.string().min(1, "Payment date is required"),
  transactionRef: z.string().max(100).optional(),
  installmentNo: z.number().int().min(1).default(1),
  remarks: z.string().max(300).optional(),
});

export type FeePaymentInput = z.infer<typeof FeePaymentSchema>;

export interface FeePaymentListItem {
  id: string;
  receiptNumber: string;
  amountPaid: number;
  totalCourseFee: number;
  paymentMode: PaymentMode;
  paymentDate: Date;
  transactionRef: string | null;
  installmentNo: number;
  remarks: string | null;
  createdAt: Date;
  student: {
    id: string;
    fullName: string;
    email: string | null;
    phone: string | null;
    studentProfile: {
      rollNumber: string;
      targetExam: string | null;
    } | null;
  };
  batch: {
    id: string;
    name: string;
    targetExam: string;
  };
  recorder: {
    fullName: string;
  } | null;
}

export interface StudentFeeSummary {
  student: {
    id: string;
    fullName: string;
    rollNumber: string;
    batchName: string;
    targetExam: string;
  };
  totalCourseFee: number;
  totalPaid: number;
  remainingBalance: number;
  paymentStatus: "FULLY_PAID" | "PARTIALLY_PAID" | "PENDING";
  payments: Array<{
    id: string;
    receiptNumber: string;
    amountPaid: number;
    paymentMode: PaymentMode;
    paymentDate: Date;
    transactionRef: string | null;
    installmentNo: number;
    remarks: string | null;
  }>;
}

// ─── Helper: Generate Receipt Number ─────────────────────

function generateReceiptNumber(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `REC-${year}-${rand}`;
}

// ─── Server Actions ─────────────────────────────────────

/**
 * Fetch all fee payment transactions with student and batch details.
 */
export async function getFeeRecordsAction(filters?: {
  batchId?: string;
  studentId?: string;
}): Promise<ActionResponse<FeePaymentListItem[]>> {
  try {
    const user = await getCurrentUser();
    if (!user || !["ADMIN", "COORDINATOR"].includes(user.role)) {
      return { success: false, error: "Forbidden. Admin or Coordinator access required." };
    }

    const { batchId, studentId } = filters ?? {};

    const whereClause: any = {};
    if (batchId && batchId !== "ALL") {
      whereClause.batchId = batchId;
    }
    if (studentId) {
      whereClause.studentId = studentId;
    }

    const records = await db.feePayment.findMany({
      where: whereClause,
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            studentProfile: {
              select: { rollNumber: true, targetExam: true },
            },
          },
        },
        batch: {
          select: { id: true, name: true, targetExam: true },
        },
        recorder: {
          select: { fullName: true },
        },
      },
      orderBy: { paymentDate: "desc" },
    });

    const formatted: FeePaymentListItem[] = records.map((r: any) => ({
      id: r.id,
      receiptNumber: r.receiptNumber,
      amountPaid: Number(r.amountPaid),
      totalCourseFee: Number(r.totalCourseFee),
      paymentMode: r.paymentMode,
      paymentDate: r.paymentDate,
      transactionRef: r.transactionRef,
      installmentNo: r.installmentNo,
      remarks: r.remarks,
      createdAt: r.createdAt,
      student: r.student,
      batch: r.batch,
      recorder: r.recorder,
    }));

    return { success: true, data: formatted };
  } catch (error) {
    console.error("[getFeeRecordsAction Error]:", error);
    return { success: false, error: "Failed to load fee payments." };
  }
}

/**
 * Record a student fee payment and generate official receipt number.
 */
export async function recordFeePaymentAction(
  data: FeePaymentInput
): Promise<ActionResponse<{ id: string; receiptNumber: string }>> {
  try {
    const user = await getCurrentUser();
    if (!user || !["ADMIN", "COORDINATOR"].includes(user.role)) {
      return { success: false, error: "Forbidden." };
    }

    const parsed = FeePaymentSchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Invalid fee input",
      };
    }

    const receiptNumber = generateReceiptNumber();

    const created = await db.feePayment.create({
      data: {
        studentId: parsed.data.studentId,
        batchId: parsed.data.batchId,
        receiptNumber,
        amountPaid: new Decimal(parsed.data.amountPaid),
        totalCourseFee: new Decimal(parsed.data.totalCourseFee),
        paymentMode: parsed.data.paymentMode,
        paymentDate: new Date(parsed.data.paymentDate),
        transactionRef: parsed.data.transactionRef || null,
        installmentNo: parsed.data.installmentNo,
        remarks: parsed.data.remarks || null,
        recordedBy: user.id,
      },
    });

    revalidatePath("/admin/fees");
    revalidatePath("/parent/fees");
    revalidatePath("/student/fees");
    revalidatePath("/parent");
    revalidatePath("/student");

    return {
      success: true,
      data: {
        id: created.id,
        receiptNumber,
      },
    };
  } catch (error) {
    console.error("[recordFeePaymentAction Error]:", error);
    return { success: false, error: "Failed to record fee payment." };
  }
}

/**
 * Fetch fee summary, ledger, and remaining dues for a specific student.
 */
export async function getStudentFeeLedgerAction(
  targetStudentUserId?: string
): Promise<ActionResponse<StudentFeeSummary>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Unauthorized." };
    }

    let studentUserId = targetStudentUserId;
    if (user.role === "STUDENT") {
      studentUserId = user.id;
    } else if (!studentUserId) {
      return { success: false, error: "Student ID is required." };
    }

    // If PARENT, verify link
    if (user.role === "PARENT") {
      const link = await db.parentStudentLink.findFirst({
        where: {
          parentUserId: user.id,
          studentUserId,
        },
      });
      if (!link) {
        return { success: false, error: "Access denied." };
      }
    }

    const studentProfile = await db.studentProfile.findUnique({
      where: { userId: studentUserId },
      include: {
        user: { select: { fullName: true } },
        batch: { select: { name: true, targetExam: true } },
      },
    });

    if (!studentProfile) {
      return { success: false, error: "Student profile not found." };
    }

    const payments = await db.feePayment.findMany({
      where: { studentId: studentUserId },
      orderBy: { paymentDate: "asc" },
    });

    let totalPaid = 0;
    let totalCourseFee = 35000; // default standard coaching fee for PSI/GPSC

    const mappedPayments = payments.map((p: any) => {
      const paid = Number(p.amountPaid);
      totalPaid += paid;
      if (Number(p.totalCourseFee) > 0) {
        totalCourseFee = Number(p.totalCourseFee);
      }
      return {
        id: p.id,
        receiptNumber: p.receiptNumber,
        amountPaid: paid,
        paymentMode: p.paymentMode as PaymentMode,
        paymentDate: p.paymentDate,
        transactionRef: p.transactionRef,
        installmentNo: p.installmentNo,
        remarks: p.remarks,
      };
    });

    const remainingBalance = Math.max(0, totalCourseFee - totalPaid);
    let paymentStatus: "FULLY_PAID" | "PARTIALLY_PAID" | "PENDING" = "PENDING";
    if (remainingBalance === 0 && totalPaid > 0) {
      paymentStatus = "FULLY_PAID";
    } else if (totalPaid > 0) {
      paymentStatus = "PARTIALLY_PAID";
    }

    return {
      success: true,
      data: {
        student: {
          id: studentUserId,
          fullName: studentProfile.user.fullName,
          rollNumber: studentProfile.rollNumber,
          batchName: studentProfile.batch?.name ?? "Main Batch",
          targetExam: studentProfile.targetExam ?? studentProfile.batch?.targetExam ?? "PSI",
        },
        totalCourseFee,
        totalPaid,
        remainingBalance,
        paymentStatus,
        payments: mappedPayments,
      },
    };
  } catch (error) {
    console.error("[getStudentFeeLedgerAction Error]:", error);
    return { success: false, error: "Failed to load fee ledger." };
  }
}
