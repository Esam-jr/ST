/*
  Warnings:

  - You are about to drop the column `amount` on the `SponsorshipApplication` table. All the data in the column will be lost.
  - You are about to drop the column `contactPerson` on the `SponsorshipApplication` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `SponsorshipApplication` table. All the data in the column will be lost.
  - You are about to drop the column `message` on the `SponsorshipApplication` table. All the data in the column will be lost.
  - You are about to drop the column `otherType` on the `SponsorshipApplication` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `SponsorshipApplication` table. All the data in the column will be lost.
  - You are about to drop the column `sponsorName` on the `SponsorshipApplication` table. All the data in the column will be lost.
  - You are about to drop the column `sponsorshipType` on the `SponsorshipApplication` table. All the data in the column will be lost.
  - The `status` column on the `SponsorshipApplication` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `description` to the `SponsorshipApplication` table without a default value. This is not possible if the table is not empty.
  - Added the required column `legalName` to the `SponsorshipApplication` table without a default value. This is not possible if the table is not empty.
  - Added the required column `primaryContact` to the `SponsorshipApplication` table without a default value. This is not possible if the table is not empty.
  - Added the required column `proposedAmount` to the `SponsorshipApplication` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sponsorshipGoals` to the `SponsorshipApplication` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "SponsorshipApplicationStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'WITHDRAWN', 'COMPLETED');

-- CreateEnum
CREATE TYPE "SponsorType" AS ENUM ('COMPANY', 'INDIVIDUAL', 'NGO', 'FOUNDATION', 'OTHER');

-- AlterTable
ALTER TABLE "SponsorshipApplication" DROP COLUMN "amount",
DROP COLUMN "contactPerson",
DROP COLUMN "email",
DROP COLUMN "message",
DROP COLUMN "otherType",
DROP COLUMN "phone",
DROP COLUMN "sponsorName",
DROP COLUMN "sponsorshipType",
ADD COLUMN     "additionalRequests" TEXT,
ADD COLUMN     "alternateContact" JSONB,
ADD COLUMN     "annualBudget" TEXT,
ADD COLUMN     "description" TEXT NOT NULL,
ADD COLUMN     "foundedYear" INTEGER,
ADD COLUMN     "hasPreviousSponsorships" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "headquarters" TEXT,
ADD COLUMN     "internalNotes" TEXT,
ADD COLUMN     "legalName" TEXT NOT NULL,
ADD COLUMN     "organizationName" TEXT,
ADD COLUMN     "preferredPaymentSchedule" TEXT,
ADD COLUMN     "previousSponsorshipsDetails" TEXT,
ADD COLUMN     "primaryContact" JSONB NOT NULL,
ADD COLUMN     "proposedAmount" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "proposedEndDate" TIMESTAMP(3),
ADD COLUMN     "proposedStartDate" TIMESTAMP(3),
ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "reviewedById" TEXT,
ADD COLUMN     "size" TEXT,
ADD COLUMN     "sponsorType" "SponsorType" NOT NULL DEFAULT 'COMPANY',
ADD COLUMN     "sponsorshipGoals" TEXT NOT NULL,
ADD COLUMN     "taxStatus" TEXT,
ALTER COLUMN "currency" SET DEFAULT 'USD',
DROP COLUMN "status",
ADD COLUMN     "status" "SponsorshipApplicationStatus" NOT NULL DEFAULT 'PENDING';

-- CreateIndex
CREATE INDEX "SponsorshipApplication_status_idx" ON "SponsorshipApplication"("status");

-- CreateIndex
CREATE INDEX "SponsorshipApplication_opportunityId_idx" ON "SponsorshipApplication"("opportunityId");

-- CreateIndex
CREATE INDEX "SponsorshipApplication_sponsorId_idx" ON "SponsorshipApplication"("sponsorId");
