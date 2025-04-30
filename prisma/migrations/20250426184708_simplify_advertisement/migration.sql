-- Drop existing table
DROP TABLE IF EXISTS "Advertisement";

-- Create simplified table
CREATE TABLE "Advertisement" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "imageUrl" TEXT,
  "scheduledDate" TIMESTAMP(3) NOT NULL,
  "platforms" TEXT[] NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "bufferPostId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Advertisement_pkey" PRIMARY KEY ("id")
); 