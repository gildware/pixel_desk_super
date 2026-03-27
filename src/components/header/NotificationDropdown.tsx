"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Dropdown } from "@/src/components/ui/dropdown/Dropdown";
import Link from "next/link";
import {
  getUnreadNotificationsCount,
  listNotifications,
  markNotificationRead,
} from "@/src/services/api/notification.api";
import type { SuperAdminNotification } from "@/src/types/notification.types";

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<SuperAdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  async function loadUnreadCount() {
    try {
      const count = await getUnreadNotificationsCount();
      setUnreadCount(count);
    } catch {
      setUnreadCount(0);
    }
  }

  async function loadLatestNotifications() {
    setLoading(true);
    try {
      const result = await listNotifications({ page: 1, limit: 6 });
      setItems(Array.isArray(result.items) ? result.items : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUnreadCount();
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    loadLatestNotifications();
    loadUnreadCount();
  }, [isOpen]);

  const hasUnread = unreadCount > 0;

  function closeDropdown() {
    setIsOpen(false);
  }

  const handleClick = async () => {
    setIsOpen((prev) => !prev);
  };

  const unreadBadgeText = useMemo(() => {
    if (unreadCount <= 0) return "";
    if (unreadCount > 99) return "99+";
    return String(unreadCount);
  }, [unreadCount]);

  const onNotificationClick = async (item: SuperAdminNotification) => {
    if (item.isRead) return;
    try {
      await markNotificationRead(item.id);
      setItems((prev) =>
        prev.map((it) => (it.id === item.id ? { ...it, isRead: true } : it))
      );
      setUnreadCount((prev) => Math.max(prev - 1, 0));
    } catch {
      // Intentionally ignore non-critical mark-read failure in dropdown.
    }
  };

  const formatWhen = (iso: string) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString();
  };

  return (
    <div className="relative">
      <button
        className="relative dropdown-toggle flex items-center justify-center text-gray-500 transition-colors bg-white border border-gray-200 rounded-full hover:text-gray-700 h-11 w-11 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        onClick={handleClick}
      >
        <span
          className={`absolute right-0 top-0.5 z-10 min-h-2 min-w-2 rounded-full bg-orange-500 px-1 text-[10px] text-white ${
            !hasUnread ? "hidden" : "flex items-center justify-center"
          }`}
        >
          {unreadBadgeText}
        </span>
        <svg
          className="fill-current"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.75 2.29248C10.75 1.87827 10.4143 1.54248 10 1.54248C9.58583 1.54248 9.25004 1.87827 9.25004 2.29248V2.83613C6.08266 3.20733 3.62504 5.9004 3.62504 9.16748V14.4591H3.33337C2.91916 14.4591 2.58337 14.7949 2.58337 15.2091C2.58337 15.6234 2.91916 15.9591 3.33337 15.9591H4.37504H15.625H16.6667C17.0809 15.9591 17.4167 15.6234 17.4167 15.2091C17.4167 14.7949 17.0809 14.4591 16.6667 14.4591H16.375V9.16748C16.375 5.9004 13.9174 3.20733 10.75 2.83613V2.29248ZM14.875 14.4591V9.16748C14.875 6.47509 12.6924 4.29248 10 4.29248C7.30765 4.29248 5.12504 6.47509 5.12504 9.16748V14.4591H14.875ZM8.00004 17.7085C8.00004 18.1228 8.33583 18.4585 8.75004 18.4585H11.25C11.6643 18.4585 12 18.1228 12 17.7085C12 17.2943 11.6643 16.9585 11.25 16.9585H8.75004C8.33583 16.9585 8.00004 17.2943 8.00004 17.7085Z"
            fill="currentColor"
          />
        </svg>
      </button>
      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute -right-[240px] mt-[17px] flex w-[280px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark sm:w-[300px] lg:right-0"
      >
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100 dark:border-gray-700">
          <h5 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Notifications
          </h5>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-500 transition dropdown-toggle dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            <svg
              className="fill-current"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M6.21967 7.28131C5.92678 6.98841 5.92678 6.51354 6.21967 6.22065C6.51256 5.92775 6.98744 5.92775 7.28033 6.22065L11.999 10.9393L16.7176 6.22078C17.0105 5.92789 17.4854 5.92788 17.7782 6.22078C18.0711 6.51367 18.0711 6.98855 17.7782 7.28144L13.0597 12L17.7782 16.7186C18.0711 17.0115 18.0711 17.4863 17.7782 17.7792C17.4854 18.0721 17.0105 18.0721 16.7176 17.7792L11.999 13.0607L7.28033 17.7794C6.98744 18.0722 6.51256 18.0722 6.21967 17.7794C5.92678 17.4865 5.92678 17.0116 6.21967 16.7187L10.9384 12L6.21967 7.28131Z"
                fill="currentColor"
              />
            </svg>
          </button>
        </div>
        <ul className="flex flex-col overflow-y-auto custom-scrollbar">
          {loading ? (
            <li className="py-3 text-theme-sm text-gray-500 dark:text-gray-400">
              Loading notifications...
            </li>
          ) : (
            items.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onNotificationClick(item)}
                  className={`w-full rounded-lg px-2 py-2 text-left transition hover:bg-gray-100 dark:hover:bg-gray-800 ${
                    item.isRead ? "opacity-75" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-theme-sm font-medium text-gray-800 dark:text-white/90">
                      {item.title}
                    </p>
                    {!item.isRead && (
                      <span className="mt-1 inline-block h-2 w-2 rounded-full bg-brand-500" />
                    )}
                  </div>
                  <p className="mt-0.5 text-theme-xs text-gray-600 dark:text-gray-400">
                    {item.message}
                  </p>
                  <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-500">
                    {formatWhen(item.createdAt)}
                  </p>
                </button>
              </li>
            ))
          )}
        </ul>
        {!loading && items.length === 0 && (
          <p className="py-3 text-center text-theme-sm text-gray-500 dark:text-gray-400">
            No notifications
          </p>
        )}
        <Link
          href="/notifications"
          className="mt-2 rounded-lg border border-gray-200 px-3 py-2 text-center text-theme-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
          onClick={closeDropdown}
        >
          View all notifications
        </Link>
      </Dropdown>
    </div>
  );
}
