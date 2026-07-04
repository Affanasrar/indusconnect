import { Request, Response } from "express";
import {
  getAllAuditLogs,
  getAuditLogById,
  getMyAuditLogs,
} from "./auditLog.service";

export async function getAllAuditLogsController(
  _req: Request,
  res: Response
) {
  try {
    const logs = await getAllAuditLogs();

    return res.status(200).json({
      success: true,
      message: "Audit logs fetched successfully",
      data: logs,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to fetch audit logs",
    });
  }
}

export async function getMyAuditLogsController(req: Request, res: Response) {
  try {
    const currentUser = (req as any).user;

    const logs = await getMyAuditLogs(currentUser.userId);

    return res.status(200).json({
      success: true,
      message: "My audit logs fetched successfully",
      data: logs,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch my audit logs",
    });
  }
}

export async function getAuditLogByIdController(req: Request, res: Response) {
  try {
    const log = await getAuditLogById(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Audit log fetched successfully",
      data: log,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error instanceof Error ? error.message : "Audit log not found",
    });
  }
}