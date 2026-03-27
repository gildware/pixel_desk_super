"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  listSuperAdminUsers,
  deleteSuperAdminUser,
} from "@/src/services/api/user.api";
import type { SuperAdminUserItem } from "@/src/types/user.types";
import { useSession } from "@/src/context/SessionContext";

const DEFAULT_LIMIT = 20;

/** Must be typed exactly (case-insensitive) to enable Delete in the confirmation modal. */
const DELETE_CONFIRM_PHRASE = "DELETE";

const STICKY_CARD_BG =
  "bg-white shadow-[4px_0_10px_-4px_rgba(15,23,42,0.12)] dark:bg-gray-900 dark:shadow-[4px_0_10px_-4px_rgba(0,0,0,0.45)]";
const STICKY_CARD_BG_RIGHT =
  "bg-white shadow-[-4px_0_10px_-4px_rgba(15,23,42,0.12)] dark:bg-gray-900 dark:shadow-[-4px_0_10px_-4px_rgba(0,0,0,0.45)]";

function displayName(u: SuperAdminUserItem): string {
  const parts = [u.firstName, u.lastName].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : u.email;
}

export default function UsersPage() {
  const { session } = useSession();
  const currentUserId = session?.user?.id;
  const [items, setItems] = useState<SuperAdminUserItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(DEFAULT_LIMIT);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<SuperAdminUserItem | null>(
    null
  );
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteModalError, setDeleteModalError] = useState<string | null>(null);

  const visibleItems = useMemo(
    () =>
      (items ?? []).filter((u) =>
        currentUserId ? u.id !== currentUserId : true
      ),
    [items, currentUserId]
  );

  const formatLastActivity = (iso?: string | null) => {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    });
  };

  const inactivityBadgeClass = (state?: SuperAdminUserItem['inactivityState']) => {
    if (state === 'delete_due') {
      return 'inline-flex rounded-full px-2.5 py-0.5 text-theme-xs font-medium bg-error-100 text-error-700 dark:bg-error-900/40 dark:text-error-300';
    }
    if (state === 'warning') {
      return 'inline-flex rounded-full px-2.5 py-0.5 text-theme-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
    }
    return '';
  };

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listSuperAdminUsers({
        page,
        limit,
        search: search || undefined,
      });
      setItems(Array.isArray(res?.items) ? res.items : []);
      setTotal(typeof res?.total === "number" ? res.total : 0);
      setTotalPages(typeof res?.totalPages === "number" ? res.totalPages : 0);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load users"
      );
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  };

  const closeDeleteModal = () => {
    setPendingDelete(null);
    setDeleteConfirmText("");
    setDeleteModalError(null);
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    setDeleteModalError(null);
    try {
      await deleteSuperAdminUser(pendingDelete.id);
      closeDeleteModal();
      await fetchList();
    } catch (err) {
      setDeleteModalError(
        err instanceof Error ? err.message : "Failed to delete user"
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Users
          </h3>
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <input
              type="text"
              placeholder="Search name, email…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="h-10 rounded-lg border border-gray-200 bg-transparent px-3 text-theme-sm text-gray-800 placeholder:text-gray-400 dark:border-gray-700 dark:bg-white/[0.03] dark:text-white/90 dark:placeholder:text-gray-500"
            />
            <button
              type="submit"
              className="rounded-lg bg-brand-500 px-4 py-2 text-theme-sm font-medium text-white hover:bg-brand-600"
            >
              Search
            </button>
          </form>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-error-200 bg-error-50 px-4 py-2 text-theme-sm text-error-700 dark:border-error-800 dark:bg-error-950 dark:text-error-400">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-theme-sm text-gray-500 dark:text-gray-400">
            Loading users…
          </p>
        ) : visibleItems.length === 0 ? (
          <p className="text-theme-sm text-gray-500 dark:text-gray-400">
            No users found.
          </p>
        ) : (
          <>
            <div
              className="overflow-x-auto"
              style={{ overscrollBehaviorX: "contain" }}
            >
              <table className="min-w-max w-full border-separate border-spacing-0 text-left text-theme-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th
                      className={`sticky left-0 z-30 ${STICKY_CARD_BG} px-3 pb-3 font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap`}
                    >
                      Name
                    </th>
                    <th className="px-3 pb-3 font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                      Email
                    </th>
                    <th className="px-3 pb-3 font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                      Companies
                    </th>
                    <th className="px-3 pb-3 font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                      Last activity
                    </th>
                    <th
                      className={`sticky right-0 z-30 ${STICKY_CARD_BG_RIGHT} w-28 px-3 pb-3 text-right font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap`}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visibleItems.map((u) => (
                    <tr
                      key={u.id}
                      className="border-b border-gray-100 dark:border-gray-800"
                    >
                      <td
                        className={`sticky left-0 z-20 ${STICKY_CARD_BG} px-3 py-3 whitespace-nowrap text-gray-800 dark:text-white/90`}
                      >
                        <div className="flex items-center gap-3">
                          {u.profilePicture ? (
                            <img
                              src={u.profilePicture}
                              alt=""
                              className="h-8 w-8 rounded-full border border-gray-200 object-cover dark:border-gray-700"
                            />
                          ) : (
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-gray-100 text-theme-xs font-medium text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
                              {displayName(u).charAt(0).toUpperCase()}
                            </div>
                          )}
                          {displayName(u)}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-gray-600 dark:text-gray-400">
                        {u.email}
                      </td>
                      <td className="px-3 py-3 text-gray-600 dark:text-gray-400">
                        {Array.isArray(u.companies) && u.companies.length > 0 ? (
                          <ul className="list-inside list-disc space-y-0.5">
                            {u.companies.map((c) => (
                              <li key={c.companyId}>
                                {c.companyName}
                                {c.role ? ` (${c.role})` : ""}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-3 py-3 text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                          <span>{formatLastActivity(u.lastActivityAt)}</span>
                          {u.inactivityState &&
                            u.inactivityState !== 'active' &&
                            u.inactivityState !== 'unknown' && (
                              <span className={inactivityBadgeClass(u.inactivityState)}>
                                {u.inactivityState === 'warning'
                                  ? 'Inactive'
                                  : 'Delete due'}
                              </span>
                            )}
                        </div>
                      </td>
                      <td
                        className={`sticky right-0 z-20 ${STICKY_CARD_BG_RIGHT} px-3 py-3 whitespace-nowrap text-right`}
                      >
                        {currentUserId === u.id ? (
                          <span className="text-theme-xs text-gray-400 dark:text-gray-500">
                            Current user
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setPendingDelete(u);
                              setDeleteConfirmText("");
                              setDeleteModalError(null);
                            }}
                            className="text-theme-sm font-medium text-error-600 hover:text-error-700 dark:text-error-400 dark:hover:text-error-300"
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between">
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
          </>
        )}
      </div>

      {pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
            <p className="mb-2 text-theme-sm font-medium text-gray-800 dark:text-white/90">
              Delete{" "}
              <span className="font-semibold">
                {displayName(pendingDelete)}
              </span>{" "}
              ({pendingDelete.email})? This cannot be undone.
            </p>
            <p className="mb-3 text-theme-xs text-gray-500 dark:text-gray-400">
              The account is only removed if this user is not linked to any
              company. If the server rejects the delete, remove them from each
              company first.
            </p>
            <label className="mb-4 block">
              <span className="mb-1.5 block text-theme-xs font-medium text-gray-700 dark:text-gray-300">
                Type {DELETE_CONFIRM_PHRASE} to confirm
              </span>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                autoComplete="off"
                className="h-10 w-full rounded-lg border border-gray-200 bg-transparent px-3 text-theme-sm text-gray-800 dark:border-gray-700 dark:bg-white/[0.03] dark:text-white/90"
                placeholder={DELETE_CONFIRM_PHRASE}
              />
            </label>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={closeDeleteModal}
                className="rounded-lg border border-gray-200 px-4 py-2 text-theme-sm dark:border-gray-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={
                  deleting ||
                  deleteConfirmText.trim().toUpperCase() !==
                    DELETE_CONFIRM_PHRASE
                }
                className="rounded-lg bg-error-500 px-4 py-2 text-theme-sm font-medium text-white hover:bg-error-600 disabled:opacity-50"
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
            {deleteModalError && (
              <div
                role="alert"
                className="mt-4 rounded-lg border border-error-200 bg-error-50 px-3 py-2 text-theme-sm text-error-700 dark:border-error-800 dark:bg-error-950 dark:text-error-400"
              >
                {deleteModalError}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
