"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { ApiRegistry, ApiTestStatus } from "@/src/types/apiRegistry.types";

const selectClass =
  "h-10 min-w-[140px] rounded-lg border border-gray-200 bg-white px-3 text-theme-sm text-gray-800 dark:border-gray-700 dark:bg-white/[0.03] dark:text-white/90";
const inputClass =
  "h-10 min-w-[200px] flex-1 rounded-lg border border-gray-200 bg-white px-3 text-theme-sm text-gray-800 placeholder:text-gray-400 dark:border-gray-700 dark:bg-white/[0.03] dark:text-white/90 dark:placeholder:text-gray-500";

function badgeClass(status: ApiTestStatus): string {
  switch (status) {
    case "tested":
    case "fixed":
    case "working":
      return "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400";
    case "code-review":
      return "bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-400";
    case "ok":
      return "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400";
    case "broken":
      return "bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-400";
    case "not-reviewed":
      return "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400";
    case "not-tested":
    default:
      return "bg-orange-50 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400";
  }
}

function StatusBadge({ status }: { status: ApiTestStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-theme-xs font-medium ${badgeClass(status)}`}
    >
      {status}
    </span>
  );
}

function methodClass(method: string): string {
  switch (method) {
    case "GET":
      return "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300";
    case "POST":
      return "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400";
    case "PUT":
    case "PATCH":
      return "bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-400";
    case "DELETE":
      return "bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-400";
    default:
      return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300";
  }
}

export default function ApiSecurityTracker() {
  const [data, setData] = useState<ApiRegistry | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("");
  const [methodFilter, setMethodFilter] = useState("");
  const [crudFilter, setCrudFilter] = useState("");
  const [scopeFilter, setScopeFilter] = useState("");
  const [tenantFilter, setTenantFilter] = useState("");
  const [liveFilter, setLiveFilter] = useState("");
  const [functionalFilter, setFunctionalFilter] = useState("");

  useEffect(() => {
    fetch("/security/api-registry.json")
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load API registry (${res.status})`);
        return res.json() as Promise<ApiRegistry>;
      })
      .then(setData)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Failed to load API registry");
      });
  }, []);

  const routes = data?.routes ?? [];

  const modules = useMemo(() => [...new Set(routes.map((r) => r.module))].sort(), [routes]);
  const methods = useMemo(() => [...new Set(routes.map((r) => r.method))].sort(), [routes]);
  const cruds = useMemo(() => [...new Set(routes.map((r) => r.crud))].sort(), [routes]);
  const scopes = useMemo(() => [...new Set(routes.map((r) => r.scope))].sort(), [routes]);
  const tenantStatuses = useMemo(
    () => [...new Set(routes.map((r) => r.tenantIsolation))].sort(),
    [routes],
  );
  const liveStatuses = useMemo(() => [...new Set(routes.map((r) => r.liveApi))].sort(), [routes]);
  const functionalStatuses = useMemo(
    () => [...new Set(routes.map((r) => r.functional))].sort(),
    [routes],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return routes.filter((r) => {
      if (moduleFilter && r.module !== moduleFilter) return false;
      if (methodFilter && r.method !== methodFilter) return false;
      if (crudFilter && r.crud !== crudFilter) return false;
      if (scopeFilter && r.scope !== scopeFilter) return false;
      if (tenantFilter && r.tenantIsolation !== tenantFilter) return false;
      if (liveFilter && r.liveApi !== liveFilter) return false;
      if (functionalFilter && r.functional !== functionalFilter) return false;
      if (q) {
        const hay = `${r.path} ${r.module} ${r.notes} ${r.method} ${r.crud}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [
    routes,
    search,
    moduleFilter,
    methodFilter,
    crudFilter,
    scopeFilter,
    tenantFilter,
    liveFilter,
    functionalFilter,
  ]);

  if (error) {
    return (
      <div className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-theme-sm text-error-700 dark:border-error-800 dark:bg-error-950 dark:text-error-400">
        {error}. Run <code className="rounded bg-white/60 px-1 dark:bg-black/20">npm run generate:api-tracker</code> in the backend, then refresh.
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white px-4 py-8 text-center text-theme-sm text-gray-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400">
        Loading API registry…
      </div>
    );
  }

  const statCards = [
    { label: "Total APIs", value: data.summary.total, tone: "" },
    { label: "Modules", value: data.summary.modules ?? new Set(routes.map((r) => r.module)).size, tone: "" },
    { label: "Tenant-scoped", value: data.summary.tenantScope, tone: "" },
    { label: "Isolation tested", value: data.summary.tested, tone: "text-success-600 dark:text-success-400" },
    { label: "Code review only", value: data.summary.codeReview, tone: "text-warning-600 dark:text-warning-400" },
    { label: "Not tested", value: data.summary.notTested, tone: "text-orange-600 dark:text-orange-400" },
  ];

  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      <div className="col-span-12 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.03]"
          >
            <p className="text-theme-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
              {card.label}
            </p>
            <p className={`mt-1 text-2xl font-semibold text-gray-900 dark:text-white/90 ${card.tone}`}>
              {card.value.toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      <div className="col-span-12 flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search path, module, notes…"
          className={inputClass}
        />
        <select value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value)} className={selectClass}>
          <option value="">All modules</option>
          {modules.map((v) => (
            <option key={v} value={v}>{v}</option>
          ))}
        </select>
        <select value={methodFilter} onChange={(e) => setMethodFilter(e.target.value)} className={selectClass}>
          <option value="">All methods</option>
          {methods.map((v) => (
            <option key={v} value={v}>{v}</option>
          ))}
        </select>
        <select value={crudFilter} onChange={(e) => setCrudFilter(e.target.value)} className={selectClass}>
          <option value="">All CRUD</option>
          {cruds.map((v) => (
            <option key={v} value={v}>{v}</option>
          ))}
        </select>
        <select value={scopeFilter} onChange={(e) => setScopeFilter(e.target.value)} className={selectClass}>
          <option value="">All scopes</option>
          {scopes.map((v) => (
            <option key={v} value={v}>{v}</option>
          ))}
        </select>
        <select value={tenantFilter} onChange={(e) => setTenantFilter(e.target.value)} className={selectClass}>
          <option value="">Tenant isolation</option>
          {tenantStatuses.map((v) => (
            <option key={v} value={v}>{v}</option>
          ))}
        </select>
        <select value={liveFilter} onChange={(e) => setLiveFilter(e.target.value)} className={selectClass}>
          <option value="">Live API</option>
          {liveStatuses.map((v) => (
            <option key={v} value={v}>{v}</option>
          ))}
        </select>
        <select value={functionalFilter} onChange={(e) => setFunctionalFilter(e.target.value)} className={selectClass}>
          <option value="">Functional</option>
          {functionalStatuses.map((v) => (
            <option key={v} value={v}>{v}</option>
          ))}
        </select>
        <span className="text-theme-sm text-gray-500 dark:text-gray-400">
          {filtered.length.toLocaleString()} / {routes.length.toLocaleString()} shown
        </span>
      </div>

      <div className="col-span-12 flex flex-wrap gap-3 text-theme-xs text-gray-500 dark:text-gray-400">
        <span><StatusBadge status="tested" /> Live cross-tenant test passed</span>
        <span><StatusBadge status="code-review" /> Static review / hardening only</span>
        <span><StatusBadge status="not-tested" /> Pending</span>
        <span><StatusBadge status="fixed" /> Code hardening applied</span>
      </div>

      <div className="col-span-12 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
        <div className="max-h-[calc(100dvh-22rem)] overflow-auto">
          <table className="min-w-full text-theme-sm">
            <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-900">
              <tr className="border-b border-gray-200 dark:border-gray-800">
                {[
                  "Method",
                  "Path",
                  "Module",
                  "CRUD",
                  "Scope",
                  "Tenant",
                  "Hardening",
                  "Live API",
                  "Frontend",
                  "Admin",
                  "Employee",
                  "Client",
                  "Functional",
                  "Notes",
                ].map((h) => (
                  <th
                    key={h}
                    className="whitespace-nowrap px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={14} className="px-3 py-8 text-center text-gray-500 dark:text-gray-400">
                    No routes match filters.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-gray-100 hover:bg-gray-50/80 dark:border-gray-800 dark:hover:bg-white/[0.02]"
                  >
                    <td className="px-3 py-2">
                      <span className={`inline-flex min-w-[3rem] justify-center rounded px-1.5 py-0.5 text-theme-xs font-bold ${methodClass(r.method)}`}>
                        {r.method}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-mono text-theme-xs text-gray-800 dark:text-gray-200">
                      {r.path}
                    </td>
                    <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{r.module}</td>
                    <td className="px-3 py-2">{r.crud}</td>
                    <td className="px-3 py-2 text-theme-xs text-gray-500">{r.scope}</td>
                    <td className="px-3 py-2"><StatusBadge status={r.tenantIsolation} /></td>
                    <td className="px-3 py-2"><StatusBadge status={r.codeHardening} /></td>
                    <td className="px-3 py-2"><StatusBadge status={r.liveApi} /></td>
                    <td className="px-3 py-2"><StatusBadge status={r.frontend} /></td>
                    <td className="px-3 py-2"><StatusBadge status={r.roles.admin} /></td>
                    <td className="px-3 py-2"><StatusBadge status={r.roles.employee} /></td>
                    <td className="px-3 py-2"><StatusBadge status={r.roles.client} /></td>
                    <td className="px-3 py-2"><StatusBadge status={r.functional} /></td>
                    <td className="max-w-[220px] px-3 py-2 text-theme-xs text-gray-500 dark:text-gray-400">
                      {r.notes || "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="col-span-12 text-theme-xs text-gray-500 dark:text-gray-400">
        Generated {new Date(data.generatedAt).toLocaleString()} · Regenerate with{" "}
        <code className="rounded bg-gray-100 px-1 dark:bg-gray-800">npm run generate:api-tracker</code> in{" "}
        <code className="rounded bg-gray-100 px-1 dark:bg-gray-800">pixel-dashboard-backend</code>
      </div>
    </div>
  );
}
