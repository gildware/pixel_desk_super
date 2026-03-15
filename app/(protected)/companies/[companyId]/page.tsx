"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  getCompany,
  getCompanyUsage,
  updateCompany,
  deleteCompany,
  listCompanyEmployees,
  listCompanyClients,
  listCompanyProjects,
} from "@/src/services/api/company.api";
import type {
  Company,
  CompanyUsageResponse,
  UpdateCompanyBody,
  LabelValue,
  CompanyEmployeeItem,
  CompanyClientItem,
  CompanyProjectItem,
} from "@/src/types/company.types";

function labelFrom(field: string | LabelValue | undefined): string {
  if (field == null) return "—";
  return typeof field === "object" ? field.label : field;
}
function valueFrom(field: string | LabelValue | undefined): string {
  if (field == null) return "";
  return typeof field === "object" ? field.value : field;
}

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
    try {
      await deleteCompany(companyId);
      window.location.href = "/companies";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete company");
    } finally {
      setDeleting(false);
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
                  <p className="font-medium text-gray-800 dark:text-white/90">
                    {company.status ?? "—"}
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
                          className="h-6 w-6 rounded-full object-cover"
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
                        <table className="w-full border-collapse text-left text-theme-sm">
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
                        <table className="w-full border-collapse text-left text-theme-sm">
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
                        <table className="w-full border-collapse text-left text-theme-sm">
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
