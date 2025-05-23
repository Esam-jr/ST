/*
  Warnings:

  - You are about to drop the column `currency` on the `Budget` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Budget` table. All the data in the column will be lost.
  - You are about to drop the column `fiscalYear` on the `Budget` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Budget` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `Budget` table. All the data in the column will be lost.
  - You are about to drop the column `currency` on the `Expense` table. All the data in the column will be lost.
  - You are about to drop the column `completedDate` on the `Milestone` table. All the data in the column will be lost.
  - You are about to drop the column `currency` on the `SponsorshipOpportunity` table. All the data in the column will be lost.
  - You are about to drop the `BudgetCategory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Task` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[startupId]` on the table `Budget` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `SponsorshipOpportunity` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `endDate` to the `Budget` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startDate` to the `Budget` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startupId` to the `Budget` table without a default value. This is not possible if the table is not empty.
  - Added the required column `milestoneId` to the `Expense` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startupId` to the `Expense` table without a default value. This is not possible if the table is not empty.
  - Made the column `categoryId` on table `Expense` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `slug` to the `SponsorshipOpportunity` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Budget" DROP CONSTRAINT "Budget_startupCallId_fkey";

-- DropForeignKey
ALTER TABLE "BudgetCategory" DROP CONSTRAINT "BudgetCategory_budgetId_fkey";

-- DropForeignKey
ALTER TABLE "Expense" DROP CONSTRAINT "Expense_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_assigneeId_fkey";

-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_creatorId_fkey";

-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_milestoneId_fkey";

-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_startupId_fkey";

-- AlterTable
ALTER TABLE "Budget" DROP COLUMN "currency",
DROP COLUMN "description",
DROP COLUMN "fiscalYear",
DROP COLUMN "status",
DROP COLUMN "title",
ADD COLUMN     "endDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "startDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "startupId" TEXT NOT NULL,
ALTER COLUMN "startupCallId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Expense" DROP COLUMN "currency",
ADD COLUMN     "milestoneId" TEXT NOT NULL,
ADD COLUMN     "startupId" TEXT NOT NULL,
ALTER COLUMN "categoryId" SET NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "Milestone" DROP COLUMN "completedDate";

-- AlterTable
ALTER TABLE "SponsorshipOpportunity" DROP COLUMN "currency",
ADD COLUMN     "coverImage" TEXT,
ADD COLUMN     "eligibility" TEXT,
ADD COLUMN     "industryFocus" TEXT,
ADD COLUMN     "shareCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "slug" TEXT NOT NULL,
ADD COLUMN     "source" TEXT,
ADD COLUMN     "tags" TEXT[],
ADD COLUMN     "viewsCount" INTEGER NOT NULL DEFAULT 0;

-- DropTable
DROP TABLE "BudgetCategory";

-- DropTable
DROP TABLE "Task";

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "allocatedAmount" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "budgetId" TEXT NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Budget_startupId_key" ON "Budget"("startupId");

-- CreateIndex
CREATE INDEX "Budget_startupCallId_idx" ON "Budget"("startupCallId");

-- CreateIndex
CREATE INDEX "Expense_startupId_idx" ON "Expense"("startupId");

-- CreateIndex
CREATE INDEX "Expense_categoryId_idx" ON "Expense"("categoryId");

-- CreateIndex
CREATE INDEX "Expense_milestoneId_idx" ON "Expense"("milestoneId");

-- CreateIndex
CREATE INDEX "Expense_userId_idx" ON "Expense"("userId");

-- CreateIndex
CREATE INDEX "Expense_budgetId_idx" ON "Expense"("budgetId");

-- CreateIndex
CREATE UNIQUE INDEX "SponsorshipOpportunity_slug_key" ON "SponsorshipOpportunity"("slug");

-- CreateIndex
CREATE INDEX "SponsorshipOpportunity_status_idx" ON "SponsorshipOpportunity"("status");

-- CreateIndex
CREATE INDEX "SponsorshipOpportunity_industryFocus_idx" ON "SponsorshipOpportunity"("industryFocus");

-- CreateIndex
CREATE INDEX "SponsorshipOpportunity_createdAt_idx" ON "SponsorshipOpportunity"("createdAt");

-- CreateIndex
CREATE INDEX "SponsorshipOpportunity_viewsCount_idx" ON "SponsorshipOpportunity"("viewsCount");

-- CreateIndex
CREATE INDEX "SponsorshipOpportunity_shareCount_idx" ON "SponsorshipOpportunity"("shareCount");

-- AddForeignKey
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_startupId_fkey" FOREIGN KEY ("startupId") REFERENCES "Startup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_startupCallId_fkey" FOREIGN KEY ("startupCallId") REFERENCES "StartupCall"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "Budget"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_startupId_fkey" FOREIGN KEY ("startupId") REFERENCES "Startup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "Milestone"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
