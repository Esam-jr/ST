/*
  Warnings:

  - The values [OVERDUE] on the enum `ReviewStatus` will be removed. If these variants are still used in the database, this will fail.
  - Added the required column `createdById` to the `SponsorshipOpportunity` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ReviewStatus_new" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'REJECTED', 'WITHDRAWN');
ALTER TABLE "ApplicationReview" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "ApplicationReview" ALTER COLUMN "status" TYPE "ReviewStatus_new" USING ("status"::text::"ReviewStatus_new");
ALTER TYPE "ReviewStatus" RENAME TO "ReviewStatus_old";
ALTER TYPE "ReviewStatus_new" RENAME TO "ReviewStatus";
DROP TYPE "ReviewStatus_old";
ALTER TABLE "ApplicationReview" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterTable
ALTER TABLE "Advertisement" ALTER COLUMN "platforms" SET DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "SponsorshipOpportunity" ADD COLUMN     "createdById" TEXT NOT NULL,
ADD COLUMN     "deadline" TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "SponsorshipOpportunity" ADD CONSTRAINT "SponsorshipOpportunity_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
