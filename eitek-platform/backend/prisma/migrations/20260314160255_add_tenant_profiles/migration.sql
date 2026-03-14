-- AlterTable
ALTER TABLE "tenants" ADD COLUMN     "profileId" TEXT;

-- CreateTable
CREATE TABLE "tenant_profiles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "maxUsers" INTEGER NOT NULL DEFAULT 10,
    "maxDevices" INTEGER NOT NULL DEFAULT 100,
    "maxProjects" INTEGER NOT NULL DEFAULT 5,
    "maxDashboards" INTEGER NOT NULL DEFAULT 10,
    "maxApiCalls" INTEGER,
    "features" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenant_profiles_name_key" ON "tenant_profiles"("name");

-- AddForeignKey
ALTER TABLE "tenants" ADD CONSTRAINT "tenants_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "tenant_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
