-- AlterTable
ALTER TABLE "menu_items" DROP COLUMN "isSpicy",
ADD COLUMN     "isFasting" BOOLEAN NOT NULL DEFAULT true;
