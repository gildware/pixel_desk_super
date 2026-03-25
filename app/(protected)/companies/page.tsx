"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  listCompanies,
  updateCompany,
  deleteCompany,
} from "@/src/services/api/company.api";
import type { Company, UpdateCompanyBody, LabelValue } from "@/src/types/company.types";
import { EyeIcon, PencilIcon, TrashBinIcon } from "@/src/icons";

const DEFAULT_LIMIT = 20;

/** Must be typed exactly (case-insensitive) to enable Delete in the confirmation modal. */
const DELETE_CONFIRM_PHRASE = "DELETE";

function labelFrom(field: string | LabelValue | undefined): string {
  if (field == null) return "—";
  return typeof field === "object" ? field.label : field;
}
function valueFrom(field: string | LabelValue | undefined): string {
  if (field == null) return "";
  return typeof field === "object" ? field.value : field;
}

function adminDisplayName(
  createdBy: Company["createdBy"]
): string {
  if (!createdBy) return "—";
  const parts = [createdBy.firstName, createdBy.lastName]
    .filter(
      (p): p is string => typeof p === "string" && p.trim().length > 0,
    )
    .map((p) => p.trim());
  return parts.length > 0 ? parts.join(" ") : "—";
}

function formatLastActivity(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
}

function inactivityBadgeClass(
  state?: Company["inactivityState"],
): string {
  if (state === 'delete_due') {
    return 'inline-flex rounded-full px-2.5 py-0.5 text-theme-xs font-medium bg-error-100 text-error-700 dark:bg-error-900/40 dark:text-error-300';
  }
  if (state === 'warning') {
    return 'inline-flex rounded-full px-2.5 py-0.5 text-theme-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
  }
  return '';
}

export default function CompaniesPage() {
  const [items, setItems] = useState<Company[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(DEFAULT_LIMIT);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editCompany, setEditCompany] = useState<Company | null>(null);
  const [editForm, setEditForm] = useState<UpdateCompanyBody>({});
  const [saving, setSaving] = useState(false);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listCompanies({ page, limit, search: search || undefined });
      setItems(Array.isArray(res?.items) ? res.items : []);
      setTotal(typeof res?.total === "number" ? res.total : 0);
      setTotalPages(typeof res?.totalPages === "number" ? res.totalPages : 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load companies");
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

  const openEdit = (company: Company) => {
    setEditCompany(company);
    setEditForm({
      company_name: company.company_name ?? (company as { companyName?: string }).companyName ?? "",
      industry: valueFrom(company.industry),
      primaryUse: valueFrom(company.primaryUse),
      timeZone: company.timeZone ?? "",
      status: company.status ?? "",
    });
  };

  const handleSaveEdit = async () => {
    if (!editCompany?.id) return;
    setSaving(true);
    try {
      const updated = await updateCompany(editCompany.id, editForm);
      setItems((prev) =>
        prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c))
      );
      setEditCompany(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update company");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteCompany(deleteId);
      setItems((prev) => prev.filter((c) => c.id !== deleteId));
      setTotal((t) => Math.max(0, t - 1));
      setDeleteId(null);
      setDeleteConfirmText("");
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : "Failed to delete company"
      );
    } finally {
      setDeleting(false);
    }
  };

  const name = (c: Company) =>
    c.company_name ?? (c as { companyName?: string }).companyName ?? c.id;
  const logoUrl = (c: Company) => c.companyLogo ?? null;

  return (
    <div>
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Companies
          </h3>
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <input
              type="text"
              placeholder="Search name, industry…"
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
            Loading companies…
          </p>
        ) : (items ?? []).length === 0 ? (
          <p className="text-theme-sm text-gray-500 dark:text-gray-400">
            No companies found.
          </p>
        ) : (
          <>
            <div
              className="overflow-x-auto"
              style={{ overscrollBehaviorX: "contain" }}
            >
              <table className="min-w-max w-full border-separate border-spacing-x-4 border-spacing-y-0 text-left text-theme-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="px-3 pb-3 font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                      Name
                    </th>
                    <th className="px-3 pb-3 font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                      Admin
                    </th>
                    <th className="px-3 pb-3 font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                      Industry
                    </th>
                    <th className="px-3 pb-3 font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                      Primary use
                    </th>
                    <th className="px-3 pb-3 font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                      Status
                    </th>
                    <th className="px-3 pb-3 font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                      Last activity
                    </th>
                    <th className="px-3 pb-3 font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                      Projects
                    </th>
                    <th className="px-3 pb-3 font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                      Clients
                    </th>
                    <th className="px-3 pb-3 font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                      Employees
                    </th>
                    <th className="px-3 pb-3 font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(items ?? []).map((c) => (
                    <tr
                      key={c.id}
                      className="border-b border-gray-100 dark:border-gray-800"
                    >
                      <td className="px-3 py-3 whitespace-nowrap text-gray-800 dark:text-white/90">
                        <Link
                          href={`/companies/${c.id}`}
                          title="View company"
                          aria-label={`View company ${name(c)}`}
                          className="inline-flex items-center gap-3 rounded-lg hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500/50 dark:hover:bg-gray-800 dark:hover:text-white"
                        >
                          {logoUrl(c) ? (
                            <img
                              src={logoUrl(c)!}
                              alt={`${name(c)} logo`}
                              className="h-8 w-8 rounded-lg border border-gray-200 object-cover dark:border-gray-700"
                            />
                          ) : (
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-gray-100 text-theme-xs font-medium text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
                              {name(c).charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span className="font-medium">{name(c)}</span>
                        </Link>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-gray-600 dark:text-gray-400">
                        {adminDisplayName(c.createdBy)}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-gray-600 dark:text-gray-400">
                        {labelFrom(c.industry)}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-gray-600 dark:text-gray-400">
                        {labelFrom(c.primaryUse)}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        {c.status ? (
                          <span
                            className={
                              String(c.status).toLowerCase() === "active"
                                ? "inline-flex rounded-full px-2.5 py-0.5 text-theme-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                                : "inline-flex rounded-full px-2.5 py-0.5 text-theme-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                            }
                          >
                            {c.status}
                          </span>
                        ) : (
                          <span className="text-gray-500 dark:text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                          <span>{formatLastActivity(c.lastActivityAt)}</span>
                          {c.inactivityState &&
                            c.inactivityState !== 'active' &&
                            c.inactivityState !== 'unknown' && (
                              <span className={inactivityBadgeClass(c.inactivityState)}>
                                {c.inactivityState === 'warning'
                                  ? 'Inactive'
                                  : 'Delete due'}
                              </span>
                            )}
                        </div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-gray-600 dark:text-gray-400">
                        {c.totalProject ?? c.projects?.length ?? "—"}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-gray-600 dark:text-gray-400">
                        {c.totalClient ?? c.clients?.length ?? "—"}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-gray-600 dark:text-gray-400">
                        {c.totalEmployee ?? "—"}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Link
                            href={`/companies/${c.id}`}
                            title="View"
                            className="inline-flex rounded-lg p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
                            aria-label="View company"
                          >
                            <span className="h-5 w-5"><EyeIcon /></span>
                          </Link>
                          <button
                            type="button"
                            onClick={() => openEdit(c)}
                            title="Edit"
                            aria-label="Edit company"
                            className="inline-flex rounded-lg p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
                          >
                            <span className="h-5 w-5"><PencilIcon /></span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDeleteId(c.id);
                              setDeleteConfirmText("");
                              setDeleteError(null);
                            }}
                            title="Delete"
                            aria-label="Delete company"
                            className="inline-flex rounded-lg p-2 text-error-600 hover:bg-error-50 dark:text-error-400 dark:hover:bg-error-950"
                          >
                            <span className="h-5 w-5"><TrashBinIcon /></span>
                          </button>
                        </div>
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

      {/* Edit modal */}
      {editCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
            <h4 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
              Edit company
            </h4>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-theme-xs font-medium text-gray-700 dark:text-gray-300">
                  Company name
                </label>
                <input
                  type="text"
                  value={editForm.company_name ?? ""}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, company_name: e.target.value }))
                  }
                  className="h-10 w-full rounded-lg border border-gray-200 bg-transparent px-3 text-theme-sm dark:border-gray-700 dark:bg-white/[0.03] dark:text-white/90"
                />
              </div>
              <div>
                <label className="mb-1 block text-theme-xs font-medium text-gray-700 dark:text-gray-300">
                  Industry
                </label>
                <input
                  type="text"
                  value={editForm.industry ?? ""}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, industry: e.target.value }))
                  }
                  className="h-10 w-full rounded-lg border border-gray-200 bg-transparent px-3 text-theme-sm dark:border-gray-700 dark:bg-white/[0.03] dark:text-white/90"
                />
              </div>
              <div>
                <label className="mb-1 block text-theme-xs font-medium text-gray-700 dark:text-gray-300">
                  Primary use
                </label>
                <input
                  type="text"
                  value={editForm.primaryUse ?? ""}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, primaryUse: e.target.value }))
                  }
                  className="h-10 w-full rounded-lg border border-gray-200 bg-transparent px-3 text-theme-sm dark:border-gray-700 dark:bg-white/[0.03] dark:text-white/90"
                />
              </div>
              <div>
                <label className="mb-1 block text-theme-xs font-medium text-gray-700 dark:text-gray-300">
                  Time zone
                </label>
                <input
                  type="text"
                  value={editForm.timeZone ?? ""}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, timeZone: e.target.value }))
                  }
                  className="h-10 w-full rounded-lg border border-gray-200 bg-transparent px-3 text-theme-sm dark:border-gray-700 dark:bg-white/[0.03] dark:text-white/90"
                />
              </div>
              <div>
                <label className="mb-1 block text-theme-xs font-medium text-gray-700 dark:text-gray-300">
                  Status
                </label>
                <input
                  type="text"
                  value={editForm.status ?? ""}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, status: e.target.value }))
                  }
                  className="h-10 w-full rounded-lg border border-gray-200 bg-transparent px-3 text-theme-sm dark:border-gray-700 dark:bg-white/[0.03] dark:text-white/90"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditCompany(null)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-theme-sm dark:border-gray-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={saving}
                className="rounded-lg bg-brand-500 px-4 py-2 text-theme-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
            <p className="mb-2 text-theme-sm font-medium text-gray-800 dark:text-white/90">
              Delete this company and all related data? This cannot be undone.
            </p>
            <p className="mb-3 text-theme-xs text-gray-500 dark:text-gray-400">
              User accounts that belong to other companies are not removed; only their link to this company is deleted.
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
                onClick={() => {
                  setDeleteId(null);
                  setDeleteConfirmText("");
                  setDeleteError(null);
                }}
                className="rounded-lg border border-gray-200 px-4 py-2 text-theme-sm dark:border-gray-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
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
            {deleteError && (
              <p
                className="mt-3 rounded-lg border border-error-200 bg-error-50 px-3 py-2 text-theme-sm text-error-700 dark:border-error-800 dark:bg-error-950 dark:text-error-400"
                role="alert"
              >
                {deleteError}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
