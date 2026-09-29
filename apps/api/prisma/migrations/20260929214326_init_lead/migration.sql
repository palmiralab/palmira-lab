-- CreateEnum
CREATE TYPE "service_type" AS ENUM ('telegram_automation', 'website_landing', 'content_automation', 'ai_consultation', 'manual_review');

-- CreateEnum
CREATE TYPE "lead_status" AS ENUM ('new', 'contacted', 'qualified', 'proposal', 'won', 'lost', 'manual_review');

-- CreateTable
CREATE TABLE "lead" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "contact" TEXT NOT NULL,
    "name" TEXT,
    "service_type" "service_type" NOT NULL,
    "budget_hint" TEXT,
    "deadline_hint" TEXT,
    "status" "lead_status" NOT NULL DEFAULT 'new',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "lead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "lead_status_created_at_idx" ON "lead"("status", "created_at" DESC);
