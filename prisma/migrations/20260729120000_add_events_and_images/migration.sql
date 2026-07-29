-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" "MarketStatus" NOT NULL DEFAULT 'PENDING',
    "closesAt" TIMESTAMP(3) NOT NULL,
    "imageUrl" TEXT,
    "creatorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Market" ADD COLUMN "imageUrl" TEXT,
ADD COLUMN "eventId" TEXT,
ADD COLUMN "outcomeLabel" TEXT;

-- CreateIndex
CREATE INDEX "Event_status_closesAt_idx" ON "Event"("status", "closesAt");

-- CreateIndex
CREATE INDEX "Market_eventId_idx" ON "Market"("eventId");

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Market" ADD CONSTRAINT "Market_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;
