-- ════════════════════════════════════════════════════════════
-- BuildMetry v1.0 — Complete Database Migration
-- Run ALL of these in Supabase SQL Editor (in order)
-- ════════════════════════════════════════════════════════════

-- 1. Deposit fields on Estimates
ALTER TABLE "Estimate" ADD COLUMN IF NOT EXISTS "depositType" TEXT NOT NULL DEFAULT 'none';
ALTER TABLE "Estimate" ADD COLUMN IF NOT EXISTS "depositValue" FLOAT NOT NULL DEFAULT 0;

-- 2. Deposit fields on Invoices
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "depositType" TEXT NOT NULL DEFAULT 'none';
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "depositValue" FLOAT NOT NULL DEFAULT 0;

-- 3. Employee fields on Subcontractors (now "Crew")
ALTER TABLE "Subcontractor" ADD COLUMN IF NOT EXISTS "employeeType" TEXT NOT NULL DEFAULT '1099';
ALTER TABLE "Subcontractor" ADD COLUMN IF NOT EXISTS "hireDate" TEXT;
ALTER TABLE "Subcontractor" ADD COLUMN IF NOT EXISTS "emergencyContact" TEXT;
ALTER TABLE "Subcontractor" ADD COLUMN IF NOT EXISTS "certifications" TEXT;

-- 4. Task table
CREATE TABLE IF NOT EXISTS "Task" (
  "id" TEXT PRIMARY KEY,
  "companyId" INTEGER NOT NULL REFERENCES "Company"("id") ON DELETE CASCADE,
  "projId" TEXT NOT NULL,
  "phase" TEXT,
  "title" TEXT NOT NULL,
  "assignedTo" INTEGER,
  "status" TEXT NOT NULL DEFAULT 'todo',
  "dueDate" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "Task_companyId_idx" ON "Task"("companyId");
CREATE INDEX IF NOT EXISTS "Task_projId_idx" ON "Task"("projId");

-- 5. ProjectPhase table
CREATE TABLE IF NOT EXISTS "ProjectPhase" (
  "id" SERIAL PRIMARY KEY,
  "companyId" INTEGER NOT NULL REFERENCES "Company"("id") ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("companyId", "name")
);
CREATE INDEX IF NOT EXISTS "ProjectPhase_companyId_idx" ON "ProjectPhase"("companyId");

-- 6. Seed project phases
DELETE FROM "ProjectPhase" WHERE "companyId" = 1;
INSERT INTO "ProjectPhase" ("companyId", "name", "sortOrder") VALUES
  (1, 'Planning', 0),
  (1, 'Design', 1),
  (1, 'Permitting', 2),
  (1, 'Demolition', 3),
  (1, 'Site Prep', 4),
  (1, 'Rough-In', 5),
  (1, 'Installations', 6),
  (1, 'Finishes', 7),
  (1, 'Closeout & Punch List', 8),
  (1, 'Completed', 9)
ON CONFLICT DO NOTHING;

-- 7. Management roles (if not already added)
INSERT INTO "LaborRole" ("companyId", "title", "baseRate", "payrollPct", "benefitsPct", "createdAt", "updatedAt")
VALUES
  (1, 'Project Manager', 52, 15.3, 16.0, NOW(), NOW()),
  (1, 'Office Manager', 28, 15.3, 14.0, NOW(), NOW()),
  (1, 'Estimator', 42, 15.3, 15.0, NOW(), NOW()),
  (1, 'Bookkeeper', 25, 15.3, 13.0, NOW(), NOW()),
  (1, 'Accounts Payable', 23, 15.3, 12.5, NOW(), NOW()),
  (1, 'Accounts Receivable', 23, 15.3, 12.5, NOW(), NOW()),
  (1, 'Receptionist', 18, 15.3, 10.0, NOW(), NOW()),
  (1, 'HR Coordinator', 30, 15.3, 14.5, NOW(), NOW()),
  (1, 'Safety Officer', 38, 15.3, 15.0, NOW(), NOW()),
  (1, 'Quality Control Inspector', 36, 15.3, 14.0, NOW(), NOW()),
  (1, 'Dispatcher', 22, 15.3, 12.0, NOW(), NOW()),
  (1, 'Warehouse Manager', 26, 15.3, 13.0, NOW(), NOW()),
  (1, 'Purchasing Agent', 28, 15.3, 13.5, NOW(), NOW()),
  (1, 'Marketing Coordinator', 26, 15.3, 13.0, NOW(), NOW()),
  (1, 'Business Development', 45, 15.3, 15.0, NOW(), NOW()),
  (1, 'Controller / CFO', 65, 15.3, 18.0, NOW(), NOW()),
  (1, 'Operations Manager', 50, 15.3, 16.0, NOW(), NOW()),
  (1, 'Field Supervisor', 42, 15.3, 15.0, NOW(), NOW()),
  (1, 'Permit Coordinator', 28, 15.3, 13.0, NOW(), NOW()),
  (1, 'IT / Tech Support', 30, 15.3, 13.5, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════
-- DONE — All migrations applied
-- ════════════════════════════════════════════════════════════
