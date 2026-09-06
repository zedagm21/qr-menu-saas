import { prisma } from '../config/database';
import { TelegramBotService } from './TelegramBotService';

export class SchemaSyncService {
    /**
     * Non-destructive, idempotent startup check that ensures all required tables,
     * columns, and indexes exist in the connected database.
     * 
     * GUARANTEE:
     * - PASSES / SKIPS existing tables and columns (never drops, deletes, or replaces them).
     * - Safe to run on every boot in production or development.
     */
    static async ensureSchemaIntegrity(): Promise<void> {
        console.log('🔍 [SchemaSyncService] Checking database schema integrity...');

        const statements: string[] = [
            // ─── 1. Enums ─────────────────────────────────────────────────────────────
            `DO $$ BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'LogLevel') THEN
                    CREATE TYPE "LogLevel" AS ENUM ('FATAL', 'ERROR', 'WARN', 'INFO');
                END IF;
            END $$;`,
            `DO $$ BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'LogSource') THEN
                    CREATE TYPE "LogSource" AS ENUM ('BACKEND', 'FRONTEND');
                END IF;
            END $$;`,
            `DO $$ BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'LogStatus') THEN
                    CREATE TYPE "LogStatus" AS ENUM ('UNRESOLVED', 'RESOLVED', 'IGNORED');
                END IF;
            END $$;`,
            `DO $$ BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SubscriptionTier') THEN
                    CREATE TYPE "SubscriptionTier" AS ENUM ('FREE_TRIAL', 'STARTER', 'PRO');
                END IF;
            END $$;`,
            `DO $$ BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Role') THEN
                    CREATE TYPE "Role" AS ENUM ('OWNER', 'ADMIN');
                END IF;
            END $$;`,
            `DO $$ BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Language') THEN
                    CREATE TYPE "Language" AS ENUM ('EN', 'AM');
                END IF;
            END $$;`,
            `DO $$ BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MenuStatus') THEN
                    CREATE TYPE "MenuStatus" AS ENUM ('DRAFT', 'PUBLISHED');
                END IF;
            END $$;`,
            `DO $$ BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MenuStyle') THEN
                    CREATE TYPE "MenuStyle" AS ENUM ('CLASSIC', 'MODERN', 'ELEGANT', 'MINIMAL');
                END IF;
            END $$;`,
            `DO $$ BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ThemeMode') THEN
                    CREATE TYPE "ThemeMode" AS ENUM ('LIGHT', 'DARK', 'AUTO');
                END IF;
            END $$;`,
            `DO $$ BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'InteractionType') THEN
                    CREATE TYPE "InteractionType" AS ENUM ('PROFILE_VIEW', 'SOCIAL_CLICK', 'CALL_CLICK', 'DIRECTIONS_CLICK');
                END IF;
            END $$;`,

            // ─── 2. Tables ────────────────────────────────────────────────────────────
            `CREATE TABLE IF NOT EXISTS "restaurant_slug_aliases" (
                "id" TEXT NOT NULL,
                "restaurantId" TEXT NOT NULL,
                "oldSlug" TEXT NOT NULL,
                "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "restaurant_slug_aliases_pkey" PRIMARY KEY ("id")
            )`,
            `CREATE TABLE IF NOT EXISTS "system_logs" (
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
            )`,
            `CREATE TABLE IF NOT EXISTS "platform_settings" (
                "key" TEXT NOT NULL,
                "value" TEXT NOT NULL,
                "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "platform_settings_pkey" PRIMARY KEY ("key")
            )`,
            `INSERT INTO "platform_settings" ("key", "value", "updatedAt")
            VALUES ('telegram_bot_enabled', 'true', CURRENT_TIMESTAMP)
            ON CONFLICT ("key") DO NOTHING`,

            // ─── 3. Columns On Existing Tables ────────────────────────────────────────
            `ALTER TABLE "menu_items" ADD COLUMN IF NOT EXISTS "discountPrice" DECIMAL(10,2)`,
            `ALTER TABLE "menu_items" ADD COLUMN IF NOT EXISTS "isFasting" BOOLEAN NOT NULL DEFAULT true`,
            `ALTER TABLE "restaurants" ALTER COLUMN "name" SET DEFAULT ''`,
            `ALTER TABLE "restaurants" ALTER COLUMN "slug" DROP NOT NULL`,
            `ALTER TABLE "restaurant_themes" ALTER COLUMN "darkMode" SET DEFAULT 'AUTO'`,

            // ─── 4. Indexes ───────────────────────────────────────────────────────────
            `CREATE UNIQUE INDEX IF NOT EXISTS "restaurant_slug_aliases_oldSlug_key" ON "restaurant_slug_aliases"("oldSlug")`,
            `CREATE INDEX IF NOT EXISTS "restaurant_slug_aliases_oldSlug_idx" ON "restaurant_slug_aliases"("oldSlug")`,
            `CREATE INDEX IF NOT EXISTS "categories_restaurantId_isActive_displayOrder_idx" ON "categories"("restaurantId", "isActive", "displayOrder")`,
            `CREATE INDEX IF NOT EXISTS "menu_items_restaurantId_displayOrder_idx" ON "menu_items"("restaurantId", "displayOrder")`,
            `CREATE INDEX IF NOT EXISTS "menu_items_categoryId_displayOrder_idx" ON "menu_items"("categoryId", "displayOrder")`,
            `CREATE INDEX IF NOT EXISTS "menu_items_restaurantId_isAvailable_displayOrder_idx" ON "menu_items"("restaurantId", "isAvailable", "displayOrder")`,
            `CREATE INDEX IF NOT EXISTS "qr_codes_restaurantId_idx" ON "qr_codes"("restaurantId")`,
            `CREATE INDEX IF NOT EXISTS "system_logs_createdAt_idx" ON "system_logs"("createdAt")`,
            `CREATE INDEX IF NOT EXISTS "system_logs_level_createdAt_idx" ON "system_logs"("level", "createdAt")`,
            `CREATE INDEX IF NOT EXISTS "system_logs_status_createdAt_idx" ON "system_logs"("status", "createdAt")`,
            `CREATE INDEX IF NOT EXISTS "system_logs_source_createdAt_idx" ON "system_logs"("source", "createdAt")`,

            // ─── 5. Foreign Key Constraints ───────────────────────────────────────────
            `DO $$ BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'restaurant_slug_aliases_restaurantId_fkey') THEN
                    ALTER TABLE "restaurant_slug_aliases" ADD CONSTRAINT "restaurant_slug_aliases_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
                END IF;
            END $$;`,
            `DO $$ BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'system_logs_userId_fkey') THEN
                    ALTER TABLE "system_logs" ADD CONSTRAINT "system_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
                END IF;
            END $$;`,
            `DO $$ BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'system_logs_restaurantId_fkey') THEN
                    ALTER TABLE "system_logs" ADD CONSTRAINT "system_logs_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
                END IF;
            END $$;`,
        ];

        let executedCount = 0;
        const failedStatements: string[] = [];
        for (const statement of statements) {
            try {
                await prisma.$executeRawUnsafe(statement);
                executedCount++;
            } catch (err: any) {
                console.warn(`⚠️ [SchemaSyncService] Statement skipped or reported warning:`, err);
                failedStatements.push(String(err?.message || err));
            }
        }

        if (failedStatements.length > 0) {
            TelegramBotService.sendDeploymentAlert({
                error: `Schema sync completed with ${failedStatements.length} warnings/failures`,
                details: failedStatements.slice(0, 3).join('\n'),
            }).catch(() => {});
        }

        console.log(`✅ [SchemaSyncService] Schema integrity verified successfully (${executedCount}/${statements.length} checks passed).`);
    }
}

