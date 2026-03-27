"use client";

import { useCallback, useEffect, useState } from "react";
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/src/services/api/notification.api";
import type { SuperAdminNotification } from "@/src/types/notification.types";

const DEFAULT_LIMIT = 20;

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

export default function NotificationsPage() {
  const [items, setItems] = useState<SuperAdminNotification[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(DEFAULT_LIMIT);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const unreadCount = items.filter((item) => !item.isRead).length;

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await listNotifications({ page, limit });
      setItems(Array.isArray(response.items) ? response.items : []);
      setTotal(typeof response.total === "number" ? response.total : 0);
      setTotalPages(
        typeof response.totalPages === "number" ? response.totalPages : 1
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load notifications");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [page, limit]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const onMarkOneRead = async (notificationId: string) => {
    setUpdating(true);
    try {
      await markNotificationRead(notificationId);
      setItems((prev) =>
        prev.map((item) =>
          item.id === notificationId ? { ...item, isRead: true } : item
        )
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to mark notification as read"
      );
    } finally {
      setUpdating(false);
    }
  };

  const onMarkAllRead = async () => {
    setUpdating(true);
    try {
      await markAllNotificationsRead();
      setItems((prev) => prev.map((item) => ({ ...item, isRead: true })));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to mark all notifications"
      );
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Notifications
          </h3>
          <p className="text-theme-sm text-gray-500 dark:text-gray-400">
            {unreadCount} unread
          </p>
        </div>
        <button
          type="button"
          onClick={onMarkAllRead}
          disabled={updating || unreadCount === 0}
          className="rounded-lg border border-gray-200 px-3 py-2 text-theme-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
        >
          Mark all as read
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-error-200 bg-error-50 px-4 py-2 text-theme-sm text-error-700 dark:border-error-800 dark:bg-error-950 dark:text-error-400">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-theme-sm text-gray-500 dark:text-gray-400">
          Loading notifications...
        </p>
      ) : items.length === 0 ? (
        <p className="text-theme-sm text-gray-500 dark:text-gray-400">
          No notifications found.
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className={`rounded-xl border px-4 py-3 ${
                item.isRead
                  ? "border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/40"
                  : "border-brand-200 bg-brand-50/50 dark:border-brand-800 dark:bg-brand-500/10"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-theme-sm font-semibold text-gray-800 dark:text-white/90">
                    {item.title}
                  </p>
                  <p className="mt-0.5 text-theme-sm text-gray-700 dark:text-gray-300">
                    {item.message}
                  </p>
                  <p className="mt-1 text-theme-xs text-gray-500 dark:text-gray-500">
                    {formatDateTime(item.createdAt)}
                  </p>
                </div>
                {!item.isRead && (
                  <button
                    type="button"
                    disabled={updating}
                    onClick={() => onMarkOneRead(item.id)}
                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-theme-xs font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-60 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                  >
                    Mark read
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-5 flex items-center justify-between">
          <p className="text-theme-sm text-gray-500 dark:text-gray-400">
            Page {page} of {totalPages} ({total} total)
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-theme-sm disabled:opacity-50 dark:border-gray-700"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-theme-sm disabled:opacity-50 dark:border-gray-700"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
