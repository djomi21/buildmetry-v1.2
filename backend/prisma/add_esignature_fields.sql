-- Migration: add_esignature_fields
-- Run this SQL against your PostgreSQL database to enable the e-signature workflow.

-- ── Contract table ──────────────────────────────────────────────────────────
ALTER TABLE "Contract" ADD COLUMN IF NOT EXISTS "signToken"       TEXT UNIQUE;
ALTER TABLE "Contract" ADD COLUMN IF NOT EXISTS "signTokenExpiry" TIMESTAMP(3);
ALTER TABLE "Contract" ADD COLUMN IF NOT EXISTS "signedAt"        TIMESTAMP(3);
ALTER TABLE "Contract" ADD COLUMN IF NOT EXISTS "signedByName"    TEXT;
ALTER TABLE "Contract" ADD COLUMN IF NOT EXISTS "signedByIp"      TEXT;
ALTER TABLE "Contract" ADD COLUMN IF NOT EXISTS "signatureImage"  TEXT;

-- ── Estimate table ──────────────────────────────────────────────────────────
ALTER TABLE "Estimate" ADD COLUMN IF NOT EXISTS "signToken"       TEXT UNIQUE;
ALTER TABLE "Estimate" ADD COLUMN IF NOT EXISTS "signTokenExpiry" TIMESTAMP(3);
ALTER TABLE "Estimate" ADD COLUMN IF NOT EXISTS "signedAt"        TIMESTAMP(3);
ALTER TABLE "Estimate" ADD COLUMN IF NOT EXISTS "signedByName"    TEXT;
ALTER TABLE "Estimate" ADD COLUMN IF NOT EXISTS "signedByIp"      TEXT;
ALTER TABLE "Estimate" ADD COLUMN IF NOT EXISTS "signatureImage"  TEXT;
