"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  listPlatformIndustriesAdmin,
  createPlatformIndustryAdmin,
  updatePlatformIndustryAdmin,
  deletePlatformIndustryAdmin,
  createIndustryProjectTypeAdmin,
  updateIndustryProjectTypeAdmin,
  deleteIndustryProjectTypeAdmin,
  listPlatformDashboardUsesAdmin,
  createPlatformDashboardUseAdmin,
  updatePlatformDashboardUseAdmin,
  deletePlatformDashboardUseAdmin,
  listPlatformSkillCategoriesAdmin,
  createPlatformSkillCategoryAdmin,
  updatePlatformSkillCategoryAdmin,
  deletePlatformSkillCategoryAdmin,
  createPlatformSkillAdmin,
  updatePlatformSkillAdmin,
  deletePlatformSkillAdmin,
} from "@/src/services/api/platformCatalog.api";
import type {
  PlatformDashboardUseAdminRow,
  PlatformIndustryAdminRow,
  PlatformIndustryProjectTypeRow,
  PlatformSkillAdminRow,
  PlatformSkillCategoryAdminRow,
} from "@/src/types/platformCatalog.types";
import { CloseIcon } from "@/src/icons/index";

const inputClass =
  "h-10 w-full rounded-lg border border-gray-200 bg-transparent px-3 text-theme-sm text-gray-800 dark:border-gray-700 dark:bg-white/[0.03] dark:text-white/90";

const cellInputClass =
  "h-9 w-full min-w-[5rem] rounded border border-gray-200 bg-transparent px-2 text-theme-xs text-gray-800 dark:border-gray-700 dark:bg-white/[0.03] dark:text-white/90";

const catalogCheckboxClass =
  "h-4 w-4 shrink-0 rounded border border-gray-300 text-brand-600 focus:ring-2 focus:ring-brand-500/30 dark:border-gray-600 dark:bg-white/[0.03]";

/** Internal slug for API; derived from label when creating — not shown in the UI. */
function slugifyIndustryValue(label: string): string {
  const s = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return s || "industry";
}

/** Same scheme as industries: internal slug for API; not shown in UI. */
function slugifyDashboardUseValue(label: string): string {
  const s = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return s || "dashboard_use";
}

/** Same as backend: snake_case key → "Website Development". */
function formatKeyAsLabel(key: string): string {
  return key
    .trim()
    .split("_")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function displayProjectTypeLabel(pt: PlatformIndustryProjectTypeRow): string {
  const t = (pt.label ?? "").trim();
  if (t) return t;
  return formatKeyAsLabel(pt.projectType);
}

/** Full table: grows to fill card. Split view: fixed row height; left/right scroll inside. */
const industriesPanelRowFullClass =
  "flex min-h-0 flex-1 flex-col gap-3 md:flex-row md:items-stretch md:gap-4";

const industriesPanelRowSplitClass =
  "flex h-[min(24rem,52vh)] min-h-0 shrink-0 flex-col gap-3 md:h-[min(26rem,54vh)] md:flex-row md:items-stretch md:gap-4";

/** Same fixed row height + internal scroll as industries split view. */
const skillsetsPanelSplitClass = industriesPanelRowSplitClass;

type TabId = "industries" | "dashboardUses" | "skillsets";

export default function PlatformCatalogPage() {
  const [tab, setTab] = useState<TabId>("industries");
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const [industries, setIndustries] = useState<PlatformIndustryAdminRow[]>([]);
  const [dashboardUses, setDashboardUses] = useState<PlatformDashboardUseAdminRow[]>([]);
  const [skillCategories, setSkillCategories] = useState<PlatformSkillCategoryAdminRow[]>([]);

  const [newIndustry, setNewIndustry] = useState({ label: "", sortOrder: 0 });
  const [newUse, setNewUse] = useState({ label: "", value: "", sortOrder: 0 });
  const [newCategory, setNewCategory] = useState({ name: "", sortOrder: 0 });
  const [newSkillByCategory, setNewSkillByCategory] = useState<Record<string, string>>({});
  const [selectedIndustryId, setSelectedIndustryId] = useState<string | null>(null);
  const [selectedSkillCategoryId, setSelectedSkillCategoryId] = useState<string | null>(null);

  const loadTab = useCallback(async () => {
    if (tab === "industries") {
      setIndustries(await listPlatformIndustriesAdmin());
    } else if (tab === "dashboardUses") {
      setDashboardUses(await listPlatformDashboardUsesAdmin());
    } else {
      setSkillCategories(await listPlatformSkillCategoriesAdmin());
    }
  }, [tab]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    loadTab()
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [loadTab]);

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "industries" || tabParam === "dashboardUses" || tabParam === "skillsets") {
      setTab(tabParam);
    }
  }, [searchParams]);

  useEffect(() => {
    if (tab !== "industries") setSelectedIndustryId(null);
    if (tab !== "skillsets") setSelectedSkillCategoryId(null);
  }, [tab]);

  useEffect(() => {
    if (
      tab === "industries" &&
      selectedIndustryId &&
      !industries.some((i) => i.id === selectedIndustryId)
    ) {
      setSelectedIndustryId(null);
    }
  }, [tab, industries, selectedIndustryId]);

  const selectedIndustry =
    selectedIndustryId == null
      ? null
      : (industries.find((i) => i.id === selectedIndustryId) ?? null);

  const selectedSkillCategory =
    selectedSkillCategoryId == null
      ? null
      : (skillCategories.find((c) => c.id === selectedSkillCategoryId) ?? null);

  useEffect(() => {
    if (
      tab === "skillsets" &&
      selectedSkillCategoryId &&
      !skillCategories.some((c) => c.id === selectedSkillCategoryId)
    ) {
      setSelectedSkillCategoryId(null);
    }
  }, [tab, skillCategories, selectedSkillCategoryId]);

  const industriesSorted = [...industries].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label),
  );

  const skillCategoriesSorted = [...skillCategories].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name),
  );

  const tabs: { id: TabId; label: string }[] = [
    { id: "industries", label: "Industries" },
    { id: "dashboardUses", label: "Dashboard primary use" },
    { id: "skillsets", label: "Skillsets" },
  ];

  const patchIndustryLocal = (id: string, patch: Partial<PlatformIndustryAdminRow>) => {
    setIndustries((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const patchPtLocal = (
    industryId: string,
    ptId: string,
    patch: Partial<PlatformIndustryProjectTypeRow>,
  ) => {
    setIndustries((prev) =>
      prev.map((ind) =>
        ind.id === industryId
          ? {
              ...ind,
              projectTypes: (ind.projectTypes ?? []).map((p) =>
                p.id === ptId ? { ...p, ...patch } : p,
              ),
            }
          : ind,
      ),
    );
  };

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
      <div className="mb-2 shrink-0">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Platform catalog
        </h3>
        <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
          Industries (and per-industry project types), options for “What is your primary use of this
          dashboard”, and member skillsets. These power signup and forms across PixelDesk.
        </p>
      </div>

      <div className="mb-5 flex shrink-0 flex-wrap gap-2 border-b border-gray-200 pb-3 dark:border-gray-800">
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
        <div className="flex min-h-0 flex-1 flex-col">
          {error && (
            <div className="mb-4 shrink-0 rounded-lg border border-error-200 bg-error-50 px-4 py-2 text-theme-sm text-error-700 dark:border-error-800 dark:bg-error-950 dark:text-error-400">
              {error}
            </div>
          )}

          {tab === "industries" && (
            <div className="flex min-h-0 flex-1 flex-col gap-4">
              <div className="flex shrink-0 flex-wrap items-end gap-2 rounded-lg border border-gray-200 p-4 dark:border-gray-800">
                <label className="min-w-[200px] flex-1">
                  <span className="mb-1 block text-theme-xs text-gray-600 dark:text-gray-400">
                    Label
                  </span>
                  <input
                    className={inputClass}
                    value={newIndustry.label}
                    onChange={(e) => setNewIndustry((s) => ({ ...s, label: e.target.value }))}
                  />
                </label>
                <label>
                  <span className="mb-1 block text-theme-xs text-gray-600 dark:text-gray-400">
                    Sort
                  </span>
                  <input
                    type="number"
                    className={inputClass + " w-24"}
                    value={newIndustry.sortOrder}
                    onChange={(e) =>
                      setNewIndustry((s) => ({ ...s, sortOrder: Number(e.target.value) }))
                    }
                  />
                </label>
                <button
                  type="button"
                  className="h-10 rounded-lg bg-brand-500 px-4 text-theme-sm font-medium text-white hover:bg-brand-600"
                  onClick={async () => {
                    if (!newIndustry.label.trim()) return;
                    try {
                      const r = await createPlatformIndustryAdmin({
                        label: newIndustry.label.trim(),
                        value: slugifyIndustryValue(newIndustry.label),
                        sortOrder: newIndustry.sortOrder,
                      });
                      const row = { ...r, projectTypes: [] as PlatformIndustryProjectTypeRow[] };
                      setIndustries((p) => [...p, row]);
                      setNewIndustry({ label: "", sortOrder: 0 });
                    } catch (e) {
                      setError(e instanceof Error ? e.message : "Create failed");
                    }
                  }}
                >
                  Add industry
                </button>
              </div>

              <div
                className={
                  selectedIndustryId ? industriesPanelRowSplitClass : industriesPanelRowFullClass
                }
              >
                {!selectedIndustryId ? (
                  <div className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
                    <p className="shrink-0 border-b border-gray-100 px-4 py-2 text-theme-xs font-semibold uppercase tracking-wide text-gray-500 dark:border-gray-800 dark:text-gray-400">
                      Industries
                    </p>
                    {industriesSorted.length === 0 ? (
                      <p className="flex min-h-0 flex-1 items-center justify-center px-4 py-6 text-center text-theme-sm text-gray-500 dark:text-gray-400">
                        No industries yet. Add one above.
                      </p>
                    ) : (
                      <div className="min-h-0 flex-1 overflow-x-auto overflow-y-auto overscroll-contain">
                        <table className="w-full min-w-[36rem] border-collapse text-left text-theme-sm text-gray-800 dark:text-white/90">
                          <thead className="sticky top-0 bg-gray-50 text-theme-xs uppercase text-gray-600 dark:bg-white/[0.06] dark:text-gray-400">
                            <tr>
                              <th className="border-b border-gray-200 px-4 py-2.5 dark:border-gray-800">
                                Label
                              </th>
                              <th className="border-b border-gray-200 px-4 py-2.5 dark:border-gray-800">
                                Project types
                              </th>
                              <th className="border-b border-gray-200 px-4 py-2.5 dark:border-gray-800 w-20">
                                Sort
                              </th>
                              <th className="border-b border-gray-200 px-4 py-2.5 dark:border-gray-800 w-24">
                                Status
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {industriesSorted.map((ind) => (
                              <tr
                                key={ind.id}
                                role="button"
                                tabIndex={0}
                                onClick={() => setSelectedIndustryId(ind.id)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    setSelectedIndustryId(ind.id);
                                  }
                                }}
                                className="cursor-pointer border-b border-gray-100 transition-colors hover:bg-brand-50/80 dark:border-gray-800/80 dark:hover:bg-brand-500/10"
                              >
                                <td className="px-4 py-3 font-medium">{ind.label}</td>
                                <td className="max-w-xl px-4 py-3 text-theme-xs text-gray-600 dark:text-gray-400">
                                  {[...(ind.projectTypes ?? [])]
                                    .sort((a, b) => a.sortOrder - b.sortOrder)
                                    .map((p) => displayProjectTypeLabel(p))
                                    .join(", ") || "—"}
                                </td>
                                <td className="px-4 py-3 text-theme-xs">{ind.sortOrder}</td>
                                <td className="px-4 py-3 text-theme-xs">
                                  {ind.isActive ? (
                                    <span className="text-green-600 dark:text-green-400">Active</span>
                                  ) : (
                                    <span className="text-gray-500">Inactive</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <aside className="flex h-full min-h-0 w-full max-h-full flex-1 basis-0 flex-col overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 md:w-52 md:max-w-[13rem] md:flex-none md:basis-auto">
                      <p className="shrink-0 border-b border-gray-100 px-3 py-2 text-theme-xs font-semibold uppercase tracking-wide text-gray-500 dark:border-gray-800 dark:text-gray-400">
                        Industries
                      </p>
                      <ul className="min-h-0 flex-1 space-y-0.5 overflow-y-auto overscroll-contain p-2">
                        {industriesSorted.map((ind) => {
                          const isSel = selectedIndustryId === ind.id;
                          return (
                            <li key={ind.id}>
                              <button
                                type="button"
                                onClick={() => setSelectedIndustryId(ind.id)}
                                className={`flex w-full flex-col items-start rounded-lg border px-2.5 py-2 text-left text-theme-sm transition-colors ${
                                  isSel
                                    ? "border-brand-500 bg-brand-50 text-gray-900 dark:border-brand-500 dark:bg-brand-500/10 dark:text-white"
                                    : "border-transparent bg-gray-50/80 hover:border-gray-200 hover:bg-gray-100 dark:bg-white/[0.04] dark:hover:border-gray-700 dark:hover:bg-white/[0.08]"
                                }`}
                              >
                                <span className="line-clamp-2 font-medium leading-snug">
                                  {ind.label}
                                </span>
                                <span className="mt-1 text-theme-xs text-gray-400 dark:text-gray-500">
                                  {ind.isActive ? "Active" : "Inactive"} · sort {ind.sortOrder}
                                </span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </aside>

                    {selectedIndustry && (
                      <section className="relative flex h-full min-h-0 min-w-0 max-h-full flex-1 basis-0 flex-col overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
                        <button
                          type="button"
                          onClick={() => setSelectedIndustryId(null)}
                          className="absolute right-2 top-2 z-10 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800"
                          aria-label="Close industry details"
                        >
                          <CloseIcon className="h-4 w-4" />
                        </button>
                        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4 pt-12">
                      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:pr-10">
                        <h4 className="min-w-0 flex-1 text-theme-sm font-semibold leading-snug text-gray-800 dark:text-white/90">
                          {selectedIndustry.label}
                        </h4>
                        <button
                          type="button"
                          className="shrink-0 self-end text-theme-sm text-error-600 dark:text-error-400 sm:self-auto"
                          onClick={async () => {
                            openConfirm(
                              "Delete this industry and all its project types?",
                              async () => {
                                try {
                                  await deletePlatformIndustryAdmin(selectedIndustry.id);
                                  setIndustries((p) =>
                                    p.filter((x) => x.id !== selectedIndustry.id),
                                  );
                                  setSelectedIndustryId(null);
                                } catch (e) {
                                  setError(e instanceof Error ? e.message : "Delete failed");
                                }
                              },
                            );
                          }}
                        >
                          Delete
                        </button>
                      </div>
                      <div className="mb-6 flex flex-wrap items-end gap-2">
                        <label className="min-w-[200px] flex-1">
                          <span className="mb-1 block text-theme-xs text-gray-600 dark:text-gray-400">
                            Label
                          </span>
                          <input
                            className={inputClass}
                            value={selectedIndustry.label}
                            onChange={(e) =>
                              patchIndustryLocal(selectedIndustry.id, { label: e.target.value })
                            }
                          />
                        </label>
                        <label>
                          <span className="mb-1 block text-theme-xs text-gray-600 dark:text-gray-400">
                            Sort
                          </span>
                          <input
                            type="number"
                            className={inputClass + " w-20"}
                            value={selectedIndustry.sortOrder}
                            onChange={(e) =>
                              patchIndustryLocal(selectedIndustry.id, {
                                sortOrder: Number(e.target.value),
                              })
                            }
                          />
                        </label>
                        <label>
                          <span className="mb-1 block text-theme-xs text-gray-600 dark:text-gray-400">
                            Active
                          </span>
                          <div className="flex h-10 items-center gap-2 text-theme-sm text-gray-700 dark:text-gray-300">
                            <input
                              type="checkbox"
                              className={catalogCheckboxClass}
                              checked={selectedIndustry.isActive}
                              onChange={(e) =>
                                patchIndustryLocal(selectedIndustry.id, {
                                  isActive: e.target.checked,
                                })
                              }
                            />
                          </div>
                        </label>
                        <button
                          type="button"
                          className="h-10 rounded-lg bg-gray-100 px-3 text-theme-sm font-medium text-gray-800 dark:bg-gray-800 dark:text-white/90"
                          onClick={async () => {
                            try {
                              const u = await updatePlatformIndustryAdmin(selectedIndustry.id, {
                                label: selectedIndustry.label,
                                value: selectedIndustry.value,
                                sortOrder: selectedIndustry.sortOrder,
                                isActive: selectedIndustry.isActive,
                              });
                              setIndustries((p) =>
                                p.map((x) =>
                                  x.id === selectedIndustry.id
                                    ? { ...u, projectTypes: x.projectTypes }
                                    : x,
                                ),
                              );
                            } catch (e) {
                              setError(e instanceof Error ? e.message : "Save failed");
                            }
                          }}
                        >
                          Save industry
                        </button>
                      </div>

                      <p className="mb-2 text-theme-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                        Project types for this industry
                      </p>
                      <div className="overflow-x-auto rounded-lg border border-gray-100 dark:border-gray-800/80">
                        <table className="min-w-full text-left text-theme-xs text-gray-800 dark:text-white/90">
                          <thead className="bg-gray-50 dark:bg-white/[0.04]">
                            <tr>
                              <th className="px-2 py-2">Type</th>
                              <th className="px-2 py-2">Key</th>
                              <th className="px-2 py-2">Unit placeholder</th>
                              <th className="px-2 py-2 w-16">Sort</th>
                              <th className="px-2 py-2">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(selectedIndustry.projectTypes ?? []).map((pt) => (
                              <tr
                                key={pt.id}
                                className="border-t border-gray-100 dark:border-gray-800"
                              >
                                <td className="p-1">
                                  <input
                                    className={cellInputClass}
                                    value={displayProjectTypeLabel(pt)}
                                    onChange={(e) =>
                                      patchPtLocal(selectedIndustry.id, pt.id, {
                                        label: e.target.value,
                                      })
                                    }
                                  />
                                </td>
                                <td className="p-1">
                                  <div
                                    className="flex h-9 items-center px-2 font-mono text-theme-xs text-gray-500 dark:text-gray-400"
                                    title="Internal key stored on projects and APIs"
                                  >
                                    {pt.projectType}
                                  </div>
                                </td>
                                <td className="p-1">
                                  <input
                                    className={cellInputClass}
                                    value={pt.placeholder}
                                    onChange={(e) =>
                                      patchPtLocal(selectedIndustry.id, pt.id, {
                                        placeholder: e.target.value,
                                      })
                                    }
                                  />
                                </td>
                                <td className="p-1">
                                  <input
                                    type="number"
                                    className={cellInputClass}
                                    value={pt.sortOrder}
                                    onChange={(e) =>
                                      patchPtLocal(selectedIndustry.id, pt.id, {
                                        sortOrder: Number(e.target.value),
                                      })
                                    }
                                  />
                                </td>
                                <td className="px-2 py-1">
                                  <button
                                    type="button"
                                    className="mr-2 text-theme-xs text-brand-600 dark:text-brand-400"
                                    onClick={async () => {
                                      try {
                                        const u = await updateIndustryProjectTypeAdmin(pt.id, {
                                          label: (pt.label ?? "").trim()
                                            ? pt.label
                                            : formatKeyAsLabel(pt.projectType),
                                          placeholder: pt.placeholder,
                                          sortOrder: pt.sortOrder,
                                        });
                                        patchPtLocal(selectedIndustry.id, pt.id, u);
                                      } catch (e) {
                                        setError(e instanceof Error ? e.message : "Save failed");
                                      }
                                    }}
                                  >
                                    Save
                                  </button>
                                  <button
                                    type="button"
                                    className="text-theme-xs text-error-600 dark:text-error-400"
                                    onClick={async () => {
                                      openConfirm("Remove this project type?", async () => {
                                        try {
                                          await deleteIndustryProjectTypeAdmin(pt.id);
                                          setIndustries((prev) =>
                                            prev.map((x) =>
                                              x.id === selectedIndustry.id
                                                ? {
                                                    ...x,
                                                    projectTypes: (x.projectTypes ?? []).filter(
                                                      (p) => p.id !== pt.id,
                                                    ),
                                                  }
                                                : x,
                                            ),
                                          );
                                        } catch (e) {
                                          setError(
                                            e instanceof Error ? e.message : "Delete failed",
                                          );
                                        }
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
                      <AddProjectTypeRow
                        industryId={selectedIndustry.id}
                        onCreated={(row) => {
                          setIndustries((prev) =>
                            prev.map((x) =>
                              x.id === selectedIndustry.id
                                ? { ...x, projectTypes: [...(x.projectTypes ?? []), row] }
                                : x,
                            ),
                          );
                        }}
                        onError={(m) => setError(m)}
                      />
                        </div>
                    </section>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {tab === "dashboardUses" && (
            <div className="flex min-h-0 flex-1 flex-col gap-4">
              <div className="flex shrink-0 flex-wrap items-end gap-2 rounded-lg border border-gray-200 p-4 dark:border-gray-800">
                <label className="min-w-[160px] flex-1">
                  <span className="mb-1 block text-theme-xs text-gray-600 dark:text-gray-400">
                    Label
                  </span>
                  <input
                    className={inputClass}
                    value={newUse.label}
                    onChange={(e) => setNewUse((s) => ({ ...s, label: e.target.value }))}
                  />
                </label>
                <label>
                  <span className="mb-1 block text-theme-xs text-gray-600 dark:text-gray-400">
                    Sort
                  </span>
                  <input
                    type="number"
                    className={inputClass + " w-24"}
                    value={newUse.sortOrder}
                    onChange={(e) =>
                      setNewUse((s) => ({ ...s, sortOrder: Number(e.target.value) }))
                    }
                  />
                </label>
                <button
                  type="button"
                  className="h-10 rounded-lg bg-brand-500 px-4 text-theme-sm font-medium text-white"
                  onClick={async () => {
                    if (!newUse.label.trim()) return;
                    try {
                      const r = await createPlatformDashboardUseAdmin({
                        label: newUse.label.trim(),
                        value: slugifyDashboardUseValue(newUse.label),
                        sortOrder: newUse.sortOrder,
                      });
                      setDashboardUses((p) => [...p, r]);
                      setNewUse({ label: "", value: "", sortOrder: 0 });
                    } catch (e) {
                      setError(e instanceof Error ? e.message : "Create failed");
                    }
                  }}
                >
                  Add
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-x-auto overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-800">
                <table className="min-w-full text-left text-theme-sm text-gray-800 dark:text-white/90">
                  <thead className="sticky top-0 bg-gray-50 text-theme-xs uppercase dark:bg-white/[0.04]">
                    <tr>
                      <th className="px-3 py-2">Label</th>
                      <th className="px-3 py-2">Sort</th>
                      <th className="px-3 py-2">Active</th>
                      <th className="px-3 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardUses.map((row) => (
                      <DashboardUseRowEditor
                        key={row.id}
                        row={row}
                        openConfirm={openConfirm}
                        onUpdate={(u) =>
                          setDashboardUses((p) => p.map((x) => (x.id === row.id ? u : x)))
                        }
                        onRemove={() => setDashboardUses((p) => p.filter((x) => x.id !== row.id))}
                        onError={(m) => setError(m)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === "skillsets" && (
            <div className="flex min-h-0 flex-1 flex-col gap-4">
              <div className="flex shrink-0 flex-wrap items-end gap-2 rounded-lg border border-gray-200 p-4 dark:border-gray-800">
                <label className="min-w-[200px] flex-1">
                  <span className="mb-1 block text-theme-xs text-gray-600 dark:text-gray-400">
                    New category name
                  </span>
                  <input
                    className={inputClass}
                    value={newCategory.name}
                    onChange={(e) => setNewCategory((s) => ({ ...s, name: e.target.value }))}
                  />
                </label>
                <label>
                  <span className="mb-1 block text-theme-xs text-gray-600 dark:text-gray-400">
                    Sort
                  </span>
                  <input
                    type="number"
                    className={inputClass + " w-24"}
                    value={newCategory.sortOrder}
                    onChange={(e) =>
                      setNewCategory((s) => ({ ...s, sortOrder: Number(e.target.value) }))
                    }
                  />
                </label>
                <button
                  type="button"
                  className="h-10 rounded-lg bg-brand-500 px-4 text-theme-sm font-medium text-white"
                  onClick={async () => {
                    if (!newCategory.name.trim()) return;
                    try {
                      const r = await createPlatformSkillCategoryAdmin(newCategory);
                      setSkillCategories((p) => [...p, { ...r, skills: [] }]);
                      setNewCategory({ name: "", sortOrder: 0 });
                    } catch (e) {
                      setError(e instanceof Error ? e.message : "Create failed");
                    }
                  }}
                >
                  Add category
                </button>
              </div>

              {selectedSkillCategoryId == null ? (
                <div
                  className={`min-h-0 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 ${skillsetsPanelSplitClass}`}
                >
                  <div className="flex h-full min-h-0 w-full flex-col overflow-hidden">
                    <p className="shrink-0 border-b border-gray-100 px-4 py-2 text-theme-xs font-semibold uppercase tracking-wide text-gray-500 dark:border-gray-800 dark:text-gray-400">
                      Skill categories
                    </p>
                    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                      <ul className="space-y-0.5 p-2">
                        {skillCategoriesSorted.map((cat) => {
                          const skillsSummary =
                            (cat.skills ?? []).map((s) => s.name).join(", ") || "—";
                          return (
                            <li key={cat.id}>
                              <button
                                type="button"
                                onClick={() => setSelectedSkillCategoryId(cat.id)}
                                className={`flex w-full flex-col items-start rounded-lg border px-2.5 py-2 text-left text-theme-sm transition-colors hover:border-gray-200 hover:bg-gray-100 dark:hover:border-gray-700 dark:hover:bg-white/[0.08]`}
                              >
                                <span className="line-clamp-2 font-medium leading-snug">
                                  {cat.name}
                                </span>
                                <span className="mt-1 text-theme-xs text-gray-400 dark:text-gray-500">
                                  {skillsSummary}
                                </span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </div>
                </div>
              ) : selectedSkillCategory ? (
                <div
                  className={`relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 ${skillsetsPanelSplitClass}`}
                >
                  <aside className="flex h-full min-h-0 w-full flex-col overflow-hidden md:w-52 md:max-w-[13rem] md:shrink-0">
                    <p className="shrink-0 border-b border-gray-100 px-3 py-2 text-theme-xs font-semibold uppercase tracking-wide text-gray-500 dark:border-gray-800 dark:text-gray-400">
                      Skill categories
                    </p>
                    <ul className="min-h-0 flex-1 space-y-0.5 overflow-y-auto overscroll-contain p-2">
                      {skillCategoriesSorted.map((cat) => {
                        const isSel = cat.id === selectedSkillCategoryId;
                        return (
                          <li key={cat.id}>
                            <button
                              type="button"
                              onClick={() => setSelectedSkillCategoryId(cat.id)}
                              className={`flex w-full flex-col items-start rounded-lg border px-2.5 py-2 text-left text-theme-sm transition-colors ${
                                isSel
                                  ? "border-brand-500 bg-brand-50 text-gray-900 dark:border-brand-500 dark:bg-brand-500/10 dark:text-white"
                                  : "border-transparent bg-gray-50/80 hover:border-gray-200 hover:bg-gray-100 dark:bg-white/[0.04] dark:hover:border-gray-700 dark:hover:bg-white/[0.08]"
                              }`}
                            >
                              <span className="line-clamp-2 font-medium leading-snug">
                                {cat.name}
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </aside>

                  <section className="relative flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setSelectedSkillCategoryId(null)}
                      className="absolute right-2 top-2 z-10 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800"
                      aria-label="Close skill category details"
                    >
                      <CloseIcon className="h-4 w-4" />
                    </button>

                    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4 pt-12">
                      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:pr-10">
                        <h4 className="min-w-0 flex-1 text-theme-sm font-semibold leading-snug text-gray-800 dark:text-white/90">
                          {selectedSkillCategory.name}
                        </h4>
                        <button
                          type="button"
                          className="shrink-0 self-end text-theme-sm text-error-600 dark:text-error-400 sm:self-auto"
                          onClick={async () => {
                            openConfirm("Delete category and all skills in it?", async () => {
                              try {
                                await deletePlatformSkillCategoryAdmin(selectedSkillCategory.id);
                                setSkillCategories((p) =>
                                  p.filter((c) => c.id !== selectedSkillCategory.id),
                                );
                                setSelectedSkillCategoryId(null);
                              } catch (e) {
                                setError(e instanceof Error ? e.message : "Delete failed");
                              }
                            });
                          }}
                        >
                          Delete
                        </button>
                      </div>

                      <div className="mb-6 flex flex-wrap items-end gap-2">
                        <label className="min-w-[200px] flex-1">
                          <span className="mb-1 block text-theme-xs text-gray-600 dark:text-gray-400">
                            Category
                          </span>
                          <input
                            className={inputClass}
                            value={selectedSkillCategory.name}
                            onChange={(e) =>
                              setSkillCategories((p) =>
                                p.map((c) =>
                                  c.id === selectedSkillCategory.id
                                    ? { ...c, name: e.target.value }
                                    : c,
                                ),
                              )
                            }
                          />
                        </label>
                        <label>
                          <span className="mb-1 block text-theme-xs text-gray-600 dark:text-gray-400">
                            Sort
                          </span>
                          <input
                            type="number"
                            className={inputClass + " w-20"}
                            value={selectedSkillCategory.sortOrder}
                            onChange={(e) =>
                              setSkillCategories((p) =>
                                p.map((c) =>
                                  c.id === selectedSkillCategory.id
                                    ? { ...c, sortOrder: Number(e.target.value) }
                                    : c,
                                ),
                              )
                            }
                          />
                        </label>
                        <label>
                          <span className="mb-1 block text-theme-xs text-gray-600 dark:text-gray-400">
                            Active
                          </span>
                          <div className="flex h-10 items-center gap-2 text-theme-sm text-gray-700 dark:text-gray-300">
                            <input
                              type="checkbox"
                              className={catalogCheckboxClass}
                              checked={selectedSkillCategory.isActive}
                              onChange={(e) =>
                                setSkillCategories((p) =>
                                  p.map((c) =>
                                    c.id === selectedSkillCategory.id
                                      ? { ...c, isActive: e.target.checked }
                                      : c,
                                  ),
                                )
                              }
                            />
                          </div>
                        </label>
                        <button
                          type="button"
                          className="h-10 rounded-lg bg-gray-100 px-3 text-theme-sm dark:bg-gray-800 dark:text-white/90"
                          onClick={async () => {
                            try {
                              const u = await updatePlatformSkillCategoryAdmin(selectedSkillCategory.id, {
                                name: selectedSkillCategory.name,
                                sortOrder: selectedSkillCategory.sortOrder,
                                isActive: selectedSkillCategory.isActive,
                              });
                              setSkillCategories((p) =>
                                p.map((c) =>
                                  c.id === selectedSkillCategory.id
                                    ? { ...c, ...u, skills: c.skills }
                                    : c,
                                ),
                              );
                            } catch (e) {
                              setError(e instanceof Error ? e.message : "Save failed");
                            }
                          }}
                        >
                          Save category
                        </button>
                      </div>

                      <div className="overflow-x-auto rounded-lg border border-gray-100 dark:border-gray-800/80">
                        <table className="min-w-full text-left text-theme-xs">
                          <thead className="bg-gray-50 dark:bg-white/[0.04]">
                            <tr>
                              <th className="px-2 py-2">Skill</th>
                              <th className="px-2 py-2 w-16">Sort</th>
                              <th className="px-2 py-2">Active</th>
                              <th className="px-2 py-2">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(selectedSkillCategory.skills ?? []).map((sk) => (
                              <SkillRowEditor
                                key={sk.id}
                                skill={sk}
                                openConfirm={openConfirm}
                                onPatch={(patch) =>
                                  setSkillCategories((p) =>
                                    p.map((c) =>
                                      c.id === selectedSkillCategory.id
                                        ? {
                                            ...c,
                                            skills: (c.skills ?? []).map((s) =>
                                              s.id === sk.id ? { ...s, ...patch } : s,
                                            ),
                                          }
                                        : c,
                                    ),
                                  )
                                }
                                onSaved={(u) =>
                                  setSkillCategories((p) =>
                                    p.map((c) =>
                                      c.id === selectedSkillCategory.id
                                        ? {
                                            ...c,
                                            skills: (c.skills ?? []).map((s) =>
                                              s.id === sk.id ? u : s,
                                            ),
                                          }
                                        : c,
                                    ),
                                  )
                                }
                                onRemoved={() =>
                                  setSkillCategories((p) =>
                                    p.map((c) =>
                                      c.id === selectedSkillCategory.id
                                        ? {
                                            ...c,
                                            skills: (c.skills ?? []).filter((s) => s.id !== sk.id),
                                          }
                                        : c,
                                    ),
                                  )
                                }
                                onError={(m) => setError(m)}
                              />
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="mt-2 flex flex-wrap items-end gap-2">
                        <input
                          className={inputClass + " max-w-md flex-1"}
                          placeholder="New skill name"
                          value={newSkillByCategory[selectedSkillCategory.id] ?? ""}
                          onChange={(e) =>
                            setNewSkillByCategory((s) => ({
                              ...s,
                              [selectedSkillCategory.id]: e.target.value,
                            }))
                          }
                        />
                        <button
                          type="button"
                          className="h-10 rounded-lg border border-gray-200 px-3 text-theme-sm dark:border-gray-700"
                          onClick={async () => {
                            const name = (newSkillByCategory[selectedSkillCategory.id] ?? "").trim();
                            if (!name) return;
                            try {
                              const row = await createPlatformSkillAdmin(selectedSkillCategory.id, { name });
                              setSkillCategories((p) =>
                                p.map((c) =>
                                  c.id === selectedSkillCategory.id
                                    ? { ...c, skills: [...(c.skills ?? []), row] }
                                    : c,
                                ),
                              );
                              setNewSkillByCategory((s) => ({ ...s, [selectedSkillCategory.id]: "" }));
                            } catch (e) {
                              setError(e instanceof Error ? e.message : "Create failed");
                            }
                          }}
                        >
                          Add skill
                        </button>
                      </div>
                    </div>
                  </section>
                </div>
              ) : (
                <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-800" />
              )}
            </div>
          )}
        </div>
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

function AddProjectTypeRow({
  industryId,
  onCreated,
  onError,
}: {
  industryId: string;
  onCreated: (row: PlatformIndustryProjectTypeRow) => void;
  onError: (m: string) => void;
}) {
  const [typeLabel, setTypeLabel] = useState("");
  const [placeholder, setPlaceholder] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  return (
    <div className="mt-2 flex flex-wrap items-end gap-2">
      <input
        className={inputClass + " min-w-[180px] max-w-[240px] flex-1"}
        placeholder="Type (e.g. Website Development)"
        value={typeLabel}
        onChange={(e) => setTypeLabel(e.target.value)}
      />
      <input
        className={inputClass + " max-w-md flex-1"}
        placeholder="Placeholder (e.g. Number of pages)"
        value={placeholder}
        onChange={(e) => setPlaceholder(e.target.value)}
      />
      <input
        type="number"
        className={inputClass + " w-20"}
        value={sortOrder}
        onChange={(e) => setSortOrder(Number(e.target.value))}
      />
      <button
        type="button"
        className="h-10 rounded-lg border border-gray-200 px-3 text-theme-sm dark:border-gray-700"
        onClick={async () => {
          if (!typeLabel.trim() || !placeholder.trim()) return;
          try {
            const row = await createIndustryProjectTypeAdmin(industryId, {
              label: typeLabel.trim(),
              placeholder,
              sortOrder,
            });
            onCreated(row);
            setTypeLabel("");
            setPlaceholder("");
            setSortOrder(0);
          } catch (e) {
            onError(e instanceof Error ? e.message : "Create failed");
          }
        }}
      >
        Add project type
      </button>
    </div>
  );
}

function DashboardUseRowEditor({
  row,
  onUpdate,
  onRemove,
  onError,
  openConfirm,
}: {
  row: PlatformDashboardUseAdminRow;
  onUpdate: (u: PlatformDashboardUseAdminRow) => void;
  onRemove: () => void;
  onError: (m: string) => void;
  openConfirm: (msg: string, action: () => Promise<void> | void) => void;
}) {
  const [draft, setDraft] = useState(row);
  useEffect(() => {
    setDraft(row);
  }, [row]);
  return (
    <tr className="border-t border-gray-200 dark:border-gray-800">
      <td className="px-2 py-1">
        <input
          className={cellInputClass}
          value={draft.label}
          onChange={(e) => setDraft((d) => ({ ...d, label: e.target.value }))}
        />
      </td>
      <td className="px-2 py-1">
        <input
          type="number"
          className={cellInputClass}
          value={draft.sortOrder}
          onChange={(e) => setDraft((d) => ({ ...d, sortOrder: Number(e.target.value) }))}
        />
      </td>
      <td className="px-2 py-1">
        <div className="flex h-9 items-center">
          <input
            type="checkbox"
            className={catalogCheckboxClass}
            checked={draft.isActive}
            onChange={(e) => setDraft((d) => ({ ...d, isActive: e.target.checked }))}
          />
        </div>
      </td>
      <td className="px-2 py-1">
        <button
          type="button"
          className="mr-2 text-theme-xs text-brand-600"
          onClick={async () => {
            try {
              const u = await updatePlatformDashboardUseAdmin(row.id, {
                label: draft.label,
                value: draft.value,
                sortOrder: draft.sortOrder,
                isActive: draft.isActive,
              });
              onUpdate(u);
            } catch (e) {
              onError(e instanceof Error ? e.message : "Save failed");
            }
          }}
        >
          Save
        </button>
        <button
          type="button"
          className="text-theme-xs text-error-600"
          onClick={async () => {
            openConfirm("Delete this option?", async () => {
              try {
                await deletePlatformDashboardUseAdmin(row.id);
                onRemove();
              } catch (e) {
                onError(e instanceof Error ? e.message : "Delete failed");
              }
            });
          }}
        >
          Delete
        </button>
      </td>
    </tr>
  );
}

function SkillRowEditor({
  skill,
  onPatch,
  onSaved,
  onRemoved,
  onError,
  openConfirm,
}: {
  skill: PlatformSkillAdminRow;
  onPatch: (patch: Partial<PlatformSkillAdminRow>) => void;
  onSaved: (u: PlatformSkillAdminRow) => void;
  onRemoved: () => void;
  onError: (m: string) => void;
  openConfirm: (msg: string, action: () => Promise<void> | void) => void;
}) {
  return (
    <tr className="border-t border-gray-200 dark:border-gray-800">
      <td className="p-1">
        <input
          className={cellInputClass}
          value={skill.name}
          onChange={(e) => onPatch({ name: e.target.value })}
        />
      </td>
      <td className="p-1">
        <input
          type="number"
          className={cellInputClass}
          value={skill.sortOrder}
          onChange={(e) => onPatch({ sortOrder: Number(e.target.value) })}
        />
      </td>
      <td className="p-1">
        <div className="flex h-9 items-center">
          <input
            type="checkbox"
            className={catalogCheckboxClass}
            checked={skill.isActive}
            onChange={(e) => onPatch({ isActive: e.target.checked })}
          />
        </div>
      </td>
      <td className="p-1">
        <button
          type="button"
          className="mr-2 text-theme-xs text-brand-600"
          onClick={async () => {
            try {
              const u = await updatePlatformSkillAdmin(skill.id, {
                name: skill.name,
                sortOrder: skill.sortOrder,
                isActive: skill.isActive,
              });
              onSaved(u);
            } catch (e) {
              onError(e instanceof Error ? e.message : "Save failed");
            }
          }}
        >
          Save
        </button>
        <button
          type="button"
          className="text-theme-xs text-error-600"
          onClick={async () => {
            openConfirm("Remove skill?", async () => {
              try {
                await deletePlatformSkillAdmin(skill.id);
                onRemoved();
              } catch (e) {
                onError(e instanceof Error ? e.message : "Delete failed");
              }
            });
          }}
        >
          Remove
        </button>
      </td>
    </tr>
  );
}
