-- CreateEnum
CREATE TYPE "SubscriptionTier" AS ENUM ('FREE_TRIAL', 'STARTER', 'PRO');

-- AlterTable
ALTER TABLE "restaurants" ADD COLUMN     "subscriptionExpiresAt" TIMESTAMP(3),
ADD COLUMN     "subscriptionTier" "SubscriptionTier" NOT NULL DEFAULT 'FREE_TRIAL';

-- CreateTable
CREATE TABLE "broadcast_announcements" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'info',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "broadcast_announcements_pkey" PRIMARY KEY ("id")
);
