-- CreateTable
CREATE TABLE "restaurant_translations" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "language" "Language" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "address" TEXT,
    "city" TEXT,

    CONSTRAINT "restaurant_translations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "restaurant_translations_restaurantId_language_key" ON "restaurant_translations"("restaurantId", "language");

-- AddForeignKey
ALTER TABLE "restaurant_translations" ADD CONSTRAINT "restaurant_translations_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
