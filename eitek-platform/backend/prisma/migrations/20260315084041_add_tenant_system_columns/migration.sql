/*
  Warnings:

  - A unique constraint covering the columns `[name,parentId,tenantId]` on the table `image_categories` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name,tenantId]` on the table `symbols` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name,parentId,tenantId]` on the table `widget_categories` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name,tenantId]` on the table `widgets` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "image_categories_name_parentId_key";

-- DropIndex
DROP INDEX "symbols_name_key";

-- DropIndex
DROP INDEX "widget_categories_name_parentId_key";

-- DropIndex
DROP INDEX "widgets_name_key";

-- AlterTable
ALTER TABLE "files" ADD COLUMN     "isSystem" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tenantId" TEXT;

-- AlterTable
ALTER TABLE "image_categories" ADD COLUMN     "isSystem" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tenantId" TEXT;

-- AlterTable
ALTER TABLE "symbols" ADD COLUMN     "isSystem" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tenantId" TEXT;

-- AlterTable
ALTER TABLE "widget_categories" ADD COLUMN     "isSystem" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tenantId" TEXT;

-- AlterTable
ALTER TABLE "widgets" ADD COLUMN     "isSystem" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tenantId" TEXT;

-- CreateTable
CREATE TABLE "user_settings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "theme" TEXT NOT NULL DEFAULT 'light',
    "language" TEXT NOT NULL DEFAULT 'vi',
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
    "dateFormat" TEXT NOT NULL DEFAULT 'DD/MM/YYYY',
    "compactMode" BOOLEAN NOT NULL DEFAULT false,
    "showGridLines" BOOLEAN NOT NULL DEFAULT true,
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "deviceAlerts" BOOLEAN NOT NULL DEFAULT true,
    "systemUpdates" BOOLEAN NOT NULL DEFAULT true,
    "projectActivity" BOOLEAN NOT NULL DEFAULT true,
    "weeklyReports" BOOLEAN NOT NULL DEFAULT false,
    "defaultProjectId" TEXT,
    "dashboardLayout" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "category" TEXT NOT NULL,
    "label" TEXT,
    "description" TEXT,
    "isSecret" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_settings_userId_key" ON "user_settings"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_key_key" ON "system_settings"("key");

-- CreateIndex
CREATE INDEX "system_settings_category_idx" ON "system_settings"("category");

-- CreateIndex
CREATE INDEX "files_tenantId_idx" ON "files"("tenantId");

-- CreateIndex
CREATE INDEX "files_type_idx" ON "files"("type");

-- CreateIndex
CREATE INDEX "files_isSystem_idx" ON "files"("isSystem");

-- CreateIndex
CREATE INDEX "image_categories_tenantId_idx" ON "image_categories"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "image_categories_name_parentId_tenantId_key" ON "image_categories"("name", "parentId", "tenantId");

-- CreateIndex
CREATE INDEX "symbols_tenantId_idx" ON "symbols"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "symbols_name_tenantId_key" ON "symbols"("name", "tenantId");

-- CreateIndex
CREATE INDEX "widget_categories_tenantId_idx" ON "widget_categories"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "widget_categories_name_parentId_tenantId_key" ON "widget_categories"("name", "parentId", "tenantId");

-- CreateIndex
CREATE INDEX "widgets_tenantId_idx" ON "widgets"("tenantId");

-- CreateIndex
CREATE INDEX "widgets_isSystem_idx" ON "widgets"("isSystem");

-- CreateIndex
CREATE UNIQUE INDEX "widgets_name_tenantId_key" ON "widgets"("name", "tenantId");

-- AddForeignKey
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
