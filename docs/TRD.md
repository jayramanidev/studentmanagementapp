# Technical Requirements Document (TRD)

## 1. Technology Stack

| Layer | Technology Choice | Rationale |
|---|---|---|
| **Framework** | Next.js 15 (App Router, Server Actions) | Fullstack capabilities, SSR for SEO/fast loading, zero-API boilerplate via Server Actions. |
| **Language** | TypeScript 5.x (Strict Mode) | End-to-end type safety across database schemas, server actions, and UI components. |
| **Styling & UI** | Tailwind CSS + Shadcn UI (Radix Primitives) | Accessible, copy-paste headless UI components with fast custom styling. |
| **Data Grid** | TanStack Table v8 | High-performance headless table handling keyboard-friendly bulk mark entries. |
| **Database** | PostgreSQL (hosted via Supabase or Neon) | ACID compliance, strong relational integrity for scores, ranks, and users. |
| **ORM** | Prisma ORM or Drizzle ORM | Type-safe query building and automated migrations. |
| **Authentication** | Supabase Auth or NextAuth.js / Auth.js (JWT/Session) | Secure RBAC with session tokens and role metadata. |
| **Charts** | Recharts / Tremor | Lightweight SVG/Canvas charting for score trajectories and batch averages. |
| **File Storage** | Supabase Storage / AWS S3 / Cloudflare R2 | Secure bucket storage for test answer keys, PDFs, and notes. |

---

## 2. Database Schema (PostgreSQL DDL Reference)

```sql
-- 1. ENUMS
CREATE TYPE user_role AS ENUM ('ADMIN', 'COORDINATOR', 'TEACHER', 'STUDENT', 'PARENT');
CREATE TYPE attendance_status AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'EXCUSED');
CREATE TYPE test_type AS ENUM ('WEEKLY_UNIT', 'MONTHLY_MOCK', 'SURPRISE_QUIZ', 'FULL_LENGTH');

-- 2. CORE USERS & PROFILES
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role user_role NOT NULL DEFAULT 'STUDENT',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL, -- e.g., 'PSI 2026 Morning Batch'
    target_exam VARCHAR(50) NOT NULL, -- e.g., 'PSI', 'Constable', 'GPSC'
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE student_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    batch_id UUID REFERENCES batches(id) ON DELETE SET NULL,
    roll_number VARCHAR(50) NOT NULL,
    target_exam VARCHAR(50),
    admission_date DATE DEFAULT CURRENT_DATE
);

CREATE TABLE parent_student_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    student_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    relationship VARCHAR(50) DEFAULT 'Guardian',
    UNIQUE (parent_user_id, student_user_id)
);

-- 3. ACADEMICS & OFFLINE TESTS
CREATE TABLE subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID REFERENCES batches(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL, -- e.g., 'Indian Polity', 'Gujarati Grammar'
    teacher_id UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE offline_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID REFERENCES batches(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    type test_type NOT NULL DEFAULT 'WEEKLY_UNIT',
    total_marks NUMERIC(5, 2) NOT NULL,
    passing_marks NUMERIC(5, 2) NOT NULL,
    test_date DATE NOT NULL,
    solution_pdf_url TEXT,
    is_published BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE test_marks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id UUID REFERENCES offline_tests(id) ON DELETE CASCADE,
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    marks_obtained NUMERIC(5, 2),
    is_absent BOOLEAN DEFAULT FALSE,
    calculated_rank INT,
    remarks TEXT,
    entered_by UUID REFERENCES users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (test_id, student_id)
);

-- 4. ATTENDANCE
CREATE TABLE attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID REFERENCES batches(id) ON DELETE CASCADE,
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status attendance_status NOT NULL DEFAULT 'PRESENT',
    marked_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (batch_id, student_id, date)
);