"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  listPlatformBlogPosts,
  updatePlatformBlogPost,
  deletePlatformBlogPost,
} from "@/src/services/api/platformBlog.api";
import type { PlatformBlogPostRow } from "@/src/types/platformBlog.types";
import PublishToggle from "@/src/components/blog/PublishToggle";
import { widgetMediaUrl } from "@/src/utils/widgetMediaUrl";
import { PencilIcon, PlusIcon, TrashBinIcon } from "@/src/icons";

type StatusFilter = "all" | "published" | "draft";

const selectClass =
  "h-10 rounded-lg border border-gray-200 bg-transparent px-3 text-theme-sm text-gray-800 dark:border-gray-700 dark:bg-white/[0.03] dark:text-white/90";

function categoryBadgeClass(category: string): string {
  const map: Record<string, string> = {
    "Client Transparency":
      "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300",
    "Team & People":
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
    "Project Management":
      "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
    "Productivity Tips":
      "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
    "Industry Insights":
      "bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300",
    "Sprint Planning":
      "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
  };
  return (
    map[category] ??
    "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
  );
}

export default function BlogListPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [posts, setPosts] = useState<PlatformBlogPostRow[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PlatformBlogPostRow | null>(
    null,
  );
  const confirmActionRef = useRef<null | (() => Promise<void> | void)>(null);

  const categories = useMemo(
    () =>
      Array.from(
        new Set(posts.map((p) => p.category.trim()).filter(Boolean)),
      ).sort((a, b) => a.localeCompare(b)),
    [posts],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return posts.filter((post) => {
      if (categoryFilter !== "all" && post.category !== categoryFilter) {
        return false;
      }
      if (statusFilter === "published" && !post.isActive) return false;
      if (statusFilter === "draft" && post.isActive) return false;
      if (!q) return true;
      return (
        post.title.toLowerCase().includes(q) ||
        post.shortDescription.toLowerCase().includes(q) ||
        post.category.toLowerCase().includes(q)
      );
    });
  }, [posts, search, categoryFilter, statusFilter]);

  const load = useCallback(() => {
    setLoading(true);
    listPlatformBlogPosts()
      .then(setPosts)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const togglePublished = async (row: PlatformBlogPostRow, next: boolean) => {
    setTogglingId(row.id);
    setError(null);
    try {
      const updated = await updatePlatformBlogPost(row.id, { isActive: next });
      setPosts((p) => p.map((r) => (r.id === updated.id ? updated : r)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update status");
    } finally {
      setTogglingId(null);
    }
  };

  const openDelete = (row: PlatformBlogPostRow) => {
    setDeleteTarget(row);
    confirmActionRef.current = async () => {
      await deletePlatformBlogPost(row.id);
      setPosts((p) => p.filter((r) => r.id !== row.id));
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
              Blogs
            </h3>
            <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
              Manage marketing blog posts for the website.
            </p>
          </div>
          <Link
            href="/settings/blog/new"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 text-theme-sm font-medium text-white hover:bg-brand-600"
          >
            <span className="h-4 w-4">
              <PlusIcon />
            </span>
            Add blog post
          </Link>
        </div>

        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title, category, description…"
            className={`${selectClass} min-w-0 flex-1`}
          />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className={selectClass}
            aria-label="Filter by category"
          >
            <option value="all">All categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
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
            Loading blog posts…
          </p>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 px-6 py-12 text-center dark:border-gray-800">
            <p className="text-theme-sm font-medium text-gray-800 dark:text-white/90">
              {posts.length === 0 ? "No blog posts yet" : "No matching posts"}
            </p>
            <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
              {posts.length === 0
                ? "Create your first blog post to get started."
                : "Try adjusting search or filters."}
            </p>
            {posts.length === 0 && (
              <Link
                href="/settings/blog/new"
                className="mt-4 inline-flex h-10 items-center gap-2 rounded-lg bg-brand-500 px-4 text-theme-sm font-medium text-white hover:bg-brand-600"
              >
                <span className="h-4 w-4">
                  <PlusIcon />
                </span>
                Add blog post
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-theme-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <th className="pb-3 pr-3 font-medium text-gray-700 dark:text-gray-300">
                    Post
                  </th>
                  <th className="px-3 pb-3 font-medium text-gray-700 dark:text-gray-300">
                    Category
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
                      <div className="flex min-w-[240px] items-start gap-3">
                        {row.imageUrl ? (
                          <img
                            src={widgetMediaUrl(row.imageUrl)}
                            alt=""
                            className="h-14 w-20 shrink-0 rounded-lg border border-gray-200 object-cover dark:border-gray-700"
                          />
                        ) : (
                          <div className="flex h-14 w-20 shrink-0 items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50 text-[10px] text-gray-400 dark:border-gray-700 dark:bg-white/[0.02]">
                            No image
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white">
                            {row.title}
                          </p>
                          <p className="mt-1 line-clamp-2 text-theme-xs text-gray-500 dark:text-gray-400">
                            {row.shortDescription}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-4 align-top">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-theme-xs font-medium ${categoryBadgeClass(row.category)}`}
                      >
                        {row.category}
                      </span>
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
                          href={`/settings/blog/${row.id}/edit`}
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
            Showing {filtered.length} of {posts.length} posts
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
              Delete blog post
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
                {confirmBusy ? "Deleting…" : "Delete post"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
