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
  await prisma.studentProfile.create({
    data: {
      userId: student1.id,
      batchId: batch.id,
      rollNumber: "PSI-2026-001",
      targetExam: "PSI",
    },
  });

  await prisma.studentProfile.create({
    data: {
      userId: student2.id,
      batchId: batch.id,
      rollNumber: "PSI-2026-002",
      targetExam: "PSI",
    },
  });
  console.log(`✅ Student profiles created and linked to batch`);

  // ─── 5. Create Parent-Student Link ───
  await prisma.parentStudentLink.create({
    data: {
      parentUserId: parent.id,
      studentUserId: student1.id,
      relationship: "Father",
    },
  });
  console.log(`✅ Parent-Student link: ${parent.fullName} → ${student1.fullName}`);

  // ─── 6. Create Subjects ───
  await prisma.subject.create({
    data: {
      batchId: batch.id,
      name: "Indian Polity",
      teacherId: teacher.id,
    },
  });

  await prisma.subject.create({
    data: {
      batchId: batch.id,
      name: "Gujarati Grammar",
      teacherId: teacher.id,
    },
  });
  console.log(`✅ Subjects: Indian Polity, Gujarati Grammar`);

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
