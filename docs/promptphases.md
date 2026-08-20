# Step-by-Step Vibe-Coding Implementation Guide

Follow these sequential prompts when building the application step-by-step with an AI coding assistant.

---

### Phase 1: Foundation, DB Setup & Auth Scaffold
```text
PROMPT 1.1:
Initialize a Next.js 15 App Router project with TypeScript, Tailwind CSS, Lucide-react, and Shadcn UI.
Set up Prisma/Drizzle with PostgreSQL using the database schema from TRD.md (Users, Batches, Subjects, OfflineTests, TestMarks, Attendance, ParentStudentLinks).
Create authentication using Supabase/Auth.js with support for 5 roles: ADMIN, COORDINATOR, TEACHER, STUDENT, PARENT.
Provide a role-based middleware to redirect users to their respective dashboard root:
- /admin
- /faculty
- /student
- /parent
Phase 2: Batch, Subject & Student Management (Admin)
Plaintext
PROMPT 2.1:
Build the Admin management views for:
1. Batches (Create batch, assign target exam like Constable/PSI, set date ranges).
2. Subjects (Add subjects tied to batches, assign a faculty member).
3. Students (Add student, assign to batch, set roll number, and link parent user accounts).
Include Shadcn DataTable with search, filter by batch, and CSV bulk student import modal.
Phase 3: Offline Test Scheduling & Bulk Mark Entry Grid
Plaintext
PROMPT 3.1:
Implement the Offline Test module for teachers & coordinators:
1. Create Test Form: Batch select, Subject select, Test Type (Unit/Mock), Total Marks, Passing Marks, Date, and Solution PDF attachment.
2. Rapid Mark Entry Grid (TanStack Table):
   - Displays all students enrolled in the batch.
   - Column 1: Roll No & Name.
   - Column 2: 'Absent' checkbox (disables marks input if checked).
   - Column 3: Marks Obtained input (auto-focus next row on 'Enter' keypress).
   - Column 4: Remarks (optional).
   - 'Save Draft' Server Action and 'Publish Marks' Server Action.
Plaintext
PROMPT 3.2:
Write the server-side ranking engine in `lib/rank-calculator.ts`.
When 'Publish Marks' is clicked:
1. Validate all entries are <= total_marks.
2. Calculate highest score, batch average, and assign standard competition ranks.
3. Update `calculated_rank` in the `test_marks` table and set `is_published = true`.
Phase 4: Student & Parent Performance Dashboards
Plaintext
PROMPT 4.1:
Build the Student Performance Dashboard:
1. Summary Stats: Latest Score, Class Rank (e.g., #3 out of 45), Batch Average, Subject Rank.
2. Recharts Line Chart: Score progression over time across all offline tests.
3. Test History Table: Test Date, Subject, Score / Total, Result (Pass/Fail), Class Rank, Download Solution PDF button.
Ensure students can only see their own marks and general class benchmarks (average/topper).
Plaintext
PROMPT 4.2:
Build the Parent View (`/parent/dashboard`):
1. Child Selector dropdown (if parent has multiple children).
2. Clean scorecard component showing current attendance % and latest 3 offline test results with teacher remarks.
3. Visual warning badge if attendance < 75% or if student failed the latest test.
Phase 5: Attendance Module & PDF Report Generation
Plaintext
PROMPT 5.1:
Implement the Daily Attendance Sheet for Faculty:
1. Date picker and batch selector.
2. Rapid multi-select for Present / Absent / Late. 'Mark All Present' quick button.
3. Server action to batch insert/update `attendance` records.
4. Monthly summary view with color-coded percentages.
Plaintext
PROMPT 5.2:
Create a printable/downloadable PDF Student Scorecard (`/api/export/report-card/[studentId]`):
Generate a clean, professional PDF containing:
- Institute Logo & Student Details.
- Complete offline test history table with ranks and batch averages.
- Overall attendance percentage and space for teacher signature.

---

### `Memory.md`

```markdown
# Project Memory & Context Persistence

## 1. Project Overview & Core Tenets
- **Project:** InstituteOps (Coaching Academy Management System).
- **Primary Focus:** Offline classroom test tracking, bulk mark entry, rank lists, and parent communication for police & competitive exams (PSI, Constable, GPSC)[cite: 1].
- **No Online Tests:** Never generate online quiz engines, question bank timers, or MCQ taker flows. Tests happen on paper at the coaching center.

---

## 2. Established Architectural Decisions
- **Framework:** Next.js 15 App Router with Server Actions for all mutations.
- **Styling:** Tailwind CSS + Shadcn UI components.
- **Database:** PostgreSQL with standard competition ranking logic.
- **Marks Security:** Students and parents can ONLY read their own `test_marks` records. They see aggregate figures (`batch_avg`, `topper_score`) via calculated query views, not raw peer rows.
- **State Management:** URL search params for table filtering/pagination; optimistic UI updates for mark input grid.

---

## 3. Active Progress & Roadmap Tracker
- [x] Core Idea & Requirements finalized (No online test engine).
- [ ] Database schema definition & migration scripts.
- [ ] Role-based auth & route protection middleware.
- [ ] Batch & Student CRUD module.
- [ ] Offline Test creation & rapid mark entry interface.
- [ ] Ranking calculation engine.
- [ ] Student & Parent score cards + progress charts.
- [ ] Attendance grid & monthly statistics.
- [ ] PDF Scorecard export generator.

---

## 4. Key Conventions & Rules
- All mark values are stored as `NUMERIC(5, 2)` to accommodate half-mark deductions (e.g. negative marking in competitive exams).
- Mark entries must validate that `marks_obtained <= total_marks`.
- All timestamps use UTC in database; converted to Indian Standard Time (`IST - Asia/Kolkata`) on the UI.
