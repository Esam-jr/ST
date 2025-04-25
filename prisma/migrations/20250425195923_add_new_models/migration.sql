/*
  Warnings:

  - You are about to drop the column `eventUrl` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `isPublic` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `campaignId` on the `Sponsorship` table. All the data in the column will be lost.
  - You are about to drop the column `sponsorshipType` on the `Sponsorship` table. All the data in the column will be lost.
  - You are about to drop the column `bio` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `company` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `website` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `SponsorCampaign` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SponsorProfile` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `type` to the `Event` table without a default value. This is not possible if the table is not empty.
  - Made the column `description` on table `Event` required. This step will fail if there are existing NULL values in that column.
  - Changed the type of `status` on the `Sponsorship` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('WORKSHOP', 'WEBINAR', 'DEADLINE', 'ANNOUNCEMENT', 'NETWORKING', 'OTHER');

-- DropForeignKey
ALTER TABLE "SponsorCampaign" DROP CONSTRAINT "SponsorCampaign_sponsorId_fkey";

-- DropForeignKey
ALTER TABLE "SponsorProfile" DROP CONSTRAINT "SponsorProfile_userId_fkey";

-- DropForeignKey
ALTER TABLE "Sponsorship" DROP CONSTRAINT "Sponsorship_campaignId_fkey";

-- AlterTable
ALTER TABLE "Event" DROP COLUMN "eventUrl",
DROP COLUMN "isPublic",
ADD COLUMN     "isVirtual" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "startupCallId" TEXT,
ADD COLUMN     "type" "EventType" NOT NULL,
ADD COLUMN     "virtualLink" TEXT,
ALTER COLUMN "description" SET NOT NULL;

-- AlterTable
ALTER TABLE "Sponsorship" DROP COLUMN "campaignId",
DROP COLUMN "sponsorshipType",
ALTER COLUMN "currency" DROP DEFAULT,
DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "bio",
DROP COLUMN "company",
DROP COLUMN "location",
DROP COLUMN "phone",
DROP COLUMN "title",
DROP COLUMN "website";

-- DropTable
DROP TABLE "SponsorCampaign";

-- DropTable
DROP TABLE "SponsorProfile";

-- DropEnum
DROP TYPE "CampaignStatus";

-- DropEnum
DROP TYPE "SponsorshipStatus";

-- CreateTable
CREATE TABLE "Advertisement" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "mediaUrl" TEXT,
    "platforms" TEXT[],
    "startupCallId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "publishedDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Advertisement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Budget" (
    "id" TEXT NOT NULL,
    "startupCallId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "fiscalYear" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Budget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BudgetCategory" (
    "id" TEXT NOT NULL,
    "budgetId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "allocatedAmount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BudgetCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "budgetId" TEXT NOT NULL,
    "categoryId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "receipt" TEXT,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SponsorshipOpportunity" (
    "id" TEXT NOT NULL,
    "startupCallId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "benefits" TEXT[],
    "minAmount" DOUBLE PRECISION NOT NULL,
    "maxAmount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SponsorshipOpportunity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SponsorshipApplication" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "sponsorId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "message" TEXT,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SponsorshipApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewCriteria" (
    "id" TEXT NOT NULL,
    "startupCallId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "minimumScore" DOUBLE PRECISION NOT NULL,
    "maximumScore" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReviewCriteria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CriteriaReview" (
    "id" TEXT NOT NULL,
    "criteriaId" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CriteriaReview_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_startupCallId_fkey" FOREIGN KEY ("startupCallId") REFERENCES "StartupCall"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Advertisement" ADD CONSTRAINT "Advertisement_startupCallId_fkey" FOREIGN KEY ("startupCallId") REFERENCES "StartupCall"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_startupCallId_fkey" FOREIGN KEY ("startupCallId") REFERENCES "StartupCall"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetCategory" ADD CONSTRAINT "BudgetCategory_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "Budget"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "Budget"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "BudgetCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SponsorshipOpportunity" ADD CONSTRAINT "SponsorshipOpportunity_startupCallId_fkey" FOREIGN KEY ("startupCallId") REFERENCES "StartupCall"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SponsorshipApplication" ADD CONSTRAINT "SponsorshipApplication_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "SponsorshipOpportunity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SponsorshipApplication" ADD CONSTRAINT "SponsorshipApplication_sponsorId_fkey" FOREIGN KEY ("sponsorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewCriteria" ADD CONSTRAINT "ReviewCriteria_startupCallId_fkey" FOREIGN KEY ("startupCallId") REFERENCES "StartupCall"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CriteriaReview" ADD CONSTRAINT "CriteriaReview_criteriaId_fkey" FOREIGN KEY ("criteriaId") REFERENCES "ReviewCriteria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CriteriaReview" ADD CONSTRAINT "CriteriaReview_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "ApplicationReview"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
