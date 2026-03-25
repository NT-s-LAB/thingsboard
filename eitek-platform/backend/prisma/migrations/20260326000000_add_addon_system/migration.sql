-- CreateEnum
CREATE TYPE "AddonType" AS ENUM ('QUOTA', 'FEATURE');

-- CreateEnum
CREATE TYPE "AddonResourceType" AS ENUM ('DEVICES', 'USERS', 'PROJECTS', 'DASHBOARDS', 'API_CALLS', 'STORAGE');

-- AlterTable (remove isDefault from tenants, was added then removed via db push)
ALTER TABLE "tenants" DROP COLUMN IF EXISTS "isDefault";

-- AlterTable
ALTER TABLE "tenant_profiles" ADD COLUMN IF NOT EXISTS "addonEligible" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE IF NOT EXISTS "addon_catalog" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "AddonType" NOT NULL,
    "resourceType" "AddonResourceType",
    "quantityPerUnit" INTEGER,
    "featureFlag" TEXT,
    "priceMonthly" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "addon_catalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "tenant_addons" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "addonId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_addons_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "addon_catalog_code_key" ON "addon_catalog"("code");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "tenant_addons_tenantId_addonId_key" ON "tenant_addons"("tenantId", "addonId");

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tenant_addons_tenantId_fkey') THEN
    ALTER TABLE "tenant_addons" ADD CONSTRAINT "tenant_addons_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tenant_addons_addonId_fkey') THEN
    ALTER TABLE "tenant_addons" ADD CONSTRAINT "tenant_addons_addonId_fkey" FOREIGN KEY ("addonId") REFERENCES "addon_catalog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
