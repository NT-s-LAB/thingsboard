-- AlterTable
ALTER TABLE "files" ADD COLUMN     "imageCategoryId" TEXT;

-- CreateTable
CREATE TABLE "image_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "image_categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "image_categories_name_parentId_key" ON "image_categories"("name", "parentId");

-- AddForeignKey
ALTER TABLE "image_categories" ADD CONSTRAINT "image_categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "image_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "files" ADD CONSTRAINT "files_imageCategoryId_fkey" FOREIGN KEY ("imageCategoryId") REFERENCES "image_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
