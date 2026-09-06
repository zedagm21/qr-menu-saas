-- AlterTable: add discountPrice if not exists
ALTER TABLE "menu_items" ADD COLUMN IF NOT EXISTS "discountPrice" DECIMAL(10,2);

-- AlterTable: update restaurant_themes darkMode default
ALTER TABLE "restaurant_themes" ALTER COLUMN "darkMode" SET DEFAULT 'AUTO';

-- AlterTable: update restaurants default name and allow nullable slug
ALTER TABLE "restaurants" ALTER COLUMN "name" SET DEFAULT '';
ALTER TABLE "restaurants" ALTER COLUMN "slug" DROP NOT NULL;

-- CreateTable: restaurant_slug_aliases
CREATE TABLE IF NOT EXISTS "restaurant_slug_aliases" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "oldSlug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "restaurant_slug_aliases_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: restaurant_slug_aliases
CREATE UNIQUE INDEX IF NOT EXISTS "restaurant_slug_aliases_oldSlug_key" ON "restaurant_slug_aliases"("oldSlug");
CREATE INDEX IF NOT EXISTS "restaurant_slug_aliases_oldSlug_idx" ON "restaurant_slug_aliases"("oldSlug");

-- CreateIndex: categories and menu_items performance indexes
CREATE INDEX IF NOT EXISTS "categories_restaurantId_isActive_displayOrder_idx" ON "categories"("restaurantId", "isActive", "displayOrder");
CREATE INDEX IF NOT EXISTS "menu_items_restaurantId_displayOrder_idx" ON "menu_items"("restaurantId", "displayOrder");
CREATE INDEX IF NOT EXISTS "menu_items_categoryId_displayOrder_idx" ON "menu_items"("categoryId", "displayOrder");
CREATE INDEX IF NOT EXISTS "menu_items_restaurantId_isAvailable_displayOrder_idx" ON "menu_items"("restaurantId", "isAvailable", "displayOrder");
CREATE INDEX IF NOT EXISTS "qr_codes_restaurantId_idx" ON "qr_codes"("restaurantId");

-- AddForeignKey: restaurant_slug_aliases -> restaurants
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'restaurant_slug_aliases_restaurantId_fkey') THEN
        ALTER TABLE "restaurant_slug_aliases" ADD CONSTRAINT "restaurant_slug_aliases_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
