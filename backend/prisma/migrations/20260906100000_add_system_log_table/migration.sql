-- CreateEnum
CREATE TYPE "LogLevel" AS ENUM ('FATAL', 'ERROR', 'WARN', 'INFO');

-- CreateEnum
CREATE TYPE "LogSource" AS ENUM ('BACKEND', 'FRONTEND');

-- CreateEnum
CREATE TYPE "LogStatus" AS ENUM ('UNRESOLVED', 'RESOLVED', 'IGNORED');

-- CreateTable
CREATE TABLE "system_logs" (
    "id" TEXT NOT NULL,
    "level" "LogLevel" NOT NULL DEFAULT 'ERROR',
    "source" "LogSource" NOT NULL DEFAULT 'BACKEND',
    "status" "LogStatus" NOT NULL DEFAULT 'UNRESOLVED',
    "message" TEXT NOT NULL,
    "stack" TEXT,
    "statusCode" INTEGER,
    "path" TEXT,
    "method" TEXT,
    "endpoint" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "userId" TEXT,
    "restaurantId" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "system_logs_createdAt_idx" ON "system_logs"("createdAt");

-- CreateIndex
CREATE INDEX "system_logs_level_createdAt_idx" ON "system_logs"("level", "createdAt");

-- CreateIndex
CREATE INDEX "system_logs_status_createdAt_idx" ON "system_logs"("status", "createdAt");

-- CreateIndex
CREATE INDEX "system_logs_source_createdAt_idx" ON "system_logs"("source", "createdAt");

-- AddForeignKey
ALTER TABLE "system_logs" ADD CONSTRAINT "system_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_logs" ADD CONSTRAINT "system_logs_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE SET NULL ON UPDATE CASCADE;