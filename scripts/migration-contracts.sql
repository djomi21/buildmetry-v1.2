-- ═══════════════════════════════════════════════════════════
-- CONTRACTS MODULE MIGRATION
-- Append this to: scripts/migration-all.sql
-- Or run directly against your PostgreSQL database
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS "Contract" (
    "id"                SERIAL PRIMARY KEY,
    "projectId"         INTEGER NOT NULL REFERENCES "Project"("id") ON DELETE CASCADE,
    "linkedEstimateId"  INTEGER REFERENCES "Estimate"("id"),
    "parentContractId"  INTEGER REFERENCES "Contract"("id"),
    "title"             TEXT NOT NULL,
    "contractType"      TEXT NOT NULL DEFAULT 'Prime',
    "status"            TEXT NOT NULL DEFAULT 'Draft',
    "clientOrSubName"   TEXT NOT NULL DEFAULT '',
    "startDate"         TIMESTAMP,
    "endDate"           TIMESTAMP,
    "signatureStatus"   TEXT NOT NULL DEFAULT 'Unsigned',
    "discountPercent"   DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxRate"           DOUBLE PRECISION NOT NULL DEFAULT 0.065,
    "retentionPercent"  DOUBLE PRECISION NOT NULL DEFAULT 10,
    "paymentTerms"      TEXT NOT NULL DEFAULT 'Net 30',
    "scopeOfWork"       TEXT NOT NULL DEFAULT '',
    "exclusions"        TEXT NOT NULL DEFAULT '',
    "lineItems"         JSONB NOT NULL DEFAULT '[]',
    "milestones"        JSONB NOT NULL DEFAULT '[]',
    "createdAt"         TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt"         TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "Contract_projectId_idx" ON "Contract"("projectId");
CREATE INDEX IF NOT EXISTS "Contract_parentContractId_idx" ON "Contract"("parentContractId");
CREATE INDEX IF NOT EXISTS "Contract_status_idx" ON "Contract"("status");
