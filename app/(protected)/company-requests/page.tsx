"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  listCompanies,
  updateCompany,
} from "@/src/services/api/company.api";
import type { Company } from "@/src/types/company.types";
import { EyeIcon } from "@/src/icons";

const DEFAULT_LIMIT = 20;
const PENDING_STATUS = "pending_approval";

function labelFrom(
  field: string | { label: string; value: string } | undefined,
): string {
  if (field == null) return "—";
  return typeof field === "object" ? field.label : field;
}

function adminDisplayName(createdBy: Company["createdBy"]): string {
  if (!createdBy) return "—";
  const parts = [createdBy.firstName, createdBy.lastName]
    .filter(
      (p): p is string => typeof p === "string" && p.trim().length > 0,
    )
    .map((p) => p.trim());
  return parts.length > 0 ? parts.join(" ") : "—";
}

function formatDateTime(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";

  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sept",
    "Oct",
    "Nov",
    "Dec",
  ];

  const day = String(d.getDate()).padStart(2, "0");
  const month = monthNames[d.getMonth()] ?? "—";
  const year = d.getFullYear();

  let hours = d.getHours();
  const ampm = hours >= 12 ? "pm" : "am";
  hours = hours % 12;
  if (hours === 0) hours = 12;

  const minutes = String(d.getMinutes()).padStart(2, "0");

  return `${day} ${month} ${year} ${hours}:${minutes} ${ampm}`;
}

export default function CompanyRequestsPage() {
  const [items, setItems] = useState<Company[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(DEFAULT_LIMIT);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listCompanies({
        page,
        limit,
        search: search || undefined,
        status: PENDING_STATUS,
      });
      setItems(Array.isArray(res?.items) ? res.items : []);
      setTotal(typeof res?.total === "number" ? res.total : 0);
      setTotalPages(typeof res?.totalPages === "number" ? res.totalPages : 0);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load company requests",
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

  const handleApprove = async (company: Company) => {
    setApprovingId(company.id);
    setError(null);
    try {
      await updateCompany(company.id, { status: "active" });
      setItems((prev) => prev.filter((c) => c.id !== company.id));
      setTotal((t) => Math.max(0, t - 1));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve company");
    } finally {
      setApprovingId(null);
    }
  };

  const name = (c: Company) =>
    c.company_name ?? (c as { companyName?: string }).companyName ?? c.id;
  const logoUrl = (c: Company) => c.companyLogo ?? null;

  return (
    <div>
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              New company requests
            </h3>
            <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
              Companies waiting for super admin approval before they can access
              the dashboard.
            </p>
          </div>
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

        {!loading && total > 0 && (
          <p className="mb-4 text-theme-sm text-amber-700 dark:text-amber-400">
            {total} {total === 1 ? "request" : "requests"} pending approval
          </p>
        )}

        {error && (
          <div className="mb-4 rounded-lg border border-error-200 bg-error-50 px-4 py-2 text-theme-sm text-error-700 dark:border-error-800 dark:bg-error-950 dark:text-error-400">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-theme-sm text-gray-500 dark:text-gray-400">
            Loading company requests…
          </p>
        ) : (items ?? []).length === 0 ? (
          <p className="text-theme-sm text-gray-500 dark:text-gray-400">
            No companies are waiting for approval.
          </p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-theme-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="px-3 pb-3 font-medium text-gray-700 dark:text-gray-300">
                      Company
                    </th>
                    <th className="px-3 pb-3 font-medium text-gray-700 dark:text-gray-300">
                      Admin
                    </th>
                    <th className="px-3 pb-3 font-medium text-gray-700 dark:text-gray-300">
                      Industry
                    </th>
                    <th className="px-3 pb-3 font-medium text-gray-700 dark:text-gray-300">
                      Primary use
                    </th>
                    <th className="px-3 pb-3 font-medium text-gray-700 dark:text-gray-300">
                      Requested
                    </th>
                    <th className="px-3 pb-3 font-medium text-gray-700 dark:text-gray-300">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((c) => (
                    <tr
                      key={c.id}
                      className="border-b border-gray-100 dark:border-gray-800"
                    >
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-3">
                          {logoUrl(c) ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={logoUrl(c) as string}
                              alt=""
                              className="h-8 w-8 rounded-lg object-cover"
                            />
                          ) : (
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-theme-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                              {name(c).charAt(0).toUpperCase()}
                            </span>
                          )}
                          <span className="font-medium text-gray-800 dark:text-white/90">
                            {name(c)}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-gray-600 dark:text-gray-400">
                        {adminDisplayName(c.createdBy)}
                      </td>
                      <td className="px-3 py-3 text-gray-600 dark:text-gray-400">
                        {labelFrom(c.industry)}
                      </td>
                      <td className="px-3 py-3 text-gray-600 dark:text-gray-400">
                        {labelFrom(c.primaryUse)}
                      </td>
                      <td className="px-3 py-3 text-gray-600 dark:text-gray-400">
                        {formatDateTime(c.createdAt)}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={approvingId === c.id}
                            onClick={() => handleApprove(c)}
                            className="inline-flex rounded-lg px-3 py-1.5 text-theme-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
                          >
                            {approvingId === c.id ? "Approving…" : "Approve"}
                          </button>
                          <Link
                            href={`/companies/${c.id}`}
                            title="View details"
                            className="inline-flex rounded-lg p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
                            aria-label="View company"
                          >
                            <span className="h-5 w-5">
                              <EyeIcon />
                            </span>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <p className="text-theme-sm text-gray-500 dark:text-gray-400">
                  Page {page} of {totalPages} ({total} total)
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-theme-sm text-gray-700 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-theme-sm text-gray-700 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
