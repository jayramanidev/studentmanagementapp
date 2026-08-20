# Product Requirements Document (PRD)

## 1. Executive Summary & Vision
**Product Name:** InstituteOps (Student & Offline Performance Management System)  
**Target Audience:** Coaching academies preparing students for competitive & state government exams (Police Constable, PSI, GPSC, UPSC, SSC, etc.)[cite: 1].  
**Core Purpose:** Centralize daily operations by replacing paper registers and WhatsApp groups with a unified portal for **offline test score entry**, **rank analytics**, **attendance tracking**, and **parent-student visibility**[cite: 1].

> **Important Scope Boundary:** The platform does NOT conduct or host online mock tests. All tests and mock exams are conducted physically (paper/OMR) at the coaching center. The system manages the lifecycle of offline test scheduling, rapid marks entry, rank/score computation, and performance distribution to students and parents.

---

## 2. User Personas & Roles

| Role | Description & Needs | Core Access Scope |
|---|---|---|
| **Admin / Director** | Institute owners managing centers, staff, revenue, and high-level pass rates[cite: 1]. | Full system access across all branches and cohorts. |
| **Exam Coordinator** | Staff responsible for scheduling physical tests, entering bulk marks, and publishing rank lists[cite: 1]. | Test creation, mark entry/editing, rank computation, report generation[cite: 1]. |
| **Teacher / Faculty** | Subject teachers logging daily attendance, uploading answer keys/notes, and adding test marks[cite: 1]. | Assigned class attendance, mark entry for their subjects, study material upload[cite: 1]. |
| **Student** | Aspirants tracking their preparation trajectory, viewing rank vs. peers, and downloading test solution keys[cite: 1]. | Personal attendance, personal test marks, class averages, rank history, materials[cite: 1]. |
| **Parent / Guardian** | Parents monitoring attendance regularity and test score progress to ensure accountability[cite: 1]. | Linked student(s) attendance, test marks, rank alerts, and teacher feedback[cite: 1]. |

---

## 3. Core Functional Requirements

### 3.1. Offline Test & Mark Logging System
- **Test Event Creation:** Admin/Teacher creates an offline test record specifying: Class/Batch, Subject, Test Date, Test Type (Weekly Unit Test, Full Mock, Surprise Test), Total Marks, and Passing Marks.
- **Answer Key Upload:** Ability to attach PDF solutions or answer keys to the test record for student reference.
- **Rapid Bulk Mark Entry:**
  - Spreadsheet-style editable data grid with keyboard navigation (`Enter`/`Tab` down student roll list).
  - Quick toggles for `Absent` vs `Present`.
  - Batch CSV / Excel score upload template.
- **Automated Score Calculations:** On publishing marks, the system computes:
  - Percentage & Pass/Fail status per student.
  - Batch Average, Highest Score, Lowest Score.
  - Dynamic Batch Rank (handling ties consistently).
- **Marks Publishing Control:** Draft mode vs. Published mode (marks are hidden until officially published by staff).

### 3.2. Performance Analytics & Dashboards
- **Student Dashboard:**
  - Latest test result overview with score, batch rank, class average, and topper's score.
  - Historical score trajectory line chart filterable by subject and date range.
  - Strengths & Weaknesses indicator based on average subject percentages.
- **Parent Dashboard:**
  - Simplified scorecard view highlighting attendance percentage and latest test performance.
  - Direct alert indicator for missed tests or scores below passing threshold.
- **Institute Analytics:**
  - Batch performance comparison and subject-wise score distribution.
  - List of students consistently ranking in the bottom 20% for intervention.

### 3.3. Attendance Management
- Daily or period-wise attendance marking (`Present`, `Absent`, `Late`, `Excused`)[cite: 1].
- Instant monthly attendance percentage calculator per student.
- Low-attendance triggers (flagging students below 75% attendance).

### 3.4. Notice Board & Resource Repository
- **Study Materials & Solution Keys:** Categorized PDF/document uploads by batch and subject[cite: 1].
- **Targeted Notices:** Broadcast notices targeted to specific batches, roles (all parents, specific class), or entire institute[cite: 1].

---

## 4. Non-Functional Requirements
- **Performance:** Bulk mark entry grid must support 100+ students per batch without UI lag (<100ms keypress response).
- **Mobile Responsiveness:** Student and Parent views must be 100% mobile-first and responsive.
- **Data Integrity & Security:** Role-Based Access Control (RBAC) ensuring parents/students can never view other students' raw private scores (only aggregate benchmarks like average/topper).
- **Audit Logging:** System logs who created tests and modified marks (timestamp and user ID)[cite: 1].

---

## 5. Out of Scope (Explicit Boundaries)
- In-app MCQ/Computer-based test engine or online quiz runner.
- Live video streaming or virtual classroom hosting.
- Biometric hardware driver integrations in Phase 1 (handled via manual/CSV attendance).