/*
  Warnings:

  - A unique constraint covering the columns `[name,parentId]` on the table `widget_categories` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "widget_categories_name_key";

-- AlterTable
ALTER TABLE "widget_categories" ADD COLUMN     "parentId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "widget_categories_name_parentId_key" ON "widget_categories"("name", "parentId");

-- AddForeignKey
ALTER TABLE "widget_categories" ADD CONSTRAINT "widget_categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "widget_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
