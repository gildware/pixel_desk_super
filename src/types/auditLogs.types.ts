export type AuditOutcome = "success" | "failure";

export interface AuditLogRow {
  id: string;
  companyId: string | null;
  companyName: string | null;
  userId: string | null;
  userEmail: string | null;
  action: string;
  resourceType: string;
  resourceId: string | null;
  outcome: AuditOutcome;
  statusCode: number;
  message: string | null;
  metadata: Record<string, unknown> | null;
  requestId: string | null;
  method: string;
  path: string;
  errorMessage: string | null;
  createdAt: string;
}

export interface ListAuditLogsParams {
  companyId?: string;
  action?: string;
  resourceType?: string;
  outcome?: AuditOutcome;
  userId?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export interface ListAuditLogsResponse {
  items: AuditLogRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
