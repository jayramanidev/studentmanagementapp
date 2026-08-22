import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding 3 new modules data (Materials, Fees, Notices)...");

  // Fetch admin, teacher, students, and batch
  const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  const teacher = await prisma.user.findFirst({ where: { role: "TEACHER" } });
  const student1 = await prisma.user.findFirst({ where: { email: "student1@instituteops.com" } });
  const student2 = await prisma.user.findFirst({ where: { email: "student2@instituteops.com" } });
  const batch = await prisma.batch.findFirst();
  const politySubject = await prisma.subject.findFirst({ where: { name: { contains: "Polity" } } });
  const gujaratiSubject = await prisma.subject.findFirst({ where: { name: { contains: "Gujarati" } } });

  if (!batch || !student1 || !student2) {
    console.error("❌ Required seed users or batch not found.");
    return;
  }

  // 1. Seed Study Materials
  console.log("Seeding Study Materials...");
  await (prisma as any).studyMaterial.createMany({
    data: [
      {
        title: "Indian Constitution Articles 1 to 51A Hand-Written Notes",
        description: "Complete fundamental rights, directive principles and fundamental duties revision notes for PSI / GPSC.",
        category: "CLASS_NOTES",
        batchId: batch.id,
        subjectId: politySubject?.id || null,
        fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        uploadedBy: teacher?.id || admin?.id,
      },
      {
        title: "Gujarat Police Sub-Inspector (PSI) 2021-2024 Solved Papers",
        description: "Official Gujarat Police Recruitment Board PYQs with detailed answer keys and explanations.",
        category: "PYQ_PAPER",
        batchId: batch.id,
        subjectId: null,
        fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        uploadedBy: admin?.id,
      },
      {
        title: "Gujarati Grammar: Sandhi, Samas & Alankar Quick Reference",
        description: "Rulebook with 200+ solved practice examples for competitive language mains exams.",
        category: "REFERENCE_BOOK",
        batchId: batch.id,
        subjectId: gujaratiSubject?.id || null,
        fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        uploadedBy: teacher?.id || admin?.id,
      },
      {
        title: "Official GPSC Class 1 & 2 Syllabus & Strategy Document",
        description: "Subject-wise topic breakdown, recommended reading list, and weightage distribution.",
        category: "SYLLABUS_COPY",
        batchId: batch.id,
        subjectId: null,
        fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        uploadedBy: admin?.id,
      },
    ],
    skipDuplicates: true,
  });
  console.log("✅ Study Materials seeded.");

  // 2. Seed Fee Payments
  console.log("Seeding Fee Payments...");
  await (prisma as any).feePayment.createMany({
    data: [
      {
        studentId: student1.id,
        batchId: batch.id,
        receiptNumber: "REC-2026-1001",
        amountPaid: 20000.0,
        totalCourseFee: 35000.0,
        paymentMode: "UPI",
        paymentDate: new Date("2026-01-05"),
        transactionRef: "UPI-40192841",
        installmentNo: 1,
        remarks: "1st Installment Admission Fee (PSI Prelims + Mains)",
        recordedBy: admin?.id,
      },
      {
        studentId: student1.id,
        batchId: batch.id,
        receiptNumber: "REC-2026-1002",
        amountPaid: 15000.0,
        totalCourseFee: 35000.0,
        paymentMode: "NET_BANKING",
        paymentDate: new Date("2026-02-10"),
        transactionRef: "NEFT-8839102",
        installmentNo: 2,
        remarks: "2nd Installment - Course Fee Fully Paid",
        recordedBy: admin?.id,
      },
      {
        studentId: student2.id,
        batchId: batch.id,
        receiptNumber: "REC-2026-1003",
        amountPaid: 18000.0,
        totalCourseFee: 35000.0,
        paymentMode: "CASH",
        paymentDate: new Date("2026-01-10"),
        installmentNo: 1,
        remarks: "1st Installment Fee",
        recordedBy: admin?.id,
      },
    ],
    skipDuplicates: true,
  });
  console.log("✅ Fee Payments seeded.");

  // 3. Seed Notices
  console.log("Seeding Notices & Announcements...");
  await (prisma as any).notice.createMany({
    data: [
      {
        title: "⚡ Mock Physical Ground Fitness Drill & 5000m Running Test",
        content: "All PSI & Constable batch aspirants must report to the Physical Training Ground at 05:45 AM sharp this Saturday. Bring official academy physical tracking cards and sports shoes.",
        priority: "URGENT",
        audience: "ALL",
        batchId: batch.id,
        isPinned: true,
        publishedBy: admin?.id,
      },
      {
        title: "📚 Monthly Full-Length Mock Test Schedule Announced",
        content: "The first 100-mark OMR physical offline examination for Indian Polity and Gujarati Grammar will be held on Sunday from 10:00 AM to 12:00 PM. Seating chart will be pasted on the notice board.",
        priority: "IMPORTANT",
        audience: "STUDENTS_ONLY",
        batchId: batch.id,
        isPinned: true,
        publishedBy: admin?.id,
      },
      {
        title: "📢 Monthly Parent-Teacher Briefing Meeting",
        content: "Dear Parents, we invite you for the monthly offline progress review session on the 4th Sunday to discuss your ward's offline test marks, rankings, and physical readiness.",
        priority: "INFO",
        audience: "PARENTS_ONLY",
        batchId: null,
        isPinned: false,
        publishedBy: admin?.id,
      },
    ],
    skipDuplicates: true,
  });
  console.log("✅ Notices seeded.");

  console.log("🎉 All 3 modules demo data successfully seeded!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
