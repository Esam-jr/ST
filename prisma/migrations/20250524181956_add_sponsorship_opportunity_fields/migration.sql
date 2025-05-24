/*
  Warnings:

  - You are about to drop the column `source` on the `SponsorshipOpportunity` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "SponsorshipOpportunity" DROP COLUMN "source",
ADD COLUMN     "analytics" JSONB,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'USD',
ADD COLUMN     "tiers" JSONB,
ADD COLUMN     "visibility" TEXT NOT NULL DEFAULT 'PUBLIC';

-- CreateIndex
CREATE INDEX "SponsorshipOpportunity_visibility_idx" ON "SponsorshipOpportunity"("visibility");
