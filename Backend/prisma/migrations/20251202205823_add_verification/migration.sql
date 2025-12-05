-- AlterTable
ALTER TABLE "User" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "verificationToken" TEXT;

-- CreateTable
CREATE TABLE "CoinPack" (
    "id" SERIAL NOT NULL,
    "amount" INTEGER NOT NULL,
    "price" TEXT NOT NULL,
    "pointsAwarded" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "CoinPack_pkey" PRIMARY KEY ("id")
);
