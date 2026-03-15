"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  getCompany,
  getCompanyUsage,
  updateCompany,
  deleteCompany,
} from "@/src/services/api/company.api";
import type {
  Company,
  CompanyUsageResponse,
  UpdateCompanyBody,
} from "@/src/types/company.types";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function companyName(c: Company): string {
  return (
    c.company_name ??
    (c as { companyName?: string }).companyName ??
    c.id
  );
}

export default function CompanyDetailPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [usage, setUsage] = useState<CompanyUsageResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editForm, setEditForm] = useState<UpdateCompanyBody>({});
  const [showEdit, setShowEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    params.then((p) => {
      if (cancelled) return;
      setCompanyId(p.companyId);
    });
    return () => {
      cancelled = true;
    };
  }, [params]);

  useEffect(() => {
    if (!companyId) return;
    setLoading(true);
    setError(null);
    Promise.all([getCompany(companyId), getCompanyUsage(companyId)])
      .then(([c, u]) => {
        setCompany(c);
        setUsage(u);
        setEditForm({
          company_name: c.company_name ?? (c as { companyName?: string }).companyName ?? "",
          industry: c.industry ?? "",
          primaryUse: c.primaryUse ?? "",
          timeZone: c.timeZone ?? "",
          status: c.status ?? "",
          slug: c.slug ?? "",
        });
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load company");
      })
      .finally(() => setLoading(false));
  }, [companyId]);

  const handleSaveEdit = async () => {
    if (!companyId || !company) return;
    setSaving(true);
    try {
      const updated = await updateCompany(companyId, editForm);
      setCompany({ ...company, ...updated });
      setShowEdit(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update company");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!companyId) return;
    setDeleting(true);
    try {
      await deleteCompany(companyId);
      window.location.href = "/companies";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete company");
    } finally {
      setDeleting(false);
    }
  };

  const logoUrl = company
    ? (company as { companyLogo?: string }).companyLogo
    : undefined;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Link
          href="/companies"
          className="text-theme-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white/90"
        >
          ← Back to Companies
        </Link>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        {error && (
          <div className="mb-4 rounded-lg border border-error-200 bg-error-50 px-4 py-2 text-theme-sm text-error-700 dark:border-error-800 dark:bg-error-950 dark:text-error-400">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-theme-sm text-gray-500 dark:text-gray-400">
            Loading company…
          </p>
        ) : !company ? (
          <p className="text-theme-sm text-gray-500 dark:text-gray-400">
            Company not found.
          </p>
        ) : (
          <div className="space-y-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-center gap-4">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt=""
                    className="h-16 w-16 rounded-xl border border-gray-200 object-cover dark:border-gray-700"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-gray-200 bg-gray-100 text-2xl font-semibold text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
                    {companyName(company).charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h1 className="text-xl font-semibold text-gray-800 dark:text-white/90">
                    {companyName(company)}
                  </h1>
                  <p className="text-theme-sm text-gray-500 dark:text-gray-400">
                    {company.status ?? "—"} · {company.industry ?? "—"}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setShowEdit(true)}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-theme-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="rounded-lg border border-error-200 px-4 py-2 text-theme-sm font-medium text-error-600 hover:bg-error-50 dark:border-error-800 dark:text-error-400 dark:hover:bg-error-950"
                >
                  Delete
                </button>
              </div>
            </div>

            <section>
              <h2 className="mb-4 text-theme-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Details
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <p className="text-theme-xs text-gray-500 dark:text-gray-400">
                    Name
                  </p>
                  <p className="font-medium text-gray-800 dark:text-white/90">
                    {companyName(company)}
                  </p>
                </div>
                <div>
                  <p className="text-theme-xs text-gray-500 dark:text-gray-400">
                    Industry
                  </p>
                  <p className="font-medium text-gray-800 dark:text-white/90">
                    {company.industry ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="text-theme-xs text-gray-500 dark:text-gray-400">
                    Primary use
                  </p>
                  <p className="font-medium text-gray-800 dark:text-white/90">
                    {company.primaryUse ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="text-theme-xs text-gray-500 dark:text-gray-400">
                    Time zone
                  </p>
                  <p className="font-medium text-gray-800 dark:text-white/90">
                    {company.timeZone ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="text-theme-xs text-gray-500 dark:text-gray-400">
                    Status
                  </p>
                  <p className="font-medium text-gray-800 dark:text-white/90">
                    {company.status ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="text-theme-xs text-gray-500 dark:text-gray-400">
                    Slug
                  </p>
                  <p className="font-medium text-gray-800 dark:text-white/90">
                    {company.slug ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="text-theme-xs text-gray-500 dark:text-gray-400">
                    Created
                  </p>
                  <p className="font-medium text-gray-800 dark:text-white/90">
                    {company.createdAt
                      ? new Date(company.createdAt).toLocaleString()
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-theme-xs text-gray-500 dark:text-gray-400">
                    Updated
                  </p>
                  <p className="font-medium text-gray-800 dark:text-white/90">
                    {company.updatedAt
                      ? new Date(company.updatedAt).toLocaleString()
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-theme-xs text-gray-500 dark:text-gray-400">
                    ID
                  </p>
                  <p className="font-mono text-theme-xs text-gray-600 dark:text-gray-400">
                    {company.id}
                  </p>
                </div>
              </div>
            </section>

            {usage && (
              <section>
                <h2 className="mb-4 text-theme-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Usage
                </h2>
                <div className="flex flex-wrap gap-4 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                  <span className="text-theme-sm text-gray-600 dark:text-gray-400">
                    Users: {usage.usage?.users ?? 0}
                  </span>
                  <span className="text-theme-sm text-gray-600 dark:text-gray-400">
                    Projects: {usage.usage?.projects ?? 0}
                  </span>
                  <span className="text-theme-sm text-gray-600 dark:text-gray-400">
                    Clients: {usage.usage?.clients ?? 0}
                  </span>
                  <span className="text-theme-sm text-gray-600 dark:text-gray-400">
                    Tasks: {usage.usage?.tasks ?? 0}
                  </span>
                  <span className="text-theme-sm text-gray-600 dark:text-gray-400">
                    Files: {usage.usage?.files ?? 0}
                  </span>
                  <span className="text-theme-sm text-gray-600 dark:text-gray-400">
                    Storage: {formatBytes(usage.usage?.storageBytes ?? 0)}
                  </span>
                </div>
              </section>
            )}

            {(company.userCompanies?.length ?? 0) > 0 && (
              <section>
                <h2 className="mb-4 text-theme-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  User associations
                </h2>
                <ul className="space-y-1 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                  {company.userCompanies!.map((uc) => (
                    <li
                      key={uc.id}
                      className="text-theme-sm text-gray-700 dark:text-gray-300"
                    >
                      {uc.userId ?? uc.id}
                      {uc.role ? ` · ${uc.role}` : ""}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {(company.projects?.length ?? 0) > 0 && (
              <section>
                <h2 className="mb-4 text-theme-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Projects
                </h2>
                <ul className="space-y-1 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                  {company.projects!.map((p) => (
                    <li
                      key={p.id}
                      className="text-theme-sm text-gray-700 dark:text-gray-300"
                    >
                      {p.name ?? p.id}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {(company.clients?.length ?? 0) > 0 && (
              <section>
                <h2 className="mb-4 text-theme-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Clients
                </h2>
                <ul className="space-y-1 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                  {company.clients!.map((cl) => (
                    <li
                      key={cl.id}
                      className="text-theme-sm text-gray-700 dark:text-gray-300"
                    >
                      {cl.name ?? cl.id}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}
      </div>

      {/* Edit modal */}
      {showEdit && company && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
            <h4 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
              Edit company
            </h4>
            <div className="space-y-3">
              {[
                { key: "company_name", label: "Company name" },
                { key: "industry", label: "Industry" },
                { key: "primaryUse", label: "Primary use" },
                { key: "timeZone", label: "Time zone" },
                { key: "status", label: "Status" },
                { key: "slug", label: "Slug" },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="mb-1 block text-theme-xs font-medium text-gray-700 dark:text-gray-300">
                    {label}
                  </label>
                  <input
                    type="text"
                    value={(editForm as Record<string, string>)[key] ?? ""}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, [key]: e.target.value }))
                    }
                    className="h-10 w-full rounded-lg border border-gray-200 bg-transparent px-3 text-theme-sm dark:border-gray-700 dark:bg-white/[0.03] dark:text-white/90"
                  />
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowEdit(false)}
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
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
            <p className="mb-4 text-theme-sm text-gray-700 dark:text-gray-300">
              Delete this company and all related data? This cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
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
