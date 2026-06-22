"use client";

import React, { useCallback, useEffect, useState } from "react";
import { listAuditLogs } from "@/src/services/api/auditLogs.api";
import { listCompanies } from "@/src/services/api/company.api";
import type { AuditLogRow, AuditOutcome } from "@/src/types/auditLogs.types";
import type { Company } from "@/src/types/company.types";

const DEFAULT_LIMIT = 50;

const STICKY_CARD_BG =
  "bg-white shadow-[4px_0_10px_-4px_rgba(15,23,42,0.12)] dark:bg-gray-900 dark:shadow-[4px_0_10px_-4px_rgba(0,0,0,0.45)]";

const RESOURCE_TYPE_OPTIONS = [
  { value: "", label: "All types" },
  { value: "company", label: "Company" },
  { value: "user", label: "User" },
  { value: "employee", label: "Employee" },
  { value: "client", label: "Client" },
  { value: "project", label: "Project" },
  { value: "task", label: "Task" },
  { value: "taskboard", label: "Taskboard" },
  { value: "timesheet", label: "Timesheet" },
  { value: "leave", label: "Leave" },
  { value: "holiday", label: "Holiday" },
  { value: "notice", label: "Notice" },
  { value: "role", label: "Role" },
  { value: "team", label: "Team" },
  { value: "file", label: "File" },
  { value: "auth", label: "Auth" },
  { value: "support", label: "Support" },
  { value: "platform", label: "Platform" },
];

const selectClass =
  "h-10 w-full min-w-[140px] rounded-lg border border-gray-200 bg-transparent px-3 text-theme-sm text-gray-800 dark:border-gray-700 dark:bg-white/[0.03] dark:text-white/90";
const inputClass =
  "h-10 rounded-lg border border-gray-200 bg-transparent px-3 text-theme-sm text-gray-800 placeholder:text-gray-400 dark:border-gray-700 dark:bg-white/[0.03] dark:text-white/90 dark:placeholder:text-gray-500";

function companyLabel(c: Company): string {
  return c.company_name ?? c.companyName ?? c.id;
}

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function outcomeBadgeClass(outcome: AuditOutcome): string {
  return outcome === "success"
    ? "inline-flex rounded-full px-2.5 py-0.5 text-theme-xs font-medium bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400"
    : "inline-flex rounded-full px-2.5 py-0.5 text-theme-xs font-medium bg-error-100 text-error-700 dark:bg-error-900/40 dark:text-error-300";
}

function formatAction(action: string): string {
  return action.replace(/\./g, " · ").replace(/_/g, " ");
}

export default function AuditLogsPage() {
  const [items, setItems] = useState<AuditLogRow[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(DEFAULT_LIMIT);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [companies, setCompanies] = useState<Company[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(true);

  const [companyId, setCompanyId] = useState("");
  const [outcome, setOutcome] = useState<"" | AuditOutcome>("");
  const [resourceType, setResourceType] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [actionInput, setActionInput] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [selected, setSelected] = useState<AuditLogRow | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setCompaniesLoading(true);
      try {
        const res = await listCompanies({ page: 1, limit: 100 });
        if (!cancelled) {
          setCompanies(Array.isArray(res.items) ? res.items : []);
        }
      } catch {
        if (!cancelled) setCompanies([]);
      } finally {
        if (!cancelled) setCompaniesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listAuditLogs({
        page,
        limit,
        companyId: companyId || undefined,
        outcome: outcome || undefined,
        resourceType: resourceType || undefined,
        action: actionFilter || undefined,
        from: fromDate ? new Date(fromDate).toISOString() : undefined,
        to: toDate
          ? new Date(`${toDate}T23:59:59.999`).toISOString()
          : undefined,
      });
      setItems(Array.isArray(res?.items) ? res.items : []);
      setTotal(typeof res?.total === "number" ? res.total : 0);
      setTotalPages(typeof res?.totalPages === "number" ? res.totalPages : 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load audit logs");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [
    page,
    limit,
    companyId,
    outcome,
    resourceType,
    actionFilter,
    fromDate,
    toDate,
  ]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const applyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    setActionFilter(actionInput.trim());
    setPage(1);
  };

  const resetFilters = () => {
    setCompanyId("");
    setOutcome("");
    setResourceType("");
    setActionInput("");
    setActionFilter("");
    setFromDate("");
    setToDate("");
    setPage(1);
  };

  return (
    <div>
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <div className="mb-5">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Audit logs
          </h3>
          <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
            Track success and failure events across all companies — logins,
            projects, employees, clients, tasks, and more.
          </p>
        </div>

        <form
          onSubmit={applyFilters}
          className="mb-5 grid gap-3 rounded-xl border border-gray-100 bg-gray-50/80 p-4 dark:border-gray-800 dark:bg-gray-900/40 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          <label className="block">
            <span className="mb-1.5 block text-theme-xs font-medium text-gray-600 dark:text-gray-400">
              Company
            </span>
            <select
              value={companyId}
              onChange={(e) => {
                setCompanyId(e.target.value);
                setPage(1);
              }}
              disabled={companiesLoading}
              className={selectClass}
            >
              <option value="">All companies</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {companyLabel(c)}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-theme-xs font-medium text-gray-600 dark:text-gray-400">
              Outcome
            </span>
            <select
              value={outcome}
              onChange={(e) => {
                setOutcome(e.target.value as "" | AuditOutcome);
                setPage(1);
              }}
              className={selectClass}
            >
              <option value="">All outcomes</option>
              <option value="success">Success</option>
              <option value="failure">Failure</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-theme-xs font-medium text-gray-600 dark:text-gray-400">
              Resource type
            </span>
            <select
              value={resourceType}
              onChange={(e) => {
                setResourceType(e.target.value);
                setPage(1);
              }}
              className={selectClass}
            >
              {RESOURCE_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value || "all"} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-theme-xs font-medium text-gray-600 dark:text-gray-400">
              Action (e.g. project.created)
            </span>
            <input
              type="text"
              value={actionInput}
              onChange={(e) => setActionInput(e.target.value)}
              placeholder="project.created"
              className={`${inputClass} w-full`}
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-theme-xs font-medium text-gray-600 dark:text-gray-400">
              From date
            </span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setPage(1);
              }}
              className={`${inputClass} w-full`}
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-theme-xs font-medium text-gray-600 dark:text-gray-400">
              To date
            </span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setPage(1);
              }}
              className={`${inputClass} w-full`}
            />
          </label>

          <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-1">
            <button
              type="submit"
              className="rounded-lg bg-brand-500 px-4 py-2 text-theme-sm font-medium text-white hover:bg-brand-600"
            >
              Apply
            </button>
            <button
              type="button"
              onClick={resetFilters}
              className="rounded-lg border border-gray-200 px-4 py-2 text-theme-sm dark:border-gray-700"
            >
              Reset
            </button>
          </div>
        </form>

        {error && (
          <div className="mb-4 rounded-lg border border-error-200 bg-error-50 px-4 py-2 text-theme-sm text-error-700 dark:border-error-800 dark:bg-error-950 dark:text-error-400">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-theme-sm text-gray-500 dark:text-gray-400">
            Loading audit logs…
          </p>
        ) : items.length === 0 ? (
          <p className="text-theme-sm text-gray-500 dark:text-gray-400">
            No audit logs match your filters.
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
                      Time
                    </th>
                    <th className="px-3 pb-3 font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                      Company
                    </th>
                    <th className="px-3 pb-3 font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                      User
                    </th>
                    <th className="px-3 pb-3 font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                      Action
                    </th>
                    <th className="px-3 pb-3 font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                      Type
                    </th>
                    <th className="px-3 pb-3 font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                      Outcome
                    </th>
                    <th className="px-3 pb-3 font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap min-w-[200px]">
                      Message
                    </th>
                    <th className="px-3 pb-3 font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-gray-100 dark:border-gray-800"
                    >
                      <td
                        className={`sticky left-0 z-20 ${STICKY_CARD_BG} px-3 py-3 whitespace-nowrap text-gray-600 dark:text-gray-400`}
                      >
                        {formatDateTime(row.createdAt)}
                      </td>
                      <td className="px-3 py-3 text-gray-800 dark:text-white/90 whitespace-nowrap">
                        {row.companyName ?? row.companyId ?? "—"}
                      </td>
                      <td className="px-3 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {row.userEmail ?? row.userId ?? "—"}
                      </td>
                      <td className="px-3 py-3 text-gray-800 dark:text-white/90 whitespace-nowrap">
                        <span title={row.action}>{formatAction(row.action)}</span>
                      </td>
                      <td className="px-3 py-3 text-gray-600 dark:text-gray-400 capitalize whitespace-nowrap">
                        {row.resourceType.replace(/_/g, " ")}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className={outcomeBadgeClass(row.outcome)}>
                          {row.outcome}
                        </span>
                        <span className="ml-1.5 text-theme-xs text-gray-400">
                          {row.statusCode}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-gray-600 dark:text-gray-400 max-w-xs truncate">
                        {row.errorMessage ?? row.message ?? "—"}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelected(row)}
                          className="text-theme-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

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
          </>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h4 className="text-base font-semibold text-gray-800 dark:text-white/90">
                  Audit log detail
                </h4>
                <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
                  {formatDateTime(selected.createdAt)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-lg border border-gray-200 px-3 py-1 text-theme-sm dark:border-gray-700"
              >
                Close
              </button>
            </div>

            <dl className="grid gap-3 text-theme-sm sm:grid-cols-2">
              <DetailItem label="Outcome">
                <span className={outcomeBadgeClass(selected.outcome)}>
                  {selected.outcome}
                </span>
                <span className="ml-2 text-gray-500">HTTP {selected.statusCode}</span>
              </DetailItem>
              <DetailItem label="Company">
                {selected.companyName ?? selected.companyId ?? "—"}
              </DetailItem>
              <DetailItem label="User">
                {selected.userEmail ?? selected.userId ?? "—"}
              </DetailItem>
              <DetailItem label="Action">{selected.action}</DetailItem>
              <DetailItem label="Resource type">{selected.resourceType}</DetailItem>
              <DetailItem label="Resource ID">
                {selected.resourceId ?? "—"}
              </DetailItem>
              <DetailItem label="Request ID">
                {selected.requestId ?? "—"}
              </DetailItem>
              <DetailItem label="Method / path">
                {selected.method} {selected.path}
              </DetailItem>
              <DetailItem label="Message" className="sm:col-span-2">
                {selected.message ?? "—"}
              </DetailItem>
              {selected.errorMessage && (
                <DetailItem label="Error" className="sm:col-span-2">
                  <span className="text-error-600 dark:text-error-400">
                    {selected.errorMessage}
                  </span>
                </DetailItem>
              )}
              {selected.metadata &&
                Object.keys(selected.metadata).length > 0 && (
                  <DetailItem label="Metadata" className="sm:col-span-2">
                    <pre className="mt-1 overflow-x-auto rounded-lg bg-gray-50 p-3 text-theme-xs text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                      {JSON.stringify(selected.metadata, null, 2)}
                    </pre>
                  </DetailItem>
                )}
            </dl>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailItem({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="text-theme-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {label}
      </dt>
      <dd className="mt-0.5 text-gray-800 dark:text-white/90">{children}</dd>
    </div>
  );
}
