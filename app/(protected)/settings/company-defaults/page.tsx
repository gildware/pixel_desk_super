"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  fetchPlatformDefaultsOverview,
  patchPlatformBootstrap,
  listPlatformDepartments,
  createPlatformDepartment,
  updatePlatformDepartment,
  deletePlatformDepartment,
  listPlatformDesignations,
  createPlatformDesignation,
  updatePlatformDesignation,
  deletePlatformDesignation,
  listPlatformEmployeeCategories,
  createPlatformEmployeeCategory,
  updatePlatformEmployeeCategory,
  deletePlatformEmployeeCategory,
  listPlatformActivityTypes,
  createPlatformActivityType,
  updatePlatformActivityType,
  deletePlatformActivityType,
  listPlatformLeaveTypes,
  createPlatformLeaveType,
  updatePlatformLeaveType,
  deletePlatformLeaveType,
} from "@/src/services/api/platformDefaults.api";
import type {
  PlatformBootstrap,
  DefaultContractModelDraft,
  PlatformDefaultLeaveTypeRow,
  PlatformDefaultRow,
} from "@/src/types/platformDefaults.types";
import CompanyDefaultRolesTab from "@/src/components/company-defaults/CompanyDefaultRolesTab";

const inputClass =
  "h-10 w-full rounded-lg border border-gray-200 bg-transparent px-3 text-theme-sm text-gray-800 dark:border-gray-700 dark:bg-white/[0.03] dark:text-white/90";
const tableCellInputClass =
  "h-9 min-w-[6rem] rounded border border-gray-200 bg-transparent px-2 text-theme-xs text-gray-800 dark:border-gray-700 dark:bg-white/[0.03] dark:text-white/90";
const weekendDayOptions = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

function newContractModelRow(): DefaultContractModelDraft {
  const today = new Date();
  const renewal = new Date(today);
  renewal.setFullYear(renewal.getFullYear() + 1);
  const ymd = (d: Date) => d.toISOString().slice(0, 10);
  return {
    _key: crypto.randomUUID(),
    modalName: "",
    doa: ymd(today),
    renewalDate: ymd(renewal),
    monthYear: "monthly",
    allotedHours: 160,
    chargeRate: 1,
    currencyConver: "USD",
  };
}

function contractModelsFromBootstrap(
  raw: Record<string, unknown>[] | null | undefined,
): DefaultContractModelDraft[] {
  if (!raw?.length) {
    return [newContractModelRow()];
  }
  return raw.map((item) => ({
    _key: crypto.randomUUID(),
    modalName: String(item.modalName ?? ""),
    doa: String(item.doa ?? "").slice(0, 10),
    renewalDate: String(item.renewalDate ?? "").slice(0, 10),
    monthYear: String(item.monthYear ?? "monthly"),
    allotedHours: Number(item.allotedHours ?? 0),
    chargeRate: Number(item.chargeRate ?? 0),
    currencyConver: String(item.currencyConver ?? "USD"),
  }));
}

function contractModelsToPayload(rows: DefaultContractModelDraft[]): Record<string, unknown>[] {
  return rows.map(({ _key: _k, ...rest }) => ({ ...rest }));
}

type TabId =
  | "bootstrap"
  | "weekendDefaults"
  | "contractModels"
  | "departments"
  | "designations"
  | "categories"
  | "activities"
  | "leaveTypes"
  | "defaultRoles";

export default function CompanyDefaultsPage() {
  const [tab, setTab] = useState<TabId>("bootstrap");
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [counts, setCounts] = useState<Record<string, number> | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmMsg, setConfirmMsg] = useState("");
  const [confirmBusy, setConfirmBusy] = useState(false);
  const confirmActionRef = useRef<null | (() => Promise<void> | void)>(null);

  const openConfirm = useCallback(
    (msg: string, action: () => Promise<void> | void) => {
      confirmActionRef.current = action;
      setConfirmMsg(msg);
      setConfirmOpen(true);
      setConfirmBusy(false);
    },
    [],
  );

  const closeConfirm = useCallback(() => {
    if (confirmBusy) return;
    setConfirmOpen(false);
    setConfirmMsg("");
    confirmActionRef.current = null;
    setConfirmBusy(false);
  }, [confirmBusy]);

  const runConfirm = useCallback(async () => {
    const fn = confirmActionRef.current;
    if (!fn) return closeConfirm();
    try {
      setConfirmBusy(true);
      await fn();
      closeConfirm();
    } finally {
      setConfirmBusy(false);
    }
  }, [closeConfirm]);

  const [bootstrap, setBootstrap] = useState<PlatformBootstrap | null>(null);
  const [contractModelRows, setContractModelRows] = useState<DefaultContractModelDraft[]>([]);
  const [savingProjectIds, setSavingProjectIds] = useState(false);
  const [savingEmployeeIds, setSavingEmployeeIds] = useState(false);
  const [savingClientIds, setSavingClientIds] = useState(false);
  const [savingWeekendDefaults, setSavingWeekendDefaults] = useState(false);
  const [savingContractModels, setSavingContractModels] = useState(false);

  const [departments, setDepartments] = useState<PlatformDefaultRow[]>([]);
  const [designations, setDesignations] = useState<PlatformDefaultRow[]>([]);
  const [categories, setCategories] = useState<PlatformDefaultRow[]>([]);
  const [activities, setActivities] = useState<PlatformDefaultRow[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<PlatformDefaultLeaveTypeRow[]>([]);

  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newShort, setNewShort] = useState("");
  const [newSort, setNewSort] = useState(0);

  const loadOverview = useCallback(async () => {
    const o = await fetchPlatformDefaultsOverview();
    setCounts(o.counts);
    setBootstrap(o.bootstrap);
    setContractModelRows(
      contractModelsFromBootstrap(
        (o.bootstrap.defaultContractModels ?? null) as Record<string, unknown>[] | null,
      ),
    );
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    loadOverview()
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [loadOverview]);

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (
      tabParam === "bootstrap" ||
      tabParam === "weekendDefaults" ||
      tabParam === "contractModels" ||
      tabParam === "departments" ||
      tabParam === "designations" ||
      tabParam === "categories" ||
      tabParam === "activities" ||
      tabParam === "leaveTypes" ||
      tabParam === "defaultRoles"
    ) {
      setTab(tabParam);
    }
  }, [searchParams]);

  useEffect(() => {
    if (tab === "bootstrap" || tab === "contractModels" || loading) return;
    setError(null);
    const run = async () => {
      try {
        if (tab === "departments") setDepartments(await listPlatformDepartments());
        if (tab === "designations") setDesignations(await listPlatformDesignations());
        if (tab === "categories") setCategories(await listPlatformEmployeeCategories());
        if (tab === "activities") setActivities(await listPlatformActivityTypes());
        if (tab === "leaveTypes") setLeaveTypes(await listPlatformLeaveTypes());
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load tab data");
      }
    };
    run();
  }, [tab, loading]);

  const handleSaveProjectIds = async () => {
    if (!bootstrap) return;
    setSavingProjectIds(true);
    setError(null);
    try {
      const updated = await patchPlatformBootstrap({
        autoProjectId: bootstrap.autoProjectId,
        projectPrefix: bootstrap.projectPrefix,
        projectIdCounter: Number(bootstrap.projectIdCounter),
      });
      setBootstrap(updated);
      const o = await fetchPlatformDefaultsOverview();
      setCounts(o.counts);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSavingProjectIds(false);
    }
  };

  const handleSaveEmployeeIds = async () => {
    if (!bootstrap) return;
    setSavingEmployeeIds(true);
    setError(null);
    try {
      const updated = await patchPlatformBootstrap({
        autoEmployeeId: bootstrap.autoEmployeeId,
        employeePrefix: bootstrap.employeePrefix,
        employeeIdCounter: Number(bootstrap.employeeIdCounter),
      });
      setBootstrap(updated);
      const o = await fetchPlatformDefaultsOverview();
      setCounts(o.counts);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSavingEmployeeIds(false);
    }
  };

  const handleSaveClientIds = async () => {
    if (!bootstrap) return;
    setSavingClientIds(true);
    setError(null);
    try {
      const updated = await patchPlatformBootstrap({
        autoClientId: bootstrap.autoClientId,
        clientPrefix: bootstrap.clientPrefix,
        clientIdCounter: Number(bootstrap.clientIdCounter),
      });
      setBootstrap(updated);
      const o = await fetchPlatformDefaultsOverview();
      setCounts(o.counts);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSavingClientIds(false);
    }
  };

  const handleSaveWeekendDefaults = async () => {
    if (!bootstrap) return;
    setSavingWeekendDefaults(true);
    setError(null);
    try {
      const updated = await patchPlatformBootstrap({
        defaultWeekendDays: bootstrap.defaultWeekendDays,
      });
      setBootstrap(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSavingWeekendDefaults(false);
    }
  };

  const handleSaveContractModels = async () => {
    if (!bootstrap) return;
    setSavingContractModels(true);
    setError(null);
    try {
      const payload = contractModelsToPayload(contractModelRows);
      const updated = await patchPlatformBootstrap({
        defaultContractModels: payload,
      });
      setBootstrap(updated);
      setContractModelRows(
        contractModelsFromBootstrap(
          (updated.defaultContractModels ?? null) as Record<string, unknown>[] | null,
        ),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSavingContractModels(false);
    }
  };

  const updateContractRow = (
    key: string,
    patch: Partial<Omit<DefaultContractModelDraft, "_key">>,
  ) => {
    setContractModelRows((prev) =>
      prev.map((row) => (row._key === key ? { ...row, ...patch } : row)),
    );
  };

  const toggleActive = async (
    kind: "departments" | "designations" | "categories" | "activities" | "leaveTypes",
    row: PlatformDefaultLeaveTypeRow | PlatformDefaultRow,
    next: boolean,
  ) => {
    try {
      if (kind === "departments") {
        const u = await updatePlatformDepartment(row.id, { isActive: next });
        setDepartments((prev) => prev.map((r) => (r.id === row.id ? u : r)));
      } else if (kind === "designations") {
        const u = await updatePlatformDesignation(row.id, { isActive: next });
        setDesignations((prev) => prev.map((r) => (r.id === row.id ? u : r)));
      } else if (kind === "categories") {
        const u = await updatePlatformEmployeeCategory(row.id, { isActive: next });
        setCategories((prev) => prev.map((r) => (r.id === row.id ? u : r)));
      } else if (kind === "activities") {
        const u = await updatePlatformActivityType(row.id, { isActive: next });
        setActivities((prev) => prev.map((r) => (r.id === row.id ? u : r)));
      } else {
        const u = await updatePlatformLeaveType(row.id, { isActive: next });
        setLeaveTypes((prev) => prev.map((r) => (r.id === row.id ? u : r)));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    }
  };

  const addSimpleRow = async (
    kind: "departments" | "designations" | "categories" | "activities",
  ) => {
    if (!newName.trim()) return;
    try {
      if (kind === "departments") {
        const r = await createPlatformDepartment({
          name: newName,
          description: newDesc,
          sortOrder: newSort,
        });
        setDepartments((p) => [...p, r]);
      } else if (kind === "designations") {
        const r = await createPlatformDesignation({
          name: newName,
          description: newDesc,
          sortOrder: newSort,
        });
        setDesignations((p) => [...p, r]);
      } else if (kind === "categories") {
        const r = await createPlatformEmployeeCategory({
          name: newName,
          description: newDesc || null,
          sortOrder: newSort,
        });
        setCategories((p) => [...p, r]);
      } else {
        const r = await createPlatformActivityType({
          name: newName,
          description: newDesc || null,
          sortOrder: newSort,
        });
        setActivities((p) => [...p, r]);
      }
      setNewName("");
      setNewDesc("");
      setNewSort(0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Create failed");
    }
  };

  const addLeaveType = async () => {
    if (!newName.trim() || !newShort.trim()) return;
    try {
      const r = await createPlatformLeaveType({
        name: newName,
        shortName: newShort,
        description: newDesc || null,
        sortOrder: newSort,
      });
      setLeaveTypes((p) => [...p, r]);
      setNewName("");
      setNewShort("");
      setNewDesc("");
      setNewSort(0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Create failed");
    }
  };

  const tabs: { id: TabId; label: string }[] = [
    { id: "bootstrap", label: "Auto IDs" },
    { id: "weekendDefaults", label: "Company weekend defaults" },
    { id: "contractModels", label: "Client contract models" },
    { id: "departments", label: "Departments" },
    { id: "designations", label: "Designations" },
    { id: "categories", label: "Member categories" },
    { id: "activities", label: "Timesheet activities" },
    { id: "leaveTypes", label: "Leave types" },
    { id: "defaultRoles", label: "Default roles" },
  ];

  return (
    <>
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
      <div className="mb-2">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          New company defaults
        </h3>
        <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
          Configure templates that are copied into every new company when it is created. Only
          active items are applied; inactive rows are kept for reference.
        </p>
      </div>

      {counts && (
        <p className="mb-4 text-theme-xs text-gray-500 dark:text-gray-400">
          Templates: {counts.departments} departments, {counts.designations} designations,{" "}
          {counts.employeeCategories} categories, {counts.activityTypes} activities,{" "}
          {counts.leaveTypes} leave types.
        </p>
      )}

      <div className="mb-5 flex flex-wrap gap-2 border-b border-gray-200 pb-3 dark:border-gray-800">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-3 py-1.5 text-theme-sm font-medium transition-colors ${
              tab === t.id
                ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-theme-sm text-gray-500 dark:text-gray-400">Loading…</p>
      ) : (
        <>
          {error && (
            <div className="mb-4 rounded-lg border border-error-200 bg-error-50 px-4 py-2 text-theme-sm text-error-700 dark:border-error-800 dark:bg-error-950 dark:text-error-400">
              {error}
            </div>
          )}

          {tab === "bootstrap" && bootstrap && (
            <div className="flex w-full max-w-6xl flex-col gap-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:items-stretch">
                <section className="flex h-full min-h-0 flex-col rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.02]">
                  <h4 className="mb-3 border-b border-gray-100 pb-2 text-theme-sm font-semibold text-gray-900 dark:border-gray-800 dark:text-white/90">
                    Project IDs
                  </h4>
                  <div className="flex flex-col gap-3">
                    <label className="flex items-center gap-2 text-theme-sm text-gray-700 dark:text-gray-300">
                      <input
                        type="checkbox"
                        checked={bootstrap.autoProjectId}
                        onChange={(e) =>
                          setBootstrap({ ...bootstrap, autoProjectId: e.target.checked })
                        }
                      />
                      Auto-generate
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-theme-xs font-medium text-gray-700 dark:text-gray-300">
                        Prefix
                      </span>
                      <input
                        className={inputClass}
                        value={bootstrap.projectPrefix}
                        onChange={(e) =>
                          setBootstrap({ ...bootstrap, projectPrefix: e.target.value })
                        }
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-theme-xs font-medium text-gray-700 dark:text-gray-300">
                        Starting counter
                      </span>
                      <input
                        type="number"
                        className={inputClass}
                        value={bootstrap.projectIdCounter}
                        onChange={(e) =>
                          setBootstrap({ ...bootstrap, projectIdCounter: Number(e.target.value) })
                        }
                      />
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveProjectIds}
                    disabled={savingProjectIds}
                    className="mt-4 w-full rounded-lg bg-brand-500 px-4 py-2 text-theme-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
                  >
                    {savingProjectIds ? "Saving…" : "Save project IDs"}
                  </button>
                </section>

                <section className="flex h-full min-h-0 flex-col rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.02]">
                  <h4 className="mb-3 border-b border-gray-100 pb-2 text-theme-sm font-semibold text-gray-900 dark:border-gray-800 dark:text-white/90">
                    Employee IDs
                  </h4>
                  <div className="flex flex-col gap-3">
                    <label className="flex items-center gap-2 text-theme-sm text-gray-700 dark:text-gray-300">
                      <input
                        type="checkbox"
                        checked={bootstrap.autoEmployeeId}
                        onChange={(e) =>
                          setBootstrap({ ...bootstrap, autoEmployeeId: e.target.checked })
                        }
                      />
                      Auto-generate
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-theme-xs font-medium text-gray-700 dark:text-gray-300">
                        Prefix
                      </span>
                      <input
                        className={inputClass}
                        value={bootstrap.employeePrefix}
                        onChange={(e) =>
                          setBootstrap({ ...bootstrap, employeePrefix: e.target.value })
                        }
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-theme-xs font-medium text-gray-700 dark:text-gray-300">
                        Starting counter
                      </span>
                      <input
                        type="number"
                        className={inputClass}
                        value={bootstrap.employeeIdCounter}
                        onChange={(e) =>
                          setBootstrap({ ...bootstrap, employeeIdCounter: Number(e.target.value) })
                        }
                      />
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveEmployeeIds}
                    disabled={savingEmployeeIds}
                    className="mt-4 w-full rounded-lg bg-brand-500 px-4 py-2 text-theme-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
                  >
                    {savingEmployeeIds ? "Saving…" : "Save employee IDs"}
                  </button>
                </section>

                <section className="flex h-full min-h-0 flex-col rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.02]">
                  <h4 className="mb-3 border-b border-gray-100 pb-2 text-theme-sm font-semibold text-gray-900 dark:border-gray-800 dark:text-white/90">
                    Client IDs
                  </h4>
                  <div className="flex flex-col gap-3">
                    <label className="flex items-center gap-2 text-theme-sm text-gray-700 dark:text-gray-300">
                      <input
                        type="checkbox"
                        checked={bootstrap.autoClientId}
                        onChange={(e) =>
                          setBootstrap({ ...bootstrap, autoClientId: e.target.checked })
                        }
                      />
                      Auto-generate
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-theme-xs font-medium text-gray-700 dark:text-gray-300">
                        Prefix
                      </span>
                      <input
                        className={inputClass}
                        value={bootstrap.clientPrefix}
                        onChange={(e) =>
                          setBootstrap({ ...bootstrap, clientPrefix: e.target.value })
                        }
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-theme-xs font-medium text-gray-700 dark:text-gray-300">
                        Starting counter
                      </span>
                      <input
                        type="number"
                        className={inputClass}
                        value={bootstrap.clientIdCounter}
                        onChange={(e) =>
                          setBootstrap({ ...bootstrap, clientIdCounter: Number(e.target.value) })
                        }
                      />
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveClientIds}
                    disabled={savingClientIds}
                    className="mt-4 w-full rounded-lg bg-brand-500 px-4 py-2 text-theme-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
                  >
                    {savingClientIds ? "Saving…" : "Save client IDs"}
                  </button>
                </section>
              </div>
            </div>
          )}

          {tab === "contractModels" && bootstrap && (
            <div className="max-w-6xl">
              <p className="mb-4 text-theme-sm text-gray-600 dark:text-gray-400">
                These rows define the default client contract models applied when a new company is
                created. Edit cells inline, add or remove rows, then save.
              </p>
              <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
                <table className="w-full min-w-[880px] border-collapse text-left text-theme-xs text-gray-800 dark:text-white/90">
                  <thead className="bg-gray-50 text-theme-xs font-medium uppercase text-gray-600 dark:bg-white/[0.04] dark:text-gray-400">
                    <tr>
                      <th className="border-b border-gray-200 px-2 py-2 dark:border-gray-800">
                        Model name
                      </th>
                      <th className="border-b border-gray-200 px-2 py-2 dark:border-gray-800">
                        DOA
                      </th>
                      <th className="border-b border-gray-200 px-2 py-2 dark:border-gray-800">
                        Renewal
                      </th>
                      <th className="border-b border-gray-200 px-2 py-2 dark:border-gray-800">
                        Billing
                      </th>
                      <th className="border-b border-gray-200 px-2 py-2 dark:border-gray-800">
                        Allotted hrs
                      </th>
                      <th className="border-b border-gray-200 px-2 py-2 dark:border-gray-800">
                        Rate
                      </th>
                      <th className="border-b border-gray-200 px-2 py-2 dark:border-gray-800">
                        Currency
                      </th>
                      <th className="border-b border-gray-200 px-2 py-2 dark:border-gray-800 w-20">
                        {/* actions */}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {contractModelRows.map((row) => (
                      <tr key={row._key} className="border-b border-gray-100 dark:border-gray-800/80">
                        <td className="p-1 align-middle">
                          <input
                            type="text"
                            className={tableCellInputClass + " min-w-[8rem]"}
                            value={row.modalName}
                            onChange={(e) =>
                              updateContractRow(row._key, { modalName: e.target.value })
                            }
                          />
                        </td>
                        <td className="p-1 align-middle">
                          <input
                            type="date"
                            className={tableCellInputClass}
                            value={row.doa}
                            onChange={(e) =>
                              updateContractRow(row._key, { doa: e.target.value })
                            }
                          />
                        </td>
                        <td className="p-1 align-middle">
                          <input
                            type="date"
                            className={tableCellInputClass}
                            value={row.renewalDate}
                            onChange={(e) =>
                              updateContractRow(row._key, { renewalDate: e.target.value })
                            }
                          />
                        </td>
                        <td className="p-1 align-middle">
                          <select
                            className={tableCellInputClass}
                            value={row.monthYear}
                            onChange={(e) =>
                              updateContractRow(row._key, { monthYear: e.target.value })
                            }
                          >
                            <option value="monthly">Monthly</option>
                            <option value="yearly">Yearly</option>
                          </select>
                        </td>
                        <td className="p-1 align-middle">
                          <input
                            type="number"
                            min={0}
                            step={1}
                            className={tableCellInputClass}
                            value={row.allotedHours}
                            onChange={(e) =>
                              updateContractRow(row._key, {
                                allotedHours: Number(e.target.value),
                              })
                            }
                          />
                        </td>
                        <td className="p-1 align-middle">
                          <input
                            type="number"
                            min={0}
                            step={0.01}
                            className={tableCellInputClass}
                            value={row.chargeRate}
                            onChange={(e) =>
                              updateContractRow(row._key, {
                                chargeRate: Number(e.target.value),
                              })
                            }
                          />
                        </td>
                        <td className="p-1 align-middle">
                          <input
                            type="text"
                            className={tableCellInputClass + " min-w-[4rem]"}
                            value={row.currencyConver}
                            onChange={(e) =>
                              updateContractRow(row._key, { currencyConver: e.target.value })
                            }
                          />
                        </td>
                        <td className="p-1 align-middle">
                          <button
                            type="button"
                            className="text-theme-xs text-error-600 hover:underline dark:text-error-400"
                            onClick={() => {
                              setContractModelRows((prev) => {
                                const next = prev.filter((r) => r._key !== row._key);
                                return next.length === 0 ? [newContractModelRow()] : next;
                              });
                            }}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setContractModelRows((p) => [...p, newContractModelRow()])}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-theme-sm font-medium text-gray-800 dark:border-gray-700 dark:text-white/90"
                >
                  Add row
                </button>
                <button
                  type="button"
                  onClick={handleSaveContractModels}
                  disabled={savingContractModels}
                  className="rounded-lg bg-brand-500 px-4 py-2 text-theme-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
                >
                  {savingContractModels ? "Saving…" : "Save contract models"}
                </button>
              </div>
            </div>
          )}

          {tab === "weekendDefaults" && bootstrap && (
            <div className="max-w-3xl">
              <p className="mb-4 text-theme-sm text-gray-600 dark:text-gray-400">
                Choose default weekend days for all newly created companies.
              </p>
              <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                <p className="mb-3 text-theme-sm font-medium text-gray-800 dark:text-white/90">
                  Weekend days
                </p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {weekendDayOptions.map((day) => {
                    const checked = bootstrap.defaultWeekendDays?.includes(day) ?? false;
                    return (
                      <label
                        key={day}
                        className="inline-flex items-center gap-2 rounded border border-gray-200 px-3 py-2 text-theme-sm dark:border-gray-700"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            const next = e.target.checked
                              ? [...(bootstrap.defaultWeekendDays ?? []), day]
                              : (bootstrap.defaultWeekendDays ?? []).filter((d) => d !== day);
                            setBootstrap({
                              ...bootstrap,
                              defaultWeekendDays: Array.from(new Set(next)),
                            });
                          }}
                        />
                        {day}
                      </label>
                    );
                  })}
                </div>
                <p className="mt-3 text-theme-xs text-gray-500 dark:text-gray-400">
                  Default is Sat and Sun. Companies can still change this in Company Settings.
                </p>
                <button
                  type="button"
                  onClick={handleSaveWeekendDefaults}
                  disabled={savingWeekendDefaults}
                  className="mt-4 rounded-lg bg-brand-500 px-4 py-2 text-theme-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
                >
                  {savingWeekendDefaults ? "Saving…" : "Save weekend defaults"}
                </button>
              </div>
            </div>
          )}

          {tab === "departments" && (
            <TemplateTable
              title="Department templates"
              rows={departments}
              onToggle={(row, v) => toggleActive("departments", row, v)}
              onDelete={async (id) => {
                openConfirm("Delete this template?", async () => {
                  await deletePlatformDepartment(id);
                  setDepartments((p) => p.filter((r) => r.id !== id));
                });
              }}
              extraColumns={null}
              renderAdd={() => (
                <div className="mb-4 flex flex-wrap items-end gap-2">
                  <label className="min-w-[140px]">
                    <span className="mb-1 block text-theme-xs text-gray-600 dark:text-gray-400">
                      Name
                    </span>
                    <input
                      className={inputClass}
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                    />
                  </label>
                  <label className="min-w-[180px] flex-1">
                    <span className="mb-1 block text-theme-xs text-gray-600 dark:text-gray-400">
                      Description
                    </span>
                    <input
                      className={inputClass}
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                    />
                  </label>
                  <label>
                    <span className="mb-1 block text-theme-xs text-gray-600 dark:text-gray-400">
                      Sort
                    </span>
                    <input
                      type="number"
                      className={inputClass}
                      value={newSort}
                      onChange={(e) => setNewSort(Number(e.target.value))}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => addSimpleRow("departments")}
                    className="h-10 rounded-lg bg-brand-500 px-4 text-theme-sm font-medium text-white hover:bg-brand-600"
                  >
                    Add
                  </button>
                </div>
              )}
            />
          )}

          {tab === "designations" && (
            <TemplateTable
              title="Designation templates"
              rows={designations}
              onToggle={(row, v) => toggleActive("designations", row, v)}
              onDelete={async (id) => {
                openConfirm("Delete this template?", async () => {
                  await deletePlatformDesignation(id);
                  setDesignations((p) => p.filter((r) => r.id !== id));
                });
              }}
              extraColumns={null}
              renderAdd={() => (
                <div className="mb-4 flex flex-wrap items-end gap-2">
                  <label className="min-w-[140px]">
                    <span className="mb-1 block text-theme-xs text-gray-600 dark:text-gray-400">
                      Name
                    </span>
                    <input
                      className={inputClass}
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                    />
                  </label>
                  <label className="min-w-[180px] flex-1">
                    <span className="mb-1 block text-theme-xs text-gray-600 dark:text-gray-400">
                      Description
                    </span>
                    <input
                      className={inputClass}
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                    />
                  </label>
                  <label>
                    <span className="mb-1 block text-theme-xs text-gray-600 dark:text-gray-400">
                      Sort
                    </span>
                    <input
                      type="number"
                      className={inputClass}
                      value={newSort}
                      onChange={(e) => setNewSort(Number(e.target.value))}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => addSimpleRow("designations")}
                    className="h-10 rounded-lg bg-brand-500 px-4 text-theme-sm font-medium text-white hover:bg-brand-600"
                  >
                    Add
                  </button>
                </div>
              )}
            />
          )}

          {tab === "categories" && (
            <TemplateTable
              title="Member category templates"
              rows={categories}
              onToggle={(row, v) => toggleActive("categories", row, v)}
              onDelete={async (id) => {
                openConfirm("Delete this template?", async () => {
                  await deletePlatformEmployeeCategory(id);
                  setCategories((p) => p.filter((r) => r.id !== id));
                });
              }}
              extraColumns={null}
              renderAdd={() => (
                <div className="mb-4 flex flex-wrap items-end gap-2">
                  <label className="min-w-[140px]">
                    <span className="mb-1 block text-theme-xs text-gray-600 dark:text-gray-400">
                      Name
                    </span>
                    <input
                      className={inputClass}
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                    />
                  </label>
                  <label className="min-w-[180px] flex-1">
                    <span className="mb-1 block text-theme-xs text-gray-600 dark:text-gray-400">
                      Description
                    </span>
                    <input
                      className={inputClass}
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                    />
                  </label>
                  <label>
                    <span className="mb-1 block text-theme-xs text-gray-600 dark:text-gray-400">
                      Sort
                    </span>
                    <input
                      type="number"
                      className={inputClass}
                      value={newSort}
                      onChange={(e) => setNewSort(Number(e.target.value))}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => addSimpleRow("categories")}
                    className="h-10 rounded-lg bg-brand-500 px-4 text-theme-sm font-medium text-white hover:bg-brand-600"
                  >
                    Add
                  </button>
                </div>
              )}
            />
          )}

          {tab === "activities" && (
            <TemplateTable
              title="Timesheet activity types"
              rows={activities}
              onToggle={(row, v) => toggleActive("activities", row, v)}
              onDelete={async (id) => {
                openConfirm("Delete this template?", async () => {
                  await deletePlatformActivityType(id);
                  setActivities((p) => p.filter((r) => r.id !== id));
                });
              }}
              extraColumns={null}
              renderAdd={() => (
                <div className="mb-4 flex flex-wrap items-end gap-2">
                  <label className="min-w-[140px]">
                    <span className="mb-1 block text-theme-xs text-gray-600 dark:text-gray-400">
                      Name
                    </span>
                    <input
                      className={inputClass}
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                    />
                  </label>
                  <label className="min-w-[180px] flex-1">
                    <span className="mb-1 block text-theme-xs text-gray-600 dark:text-gray-400">
                      Description
                    </span>
                    <input
                      className={inputClass}
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                    />
                  </label>
                  <label>
                    <span className="mb-1 block text-theme-xs text-gray-600 dark:text-gray-400">
                      Sort
                    </span>
                    <input
                      type="number"
                      className={inputClass}
                      value={newSort}
                      onChange={(e) => setNewSort(Number(e.target.value))}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => addSimpleRow("activities")}
                    className="h-10 rounded-lg bg-brand-500 px-4 text-theme-sm font-medium text-white hover:bg-brand-600"
                  >
                    Add
                  </button>
                </div>
              )}
            />
          )}

          {tab === "leaveTypes" && (
            <div>
              <p className="mb-3 text-theme-sm font-medium text-gray-800 dark:text-white/90">
                Leave type templates
              </p>
              <div className="mb-4 flex flex-wrap items-end gap-2">
                <label className="min-w-[120px]">
                  <span className="mb-1 block text-theme-xs text-gray-600 dark:text-gray-400">
                    Name
                  </span>
                  <input
                    className={inputClass}
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                  />
                </label>
                <label className="min-w-[100px]">
                  <span className="mb-1 block text-theme-xs text-gray-600 dark:text-gray-400">
                    Short
                  </span>
                  <input
                    className={inputClass}
                    value={newShort}
                    onChange={(e) => setNewShort(e.target.value)}
                  />
                </label>
                <label className="min-w-[160px] flex-1">
                  <span className="mb-1 block text-theme-xs text-gray-600 dark:text-gray-400">
                    Description
                  </span>
                  <input
                    className={inputClass}
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                  />
                </label>
                <label>
                  <span className="mb-1 block text-theme-xs text-gray-600 dark:text-gray-400">
                    Sort
                  </span>
                  <input
                    type="number"
                    className={inputClass}
                    value={newSort}
                    onChange={(e) => setNewSort(Number(e.target.value))}
                  />
                </label>
                <button
                  type="button"
                  onClick={addLeaveType}
                  className="h-10 rounded-lg bg-brand-500 px-4 text-theme-sm font-medium text-white hover:bg-brand-600"
                >
                  Add
                </button>
              </div>
              <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
                <table className="min-w-full text-left text-theme-sm text-gray-800 dark:text-white/90">
                  <thead className="bg-gray-50 text-theme-xs uppercase dark:bg-white/[0.04]">
                    <tr>
                      <th className="px-3 py-2">Name</th>
                      <th className="px-3 py-2">Short</th>
                      <th className="px-3 py-2">Active</th>
                      <th className="px-3 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaveTypes.map((row) => (
                      <tr key={row.id} className="border-t border-gray-200 dark:border-gray-800">
                        <td className="px-3 py-2">{row.name}</td>
                        <td className="px-3 py-2">{row.shortName}</td>
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            checked={row.isActive}
                            onChange={(e) => toggleActive("leaveTypes", row, e.target.checked)}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <button
                            type="button"
                            className="text-error-600 dark:text-error-400"
                            onClick={async () => {
                              openConfirm("Delete?", async () => {
                                await deletePlatformLeaveType(row.id);
                                setLeaveTypes((p) => p.filter((r) => r.id !== row.id));
                              });
                            }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === "defaultRoles" && <CompanyDefaultRolesTab />}
        </>
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
              Confirm
            </h3>
            <p className="mt-2 text-theme-sm text-gray-600 dark:text-gray-300">
              {confirmMsg}
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
                {confirmBusy ? "Deleting…" : "Continue"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function TemplateTable({
  title,
  rows,
  onToggle,
  onDelete,
  renderAdd,
  extraColumns,
}: {
  title: string;
  rows: PlatformDefaultRow[];
  onToggle: (row: PlatformDefaultRow, v: boolean) => void;
  onDelete: (id: string) => Promise<void>;
  renderAdd: () => React.ReactNode;
  extraColumns: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-3 text-theme-sm font-medium text-gray-800 dark:text-white/90">{title}</p>
      {renderAdd()}
      {extraColumns}
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
        <table className="min-w-full text-left text-theme-sm text-gray-800 dark:text-white/90">
          <thead className="bg-gray-50 text-theme-xs uppercase dark:bg-white/[0.04]">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Description</th>
              <th className="px-3 py-2">Sort</th>
              <th className="px-3 py-2">Active</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-gray-200 dark:border-gray-800">
                <td className="px-3 py-2">{row.name}</td>
                <td className="px-3 py-2 max-w-xs truncate text-gray-600 dark:text-gray-400">
                  {row.description ?? ""}
                </td>
                <td className="px-3 py-2">{row.sortOrder}</td>
                <td className="px-3 py-2">
                  <input
                    type="checkbox"
                    checked={row.isActive}
                    onChange={(e) => onToggle(row, e.target.checked)}
                  />
                </td>
                <td className="px-3 py-2">
                  <button
                    type="button"
                    className="text-error-600 dark:text-error-400"
                    onClick={() => onDelete(row.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
