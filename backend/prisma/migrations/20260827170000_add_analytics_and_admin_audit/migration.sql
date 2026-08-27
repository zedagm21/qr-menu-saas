-- CreateEnum
CREATE TYPE "InteractionType" AS ENUM ('PROFILE_VIEW', 'SOCIAL_CLICK', 'CALL_CLICK', 'DIRECTIONS_CLICK');

-- AlterTable
ALTER TABLE "restaurants" ADD COLUMN "isSuspended" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "suspensionReason" TEXT;

-- CreateTable
CREATE TABLE "scan_events" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "qrCodeId" TEXT,
    "tableNumber" TEXT,
    "device" TEXT,
    "os" TEXT,
    "language" "Language",
    "ipHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scan_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_item_clicks" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "menuItemId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "menu_item_clicks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "search_query_logs" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "resultsCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "search_query_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile_interactions" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "type" "InteractionType" NOT NULL,
    "platform" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profile_interactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "restaurantId" TEXT,
    "action" TEXT NOT NULL,
    "details" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "scan_events_restaurantId_createdAt_idx" ON "scan_events"("restaurantId", "createdAt");

-- CreateIndex
CREATE INDEX "scan_events_restaurantId_qrCodeId_idx" ON "scan_events"("restaurantId", "qrCodeId");

-- CreateIndex
CREATE INDEX "menu_item_clicks_restaurantId_createdAt_idx" ON "menu_item_clicks"("restaurantId", "createdAt");

-- CreateIndex
CREATE INDEX "menu_item_clicks_menuItemId_createdAt_idx" ON "menu_item_clicks"("menuItemId", "createdAt");

-- CreateIndex
CREATE INDEX "search_query_logs_restaurantId_createdAt_idx" ON "search_query_logs"("restaurantId", "createdAt");

-- CreateIndex
CREATE INDEX "profile_interactions_restaurantId_createdAt_idx" ON "profile_interactions"("restaurantId", "createdAt");

-- CreateIndex
CREATE INDEX "profile_interactions_restaurantId_type_idx" ON "profile_interactions"("restaurantId", "type");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_restaurantId_createdAt_idx" ON "audit_logs"("restaurantId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_userId_createdAt_idx" ON "audit_logs"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "scan_events" ADD CONSTRAINT "scan_events_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scan_events" ADD CONSTRAINT "scan_events_qrCodeId_fkey" FOREIGN KEY ("qrCodeId") REFERENCES "qr_codes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_item_clicks" ADD CONSTRAINT "menu_item_clicks_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_item_clicks" ADD CONSTRAINT "menu_item_clicks_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "menu_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "search_query_logs" ADD CONSTRAINT "search_query_logs_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_interactions" ADD CONSTRAINT "profile_interactions_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
