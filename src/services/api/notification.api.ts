import { apiClient } from "./apiClient";
import { apiConfig } from "@/src/config/api.config";
import type { ListNotificationsResponse, SuperAdminNotification } from "@/src/types/notification.types";

export interface ListNotificationsParams {
  page?: number;
  limit?: number;
}

export async function listNotifications(
  params: ListNotificationsParams = {}
): Promise<ListNotificationsResponse> {
  const { page = 1, limit = 20 } = params;
  const searchParams = new URLSearchParams();
  searchParams.set("page", String(page));
  searchParams.set("limit", String(Math.min(limit, 100)));
  const url = `${apiConfig.superAdmin.notifications}?${searchParams.toString()}`;
  const res = await apiClient.get<{
    data?: ListNotificationsResponse;
  }>(url);
  return (
    res?.data ?? {
      items: [],
      total: 0,
      page,
      limit,
      totalPages: 1,
    }
  );
}

export async function getUnreadNotificationsCount(): Promise<number> {
  const res = await apiClient.get<{ data?: { unread?: number } }>(
    apiConfig.superAdmin.notificationsUnreadCount
  );
  return typeof res?.data?.unread === "number" ? res.data.unread : 0;
}

export async function markNotificationRead(
  notificationId: string
): Promise<SuperAdminNotification> {
  const res = await apiClient.patch<{ data?: SuperAdminNotification }>(
    apiConfig.superAdmin.notificationRead(notificationId),
    {}
  );
  if (res?.data) return res.data;
  throw new Error("Failed to mark notification as read");
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiClient.post(apiConfig.superAdmin.notificationsMarkAllRead, {});
}
