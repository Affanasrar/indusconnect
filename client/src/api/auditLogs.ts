import { http } from "./http";
import type { ApiResponse } from "../types/frontend";
import type { AuditLog } from "../types/auditLog";

export async function getAllAuditLogs() {
  const response = await http.get<ApiResponse<AuditLog[]>>("/audit-logs");
  return response.data.data;
}

export async function getMyAuditLogs() {
  const response = await http.get<ApiResponse<AuditLog[]>>("/audit-logs/my");
  return response.data.data;
}

export async function getAuditLogById(id: string) {
  const response = await http.get<ApiResponse<AuditLog>>(`/audit-logs/${id}`);
  return response.data.data;
}
