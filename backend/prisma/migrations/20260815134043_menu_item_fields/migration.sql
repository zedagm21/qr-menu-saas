-- AlterTable
ALTER TABLE "menu_item_translations" ADD COLUMN     "allergens" TEXT,
ADD COLUMN     "ingredients" TEXT;

-- AlterTable
ALTER TABLE "menu_items" ADD COLUMN     "isFeatured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isSpicy" BOOLEAN NOT NULL DEFAULT false;
