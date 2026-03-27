"use client";

import React, { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  deleteOrphanClients,
  deleteOrphanEmployees,
  deleteOrphanFileUploads,
  deleteOrphanMemberships,
  deleteOrphanProjects,
  deleteOrphanUsers,
  fetchOrphanClients,
  fetchOrphanEmployees,
  fetchOrphanFileUploads,
  fetchOrphanMemberships,
  fetchOrphanProjects,
  fetchOrphanUsers,
} from "@/src/services/api/orphanData.api";
import type {
  OrphanClientItem,
  OrphanDataTabId,
  OrphanEmployeeItem,
  OrphanFileUploadItem,
  OrphanMembershipItem,
  OrphanProjectItem,
  OrphanUserItem,
} from "@/src/types/orphanData.types";
import { FileIcon, TrashBinIcon } from "@/src/icons/index";

/** Must match exactly (case-insensitive) to enable Delete in the confirmation modal. */
const DELETE_CONFIRM_PHRASE = "DELETE";

const VALID_TABS: OrphanDataTabId[] = [
  "files",
  "users",
  "memberships",
  "employees",
  "clients",
  "projects",
];

const TAB_CONFIG: {
  id: OrphanDataTabId;
  label: string;
  description: string;
}[] = [
  {
    id: "files",
    label: "File uploads",
    description:
      "Tracked uploads whose URL is not used on profiles, logos, project files, or notices.",
  },
  {
    id: "users",
    label: "Users",
    description: "Accounts with no company membership (global super admins excluded).",
  },
  {
    id: "memberships",
    label: "Memberships",
    description: "user_company rows pointing at a missing user or inactive/deleted company.",
  },
  {
    id: "employees",
    label: "Employees",
    description:
      "employee_details rows with invalid userCompany or company (integrity orphans).",
  },
  {
    id: "clients",
    label: "Clients",
    description:
      "Client records with broken company or membership (not flagged isDeleted).",
  },
  {
    id: "projects",
    label: "Projects",
    description:
      "Projects with missing active company or invalid owner / creator / updater membership.",
  },
];

function parseTab(raw: string | null): OrphanDataTabId {
  if (raw && VALID_TABS.includes(raw as OrphanDataTabId)) {
    return raw as OrphanDataTabId;
  }
  return "files";
}

function formatBytes(n: number): string {
  const v = typeof n === "number" && Number.isFinite(n) ? n : 0;
  if (v < 1024) return `${v} B`;
  if (v < 1024 * 1024) return `${(v / 1024).toFixed(1)} KB`;
  return `${(v / (1024 * 1024)).toFixed(1)} MB`;
}

function safeLocaleDate(iso: string | undefined | null): string {
  if (iso == null || typeof iso !== "string" || !iso.trim()) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

type RowWithId = { id: string };

export default function OrphanDataPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 text-theme-sm text-gray-500 dark:text-gray-400">Loading orphan data…</div>
      }
    >
      <OrphanDataPageInner />
    </Suspense>
  );
}

function OrphanDataPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = useMemo(
    () => parseTab(searchParams.get("tab")),
    [searchParams],
  );

  const setTab = (next: OrphanDataTabId) => {
    router.replace(`/orphan-data?tab=${next}`, { scroll: false });
  };

  const [rows, setRows] = useState<RowWithId[]>([]);
  const [fileMeta, setFileMeta] = useState<{
    referencedUrlCount: number;
    totalFileUploads: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ ids: string[] } | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteModalError, setDeleteModalError] = useState<string | null>(null);

  const closeConfirmModal = () => {
    setConfirmDelete(null);
    setDeleteConfirmText("");
    setDeleteModalError(null);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      switch (tab) {
        case "files": {
          const res = await fetchOrphanFileUploads();
          setRows(Array.isArray(res?.orphans) ? res.orphans : []);
          setFileMeta({
            referencedUrlCount:
              typeof res?.referencedUrlCount === "number" ? res.referencedUrlCount : 0,
            totalFileUploads:
              typeof res?.totalFileUploads === "number" ? res.totalFileUploads : 0,
          });
          break;
        }
        case "users":
          setFileMeta(null);
          setRows(await fetchOrphanUsers());
          break;
        case "memberships":
          setFileMeta(null);
          setRows(await fetchOrphanMemberships());
          break;
        case "employees":
          setFileMeta(null);
          setRows(await fetchOrphanEmployees());
          break;
        case "clients":
          setFileMeta(null);
          setRows(await fetchOrphanClients());
          break;
        case "projects":
          setFileMeta(null);
          setRows(await fetchOrphanProjects());
          break;
        default:
          setFileMeta(null);
          setRows([]);
      }
      setSelected(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
      setRows([]);
      setFileMeta(null);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    void load();
  }, [load]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    const ids = rows
      .map((r) => (r && typeof r.id === "string" ? r.id : ""))
      .filter((id) => id.length > 0);
    if (selected.size === ids.length && ids.length > 0) {
      setSelected(new Set());
    } else {
      setSelected(new Set(ids));
    }
  };

  const runDelete = async (ids: string[]) => {
    if (!ids.length) return;
    setBusy(true);
    setDeleteModalError(null);
    setError(null);
    try {
      switch (tab) {
        case "files":
          await deleteOrphanFileUploads(ids);
          break;
        case "users":
          await deleteOrphanUsers(ids);
          break;
        case "memberships":
          await deleteOrphanMemberships(ids);
          break;
        case "employees":
          await deleteOrphanEmployees(ids);
          break;
        case "clients":
          await deleteOrphanClients(ids);
          break;
        case "projects":
          await deleteOrphanProjects(ids);
          break;
      }
      await load();
      closeConfirmModal();
    } catch (err) {
      setDeleteModalError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteSelected = () => {
    const ids = [...selected];
    if (!ids.length) return;
    setDeleteModalError(null);
    setDeleteConfirmText("");
    setConfirmDelete({ ids });
  };

  const handleDeleteAll = () => {
    const ids = rows
      .map((r) => (r && typeof r.id === "string" ? r.id : ""))
      .filter((id) => id.length > 0);
    if (!ids.length) return;
    setDeleteModalError(null);
    setDeleteConfirmText("");
    setConfirmDelete({ ids });
  };

  const handleConfirmModalDelete = () => {
    if (!confirmDelete) return;
    if (deleteConfirmText.trim().toUpperCase() !== DELETE_CONFIRM_PHRASE) {
      return;
    }
    void runDelete(confirmDelete.ids);
  };

  const activeHint = TAB_CONFIG.find((t) => t.id === tab)?.description ?? "";

  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      <div className="col-span-12">
        <h1 className="mb-1 text-2xl font-semibold text-gray-900 dark:text-white/90">
          Orphan data
        </h1>
        <p className="text-theme-sm text-gray-500 dark:text-gray-400 max-w-3xl">
          Review inconsistent rows and unused uploads. Each tab uses explicit rules; deletions are
          permanent. When in doubt, export or back up first.
        </p>
      </div>

      <div className="col-span-12 border-b border-gray-200 dark:border-gray-800">
        <nav className="-mb-px flex flex-wrap gap-2" aria-label="Orphan data sections">
          {TAB_CONFIG.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`whitespace-nowrap border-b-2 px-3 py-2 text-theme-sm font-medium transition-colors ${
                tab === t.id
                  ? "border-brand-500 text-brand-600 dark:border-brand-400 dark:text-brand-400"
                  : "border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="col-span-12 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-theme-sm text-gray-600 dark:border-gray-800 dark:bg-gray-900/40 dark:text-gray-300">
        {activeHint}
      </div>

      {error && (
        <div className="col-span-12 rounded-lg border border-error-200 bg-error-50 px-4 py-2 text-theme-sm text-error-700 dark:border-error-800 dark:bg-error-950 dark:text-error-400">
          {error}
        </div>
      )}

      {tab === "files" && (
        <div className="col-span-12 flex flex-wrap gap-3">
          <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.03]">
            <p className="text-theme-xs text-gray-500 dark:text-gray-400">Total uploads</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white/90">
              {loading ? "—" : (fileMeta?.totalFileUploads ?? 0).toLocaleString()}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.03]">
            <p className="text-theme-xs text-gray-500 dark:text-gray-400">Referenced URLs (scan)</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white/90">
              {loading ? "—" : (fileMeta?.referencedUrlCount ?? 0).toLocaleString()}
            </p>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 shadow-theme-sm dark:border-amber-900/40 dark:bg-amber-950/30">
            <p className="text-theme-xs text-amber-800 dark:text-amber-300">Orphans</p>
            <p className="text-lg font-semibold text-amber-900 dark:text-amber-200">
              {loading ? "—" : rows.length.toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {tab !== "files" && (
        <div className="col-span-12">
          <p className="text-theme-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium text-gray-800 dark:text-gray-200">Rows: </span>
            {loading ? "—" : rows.length.toLocaleString()}
          </p>
        </div>
      )}

      <div className="col-span-12 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading || busy}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
        >
          Refresh
        </button>
        <button
          type="button"
          onClick={handleDeleteSelected}
          disabled={busy || selected.size === 0}
          className="inline-flex items-center gap-2 rounded-lg border border-error-300 bg-error-50 px-4 py-2 text-theme-sm font-medium text-error-800 hover:bg-error-100 disabled:opacity-50 dark:border-error-800 dark:bg-error-950/50 dark:text-error-300 dark:hover:bg-error-900/40"
        >
          <span className="h-4 w-4 inline-flex items-center justify-center">
            <TrashBinIcon />
          </span>
          Delete selected ({selected.size})
        </button>
        <button
          type="button"
          onClick={handleDeleteAll}
          disabled={busy || rows.length === 0}
          className="inline-flex items-center gap-2 rounded-lg bg-error-600 px-4 py-2 text-theme-sm font-medium text-white hover:bg-error-700 disabled:opacity-50"
        >
          <span className="h-4 w-4 inline-flex items-center justify-center">
            <TrashBinIcon />
          </span>
          Delete all in tab
        </button>
      </div>

      <div className="col-span-12 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="overflow-x-auto">
          {tab === "files" && (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={rows.length > 0 && selected.size === rows.length}
                      onChange={toggleAll}
                      disabled={loading || rows.length === 0}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-theme-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    File
                  </th>
                  <th className="px-4 py-3 text-left text-theme-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Size
                  </th>
                  <th className="px-4 py-3 text-left text-theme-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Created
                  </th>
                  <th className="px-4 py-3 text-left text-theme-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    URL
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-theme-sm text-gray-500">
                      Loading…
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-theme-sm text-gray-500">
                      No orphan uploads.
                    </td>
                  </tr>
                ) : (
                  (rows as OrphanFileUploadItem[]).map((row, idx) => {
                    const id = typeof row?.id === "string" ? row.id : `row-${idx}`;
                    const url = typeof row?.url === "string" ? row.url : "";
                    const filename = typeof row?.filename === "string" ? row.filename : "—";
                    const mimetype = typeof row?.mimetype === "string" ? row.mimetype : "—";
                    const size = typeof row?.size === "number" ? row.size : 0;
                    return (
                      <tr key={id} className="hover:bg-gray-50/80 dark:hover:bg-white/[0.04]">
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selected.has(id)}
                            onChange={() => toggle(id)}
                            disabled={busy || typeof row?.id !== "string"}
                            className="rounded border-gray-300"
                          />
                        </td>
                        <td className="px-4 py-3 text-theme-sm text-gray-900 dark:text-white/90">
                          <span className="inline-flex items-center gap-2">
                            <FileIcon className="h-4 w-4 shrink-0 text-gray-400" />
                            <span className="max-w-[200px] truncate" title={filename}>
                              {filename}
                            </span>
                          </span>
                          <p className="mt-0.5 text-theme-xs text-gray-500">{mimetype}</p>
                        </td>
                        <td className="px-4 py-3 text-theme-sm text-gray-700 dark:text-gray-300">
                          {formatBytes(size)}
                        </td>
                        <td className="px-4 py-3 text-theme-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                          {safeLocaleDate(row?.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-theme-xs">
                          {url ? (
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-brand-600 hover:underline break-all max-w-md inline-block dark:text-brand-400"
                            >
                              {url.length > 80 ? `${url.slice(0, 80)}…` : url}
                            </a>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}

          {tab === "users" && (
            <GenericTable
              loading={loading}
              empty="No orphan users."
              rows={rows}
              selected={selected}
              toggle={toggle}
              toggleAll={toggleAll}
              busy={busy}
              columns={[
                { key: "who", header: "User" },
                { key: "createdAt", header: "Created" },
              ]}
              renderCells={(row) => {
                const r = row as OrphanUserItem;
                const name = [r.firstName, r.lastName].filter(Boolean).join(" ") || "—";
                return (
                  <>
                    <td className="px-4 py-3 text-theme-sm">
                      <div className="font-medium text-gray-900 dark:text-white/90">{name}</div>
                      <div className="text-theme-xs text-gray-500">{r.email}</div>
                    </td>
                    <td className="px-4 py-3 text-theme-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                      {safeLocaleDate(r.createdAt)}
                    </td>
                  </>
                );
              }}
            />
          )}

          {tab === "memberships" && (
            <GenericTable
              loading={loading}
              empty="No orphan memberships."
              rows={rows}
              selected={selected}
              toggle={toggle}
              toggleAll={toggleAll}
              busy={busy}
              columns={[
                { key: "role", header: "Role" },
                { key: "ids", header: "User / Company" },
                { key: "createdAt", header: "Created" },
              ]}
              renderCells={(row) => {
                const r = row as OrphanMembershipItem;
                return (
                  <>
                    <td className="px-4 py-3 text-theme-sm font-mono text-gray-800 dark:text-gray-200">
                      {r.topLevelRole}
                    </td>
                    <td className="px-4 py-3 text-theme-xs font-mono text-gray-600 dark:text-gray-400">
                      <div>user: {r.userId}</div>
                      <div>co: {r.companyId}</div>
                    </td>
                    <td className="px-4 py-3 text-theme-sm whitespace-nowrap">
                      {safeLocaleDate(r.createdAt)}
                    </td>
                  </>
                );
              }}
            />
          )}

          {tab === "employees" && (
            <GenericTable
              loading={loading}
              empty="No orphan employee rows."
              rows={rows}
              selected={selected}
              toggle={toggle}
              toggleAll={toggleAll}
              busy={busy}
              columns={[
                { key: "name", header: "Name" },
                { key: "ids", header: "IDs" },
                { key: "createdAt", header: "Created" },
              ]}
              renderCells={(row) => {
                const r = row as OrphanEmployeeItem;
                const name = [r.firstName, r.lastName].filter(Boolean).join(" ") || "—";
                return (
                  <>
                    <td className="px-4 py-3 text-theme-sm">{name}</td>
                    <td className="px-4 py-3 text-theme-xs font-mono text-gray-600 dark:text-gray-400">
                      <div>emp: {r.id}</div>
                      <div>uc: {r.userCompanyId}</div>
                      <div>co: {r.companyId}</div>
                    </td>
                    <td className="px-4 py-3 text-theme-sm whitespace-nowrap">
                      {safeLocaleDate(r.createdAt)}
                    </td>
                  </>
                );
              }}
            />
          )}

          {tab === "clients" && (
            <GenericTable
              loading={loading}
              empty="No orphan clients."
              rows={rows}
              selected={selected}
              toggle={toggle}
              toggleAll={toggleAll}
              busy={busy}
              columns={[
                { key: "client", header: "Client" },
                { key: "ids", header: "IDs" },
                { key: "createdAt", header: "Created" },
              ]}
              renderCells={(row) => {
                const r = row as OrphanClientItem;
                return (
                  <>
                    <td className="px-4 py-3 text-theme-sm">
                      <div className="font-medium text-gray-900 dark:text-white/90">
                        {r.companyName || "—"}
                      </div>
                      <div className="text-theme-xs text-gray-500">{r.email}</div>
                    </td>
                    <td className="px-4 py-3 text-theme-xs font-mono text-gray-600 dark:text-gray-400">
                      <div>{r.id}</div>
                      <div>uc: {r.userCompanyId}</div>
                      <div>co: {r.companyId}</div>
                    </td>
                    <td className="px-4 py-3 text-theme-sm whitespace-nowrap">
                      {safeLocaleDate(r.createdAt)}
                    </td>
                  </>
                );
              }}
            />
          )}

          {tab === "projects" && (
            <GenericTable
              loading={loading}
              empty="No orphan projects."
              rows={rows}
              selected={selected}
              toggle={toggle}
              toggleAll={toggleAll}
              busy={busy}
              columns={[
                { key: "name", header: "Project" },
                { key: "ids", header: "IDs" },
                { key: "createdAt", header: "Created" },
              ]}
              renderCells={(row) => {
                const r = row as OrphanProjectItem;
                return (
                  <>
                    <td className="px-4 py-3 text-theme-sm font-medium text-gray-900 dark:text-white/90">
                      {r.projectName}
                    </td>
                    <td className="px-4 py-3 text-theme-xs font-mono text-gray-600 dark:text-gray-400">
                      <div>{r.id}</div>
                      <div>co: {r.companyId}</div>
                      <div>owner: {r.projectOwnerId}</div>
                      <div>by: {r.createdById}</div>
                      {r.updatedById ? <div>upd: {r.updatedById}</div> : null}
                    </td>
                    <td className="px-4 py-3 text-theme-sm whitespace-nowrap">
                      {safeLocaleDate(r.createdAt)}
                    </td>
                  </>
                );
              }}
            />
          )}
        </div>
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
            <p className="mb-2 text-theme-sm font-medium text-gray-800 dark:text-white/90">
              Permanently delete{" "}
              <span className="font-semibold">{confirmDelete.ids.length}</span>{" "}
              row(s) in <span className="font-semibold">{TAB_CONFIG.find((t) => t.id === tab)?.label ?? "this tab"}</span>
              ? This cannot be undone.
            </p>
            <p className="mb-3 text-theme-xs text-gray-500 dark:text-gray-400">
              For users, the server only removes accounts with no company links. If delete fails, fix
              the data first, then try again.
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
                onClick={closeConfirmModal}
                className="rounded-lg border border-gray-200 px-4 py-2 text-theme-sm dark:border-gray-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmModalDelete}
                disabled={
                  busy ||
                  deleteConfirmText.trim().toUpperCase() !== DELETE_CONFIRM_PHRASE
                }
                className="rounded-lg bg-error-500 px-4 py-2 text-theme-sm font-medium text-white hover:bg-error-600 disabled:opacity-50"
              >
                {busy ? "Deleting…" : "Delete"}
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

function GenericTable({
  loading,
  empty,
  rows,
  selected,
  toggle,
  toggleAll,
  busy,
  columns,
  renderCells,
}: {
  loading: boolean;
  empty: string;
  rows: RowWithId[];
  selected: Set<string>;
  toggle: (id: string) => void;
  toggleAll: () => void;
  busy: boolean;
  columns: { key: string; header: string }[];
  renderCells: (row: RowWithId) => React.ReactNode;
}) {
  const colCount = columns.length + 1;
  return (
    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
      <thead className="bg-gray-50 dark:bg-gray-900/50">
        <tr>
          <th scope="col" className="px-4 py-3 text-left">
            <input
              type="checkbox"
              checked={rows.length > 0 && selected.size === rows.length}
              onChange={toggleAll}
              disabled={loading || rows.length === 0}
              className="rounded border-gray-300"
            />
          </th>
          {columns.map((c) => (
            <th
              key={c.key}
              className="px-4 py-3 text-left text-theme-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
            >
              {c.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
        {loading ? (
          <tr>
            <td colSpan={colCount} className="px-4 py-8 text-center text-theme-sm text-gray-500">
              Loading…
            </td>
          </tr>
        ) : rows.length === 0 ? (
          <tr>
            <td colSpan={colCount} className="px-4 py-8 text-center text-theme-sm text-gray-500">
              {empty}
            </td>
          </tr>
        ) : (
          rows.map((row, index) => {
            const rid =
              row && typeof row.id === "string" ? row.id : `row-${index}`;
            return (
              <tr key={rid} className="hover:bg-gray-50/80 dark:hover:bg-white/[0.04]">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={typeof row.id === "string" && selected.has(row.id)}
                    onChange={() => {
                      if (typeof row.id === "string") toggle(row.id);
                    }}
                    disabled={busy || typeof row.id !== "string"}
                    className="rounded border-gray-300"
                  />
                </td>
                {renderCells(row)}
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  );
}
