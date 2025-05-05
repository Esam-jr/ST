/*
  Warnings:

  - Added the required column `contactPerson` to the `SponsorshipApplication` table without a default value. This is not possible if the table is not empty.
  - Added the required column `email` to the `SponsorshipApplication` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sponsorName` to the `SponsorshipApplication` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sponsorshipType` to the `SponsorshipApplication` table without a default value. This is not possible if the table is not empty.

*/
-- First add the columns as nullable
ALTER TABLE "SponsorshipApplication" ADD COLUMN "sponsorName" TEXT;
ALTER TABLE "SponsorshipApplication" ADD COLUMN "contactPerson" TEXT;
ALTER TABLE "SponsorshipApplication" ADD COLUMN "email" TEXT;
ALTER TABLE "SponsorshipApplication" ADD COLUMN "phone" TEXT;
ALTER TABLE "SponsorshipApplication" ADD COLUMN "website" TEXT;
ALTER TABLE "SponsorshipApplication" ADD COLUMN "sponsorshipType" TEXT;
ALTER TABLE "SponsorshipApplication" ADD COLUMN "otherType" TEXT;

-- Update existing records with default values
UPDATE "SponsorshipApplication"
SET 
  "sponsorName" = 'Legacy Sponsor',
  "contactPerson" = 'Legacy Contact',
  "email" = 'legacy@example.com',
  "sponsorshipType" = 'FINANCIAL'
WHERE "sponsorName" IS NULL;

-- Make the required columns non-nullable
ALTER TABLE "SponsorshipApplication" ALTER COLUMN "sponsorName" SET NOT NULL;
ALTER TABLE "SponsorshipApplication" ALTER COLUMN "contactPerson" SET NOT NULL;
ALTER TABLE "SponsorshipApplication" ALTER COLUMN "email" SET NOT NULL;
ALTER TABLE "SponsorshipApplication" ALTER COLUMN "sponsorshipType" SET NOT NULL;
