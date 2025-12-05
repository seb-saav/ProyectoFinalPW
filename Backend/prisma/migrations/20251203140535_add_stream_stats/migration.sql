-- AlterTable
ALTER TABLE "User" ADD COLUMN     "lastStreamStart" TIMESTAMP(3),
ADD COLUMN     "totalStreamHours" DOUBLE PRECISION NOT NULL DEFAULT 0.0;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_targetStreamerId_fkey" FOREIGN KEY ("targetStreamerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
