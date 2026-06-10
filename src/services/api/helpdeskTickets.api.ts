import { apiClient } from "./apiClient";
import { apiConfig } from "@/src/config/api.config";
import type {
  HelpdeskTicketRow,
  HelpdeskTicketStatus,
} from "@/src/types/helpdeskTickets.types";

function unwrap<T>(res: unknown): T {
  if (
    res &&
    typeof res === "object" &&
    "data" in res &&
    (res as { data?: T }).data !== undefined
  ) {
    return (res as { data: T }).data;
  }
  return res as T;
}

export async function listHelpdeskTickets(
  status?: HelpdeskTicketStatus,
): Promise<HelpdeskTicketRow[]> {
  const url = status
    ? `${apiConfig.superAdmin.helpdeskTickets}?status=${status}`
    : apiConfig.superAdmin.helpdeskTickets;
  const res = await apiClient.get<unknown>(url);
  return unwrap<HelpdeskTicketRow[]>(res);
}

export async function getHelpdeskTicket(
  id: string,
): Promise<HelpdeskTicketRow> {
  const res = await apiClient.get<unknown>(
    apiConfig.superAdmin.helpdeskTicket(id),
  );
  return unwrap<HelpdeskTicketRow>(res);
}

export async function replyHelpdeskTicket(
  id: string,
  message: string,
): Promise<HelpdeskTicketRow> {
  const res = await apiClient.post<unknown>(
    apiConfig.superAdmin.helpdeskTicketReply(id),
    { message },
  );
  return unwrap<HelpdeskTicketRow>(res);
}

export async function updateHelpdeskTicketStatus(
  id: string,
  status: HelpdeskTicketStatus,
): Promise<HelpdeskTicketRow> {
  const res = await apiClient.patch<unknown>(
    apiConfig.superAdmin.helpdeskTicket(id),
    { status },
  );
  return unwrap<HelpdeskTicketRow>(res);
}
