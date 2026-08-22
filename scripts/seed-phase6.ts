import { PrismaClient, AlertChannel, AlertType, AlertStatus, Gender } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Phase 6: Alerts & Physical Fitness records...");

  // 1. Fetch Students & Batches
  const students = await db.studentProfile.findMany({
    include: { user: true, batch: true },
  });
  const admin = await db.user.findFirst({ where: { role: "ADMIN" } });
  const teacher = await db.user.findFirst({ where: { role: "TEACHER" } });

  if (students.length === 0 || !admin) {
    console.error("❌ Need students and admin to seed phase 6 data.");
    return;
  }

  // 2. Seed Physical Fitness Records
  console.log("🏃 Creating Physical Fitness records for PSI / Constable aspirants...");
  const physicalRecords = [
    {
      studentId: students[0].userId,
      batchId: students[0].batchId ?? "",
      testDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7), // 7 days ago
      gender: Gender.MALE,
      runningDistanceMeters: 5000,
      runningTimeSeconds: 1180, // 19:40 min (<20:00 min)
      runningMarks: 25.0,
      pullUpsCount: 10,
      longJumpMeters: 4.6,
      isQualified: true,
      remarks: "Outstanding pace. Managed sub-20 minute timing with strong stamina.",
      recordedBy: teacher?.id ?? admin.id,
    },
    {
      studentId: students[0].userId,
      batchId: students[0].batchId ?? "",
      testDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1), // Yesterday
      gender: Gender.MALE,
      runningDistanceMeters: 5000,
      runningTimeSeconds: 1165, // 19:25 min (PB)
      runningMarks: 25.0,
      pullUpsCount: 12,
      longJumpMeters: 4.8,
      isQualified: true,
      remarks: "Improved personal best by 15 seconds! Ground readiness is 100%.",
      recordedBy: teacher?.id ?? admin.id,
    },
  ];

  if (students.length > 1 && students[1].batchId) {
    physicalRecords.push({
      studentId: students[1].userId,
      batchId: students[1].batchId,
      testDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
      gender: Gender.MALE,
      runningDistanceMeters: 5000,
      runningTimeSeconds: 1340, // 22:20 min (19 Marks)
      runningMarks: 19.0,
      pullUpsCount: 7,
      longJumpMeters: 3.9,
      isQualified: true,
      remarks: "Qualified within cutoff. Need to increase stride frequency in final lap.",
      recordedBy: teacher?.id ?? admin.id,
    });
  }

  for (const pr of physicalRecords) {
    if (pr.batchId) {
      await db.physicalFitnessRecord.create({
        data: pr,
      });
    }
  }

  // 3. Seed Alert Notifications (WhatsApp & SMS)
  console.log("📱 Creating Parent SMS & WhatsApp notification log history...");
  const alertLogs = [
    {
      recipientPhone: "9876500001",
      recipientName: "Mr. Suresh Sharma",
      studentId: students[0].userId,
      batchId: students[0].batchId,
      message: `📢 *InstituteOps Exam Score Alert*\n\nDear Mr. Suresh Sharma,\nYour ward *${students[0].user.fullName}* (Roll: ${students[0].rollNumber}) scored *44.5 / 50* in Indian Polity Mock Test.\n🏆 State Rank: #1\nStatus: PASSED ✅`,
      channel: AlertChannel.WHATSAPP,
      alertType: AlertType.TEST_RESULT,
      status: AlertStatus.DELIVERED,
      sentBy: admin.id,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 36),
    },
    {
      recipientPhone: "9876500001",
      recipientName: "Mr. Suresh Sharma",
      studentId: students[0].userId,
      batchId: students[0].batchId,
      message: `🏃 *Ground Training Reminder*\nDear Mr. Suresh Sharma,\nTomorrow's 5000m physical fitness trial starts at 06:00 AM at the academy ground. Please ensure ${students[0].user.fullName} arrives on time.`,
      channel: AlertChannel.WHATSAPP,
      alertType: AlertType.CUSTOM_BROADCAST,
      status: AlertStatus.DELIVERED,
      sentBy: admin.id,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 18),
    },
  ];

  if (students.length > 1) {
    alertLogs.push({
      recipientPhone: "9876500002",
      recipientName: "Mrs. Meena Patel",
      studentId: students[1].userId,
      batchId: students[1].batchId,
      message: `⚠️ *Attendance Notice — InstituteOps*\n\nDear Mrs. Meena Patel,\n*${students[1].user.fullName}* was marked ABSENT yesterday for PSI Morning Batch. Regularity is required for prelims preparation.`,
      channel: AlertChannel.WHATSAPP,
      alertType: "ATTENDANCE_ABSENT" as any,
      status: AlertStatus.DELIVERED,
      sentBy: admin.id,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8),
    });
  }

  for (const al of alertLogs) {
    await db.alertNotification.create({
      data: al,
    });
  }

  console.log("✅ Phase 6 seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
