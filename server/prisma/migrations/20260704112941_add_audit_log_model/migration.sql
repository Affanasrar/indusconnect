-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('LOGIN', 'CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'CANCEL', 'ASSIGN', 'CHECK_IN', 'CHECK_OUT', 'EXPORT', 'FLAG', 'START_TRIP', 'END_TRIP', 'REPORT_ISSUE', 'SYSTEM');

-- CreateEnum
CREATE TYPE "AuditEntity" AS ENUM ('AUTH', 'USER', 'VEHICLE', 'DRIVER', 'ROUTE', 'SMART_STOP', 'SHUTTLE_BOOKING', 'TRAVEL_REQUEST', 'ROOM', 'ROOM_RESERVATION', 'EXPENSE_CLAIM', 'TRANSPORT_TRIP', 'REPORT', 'SYSTEM');

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "actorEmail" TEXT,
    "actorRole" TEXT,
    "action" "AuditAction" NOT NULL,
    "entity" "AuditEntity" NOT NULL,
    "entityId" TEXT,
    "method" TEXT,
    "path" TEXT,
    "statusCode" INTEGER,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "requestBody" JSONB,
    "responseMessage" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_entity_idx" ON "AuditLog"("entity");

-- CreateIndex
CREATE INDEX "AuditLog_entityId_idx" ON "AuditLog"("entityId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
