"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  listCompanies,
  updateCompany,
  deleteCompany,
} from "@/src/services/api/company.api";
import type { Company, UpdateCompanyBody } from "@/src/types/company.types";

const DEFAULT_LIMIT = 20;

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
      industry: company.industry ?? "",
      primaryUse: company.primaryUse ?? "",
      timeZone: company.timeZone ?? "",
      status: company.status ?? "",
      slug: company.slug ?? "",
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
    try {
      await deleteCompany(deleteId);
      setItems((prev) => prev.filter((c) => c.id !== deleteId));
      setTotal((t) => Math.max(0, t - 1));
      setDeleteId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete company");
    } finally {
      setDeleting(false);
    }
  };

  const name = (c: Company) =>
    c.company_name ?? (c as { companyName?: string }).companyName ?? c.id;

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
              placeholder="Search name, industry, slug…"
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
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-theme-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="pb-3 font-medium text-gray-700 dark:text-gray-300">
                      Name
                    </th>
                    <th className="pb-3 font-medium text-gray-700 dark:text-gray-300">
                      Industry
                    </th>
                    <th className="pb-3 font-medium text-gray-700 dark:text-gray-300">
                      Status
                    </th>
                    <th className="pb-3 font-medium text-gray-700 dark:text-gray-300">
                      Slug
                    </th>
                    <th className="pb-3 font-medium text-gray-700 dark:text-gray-300">
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
                      <td className="py-3 text-gray-800 dark:text-white/90">
                        {name(c)}
                      </td>
                      <td className="py-3 text-gray-600 dark:text-gray-400">
                        {c.industry ?? "—"}
                      </td>
                      <td className="py-3 text-gray-600 dark:text-gray-400">
                        {c.status ?? "—"}
                      </td>
                      <td className="py-3 text-gray-600 dark:text-gray-400">
                        {c.slug ?? "—"}
                      </td>
                      <td className="py-3">
                        <div className="flex flex-wrap gap-2">
                          <Link
                            href={`/companies/${c.id}`}
                            className="text-brand-600 hover:underline dark:text-brand-400"
                          >
                            View
                          </Link>
                          <button
                            type="button"
                            onClick={() => openEdit(c)}
                            className="text-gray-600 hover:underline dark:text-gray-400"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteId(c.id)}
                            className="text-error-600 hover:underline dark:text-error-400"
                          >
                            Delete
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
              <div>
                <label className="mb-1 block text-theme-xs font-medium text-gray-700 dark:text-gray-300">
                  Slug
                </label>
                <input
                  type="text"
                  value={editForm.slug ?? ""}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, slug: e.target.value }))
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
          <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
            <p className="mb-4 text-theme-sm text-gray-700 dark:text-gray-300">
              Delete this company and all related data? This cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteId(null)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-theme-sm dark:border-gray-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-lg bg-error-500 px-4 py-2 text-theme-sm font-medium text-white hover:bg-error-600 disabled:opacity-50"
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
