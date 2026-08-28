-- AlterTable
ALTER TABLE "users" ADD COLUMN     "lastResetAttemptAt" TIMESTAMP(3),
ADD COLUMN     "resetPasswordAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "resetPasswordExpires" TIMESTAMP(3),
ADD COLUMN     "resetPasswordOtp" TEXT;
