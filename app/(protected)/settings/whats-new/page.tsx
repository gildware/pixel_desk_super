"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  listPlatformWhatsNewUpdates,
  updatePlatformWhatsNewUpdate,
  deletePlatformWhatsNewUpdate,
} from "@/src/services/api/platformWhatsNew.api";
import type { PlatformWhatsNewRow } from "@/src/types/platformWhatsNew.types";
import PublishToggle from "@/src/components/blog/PublishToggle";
import { PencilIcon, PlusIcon, TrashBinIcon } from "@/src/icons";

type StatusFilter = "all" | "published" | "draft";

const selectClass =
  "h-10 rounded-lg border border-gray-200 bg-transparent px-3 text-theme-sm text-gray-800 dark:border-gray-700 dark:bg-white/[0.03] dark:text-white/90";

function formatPublishedDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default function WhatsNewListPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updates, setUpdates] = useState<PlatformWhatsNewRow[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PlatformWhatsNewRow | null>(
    null,
  );
  const confirmActionRef = useRef<null | (() => Promise<void> | void)>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return updates.filter((row) => {
      if (statusFilter === "published" && !row.isActive) return false;
      if (statusFilter === "draft" && row.isActive) return false;
      if (!q) return true;
      return (
        row.title.toLowerCase().includes(q) ||
        row.body.toLowerCase().includes(q) ||
        formatPublishedDate(row.publishedAt).toLowerCase().includes(q)
      );
    });
  }, [updates, search, statusFilter]);

  const load = useCallback(() => {
    setLoading(true);
    listPlatformWhatsNewUpdates()
      .then(setUpdates)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const togglePublished = async (row: PlatformWhatsNewRow, next: boolean) => {
    setTogglingId(row.id);
    setError(null);
    try {
      const updated = await updatePlatformWhatsNewUpdate(row.id, {
        isActive: next,
      });
      setUpdates((items) =>
        items.map((item) => (item.id === updated.id ? updated : item)),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update status");
    } finally {
      setTogglingId(null);
    }
  };

  const openDelete = (row: PlatformWhatsNewRow) => {
    setDeleteTarget(row);
    confirmActionRef.current = async () => {
      await deletePlatformWhatsNewUpdate(row.id);
      setUpdates((items) => items.filter((item) => item.id !== row.id));
    };
    setConfirmBusy(false);
    setConfirmOpen(true);
  };

  const closeConfirm = () => {
    confirmActionRef.current = null;
    setDeleteTarget(null);
    setConfirmOpen(false);
    setConfirmBusy(false);
  };

  const runConfirm = async () => {
    const fn = confirmActionRef.current;
    if (!fn) return closeConfirm();
    try {
      setConfirmBusy(true);
      await fn();
      closeConfirm();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
      setConfirmBusy(false);
    }
  };

  return (
    <>
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Website What&apos;s new
            </h3>
            <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
              Manage product update timeline entries for the marketing website.
            </p>
          </div>
          <Link
            href="/settings/whats-new/new"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 text-theme-sm font-medium text-white hover:bg-brand-600"
          >
            <span className="h-4 w-4">
              <PlusIcon />
            </span>
            Add update
          </Link>
        </div>

        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title, body, or date…"
            className={`${selectClass} min-w-0 flex-1`}
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className={selectClass}
            aria-label="Filter by status"
          >
            <option value="all">All statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-error-200 bg-error-50 px-4 py-2 text-theme-sm text-error-700 dark:border-error-800 dark:bg-error-950 dark:text-error-400">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-theme-sm text-gray-500 dark:text-gray-400">
            Loading updates…
          </p>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 px-6 py-12 text-center dark:border-gray-800">
            <p className="text-theme-sm font-medium text-gray-800 dark:text-white/90">
              {updates.length === 0 ? "No updates yet" : "No matching updates"}
            </p>
            <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
              {updates.length === 0
                ? "Create your first timeline entry to get started."
                : "Try adjusting search or filters."}
            </p>
            {updates.length === 0 && (
              <Link
                href="/settings/whats-new/new"
                className="mt-4 inline-flex h-10 items-center gap-2 rounded-lg bg-brand-500 px-4 text-theme-sm font-medium text-white hover:bg-brand-600"
              >
                <span className="h-4 w-4">
                  <PlusIcon />
                </span>
                Add update
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-theme-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <th className="pb-3 pr-3 font-medium text-gray-700 dark:text-gray-300">
                    Update
                  </th>
                  <th className="px-3 pb-3 font-medium text-gray-700 dark:text-gray-300">
                    Published
                  </th>
                  <th className="px-3 pb-3 font-medium text-gray-700 dark:text-gray-300">
                    Status
                  </th>
                  <th className="pb-3 pl-3 text-right font-medium text-gray-700 dark:text-gray-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-gray-100 dark:border-gray-800/80"
                  >
                    <td className="py-4 pr-3">
                      <div className="min-w-[280px]">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {row.title}
                        </p>
                        <p className="mt-1 line-clamp-2 text-theme-xs text-gray-500 dark:text-gray-400">
                          {row.body}
                        </p>
                      </div>
                    </td>
                    <td className="px-3 py-4 align-top text-gray-700 dark:text-gray-300">
                      {formatPublishedDate(row.publishedAt)}
                    </td>
                    <td className="px-3 py-4 align-top">
                      <PublishToggle
                        checked={row.isActive}
                        disabled={togglingId === row.id}
                        onChange={(next) => togglePublished(row, next)}
                      />
                    </td>
                    <td className="py-4 pl-3 align-top">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/settings/whats-new/${row.id}/edit`}
                          title="Edit"
                          aria-label={`Edit ${row.title}`}
                          className="inline-flex rounded-lg p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
                        >
                          <span className="h-5 w-5">
                            <PencilIcon />
                          </span>
                        </Link>
                        <button
                          type="button"
                          title="Delete"
                          aria-label={`Delete ${row.title}`}
                          onClick={() => openDelete(row)}
                          className="inline-flex rounded-lg p-2 text-error-600 hover:bg-error-50 dark:text-error-400 dark:hover:bg-error-950"
                        >
                          <span className="h-5 w-5">
                            <TrashBinIcon />
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <p className="mt-4 text-theme-xs text-gray-500 dark:text-gray-400">
            Showing {filtered.length} of {updates.length} updates
          </p>
        )}
      </div>

      {confirmOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close confirmation dialog"
            onClick={closeConfirm}
          />
          <div className="relative w-[min(92vw,520px)] rounded-2xl border border-gray-200 bg-white p-5 shadow-xl dark:border-gray-800 dark:bg-gray-950">
            <h3 className="text-theme-sm font-semibold text-gray-900 dark:text-white">
              Delete update
            </h3>
            <p className="mt-2 text-theme-sm text-gray-600 dark:text-gray-300">
              Delete{" "}
              <span className="font-medium text-gray-900 dark:text-white">
                {deleteTarget?.title}
              </span>
              ? This cannot be undone.
            </p>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeConfirm}
                disabled={confirmBusy}
                className="h-9 rounded-lg border border-gray-200 px-3 text-theme-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60 dark:border-gray-800 dark:text-gray-200 dark:hover:bg-gray-900"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={runConfirm}
                disabled={confirmBusy}
                className="h-9 rounded-lg bg-error-600 px-3 text-theme-sm font-medium text-white hover:bg-error-700 disabled:opacity-60"
              >
                {confirmBusy ? "Deleting…" : "Delete update"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
