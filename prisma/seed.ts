/**
 * InstituteOps — Database Seed Script
 * 
 * Seeds all 5 roles, 1 branch, 1 batch, 2 subjects, 2 students,
 * 1 parent with parent-student link.
 * 
 * Run with: npx tsx prisma/seed.ts
 */

import { PrismaClient, UserRole } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...\n");

  // ─── Default password for all seed users ───
  const defaultPassword = await hash("password123", 12);

  // ─── 1. Create Users (all 5 roles) ───
  const admin = await prisma.user.upsert({
    where: { email: "admin@instituteops.com" },
    update: {},
    create: {
      email: "admin@instituteops.com",
      phone: "9876500001",
      passwordHash: defaultPassword,
      fullName: "Rajesh Patel",
      role: UserRole.ADMIN,
    },
  });
  console.log(`✅ Admin:       ${admin.fullName} (${admin.email})`);

  const coordinator = await prisma.user.upsert({
    where: { email: "coordinator@instituteops.com" },
    update: {},
    create: {
      email: "coordinator@instituteops.com",
      phone: "9876500002",
      passwordHash: defaultPassword,
      fullName: "Meena Shah",
      role: UserRole.COORDINATOR,
    },
  });
  console.log(`✅ Coordinator: ${coordinator.fullName} (${coordinator.email})`);

  const teacher = await prisma.user.upsert({
    where: { email: "teacher@instituteops.com" },
    update: {},
    create: {
      email: "teacher@instituteops.com",
      phone: "9876500003",
      passwordHash: defaultPassword,
      fullName: "Amit Desai",
      role: UserRole.TEACHER,
    },
  });
  console.log(`✅ Teacher:     ${teacher.fullName} (${teacher.email})`);

  const student1 = await prisma.user.upsert({
    where: { email: "student1@instituteops.com" },
    update: {},
    create: {
      email: "student1@instituteops.com",
      phone: "9876500004",
      passwordHash: defaultPassword,
      fullName: "Jay Sharma",
      role: UserRole.STUDENT,
    },
  });
  console.log(`✅ Student 1:   ${student1.fullName} (${student1.email})`);

  const student2 = await prisma.user.upsert({
    where: { email: "student2@instituteops.com" },
    update: {},
    create: {
      email: "student2@instituteops.com",
      phone: "9876500005",
      passwordHash: defaultPassword,
      fullName: "Priya Mehta",
      role: UserRole.STUDENT,
    },
  });
  console.log(`✅ Student 2:   ${student2.fullName} (${student2.email})`);

  const parent = await prisma.user.upsert({
    where: { email: "parent@instituteops.com" },
    update: {},
    create: {
      email: "parent@instituteops.com",
      phone: "9876500006",
      passwordHash: defaultPassword,
      fullName: "Kiran Sharma",
      role: UserRole.PARENT,
    },
  });
  console.log(`✅ Parent:      ${parent.fullName} (${parent.email})`);

  // ─── 2. Create Branch ───
  const branch = await prisma.branch.create({
    data: {
      name: "Main Center",
      city: "Ahmedabad",
    },
  });
  console.log(`\n✅ Branch: ${branch.name} (${branch.city})`);

  // ─── 3. Create Batch ───
  const batch = await prisma.batch.create({
    data: {
      branchId: branch.id,
      name: "PSI 2026 Morning Batch",
      targetExam: "PSI",
      startDate: new Date("2026-01-15"),
      endDate: new Date("2026-12-31"),
    },
  });
  console.log(`✅ Batch: ${batch.name} (${batch.targetExam})`);

  // ─── 4. Create Student Profiles ───
  await prisma.studentProfile.upsert({
    where: { userId: student1.id },
    update: {
      batchId: batch.id,
      rollNumber: "PSI-2026-001",
      targetExam: "PSI",
    },
    create: {
      userId: student1.id,
      batchId: batch.id,
      rollNumber: "PSI-2026-001",
      targetExam: "PSI",
    },
  });

  await prisma.studentProfile.upsert({
    where: { userId: student2.id },
    update: {
      batchId: batch.id,
      rollNumber: "PSI-2026-002",
      targetExam: "PSI",
    },
    create: {
      userId: student2.id,
      batchId: batch.id,
      rollNumber: "PSI-2026-002",
      targetExam: "PSI",
    },
  });
  console.log(`✅ Student profiles created and linked to batch`);

  // ─── 5. Create Parent-Student Link ───
  await prisma.parentStudentLink.upsert({
    where: {
      parentUserId_studentUserId: {
        parentUserId: parent.id,
        studentUserId: student1.id,
      }
    },
    update: {},
    create: {
      parentUserId: parent.id,
      studentUserId: student1.id,
      relationship: "Father",
    },
  });
  console.log(`✅ Parent-Student link: ${parent.fullName} → ${student1.fullName}`);

  // ─── 6. Create Subjects ───
  const sub1 = await prisma.subject.create({
    data: {
      batchId: batch.id,
      name: "Indian Polity",
      teacherId: teacher.id,
    },
  });

  const sub2 = await prisma.subject.create({
    data: {
      batchId: batch.id,
      name: "Gujarati Grammar",
      teacherId: teacher.id,
    },
  });
  console.log(`✅ Subjects: Indian Polity, Gujarati Grammar`);

  // ─── 7. Create Sample Offline Tests & Marks ───
  const test1 = await prisma.offlineTest.create({
    data: {
      title: "Polity Unit Test 1 — Fundamental Rights",
      type: "WEEKLY_UNIT",
      batchId: batch.id,
      subjectId: sub1.id,
      totalMarks: 50,
      passingMarks: 20,
      testDate: new Date("2026-02-05"),
      solutionPdfUrl: "https://storage.instituteops.com/solutions/polity-test-1.pdf",
      isPublished: true,
      createdBy: teacher.id,
    },
  });

  await prisma.testMark.createMany({
    data: [
      {
        testId: test1.id,
        studentId: student1.id,
        marksObtained: 44.5,
        isAbsent: false,
        calculatedRank: 1,
        remarks: "Excellent grasp of Fundamental Rights (Articles 14-32).",
        enteredBy: teacher.id,
      },
      {
        testId: test1.id,
        studentId: student2.id,
        marksObtained: 38.0,
        isAbsent: false,
        calculatedRank: 2,
        remarks: "Good score. Focus on Writs jurisdiction.",
        enteredBy: teacher.id,
      },
    ],
  });

  const test2 = await prisma.offlineTest.create({
    data: {
      title: "Gujarati Grammar Mock Test 1 — Sandhi & Alankar",
      type: "MONTHLY_MOCK",
      batchId: batch.id,
      subjectId: sub2.id,
      totalMarks: 100,
      passingMarks: 35,
      testDate: new Date("2026-02-15"),
      solutionPdfUrl: "https://storage.instituteops.com/solutions/gujarati-grammar-1.pdf",
      isPublished: true,
      createdBy: teacher.id,
    },
  });

  await prisma.testMark.createMany({
    data: [
      {
        testId: test2.id,
        studentId: student1.id,
        marksObtained: 82.0,
        isAbsent: false,
        calculatedRank: 2,
        remarks: "Very strong in Sandhi. Revise Alankar rules.",
        enteredBy: teacher.id,
      },
      {
        testId: test2.id,
        studentId: student2.id,
        marksObtained: 89.5,
        isAbsent: false,
        calculatedRank: 1,
        remarks: "Top score in batch! Outstanding vocabulary.",
        enteredBy: teacher.id,
      },
    ],
  });
  console.log(`✅ Sample Tests & Published Marks seeded`);

  // ─── 8. Create Sample Attendance ───
  const dates = [
    new Date("2026-02-10"),
    new Date("2026-02-11"),
    new Date("2026-02-12"),
    new Date("2026-02-13"),
    new Date("2026-02-14"),
  ];

  for (const d of dates) {
    await prisma.attendance.createMany({
      data: [
        {
          studentId: student1.id,
          batchId: batch.id,
          date: d,
          status: "PRESENT",
          markedBy: teacher.id,
        },
        {
          studentId: student2.id,
          batchId: batch.id,
          date: d,
          status: "PRESENT",
          markedBy: teacher.id,
        },
      ],
      skipDuplicates: true,
    });
  }
  console.log(`✅ Sample Attendance records seeded (5 days)`);

  // ─── 8. Seed Study Materials ───
  await (prisma as any).studyMaterial.createMany({
    data: [
      {
        title: "Indian Constitution Articles 1 to 51A Hand-Written Notes",
        description: "Complete fundamental rights, directive principles and fundamental duties revision notes for PSI / GPSC.",
        category: "CLASS_NOTES",
        batchId: batch.id,
        subjectId: sub1.id,
        fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        uploadedBy: teacher.id,
      },
      {
        title: "Gujarat Police Sub-Inspector (PSI) 2021-2024 Solved Papers",
        description: "Official Gujarat Police Recruitment Board PYQs with detailed answer keys and explanations.",
        category: "PYQ_PAPER",
        batchId: batch.id,
        subjectId: null,
        fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        uploadedBy: admin.id,
      },
      {
        title: "Gujarati Grammar: Sandhi, Samas & Alankar Quick Reference",
        description: "Rulebook with 200+ solved practice examples for competitive language mains exams.",
        category: "REFERENCE_BOOK",
        batchId: batch.id,
        subjectId: sub2.id,
        fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        uploadedBy: teacher.id,
      },
    ],
    skipDuplicates: true,
  });
  console.log(`✅ Sample Study Materials seeded`);

  // ─── 9. Seed Fee Payments ───
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
        recordedBy: admin.id,
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
        remarks: "2nd Installment - Fees Fully Paid",
        recordedBy: admin.id,
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
        recordedBy: admin.id,
      },
    ],
    skipDuplicates: true,
  });
  console.log(`✅ Sample Fee Payments & Receipts seeded`);

  // ─── 10. Seed Notice Board Announcements ───
  await (prisma as any).notice.createMany({
    data: [
      {
        title: "⚡ Mock Physical Ground Fitness Drill & 5000m Running Test",
        content: "All PSI & Constable batch aspirants must report to the Physical Training Ground at 05:45 AM sharp this Saturday. Bring official academy physical tracking cards and sports shoes.",
        priority: "URGENT",
        audience: "ALL",
        batchId: batch.id,
        isPinned: true,
        publishedBy: admin.id,
      },
      {
        title: "📚 Monthly Full-Length Mock Test Schedule Announced",
        content: "The first 100-mark OMR physical offline examination for Indian Polity and Gujarati Grammar will be held on Sunday from 10:00 AM to 12:00 PM. Seating chart will be pasted on the notice board.",
        priority: "IMPORTANT",
        audience: "STUDENTS_ONLY",
        batchId: batch.id,
        isPinned: true,
        publishedBy: coordinator.id,
      },
      {
        title: "📢 Monthly Parent-Teacher Briefing Meeting",
        content: "Dear Parents, we invite you for the monthly offline progress review session on the 4th Sunday to discuss your ward's offline test marks, rankings, and physical readiness.",
        priority: "INFO",
        audience: "PARENTS_ONLY",
        batchId: null,
        isPinned: false,
        publishedBy: admin.id,
      },
    ],
    skipDuplicates: true,
  });
  console.log(`✅ Sample Notices & Alerts seeded`);

  // ─── 11. Seed Syllabus Topics & Progress ───
  const topic1 = await (prisma as any).syllabusTopic.create({
    data: {
      batchId: batch.id,
      subjectId: sub1.id,
      chapterName: "Part III: Fundamental Rights",
      topicName: "Articles 12-18: Right to Equality",
      createdBy: teacher.id,
    },
  });

  const topic2 = await (prisma as any).syllabusTopic.create({
    data: {
      batchId: batch.id,
      subjectId: sub1.id,
      chapterName: "Part III: Fundamental Rights",
      topicName: "Articles 19-22: Right to Freedom",
      createdBy: teacher.id,
    },
  });

  const topic3 = await (prisma as any).syllabusTopic.create({
    data: {
      batchId: batch.id,
      subjectId: sub2.id,
      chapterName: "Vyakaran: Sandhi",
      topicName: "Swar Sandhi & Vyanjan Sandhi",
      createdBy: teacher.id,
    },
  });

  // Seed progress for Student 1
  await (prisma as any).topicProgress.createMany({
    data: [
      {
        topicId: topic1.id,
        studentId: student1.id,
        status: "COMPLETED",
      },
      {
        topicId: topic2.id,
        studentId: student1.id,
        status: "IN_PROGRESS",
      },
      {
        topicId: topic3.id,
        studentId: student1.id,
        status: "COMPLETED",
      },
    ],
    skipDuplicates: true,
  });
  console.log(`✅ Sample Syllabus Topics & Progress seeded`);

  console.log("\n🎉 Seed complete! All test accounts use password: password123\n");
  console.log("Login credentials:");
  console.log("──────────────────────────────────────────");
  console.log("Admin:       admin@instituteops.com");
  console.log("Coordinator: coordinator@instituteops.com");
  console.log("Teacher:     teacher@instituteops.com");
  console.log("Student 1:   student1@instituteops.com");
  console.log("Student 2:   student2@instituteops.com");
  console.log("Parent:      parent@instituteops.com");
  console.log("Password:    password123 (for all accounts)");
  console.log("──────────────────────────────────────────");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
