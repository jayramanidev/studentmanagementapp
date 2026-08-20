# Development & AI Assistant Rules (`.cursorrules`)

## 1. Core Domain Constraints
- **NO ONLINE TEST RUNNER:** Do not write code for taking tests online, question banks with timers, or client-side quiz components. Tests are conducted offline on paper.
- Focus strictly on: Offline test scheduling, answer key uploads, rapid mark entry, rank calculation, attendance, and student/parent dashboards.

---

## 2. Code Quality & TypeScript Standards
- **Strict Typing:** No `any` types. All database entities, action payloads, and component props must have explicit interfaces or Zod schemas.
- **Server Actions:** Place all mutations in the `/actions` directory. Validate all inputs using `zod` before executing database queries.
- **Error Handling:** Return structured objects from server actions:
  ```typescript
  type ActionResponse<T> = 
    | { success: true; data: T }
    | { success: false; error: string };