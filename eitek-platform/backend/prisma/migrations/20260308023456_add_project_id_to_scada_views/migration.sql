-- DropForeignKey
ALTER TABLE "scada_views" DROP CONSTRAINT "scada_views_areaId_fkey";

-- DropIndex
DROP INDEX "scada_views_areaId_name_key";

-- AlterTable
ALTER TABLE "scada_views" ADD COLUMN     "projectId" TEXT,
ALTER COLUMN "areaId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "scada_views" ADD CONSTRAINT "scada_views_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "areas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scada_views" ADD CONSTRAINT "scada_views_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
