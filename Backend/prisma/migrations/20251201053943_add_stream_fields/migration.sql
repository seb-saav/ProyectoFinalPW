-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isLive" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "streamCategory" TEXT,
ADD COLUMN     "streamTitle" TEXT,
ALTER COLUMN "goodbyeMessage" SET DEFAULT '¡Gracias por haber sido parte de la comunidad!';
