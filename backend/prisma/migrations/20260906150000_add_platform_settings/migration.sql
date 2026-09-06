-- CreateTable
CREATE TABLE IF NOT EXISTS "platform_settings" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_settings_pkey" PRIMARY KEY ("key")
);

-- Seed default telegram_bot_enabled setting
INSERT INTO "platform_settings" ("key", "value", "updatedAt")
VALUES ('telegram_bot_enabled', 'true', CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;
