-- AlterTable
ALTER TABLE "restaurants" ADD COLUMN     "paymentInfo" TEXT,
ADD COLUMN     "socialMedia" JSONB,
ADD COLUMN     "wifiName" TEXT,
ADD COLUMN     "wifiPassword" TEXT;
