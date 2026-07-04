import prisma from "../../config/prisma";

export async function getAllAuditLogs() {
  return prisma.auditLog.findMany({
    include: {
      actor: {
        select: {
          id: true,
          fullName: true,
          email: true,
          role: {
            select: {
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 200,
  });
}

export async function getMyAuditLogs(userId: string) {
  return prisma.auditLog.findMany({
    where: {
      actorId: userId,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 100,
  });
}

export async function getAuditLogById(id: string) {
  const log = await prisma.auditLog.findUnique({
    where: {
      id,
    },
    include: {
      actor: {
        select: {
          id: true,
          fullName: true,
          email: true,
          role: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  if (!log) {
    throw new Error("Audit log not found");
  }

  return log;
}