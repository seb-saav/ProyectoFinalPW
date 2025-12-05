-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "targetStreamerId" TEXT,
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'COINS';
