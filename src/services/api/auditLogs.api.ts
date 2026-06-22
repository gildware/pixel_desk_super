import { apiClient } from "./apiClient";
import { apiConfig } from "@/src/config/api.config";
import type {
  ListAuditLogsParams,
  ListAuditLogsResponse,
  AuditLogRow,
} from "@/src/types/auditLogs.types";

export async function listAuditLogs(
  params: ListAuditLogsParams = {},
): Promise<ListAuditLogsResponse> {
  const {
    page = 1,
    limit = 50,
    companyId,
    action,
    resourceType,
    outcome,
    userId,
    from,
    to,
  } = params;

  const searchParams = new URLSearchParams();
  searchParams.set("page", String(page));
  searchParams.set("limit", String(Math.min(limit, 100)));
  if (companyId?.trim()) searchParams.set("companyId", companyId.trim());
  if (action?.trim()) searchParams.set("action", action.trim());
  if (resourceType?.trim()) searchParams.set("resourceType", resourceType.trim());
  if (outcome) searchParams.set("outcome", outcome);
  if (userId?.trim()) searchParams.set("userId", userId.trim());
  if (from?.trim()) searchParams.set("from", from.trim());
  if (to?.trim()) searchParams.set("to", to.trim());

  const url = `${apiConfig.superAdmin.auditLogs}?${searchParams.toString()}`;
  const res = await apiClient.get<{
    data?: {
      items?: AuditLogRow[];
      total?: number;
      page?: number;
      limit?: number;
      totalPages?: number;
    };
  }>(url);

  const data = res?.data;
  const items = Array.isArray(data?.items) ? data.items : [];
  const total = typeof data?.total === "number" ? data.total : items.length;
  const totalPages =
    typeof data?.totalPages === "number"
      ? data.totalPages
      : Math.ceil(total / limit) || 1;

  return {
    items,
    total,
    page: typeof data?.page === "number" ? data.page : page,
    limit: typeof data?.limit === "number" ? data.limit : limit,
    totalPages,
  };
}
