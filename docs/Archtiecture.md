**Rank Computation Logic
When publishTestMarksAction(testId: string) is triggered:

Fetch all test_marks for the given test_id where is_absent = false.

Sort marks descending by marks_obtained.

Assign ranks using Standard Competition Ranking (1224 format) or Dense Ranking (1223 format).

Run a bulk update transaction updating calculated_rank for each record and set offline_tests.is_published = true.

Role-Based Access Rules (RBAC Engine)
TypeScript
// types/auth.ts
export type Role = 'ADMIN' | 'COORDINATOR' | 'TEACHER' | 'STUDENT' | 'PARENT';

export const permissions = {
  CAN_CREATE_TEST: ['ADMIN', 'COORDINATOR', 'TEACHER'],
  CAN_ENTER_MARKS: ['ADMIN', 'COORDINATOR', 'TEACHER'],
  CAN_PUBLISH_TEST: ['ADMIN', 'COORDINATOR'],
  CAN_VIEW_ALL_STUDENT_MARKS: ['ADMIN', 'COORDINATOR', 'TEACHER'],
  CAN_VIEW_OWN_MARKS: ['STUDENT', 'PARENT'],
};

---

### `Architecture.md`

```markdown
# System Architecture

## 1. High-Level Architecture Diagram

+-----------------------------------------------------------------------------------+
|                                Client Applications                                |
|                                                                                   |
|  +--------------------+   +---------------------+   +--------------------------+  |
|  | Admin / Coordinator|   |   Faculty Portal    |   |     Student / Parent     |  |
|  | (Desktop Dashboard)|   | (Attendance & Marks)|   | (Mobile-First Scorecard) |  |
|  +---------+----------+   +----------+----------+   +------------+-------------+  |
+------------|-------------------------|---------------------------|----------------+
|                         |                           |
+-------------------------v---------------------------+
|
+---------------v---------------+
|    Next.js 15 App Router      |
|  - Server Actions (Mutations) |
|  - React Server Components    |
|  - Route Handlers / API       |
+---------------+---------------+
|
+-------------------------------+-------------------------------+
|                               |                               |
+------v-------+              +--------v-------+              +--------v-------+
|  Auth Layer  |              | Business Logic |              | Object Storage |
| (JWT / RBAC) |              | - Rank Engine  |              | - PDF Keys     |
+--------------+              | - Stat Aggreg. |              | - Notes/Docs   |
+--------+-------+              +----------------+
|
+-------v-------+
|  PostgreSQL   |
| (Relational)  |
+---------------+


---

## 2. Offline Marks Ingestion & Publishing Pipeline

[ Teacher Conducts Offline Test on Paper/OMR ]
|
v
[ Teacher Opens Rapid Mark Entry Data-Grid (Web) ]
|
+-------------+-------------+
|                           |
(Manual Grid Entry)         (CSV Bulk Upload)
|                           |
+------------->+<-----------+
|
v
[ Server Action: Upsert Marks ]
- Stores draft mark records
- Validates against max_marks
|
v
[ Coordinator/Teacher: "Publish Marks" ]
|
v
[ Rank Engine Execution ]
- Calculates Batch Avg, High, Low
- Computes & writes individual ranks
- Marks 'is_published = true'
|
v
+----------------+----------------+
|                                 |
[ Invalidate Next.js ]         [ Trigger Alerts ]
[ Student Cache Tag  ]         [ In-App & SMS   ]


---

## 3. Directory Structure (Next.js 15 App Router)

├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── forgot-password/
│   ├── (dashboard)/
│   │   ├── admin/
│   │   │   ├── batches/
│   │   │   ├── teachers/
│   │   │   └── reports/
│   │   ├── faculty/
│   │   │   ├── attendance/
│   │   │   └── tests/
│   │   │       ├── [testId]/
│   │   │       │   └── mark-entry/       # TanStack Rapid Entry Grid
│   │   │       └── create/
│   │   ├── student/
│   │   │   ├── performance/              # Score trajectory & rank cards
│   │   │   ├── attendance/
│   │   │   └── materials/
│   │   └── parent/
│   │       └── dashboard/                # Simplified child view
│   ├── api/
│   │   └── export/report-card/[id]/route.ts
│   └── layout.tsx
├── components/
│   ├── ui/                               # Shadcn base components
│   ├── marks/
│   │   ├── mark-entry-grid.tsx           # Keyboard navigable table
│   │   ├── rank-badge.tsx
│   │   └── score-trend-chart.tsx
│   └── attendance/
│       └── attendance-sheet.tsx
├── lib/
│   ├── db/                               # Prisma / Drizzle client
│   ├── rank-calculator.ts                # Deterministic ranking utilities
│   └── auth/                             # Session & RBAC guards
└── actions/
├── tests.ts                          # createTest, publishMarks
├── marks.ts                          # saveBulkMarksAction
**└── attendance.ts                     # markBatchAttendanceAction