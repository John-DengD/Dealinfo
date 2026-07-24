ALTER TYPE "MarketStatus" ADD VALUE 'CANCELED';

ALTER TABLE "Market"
  ADD COLUMN "resolutionNote" TEXT,
  ADD COLUMN "canceledAt" TIMESTAMP(3),
  ADD COLUMN "cancelReason" TEXT,
  ADD COLUMN "sourceUrl" TEXT,
  ADD COLUMN "sourceName" TEXT,
  ADD COLUMN "sourcePublishedAt" TIMESTAMP(3),
  ADD COLUMN "generatedBy" TEXT,
  ADD COLUMN "generationDate" TIMESTAMP(3);

CREATE UNIQUE INDEX "Market_sourceUrl_key" ON "Market"("sourceUrl");
CREATE INDEX "Market_generatedBy_generationDate_idx" ON "Market"("generatedBy", "generationDate");
CREATE INDEX "Market_status_closesAt_idx" ON "Market"("status", "closesAt");
