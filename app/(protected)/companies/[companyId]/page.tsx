"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  getCompany,
  getCompanyUsage,
  updateCompany,
  deleteCompany,
  sendCompanyInactivityManualEmail,
  listCompanyEmployees,
  listCompanyClients,
  listCompanyProjects,
} from "@/src/services/api/company.api";
import { listPlatformDashboardUsesAdmin } from "@/src/services/api/platformCatalog.api";
import type {
  Company,
  CompanyUsageResponse,
  UpdateCompanyBody,
  LabelValue,
  CompanyEmployeeItem,
  CompanyClientItem,
  CompanyProjectItem,
} from "@/src/types/company.types";
import type { PlatformDashboardUseAdminRow } from "@/src/types/platformCatalog.types";

function labelFrom(field: string | LabelValue | undefined): string {
  if (field == null) return "—";
  return typeof field === "object" ? field.label : field;
}
function valueFrom(field: string | LabelValue | undefined): string {
  if (field == null) return "";
  return typeof field === "object" ? field.value : field;
}

/** Must be typed exactly (case-insensitive) to enable Delete in the confirmation modal. */
const DELETE_CONFIRM_PHRASE = "DELETE";

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

function formatLastActivity(iso?: string | null): string {
  // Keep last-activity formatting consistent with other timestamps.
  return formatDateTime(iso);
}

function inactivityBadgeClass(
  state?: Company["inactivityState"],
): string {
  if (state === "active") {
    return "inline-flex rounded-full px-2.5 py-0.5 text-theme-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300";
  }
  if (state === "delete_due") {
    return "inline-flex rounded-full px-2.5 py-0.5 text-theme-xs font-medium bg-error-100 text-error-700 dark:bg-error-900/40 dark:text-error-300";
  }
  if (state === "warning") {
    return "inline-flex rounded-full px-2.5 py-0.5 text-theme-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300";
  }
  return "";
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
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  type InactivityAction = "warning" | "delete_due";
  const [showInactivityConfirm, setShowInactivityConfirm] = useState(false);
  const [inactivityAction, setInactivityAction] =
    useState<InactivityAction | null>(null);
  const [inactivityError, setInactivityError] = useState<string | null>(null);
  const [inactivitySentMessage, setInactivitySentMessage] = useState<
    string | null
  >(null);
  const [lastInactivityEmailSentFor, setLastInactivityEmailSentFor] =
    useState<InactivityAction | null>(null);
  const [sendingInactivity, setSendingInactivity] = useState(false);
  const [dashboardUses, setDashboardUses] = useState<
    PlatformDashboardUseAdminRow[]
  >([]);
  const [dashboardUsesLoading, setDashboardUsesLoading] = useState(false);

  type TabId = "projects" | "employees" | "clients";
  const [activeTab, setActiveTab] = useState<TabId>("projects");
  const [projects, setProjects] = useState<CompanyProjectItem[]>([]);
  const [employees, setEmployees] = useState<CompanyEmployeeItem[]>([]);
  const [clients, setClients] = useState<CompanyClientItem[]>([]);
  const [projectsTotal, setProjectsTotal] = useState(0);
  const [employeesTotal, setEmployeesTotal] = useState(0);
  const [clientsTotal, setClientsTotal] = useState(0);
  const [projectsPage, setProjectsPage] = useState(1);
  const [employeesPage, setEmployeesPage] = useState(1);
  const [clientsPage, setClientsPage] = useState(1);
  const [projectsTotalPages, setProjectsTotalPages] = useState(0);
  const [employeesTotalPages, setEmployeesTotalPages] = useState(0);
  const [clientsTotalPages, setClientsTotalPages] = useState(0);
  const [tabSearch, setTabSearch] = useState("");
  const [tabSearchInput, setTabSearchInput] = useState("");
  const [tabLoading, setTabLoading] = useState(false);
  const limit = 20;

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
    let cancelled = false;
    setDashboardUsesLoading(true);
    listPlatformDashboardUsesAdmin()
      .then((rows) => {
        if (cancelled) return;
        setDashboardUses(rows);
      })
      .catch(() => {
        if (cancelled) return;
        setDashboardUses([]);
      })
      .finally(() => {
        if (cancelled) return;
        setDashboardUsesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

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
          industry: valueFrom(c.industry),
          primaryUse: valueFrom(c.primaryUse),
          timeZone: c.timeZone ?? "",
          status: c.status ?? "",
        });
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load company");
      })
      .finally(() => setLoading(false));
  }, [companyId]);

  const fetchProjects = useCallback(async () => {
    if (!companyId) return;
    setTabLoading(true);
    try {
      const res = await listCompanyProjects(companyId, {
        page: projectsPage,
        limit,
        search: tabSearch || undefined,
      });
      setProjects(res.items);
      setProjectsTotal(res.total);
      setProjectsTotalPages(res.totalPages);
    } catch {
      setProjects([]);
    } finally {
      setTabLoading(false);
    }
  }, [companyId, projectsPage, limit, tabSearch]);

  const fetchEmployees = useCallback(async () => {
    if (!companyId) return;
    setTabLoading(true);
    try {
      const res = await listCompanyEmployees(companyId, {
        page: employeesPage,
        limit,
        search: tabSearch || undefined,
      });
      setEmployees(res.items);
      setEmployeesTotal(res.total);
      setEmployeesTotalPages(res.totalPages);
    } catch {
      setEmployees([]);
    } finally {
      setTabLoading(false);
    }
  }, [companyId, employeesPage, limit, tabSearch]);

  const fetchClients = useCallback(async () => {
    if (!companyId) return;
    setTabLoading(true);
    try {
      const res = await listCompanyClients(companyId, {
        page: clientsPage,
        limit,
        search: tabSearch || undefined,
      });
      setClients(res.items);
      setClientsTotal(res.total);
      setClientsTotalPages(res.totalPages);
    } catch {
      setClients([]);
    } finally {
      setTabLoading(false);
    }
  }, [companyId, clientsPage, limit, tabSearch]);

  useEffect(() => {
    if (!companyId) return;
    if (activeTab === "projects") fetchProjects();
    else if (activeTab === "employees") fetchEmployees();
    else if (activeTab === "clients") fetchClients();
  }, [companyId, activeTab, fetchProjects, fetchEmployees, fetchClients]);

  const handleTabSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setTabSearch(tabSearchInput.trim());
    setProjectsPage(1);
    setEmployeesPage(1);
    setClientsPage(1);
  };

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
    setDeleteError(null);
    try {
      await deleteCompany(companyId);
      window.location.href = "/companies";
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : "Failed to delete company"
      );
    } finally {
      setDeleting(false);
    }
  };

  const handleSendInactivityManualEmail = async () => {
    if (!companyId || !inactivityAction) return;
    setSendingInactivity(true);
    setInactivityError(null);
    try {
      const result = await sendCompanyInactivityManualEmail(companyId);
      if (result.deleted) {
        window.location.href = "/companies";
        return;
      }

      if (result.action === "warning_email" && result.sent) {
        setInactivitySentMessage("Reminder email has been sent.");
        setLastInactivityEmailSentFor("warning");
      } else if (result.action === "delete_due_email_delete" && result.sent) {
        setInactivitySentMessage("Deletion email has been sent.");
        setLastInactivityEmailSentFor("delete_due");
      } else if (result.action === "no_action" && !result.sent) {
        setInactivitySentMessage("No email was sent (not inactive).");
      } else {
        setInactivitySentMessage("Request completed.");
      }

      // Refresh view data after sending.
      const [c, u] = await Promise.all([
        getCompany(companyId),
        getCompanyUsage(companyId),
      ]);
      setCompany(c);
      setUsage(u);
      setEditForm({
        company_name: c.company_name ?? (c as { companyName?: string }).companyName ?? "",
        industry: valueFrom(c.industry),
        primaryUse: valueFrom(c.primaryUse),
        timeZone: c.timeZone ?? "",
        status: c.status ?? "",
      });
    } catch (err) {
      setInactivityError(
        err instanceof Error
          ? err.message
          : "Failed to send inactivity email"
      );
    } finally {
      setSendingInactivity(false);
    }
  };

  const logoUrl = company?.companyLogo ?? undefined;

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
                    {company.status ?? "—"} · {labelFrom(company.industry)}
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
                  onClick={() => {
                    setDeleteConfirmText("");
                    setDeleteError(null);
                    setShowDeleteConfirm(true);
                  }}
                  className="rounded-lg border border-error-200 px-4 py-2 text-theme-sm font-medium text-error-600 hover:bg-error-50 dark:border-error-800 dark:text-error-400 dark:hover:bg-error-950"
                >
                  Delete
                </button>
                {(company.inactivityState === "warning" ||
                  company.inactivityState === "delete_due") && (
                  <button
                    type="button"
                    disabled={sendingInactivity}
                    onClick={() => {
                      setInactivityAction(
                        company.inactivityState === "delete_due"
                          ? "delete_due"
                          : "warning",
                      );
                      setInactivityError(null);
                      setInactivitySentMessage(null);
                      setShowInactivityConfirm(true);
                    }}
                    className="rounded-lg border border-brand-200 px-4 py-2 text-theme-sm font-medium text-brand-600 hover:bg-brand-50 dark:border-brand-800 dark:text-brand-400 dark:hover:bg-brand-950 disabled:opacity-50"
                  >
                    {company.inactivityState === "warning"
                      ? lastInactivityEmailSentFor === "warning"
                        ? "Resend reminder email"
                        : "Send reminder email"
                      : lastInactivityEmailSentFor === "delete_due"
                        ? "Resend deletion email"
                        : "Send deletion email"}
                  </button>
                )}
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
                    {labelFrom(company.industry)}
                  </p>
                </div>
                <div>
                  <p className="text-theme-xs text-gray-500 dark:text-gray-400">
                    Primary use
                  </p>
                  <p className="font-medium text-gray-800 dark:text-white/90">
                    {labelFrom(company.primaryUse)}
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
                  {company.status ? (
                    <span
                      className={
                        String(company.status).toLowerCase() === "active"
                          ? "inline-flex rounded-full px-2.5 py-0.5 text-theme-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                          : "inline-flex rounded-full px-2.5 py-0.5 text-theme-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                      }
                    >
                      {String(company.status).toLowerCase() === "active"
                        ? "Active"
                        : company.status}
                    </span>
                  ) : (
                    <span className="text-gray-500 dark:text-gray-400">—</span>
                  )}
                </div>
                <div>
                  <p className="text-theme-xs text-gray-500 dark:text-gray-400">
                    Created at
                  </p>
                  <p className="font-medium text-gray-800 dark:text-white/90">
                    {formatDateTime(company.createdAt)}
                  </p>
                </div>
                <div>
                  <p className="text-theme-xs text-gray-500 dark:text-gray-400">
                    Updated at
                  </p>
                  <p className="font-medium text-gray-800 dark:text-white/90">
                    {formatDateTime(company.updatedAt)}
                  </p>
                </div>
                <div>
                  <p className="text-theme-xs text-gray-500 dark:text-gray-400">
                    Last activity
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-gray-800 dark:text-white/90">
                      {formatLastActivity(company.lastActivityAt ?? null)}
                    </p>
                    {company.inactivityState &&
                      company.inactivityState !== "unknown" && (
                        <span
                          className={inactivityBadgeClass(company.inactivityState)}
                        >
                          {company.inactivityState === "active"
                            ? "Active"
                            : company.inactivityState === "warning"
                              ? "Inactive"
                              : "Delete due"}
                        </span>
                      )}
                  </div>
                </div>
                {company.createdBy && (
                  <div>
                    <p className="text-theme-xs text-gray-500 dark:text-gray-400">
                      Created by
                    </p>
                    <div className="flex items-center gap-2">
                      {company.createdBy.profilePicture ? (
                        <img
                          src={company.createdBy.profilePicture}
                          alt=""
                          className="h-6 w-6 rounded-full object-cover ring-1 ring-gray-200 dark:ring-gray-700"
                        />
                      ) : null}
                      <p className="font-medium text-gray-800 dark:text-white/90">
                        {[company.createdBy.firstName, company.createdBy.lastName]
                          .filter(Boolean)
                          .join(" ")}
                      </p>
                    </div>
                  </div>
                )}
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

            <section>
              <h2 className="mb-4 text-theme-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Projects, employees & clients
              </h2>
              <div className="rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="flex flex-wrap items-center gap-3 border-b border-gray-200 p-3 dark:border-gray-700 sm:flex-nowrap">
                  <div className="flex rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
                    {(["projects", "employees", "clients"] as const).map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setActiveTab(tab)}
                        className={`rounded-md px-3 py-1.5 text-theme-sm font-medium capitalize transition-colors ${
                          activeTab === tab
                            ? "bg-white text-gray-900 shadow dark:bg-gray-700 dark:text-white"
                            : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                  <form onSubmit={handleTabSearch} className="flex flex-1 gap-2 min-w-0">
                    <input
                      type="text"
                      placeholder={
                        activeTab === "projects"
                          ? "Search name, key…"
                          : activeTab === "employees"
                            ? "Search name, email…"
                            : "Search name, company, email…"
                      }
                      value={tabSearchInput}
                      onChange={(e) => setTabSearchInput(e.target.value)}
                      className="h-9 flex-1 min-w-0 rounded-lg border border-gray-200 bg-transparent px-3 text-theme-sm text-gray-800 placeholder:text-gray-400 dark:border-gray-700 dark:bg-white/[0.03] dark:text-white/90 dark:placeholder:text-gray-500"
                    />
                    <button
                      type="submit"
                      className="rounded-lg bg-brand-500 px-3 py-1.5 text-theme-sm font-medium text-white hover:bg-brand-600"
                    >
                      Search
                    </button>
                  </form>
                </div>
                <div className="min-h-[200px]">
                  {tabLoading ? (
                    <p className="p-6 text-theme-sm text-gray-500 dark:text-gray-400">
                      Loading…
                    </p>
                  ) : activeTab === "projects" ? (
                    <>
                      <div className="overflow-x-auto">
                        <table className="min-w-max w-full border-separate border-spacing-x-4 border-spacing-y-0 text-left text-theme-sm">
                          <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-700">
                              <th className="p-3 font-medium text-gray-700 dark:text-gray-300">Name</th>
                              <th className="p-3 font-medium text-gray-700 dark:text-gray-300">Key</th>
                              <th className="p-3 font-medium text-gray-700 dark:text-gray-300">Status</th>
                              <th className="p-3 font-medium text-gray-700 dark:text-gray-300">Type</th>
                              <th className="p-3 font-medium text-gray-700 dark:text-gray-300">Start</th>
                              <th className="p-3 font-medium text-gray-700 dark:text-gray-300">End</th>
                            </tr>
                          </thead>
                          <tbody>
                            {projects.length === 0 ? (
                              <tr>
                                <td colSpan={6} className="p-6 text-gray-500 dark:text-gray-400">
                                  No projects found.
                                </td>
                              </tr>
                            ) : (
                              projects.map((p) => (
                                <tr key={p.id} className="border-b border-gray-100 dark:border-gray-800">
                                  <td className="p-3 font-medium text-gray-800 dark:text-white/90">{p.projectName}</td>
                                  <td className="p-3 text-gray-600 dark:text-gray-400">{p.projectKey ?? "—"}</td>
                                  <td className="p-3 text-gray-600 dark:text-gray-400">{p.projectStatus ?? "—"}</td>
                                  <td className="p-3 text-gray-600 dark:text-gray-400">{p.projectType ?? "—"}</td>
                                  <td className="p-3 text-gray-600 dark:text-gray-400">
                                    {p.startDate ? new Date(p.startDate).toLocaleDateString() : "—"}
                                  </td>
                                  <td className="p-3 text-gray-600 dark:text-gray-400">
                                    {p.endDate ? new Date(p.endDate).toLocaleDateString() : "—"}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                      {projectsTotalPages > 1 && (
                        <div className="flex items-center justify-between border-t border-gray-200 p-3 dark:border-gray-700">
                          <p className="text-theme-sm text-gray-500 dark:text-gray-400">
                            Page {projectsPage} of {projectsTotalPages} ({projectsTotal} total)
                          </p>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              disabled={projectsPage <= 1}
                              onClick={() => setProjectsPage((p) => p - 1)}
                              className="rounded-lg border border-gray-200 px-3 py-1.5 text-theme-sm disabled:opacity-50 dark:border-gray-700"
                            >
                              Previous
                            </button>
                            <button
                              type="button"
                              disabled={projectsPage >= projectsTotalPages}
                              onClick={() => setProjectsPage((p) => p + 1)}
                              className="rounded-lg border border-gray-200 px-3 py-1.5 text-theme-sm disabled:opacity-50 dark:border-gray-700"
                            >
                              Next
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : activeTab === "employees" ? (
                    <>
                      <div className="overflow-x-auto">
                        <table className="min-w-max w-full border-separate border-spacing-x-4 border-spacing-y-0 text-left text-theme-sm">
                          <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-700">
                              <th className="p-3 font-medium text-gray-700 dark:text-gray-300">Name</th>
                              <th className="p-3 font-medium text-gray-700 dark:text-gray-300">Email</th>
                              <th className="p-3 font-medium text-gray-700 dark:text-gray-300">Status</th>
                              <th className="p-3 font-medium text-gray-700 dark:text-gray-300">Deactivated</th>
                              <th className="p-3 font-medium text-gray-700 dark:text-gray-300">Joined</th>
                            </tr>
                          </thead>
                          <tbody>
                            {employees.length === 0 ? (
                              <tr>
                                <td colSpan={5} className="p-6 text-gray-500 dark:text-gray-400">
                                  No employees found.
                                </td>
                              </tr>
                            ) : (
                              employees.map((emp) => (
                                <tr key={emp.id} className="border-b border-gray-100 dark:border-gray-800">
                                  <td className="p-3 font-medium text-gray-800 dark:text-white/90">
                                    {emp.user
                                      ? [emp.user.firstName, emp.user.lastName].filter(Boolean).join(" ") || "—"
                                      : "—"}
                                  </td>
                                  <td className="p-3 text-gray-600 dark:text-gray-400">{emp.user?.email ?? "—"}</td>
                                  <td className="p-3 text-gray-600 dark:text-gray-400">{emp.user?.status ?? "—"}</td>
                                  <td className="p-3 text-gray-600 dark:text-gray-400">
                                    {emp.isDeactivated ? "Yes" : "No"}
                                  </td>
                                  <td className="p-3 text-gray-600 dark:text-gray-400">
                                    {emp.createdAt ? new Date(emp.createdAt).toLocaleDateString() : "—"}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                      {employeesTotalPages > 1 && (
                        <div className="flex items-center justify-between border-t border-gray-200 p-3 dark:border-gray-700">
                          <p className="text-theme-sm text-gray-500 dark:text-gray-400">
                            Page {employeesPage} of {employeesTotalPages} ({employeesTotal} total)
                          </p>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              disabled={employeesPage <= 1}
                              onClick={() => setEmployeesPage((p) => p - 1)}
                              className="rounded-lg border border-gray-200 px-3 py-1.5 text-theme-sm disabled:opacity-50 dark:border-gray-700"
                            >
                              Previous
                            </button>
                            <button
                              type="button"
                              disabled={employeesPage >= employeesTotalPages}
                              onClick={() => setEmployeesPage((p) => p + 1)}
                              className="rounded-lg border border-gray-200 px-3 py-1.5 text-theme-sm disabled:opacity-50 dark:border-gray-700"
                            >
                              Next
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <table className="min-w-max w-full border-separate border-spacing-x-4 border-spacing-y-0 text-left text-theme-sm">
                          <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-700">
                              <th className="p-3 font-medium text-gray-700 dark:text-gray-300">Name / Company</th>
                              <th className="p-3 font-medium text-gray-700 dark:text-gray-300">Email</th>
                              <th className="p-3 font-medium text-gray-700 dark:text-gray-300">Location</th>
                              <th className="p-3 font-medium text-gray-700 dark:text-gray-300">Pending</th>
                              <th className="p-3 font-medium text-gray-700 dark:text-gray-300">Created</th>
                            </tr>
                          </thead>
                          <tbody>
                            {clients.length === 0 ? (
                              <tr>
                                <td colSpan={5} className="p-6 text-gray-500 dark:text-gray-400">
                                  No clients found.
                                </td>
                              </tr>
                            ) : (
                              clients.map((cl) => (
                                <tr key={cl.id} className="border-b border-gray-100 dark:border-gray-800">
                                  <td className="p-3 font-medium text-gray-800 dark:text-white/90">
                                    {([cl.firstName, cl.lastName].filter(Boolean).join(" ") || cl.companyName) ?? "—"}
                                  </td>
                                  <td className="p-3 text-gray-600 dark:text-gray-400">{cl.email}</td>
                                  <td className="p-3 text-gray-600 dark:text-gray-400">
                                    {[cl.city, cl.state, cl.country].filter(Boolean).join(", ") || "—"}
                                  </td>
                                  <td className="p-3 text-gray-600 dark:text-gray-400">
                                    {cl.isPending ? "Yes" : "No"}
                                  </td>
                                  <td className="p-3 text-gray-600 dark:text-gray-400">
                                    {cl.createdAt ? new Date(cl.createdAt).toLocaleDateString() : "—"}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                      {clientsTotalPages > 1 && (
                        <div className="flex items-center justify-between border-t border-gray-200 p-3 dark:border-gray-700">
                          <p className="text-theme-sm text-gray-500 dark:text-gray-400">
                            Page {clientsPage} of {clientsTotalPages} ({clientsTotal} total)
                          </p>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              disabled={clientsPage <= 1}
                              onClick={() => setClientsPage((p) => p - 1)}
                              className="rounded-lg border border-gray-200 px-3 py-1.5 text-theme-sm disabled:opacity-50 dark:border-gray-700"
                            >
                              Previous
                            </button>
                            <button
                              type="button"
                              disabled={clientsPage >= clientsTotalPages}
                              onClick={() => setClientsPage((p) => p + 1)}
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
              </div>
            </section>
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
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="mb-1 block text-theme-xs font-medium text-gray-700 dark:text-gray-300">
                    {label}
                  </label>
                  {key === "primaryUse" ? (
                    <select
                      value={editForm.primaryUse ?? ""}
                      onChange={(e) =>
                        setEditForm((f) => ({ ...f, primaryUse: e.target.value }))
                      }
                      disabled={dashboardUsesLoading}
                      className="h-10 w-full rounded-lg border border-gray-200 bg-transparent px-3 text-theme-sm dark:border-gray-700 dark:bg-white/[0.03] dark:text-white/90 disabled:opacity-60"
                    >
                      <option value="" disabled>
                        {dashboardUsesLoading ? "Loading..." : "Select"}
                      </option>
                      {(dashboardUses ?? [])
                        .filter((u) => u.isActive)
                        .map((u) => (
                          <option key={u.value} value={u.value}>
                            {u.label}
                          </option>
                        ))}
                      {(() => {
                        const current = editForm.primaryUse ?? "";
                        const inList = dashboardUses.some(
                          (u) => u.value === current,
                        );
                        if (!current || inList) return null;
                        // Fallback: avoid leaking internal value when possible.
                        const safeFallbackLabel =
                          company && typeof company.primaryUse === "object" && company.primaryUse
                            ? company.primaryUse.label
                            : "Unknown";
                        return (
                          <option value={current}>
                            {safeFallbackLabel}
                          </option>
                        );
                      })()}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={(editForm as Record<string, string>)[key] ?? ""}
                      onChange={(e) =>
                        setEditForm((f) => ({ ...f, [key]: e.target.value }))
                      }
                      className="h-10 w-full rounded-lg border border-gray-200 bg-transparent px-3 text-theme-sm dark:border-gray-700 dark:bg-white/[0.03] dark:text-white/90"
                    />
                  )}
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
                  setShowDeleteConfirm(false);
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

      {/* Inactivity email confirm */}
      {showInactivityConfirm && company && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
            <p className="mb-2 text-theme-sm font-medium text-gray-800 dark:text-white/90">
              {company.inactivityState === "delete_due"
                ? "Send deletion email and delete this company now?"
                : "Send reminder email to this company admins now?"}
            </p>
            <p className="mb-3 text-theme-xs text-gray-500 dark:text-gray-400">
              Last activity: {formatLastActivity(company.lastActivityAt ?? null)}
            </p>

            {inactivityError && (
              <p
                className="mt-3 rounded-lg border border-error-200 bg-error-50 px-3 py-2 text-theme-sm text-error-700 dark:border-error-800 dark:bg-error-950 dark:text-error-400"
                role="alert"
              >
                {inactivityError}
              </p>
            )}

            {inactivitySentMessage && (
              <p className="mt-3 mb-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-theme-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                {inactivitySentMessage}
              </p>
            )}

            {inactivitySentMessage ? (
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowInactivityConfirm(false);
                    setInactivityAction(null);
                    setInactivityError(null);
                    setInactivitySentMessage(null);
                  }}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-theme-sm dark:border-gray-700"
                >
                  OK
                </button>
              </div>
            ) : (
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowInactivityConfirm(false);
                    setInactivityAction(null);
                    setInactivityError(null);
                    setInactivitySentMessage(null);
                  }}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-theme-sm dark:border-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSendInactivityManualEmail}
                  disabled={sendingInactivity}
                  className="rounded-lg bg-brand-500 px-4 py-2 text-theme-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
                >
                  {sendingInactivity ? "Sending…" : "Confirm"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
