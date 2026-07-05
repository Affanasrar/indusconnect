-- AlterEnum
ALTER TYPE "AuditEntity" ADD VALUE 'PROXY_BOOKING';

-- AlterTable
ALTER TABLE "ShuttleBooking" ADD COLUMN     "isProxyBooking" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "proxyCreatedById" TEXT,
ADD COLUMN     "proxyReason" TEXT;

-- AlterTable
ALTER TABLE "TravelRequest" ADD COLUMN     "isProxyRequest" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "proxyCreatedById" TEXT,
ADD COLUMN     "proxyReason" TEXT;

-- CreateIndex
CREATE INDEX "ShuttleBooking_proxyCreatedById_idx" ON "ShuttleBooking"("proxyCreatedById");

-- CreateIndex
CREATE INDEX "TravelRequest_proxyCreatedById_idx" ON "TravelRequest"("proxyCreatedById");

-- AddForeignKey
ALTER TABLE "ShuttleBooking" ADD CONSTRAINT "ShuttleBooking_proxyCreatedById_fkey" FOREIGN KEY ("proxyCreatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TravelRequest" ADD CONSTRAINT "TravelRequest_proxyCreatedById_fkey" FOREIGN KEY ("proxyCreatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
