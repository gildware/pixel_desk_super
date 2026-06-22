"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import {
  CatalogDragHandle,
  useCatalogDragReorder,
} from "@/src/components/platform-catalog/CatalogDragHandle";
import {
  nextSortOrder,
  persistSortReorder,
  sortByOrder,
} from "@/src/components/platform-catalog/catalogSortUtils";

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

const VALID_TABS: TabId[] = ["industries", "dashboardUses", "skillsets"];

function parseTab(raw: string | null): TabId {
  if (raw && VALID_TABS.includes(raw as TabId)) {
    return raw as TabId;
  }
  return "industries";
}

export default function PlatformCatalogPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = useMemo(() => parseTab(searchParams.get("tab")), [searchParams]);

  const setTab = useCallback(
    (next: TabId) => {
      router.replace(`/settings/platform-catalog?tab=${next}`, { scroll: false });
    },
    [router],
  );
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

  const [newIndustry, setNewIndustry] = useState({ label: "" });
  const [newUse, setNewUse] = useState({ label: "" });
  const [newCategory, setNewCategory] = useState({ name: "" });
  const [newSkillByCategory, setNewSkillByCategory] = useState<Record<string, string>>({});
  const [selectedIndustryId, setSelectedIndustryId] = useState<string | null>(null);
  const [selectedSkillCategoryId, setSelectedSkillCategoryId] = useState<string | null>(null);

  const [editingIndustry, setEditingIndustry] = useState<PlatformIndustryAdminRow | null>(null);
  const [editingDashboardUse, setEditingDashboardUse] = useState<PlatformDashboardUseAdminRow | null>(
    null,
  );
  const [editingSkillCategory, setEditingSkillCategory] =
    useState<PlatformSkillCategoryAdminRow | null>(null);
  const [editingSkill, setEditingSkill] = useState<{
    categoryId: string;
    skill: PlatformSkillAdminRow;
  } | null>(null);
  const [editingProjectType, setEditingProjectType] = useState<{
    industryId: string;
    pt: PlatformIndustryProjectTypeRow;
  } | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

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

  const industriesSorted = sortByOrder(industries, (a, b) => a.label.localeCompare(b.label));

  const dashboardUsesSorted = sortByOrder(dashboardUses, (a, b) => a.label.localeCompare(b.label));

  const skillCategoriesSorted = sortByOrder(skillCategories, (a, b) => a.name.localeCompare(b.name));

  const tabs: { id: TabId; label: string }[] = [
    { id: "industries", label: "Industries" },
    { id: "dashboardUses", label: "Dashboard primary use" },
    { id: "skillsets", label: "Skillsets" },
  ];

  const reorderIndustries = useCallback(
    async (reordered: PlatformIndustryAdminRow[]) => {
      await persistSortReorder(
        reordered,
        (id, sortOrder) => updatePlatformIndustryAdmin(id, { sortOrder }),
        (rows) => setIndustries(rows),
        (rows) => sortByOrder(rows, (a, b) => a.label.localeCompare(b.label)),
      );
    },
    [],
  );

  const reorderDashboardUses = useCallback(
    async (reordered: PlatformDashboardUseAdminRow[]) => {
      await persistSortReorder(
        reordered,
        (id, sortOrder) => updatePlatformDashboardUseAdmin(id, { sortOrder }),
        (rows) => setDashboardUses(rows),
        (rows) => sortByOrder(rows, (a, b) => a.label.localeCompare(b.label)),
      );
    },
    [],
  );

  const reorderSkillCategories = useCallback(
    async (reordered: PlatformSkillCategoryAdminRow[]) => {
      await persistSortReorder(
        reordered,
        (id, sortOrder) => updatePlatformSkillCategoryAdmin(id, { sortOrder }),
        (rows) => setSkillCategories(rows),
        (rows) => sortByOrder(rows, (a, b) => a.name.localeCompare(b.name)),
      );
    },
    [],
  );

  const reorderProjectTypes = useCallback(
    async (industryId: string, reordered: PlatformIndustryProjectTypeRow[]) => {
      const previous = industries.find((i) => i.id === industryId)?.projectTypes ?? [];
      const withNewOrder = reordered.map((row, index) => ({ ...row, sortOrder: index }));
      setIndustries((prev) =>
        prev.map((ind) =>
          ind.id === industryId ? { ...ind, projectTypes: withNewOrder } : ind,
        ),
      );
      try {
        const updated = await Promise.all(
          withNewOrder.map((row) =>
            updateIndustryProjectTypeAdmin(row.id, { sortOrder: row.sortOrder }),
          ),
        );
        setIndustries((prev) =>
          prev.map((ind) =>
            ind.id === industryId
              ? {
                  ...ind,
                  projectTypes: sortByOrder(updated, (a, b) =>
                    displayProjectTypeLabel(a).localeCompare(displayProjectTypeLabel(b)),
                  ),
                }
              : ind,
          ),
        );
      } catch (e) {
        setIndustries((prev) =>
          prev.map((ind) =>
            ind.id === industryId ? { ...ind, projectTypes: previous } : ind,
          ),
        );
        throw e;
      }
    },
    [industries],
  );

  const reorderSkills = useCallback(
    async (categoryId: string, reordered: PlatformSkillAdminRow[]) => {
      const previous =
        skillCategories.find((c) => c.id === categoryId)?.skills ?? [];
      const withNewOrder = reordered.map((row, index) => ({ ...row, sortOrder: index }));
      setSkillCategories((prev) =>
        prev.map((cat) =>
          cat.id === categoryId ? { ...cat, skills: withNewOrder } : cat,
        ),
      );
      try {
        const updated = await Promise.all(
          withNewOrder.map((row) => updatePlatformSkillAdmin(row.id, { sortOrder: row.sortOrder })),
        );
        setSkillCategories((prev) =>
          prev.map((cat) =>
            cat.id === categoryId
              ? {
                  ...cat,
                  skills: sortByOrder(updated, (a, b) => a.name.localeCompare(b.name)),
                }
              : cat,
          ),
        );
      } catch (e) {
        setSkillCategories((prev) =>
          prev.map((cat) =>
            cat.id === categoryId ? { ...cat, skills: previous } : cat,
          ),
        );
        throw e;
      }
    },
    [skillCategories],
  );

  const industryDrag = useCatalogDragReorder(industriesSorted, reorderIndustries, setError);
  const dashboardDrag = useCatalogDragReorder(
    dashboardUsesSorted,
    reorderDashboardUses,
    setError,
  );
  const skillCategoryDrag = useCatalogDragReorder(
    skillCategoriesSorted,
    reorderSkillCategories,
    setError,
  );

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
                <button
                  type="button"
                  className="h-10 rounded-lg bg-brand-500 px-4 text-theme-sm font-medium text-white hover:bg-brand-600"
                  onClick={async () => {
                    if (!newIndustry.label.trim()) return;
                    try {
                      const r = await createPlatformIndustryAdmin({
                        label: newIndustry.label.trim(),
                        value: slugifyIndustryValue(newIndustry.label),
                        sortOrder: nextSortOrder(industries),
                      });
                      const row = { ...r, projectTypes: [] as PlatformIndustryProjectTypeRow[] };
                      setIndustries((p) =>
                        sortByOrder([...p, row], (a, b) => a.label.localeCompare(b.label)),
                      );
                      setNewIndustry({ label: "" });
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
                              <th className="w-10 border-b border-gray-200 px-2 py-2.5 dark:border-gray-800" aria-label="Reorder" />
                              <th className="border-b border-gray-200 px-4 py-2.5 dark:border-gray-800">
                                Label
                              </th>
                              <th className="border-b border-gray-200 px-4 py-2.5 dark:border-gray-800">
                                Project types
                              </th>
                              <th className="border-b border-gray-200 px-4 py-2.5 dark:border-gray-800 w-24">
                                Status
                              </th>
                              <th className="border-b border-gray-200 px-4 py-2.5 dark:border-gray-800 w-36">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {industriesSorted.map((ind) => (
                              <tr
                                key={ind.id}
                                {...industryDrag.rowDragProps(ind.id)}
                                className={`border-b border-gray-100 transition-colors dark:border-gray-800/80 ${industryDrag.rowClassName(ind.id)}`}
                              >
                                <td className="px-2 py-3 align-middle">
                                  <CatalogDragHandle {...industryDrag.dragHandleProps(ind.id, ind.label)} />
                                </td>
                                <td
                                  role="button"
                                  tabIndex={0}
                                  onClick={() => setSelectedIndustryId(ind.id)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                      e.preventDefault();
                                      setSelectedIndustryId(ind.id);
                                    }
                                  }}
                                  className="cursor-pointer px-4 py-3 font-medium hover:text-brand-600 dark:hover:text-brand-400"
                                >
                                  {ind.label}
                                </td>
                                <td
                                  role="button"
                                  tabIndex={0}
                                  onClick={() => setSelectedIndustryId(ind.id)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                      e.preventDefault();
                                      setSelectedIndustryId(ind.id);
                                    }
                                  }}
                                  className="max-w-xl cursor-pointer px-4 py-3 text-theme-xs text-gray-600 dark:text-gray-400"
                                >
                                  {sortByOrder(ind.projectTypes ?? [], (a, b) =>
                                    displayProjectTypeLabel(a).localeCompare(displayProjectTypeLabel(b)),
                                  )
                                    .map((p) => displayProjectTypeLabel(p))
                                    .join(", ") || "—"}
                                </td>
                                <td className="px-4 py-3 text-theme-xs">
                                  {ind.isActive ? (
                                    <span className="text-green-600 dark:text-green-400">Active</span>
                                  ) : (
                                    <span className="text-gray-500">Inactive</span>
                                  )}
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-3 text-theme-xs">
                                    <button
                                      type="button"
                                      className="text-brand-600 hover:underline dark:text-brand-400"
                                      disabled={industryDrag.reordering}
                                      onClick={() => setEditingIndustry(ind)}
                                    >
                                      Edit
                                    </button>
                                    <button
                                      type="button"
                                      className="text-gray-600 hover:underline dark:text-gray-300"
                                      disabled={industryDrag.reordering}
                                      onClick={() => setSelectedIndustryId(ind.id)}
                                    >
                                      Manage
                                    </button>
                                  </div>
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
                            <li
                              key={ind.id}
                              {...industryDrag.rowDragProps(ind.id)}
                              className={industryDrag.rowClassName(ind.id)}
                            >
                              <div
                                className={`flex items-start gap-1 rounded-lg border px-1.5 py-1.5 transition-colors ${
                                  isSel
                                    ? "border-brand-500 bg-brand-50 dark:border-brand-500 dark:bg-brand-500/10"
                                    : "border-transparent bg-gray-50/80 dark:bg-white/[0.04]"
                                }`}
                              >
                                <CatalogDragHandle {...industryDrag.dragHandleProps(ind.id, ind.label)} />
                                <button
                                  type="button"
                                  onClick={() => setSelectedIndustryId(ind.id)}
                                  className={`min-w-0 flex-1 flex-col items-start rounded-md px-1 py-0.5 text-left text-theme-sm transition-colors ${
                                    isSel
                                      ? "text-gray-900 dark:text-white"
                                      : "text-gray-800 hover:bg-gray-100 dark:text-white/90 dark:hover:bg-white/[0.08]"
                                  }`}
                                >
                                  <span className="line-clamp-2 font-medium leading-snug">
                                    {ind.label}
                                  </span>
                                  <span className="mt-1 text-theme-xs text-gray-400 dark:text-gray-500">
                                    {ind.isActive ? "Active" : "Inactive"}
                                  </span>
                                </button>
                              </div>
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
                      <div className="mb-6 flex flex-wrap items-center gap-3">
                        <p className="text-theme-sm text-gray-600 dark:text-gray-400">
                          Status:{" "}
                          {selectedIndustry.isActive ? (
                            <span className="text-green-600 dark:text-green-400">Active</span>
                          ) : (
                            <span className="text-gray-500">Inactive</span>
                          )}
                        </p>
                        <button
                          type="button"
                          className="text-theme-sm text-brand-600 hover:underline dark:text-brand-400"
                          onClick={() => setEditingIndustry(selectedIndustry)}
                        >
                          Edit industry
                        </button>
                      </div>

                      <IndustryProjectTypesSection
                        industry={selectedIndustry}
                        openConfirm={openConfirm}
                        onError={setError}
                        onProjectTypesChange={(industryId, projectTypes) => {
                          setIndustries((prev) =>
                            prev.map((x) =>
                              x.id === industryId ? { ...x, projectTypes } : x,
                            ),
                          );
                        }}
                        onEditProjectType={(pt) =>
                          setEditingProjectType({ industryId: selectedIndustry.id, pt })
                        }
                        reorderProjectTypes={reorderProjectTypes}
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
                <button
                  type="button"
                  className="h-10 rounded-lg bg-brand-500 px-4 text-theme-sm font-medium text-white"
                  onClick={async () => {
                    if (!newUse.label.trim()) return;
                    try {
                      const r = await createPlatformDashboardUseAdmin({
                        label: newUse.label.trim(),
                        value: slugifyDashboardUseValue(newUse.label),
                        sortOrder: nextSortOrder(dashboardUses),
                      });
                      setDashboardUses((p) =>
                        sortByOrder([...p, r], (a, b) => a.label.localeCompare(b.label)),
                      );
                      setNewUse({ label: "" });
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
                      <th className="w-10 px-2 py-2" aria-label="Reorder" />
                      <th className="px-3 py-2">Label</th>
                      <th className="px-3 py-2">Active</th>
                      <th className="px-3 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardUsesSorted.map((row) => (
                      <tr
                        key={row.id}
                        {...dashboardDrag.rowDragProps(row.id)}
                        className={`border-t border-gray-200 dark:border-gray-800 ${dashboardDrag.rowClassName(row.id)}`}
                      >
                        <td className="px-2 py-2 align-middle">
                          <CatalogDragHandle
                            {...dashboardDrag.dragHandleProps(row.id, row.label)}
                          />
                        </td>
                        <td className="px-3 py-2">{row.label}</td>
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            className={catalogCheckboxClass}
                            checked={row.isActive}
                            disabled={dashboardDrag.reordering}
                            onChange={async (e) => {
                              try {
                                const u = await updatePlatformDashboardUseAdmin(row.id, {
                                  isActive: e.target.checked,
                                });
                                setDashboardUses((p) =>
                                  p.map((x) => (x.id === row.id ? u : x)),
                                );
                              } catch (err) {
                                setError(err instanceof Error ? err.message : "Update failed");
                              }
                            }}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-3 text-theme-xs">
                            <button
                              type="button"
                              className="text-brand-600 hover:underline dark:text-brand-400"
                              disabled={dashboardDrag.reordering}
                              onClick={() => setEditingDashboardUse(row)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="text-error-600 dark:text-error-400"
                              disabled={dashboardDrag.reordering}
                              onClick={() => {
                                openConfirm("Delete this option?", async () => {
                                  try {
                                    await deletePlatformDashboardUseAdmin(row.id);
                                    setDashboardUses((p) => p.filter((x) => x.id !== row.id));
                                  } catch (err) {
                                    setError(err instanceof Error ? err.message : "Delete failed");
                                  }
                                });
                              }}
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
                <button
                  type="button"
                  className="h-10 rounded-lg bg-brand-500 px-4 text-theme-sm font-medium text-white"
                  onClick={async () => {
                    if (!newCategory.name.trim()) return;
                    try {
                      const r = await createPlatformSkillCategoryAdmin({
                        name: newCategory.name.trim(),
                        sortOrder: nextSortOrder(skillCategories),
                      });
                      setSkillCategories((p) =>
                        sortByOrder([...p, { ...r, skills: [] }], (a, b) =>
                          a.name.localeCompare(b.name),
                        ),
                      );
                      setNewCategory({ name: "" });
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
                            sortByOrder(cat.skills ?? [], (a, b) => a.name.localeCompare(b.name))
                              .map((s) => s.name)
                              .join(", ") || "—";
                          return (
                            <li
                              key={cat.id}
                              {...skillCategoryDrag.rowDragProps(cat.id)}
                              className={skillCategoryDrag.rowClassName(cat.id)}
                            >
                              <div className="flex items-start gap-1 rounded-lg border border-transparent px-1.5 py-1.5">
                                <CatalogDragHandle
                                  {...skillCategoryDrag.dragHandleProps(cat.id, cat.name)}
                                />
                                <button
                                  type="button"
                                  onClick={() => setSelectedSkillCategoryId(cat.id)}
                                  className="min-w-0 flex-1 flex-col items-start rounded-md px-1 py-0.5 text-left text-theme-sm transition-colors hover:bg-gray-100 dark:hover:bg-white/[0.08]"
                                >
                                  <span className="line-clamp-2 font-medium leading-snug">
                                    {cat.name}
                                  </span>
                                  <span className="mt-1 text-theme-xs text-gray-400 dark:text-gray-500">
                                    {skillsSummary}
                                  </span>
                                </button>
                                <button
                                  type="button"
                                  className="shrink-0 px-1 text-theme-xs text-brand-600 dark:text-brand-400"
                                  disabled={skillCategoryDrag.reordering}
                                  onClick={() => setEditingSkillCategory(cat)}
                                >
                                  Edit
                                </button>
                              </div>
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
                          <li
                            key={cat.id}
                            {...skillCategoryDrag.rowDragProps(cat.id)}
                            className={skillCategoryDrag.rowClassName(cat.id)}
                          >
                            <div
                              className={`flex items-start gap-1 rounded-lg border px-1.5 py-1.5 transition-colors ${
                                isSel
                                  ? "border-brand-500 bg-brand-50 dark:border-brand-500 dark:bg-brand-500/10"
                                  : "border-transparent bg-gray-50/80 dark:bg-white/[0.04]"
                              }`}
                            >
                              <CatalogDragHandle
                                {...skillCategoryDrag.dragHandleProps(cat.id, cat.name)}
                              />
                              <button
                                type="button"
                                onClick={() => setSelectedSkillCategoryId(cat.id)}
                                className={`min-w-0 flex-1 flex-col items-start rounded-md px-1 py-0.5 text-left text-theme-sm transition-colors ${
                                  isSel
                                    ? "text-gray-900 dark:text-white"
                                    : "text-gray-800 hover:bg-gray-100 dark:text-white/90 dark:hover:bg-white/[0.08]"
                                }`}
                              >
                                <span className="line-clamp-2 font-medium leading-snug">
                                  {cat.name}
                                </span>
                              </button>
                            </div>
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

                      <div className="mb-6 flex flex-wrap items-center gap-3">
                        <p className="text-theme-sm text-gray-600 dark:text-gray-400">
                          Status:{" "}
                          {selectedSkillCategory.isActive ? (
                            <span className="text-green-600 dark:text-green-400">Active</span>
                          ) : (
                            <span className="text-gray-500">Inactive</span>
                          )}
                        </p>
                        <button
                          type="button"
                          className="text-theme-sm text-brand-600 hover:underline dark:text-brand-400"
                          onClick={() => setEditingSkillCategory(selectedSkillCategory)}
                        >
                          Edit category
                        </button>
                      </div>

                      <CategorySkillsSection
                        category={selectedSkillCategory}
                        newSkillName={newSkillByCategory[selectedSkillCategory.id] ?? ""}
                        onNewSkillNameChange={(value) =>
                          setNewSkillByCategory((s) => ({
                            ...s,
                            [selectedSkillCategory.id]: value,
                          }))
                        }
                        openConfirm={openConfirm}
                        onError={setError}
                        onSkillsChange={(categoryId, skills) => {
                          setSkillCategories((p) =>
                            p.map((c) => (c.id === categoryId ? { ...c, skills } : c)),
                          );
                        }}
                        onEditSkill={(skill) =>
                          setEditingSkill({ categoryId: selectedSkillCategory.id, skill })
                        }
                        reorderSkills={reorderSkills}
                      />
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

      {editingIndustry && (
        <CatalogLabelEditModal
          title="Edit industry"
          label="Label"
          initialLabel={editingIndustry.label}
          initialIsActive={editingIndustry.isActive}
          saving={savingEdit}
          onClose={() => setEditingIndustry(null)}
          onSave={async (label, isActive) => {
            setSavingEdit(true);
            try {
              const u = await updatePlatformIndustryAdmin(editingIndustry.id, {
                label: label.trim(),
                value: editingIndustry.value,
                isActive,
              });
              setIndustries((p) =>
                p.map((x) =>
                  x.id === editingIndustry.id ? { ...u, projectTypes: x.projectTypes } : x,
                ),
              );
              setEditingIndustry(null);
            } catch (e) {
              setError(e instanceof Error ? e.message : "Save failed");
            } finally {
              setSavingEdit(false);
            }
          }}
        />
      )}

      {editingDashboardUse && (
        <CatalogLabelEditModal
          title="Edit dashboard use"
          label="Label"
          initialLabel={editingDashboardUse.label}
          initialIsActive={editingDashboardUse.isActive}
          saving={savingEdit}
          onClose={() => setEditingDashboardUse(null)}
          onSave={async (label, isActive) => {
            setSavingEdit(true);
            try {
              const u = await updatePlatformDashboardUseAdmin(editingDashboardUse.id, {
                label: label.trim(),
                value: editingDashboardUse.value,
                isActive,
              });
              setDashboardUses((p) => p.map((x) => (x.id === editingDashboardUse.id ? u : x)));
              setEditingDashboardUse(null);
            } catch (e) {
              setError(e instanceof Error ? e.message : "Save failed");
            } finally {
              setSavingEdit(false);
            }
          }}
        />
      )}

      {editingSkillCategory && (
        <CatalogLabelEditModal
          title="Edit skill category"
          label="Category name"
          initialLabel={editingSkillCategory.name}
          initialIsActive={editingSkillCategory.isActive}
          saving={savingEdit}
          onClose={() => setEditingSkillCategory(null)}
          onSave={async (name, isActive) => {
            setSavingEdit(true);
            try {
              const u = await updatePlatformSkillCategoryAdmin(editingSkillCategory.id, {
                name: name.trim(),
                isActive,
              });
              setSkillCategories((p) =>
                p.map((c) =>
                  c.id === editingSkillCategory.id ? { ...c, ...u, skills: c.skills } : c,
                ),
              );
              setEditingSkillCategory(null);
            } catch (e) {
              setError(e instanceof Error ? e.message : "Save failed");
            } finally {
              setSavingEdit(false);
            }
          }}
        />
      )}

      {editingSkill && (
        <CatalogLabelEditModal
          title="Edit skill"
          label="Skill name"
          initialLabel={editingSkill.skill.name}
          initialIsActive={editingSkill.skill.isActive}
          saving={savingEdit}
          onClose={() => setEditingSkill(null)}
          onSave={async (name, isActive) => {
            setSavingEdit(true);
            try {
              const u = await updatePlatformSkillAdmin(editingSkill.skill.id, {
                name: name.trim(),
                isActive,
              });
              setSkillCategories((p) =>
                p.map((c) =>
                  c.id === editingSkill.categoryId
                    ? {
                        ...c,
                        skills: (c.skills ?? []).map((s) => (s.id === editingSkill.skill.id ? u : s)),
                      }
                    : c,
                ),
              );
              setEditingSkill(null);
            } catch (e) {
              setError(e instanceof Error ? e.message : "Save failed");
            } finally {
              setSavingEdit(false);
            }
          }}
        />
      )}

      {editingProjectType && (
        <ProjectTypeEditModal
          projectType={editingProjectType.pt}
          saving={savingEdit}
          onClose={() => setEditingProjectType(null)}
          onSave={async (label, placeholder) => {
            setSavingEdit(true);
            try {
              const u = await updateIndustryProjectTypeAdmin(editingProjectType.pt.id, {
                label: label.trim(),
                placeholder: placeholder.trim(),
              });
              setIndustries((prev) =>
                prev.map((ind) =>
                  ind.id === editingProjectType.industryId
                    ? {
                        ...ind,
                        projectTypes: (ind.projectTypes ?? []).map((p) =>
                          p.id === editingProjectType.pt.id ? u : p,
                        ),
                      }
                    : ind,
                ),
              );
              setEditingProjectType(null);
            } catch (e) {
              setError(e instanceof Error ? e.message : "Save failed");
            } finally {
              setSavingEdit(false);
            }
          }}
        />
      )}

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

function CatalogLabelEditModal({
  title,
  label,
  initialLabel,
  initialIsActive,
  saving,
  onClose,
  onSave,
}: {
  title: string;
  label: string;
  initialLabel: string;
  initialIsActive: boolean;
  saving: boolean;
  onClose: () => void;
  onSave: (label: string, isActive: boolean) => Promise<void>;
}) {
  const [draftLabel, setDraftLabel] = useState(initialLabel);
  const [draftActive, setDraftActive] = useState(initialIsActive);

  useEffect(() => {
    setDraftLabel(initialLabel);
    setDraftActive(initialIsActive);
  }, [initialLabel, initialIsActive]);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close edit dialog"
        onClick={onClose}
      />
      <div className="relative w-[min(92vw,520px)] rounded-2xl border border-gray-200 bg-white p-5 shadow-xl dark:border-gray-800 dark:bg-gray-950">
        <h3 className="text-theme-sm font-semibold text-gray-900 dark:text-white">{title}</h3>
        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="mb-1 block text-theme-xs text-gray-500 dark:text-gray-400">
              {label}
            </span>
            <input
              className={inputClass}
              value={draftLabel}
              onChange={(e) => setDraftLabel(e.target.value)}
            />
          </label>
          <label className="flex items-center gap-2 text-theme-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              className={catalogCheckboxClass}
              checked={draftActive}
              onChange={(e) => setDraftActive(e.target.checked)}
            />
            Active
          </label>
        </div>
        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="h-9 rounded-lg border border-gray-200 px-3 text-theme-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60 dark:border-gray-800 dark:text-gray-200 dark:hover:bg-gray-900"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving || !draftLabel.trim()}
            onClick={() => void onSave(draftLabel, draftActive)}
            className="h-9 rounded-lg bg-brand-500 px-3 text-theme-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ProjectTypeEditModal({
  projectType,
  saving,
  onClose,
  onSave,
}: {
  projectType: PlatformIndustryProjectTypeRow;
  saving: boolean;
  onClose: () => void;
  onSave: (label: string, placeholder: string) => Promise<void>;
}) {
  const [label, setLabel] = useState(displayProjectTypeLabel(projectType));
  const [placeholder, setPlaceholder] = useState(projectType.placeholder);

  useEffect(() => {
    setLabel(displayProjectTypeLabel(projectType));
    setPlaceholder(projectType.placeholder);
  }, [projectType]);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close edit dialog"
        onClick={onClose}
      />
      <div className="relative w-[min(92vw,520px)] rounded-2xl border border-gray-200 bg-white p-5 shadow-xl dark:border-gray-800 dark:bg-gray-950">
        <h3 className="text-theme-sm font-semibold text-gray-900 dark:text-white">
          Edit project type
        </h3>
        <p className="mt-1 font-mono text-theme-xs text-gray-500 dark:text-gray-400">
          Key: {projectType.projectType}
        </p>
        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="mb-1 block text-theme-xs text-gray-500 dark:text-gray-400">Type</span>
            <input className={inputClass} value={label} onChange={(e) => setLabel(e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1 block text-theme-xs text-gray-500 dark:text-gray-400">
              Unit placeholder
            </span>
            <input
              className={inputClass}
              value={placeholder}
              onChange={(e) => setPlaceholder(e.target.value)}
            />
          </label>
        </div>
        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="h-9 rounded-lg border border-gray-200 px-3 text-theme-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60 dark:border-gray-800 dark:text-gray-200 dark:hover:bg-gray-900"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving || !label.trim() || !placeholder.trim()}
            onClick={() => void onSave(label, placeholder)}
            className="h-9 rounded-lg bg-brand-500 px-3 text-theme-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

function IndustryProjectTypesSection({
  industry,
  openConfirm,
  onError,
  onProjectTypesChange,
  onEditProjectType,
  reorderProjectTypes,
}: {
  industry: PlatformIndustryAdminRow;
  openConfirm: (msg: string, action: () => Promise<void> | void) => void;
  onError: (m: string) => void;
  onProjectTypesChange: (industryId: string, projectTypes: PlatformIndustryProjectTypeRow[]) => void;
  onEditProjectType: (pt: PlatformIndustryProjectTypeRow) => void;
  reorderProjectTypes: (
    industryId: string,
    reordered: PlatformIndustryProjectTypeRow[],
  ) => Promise<void>;
}) {
  const projectTypesSorted = useMemo(
    () =>
      sortByOrder(industry.projectTypes ?? [], (a, b) =>
        displayProjectTypeLabel(a).localeCompare(displayProjectTypeLabel(b)),
      ),
    [industry.projectTypes],
  );

  const drag = useCatalogDragReorder(
    projectTypesSorted,
    (reordered) => reorderProjectTypes(industry.id, reordered),
    onError,
  );

  return (
    <>
      <p className="mb-2 text-theme-xs font-medium uppercase text-gray-500 dark:text-gray-400">
        Project types for this industry
      </p>
      <div className="overflow-x-auto rounded-lg border border-gray-100 dark:border-gray-800/80">
        <table className="min-w-full text-left text-theme-xs text-gray-800 dark:text-white/90">
          <thead className="bg-gray-50 dark:bg-white/[0.04]">
            <tr>
              <th className="w-10 px-2 py-2" aria-label="Reorder" />
              <th className="px-2 py-2">Type</th>
              <th className="px-2 py-2">Key</th>
              <th className="px-2 py-2">Unit placeholder</th>
              <th className="px-2 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {projectTypesSorted.map((pt) => (
              <tr
                key={pt.id}
                {...drag.rowDragProps(pt.id)}
                className={`border-t border-gray-100 dark:border-gray-800 ${drag.rowClassName(pt.id)}`}
              >
                <td className="p-1 align-middle">
                  <CatalogDragHandle
                    {...drag.dragHandleProps(pt.id, displayProjectTypeLabel(pt))}
                  />
                </td>
                <td className="px-2 py-2">{displayProjectTypeLabel(pt)}</td>
                <td className="px-2 py-2 font-mono text-gray-500 dark:text-gray-400">
                  {pt.projectType}
                </td>
                <td className="px-2 py-2 text-gray-600 dark:text-gray-400">{pt.placeholder}</td>
                <td className="px-2 py-2">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      className="text-theme-xs text-brand-600 dark:text-brand-400"
                      disabled={drag.reordering}
                      onClick={() => onEditProjectType(pt)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="text-theme-xs text-error-600 dark:text-error-400"
                      disabled={drag.reordering}
                      onClick={() => {
                        openConfirm("Remove this project type?", async () => {
                          try {
                            await deleteIndustryProjectTypeAdmin(pt.id);
                            onProjectTypesChange(
                              industry.id,
                              (industry.projectTypes ?? []).filter((p) => p.id !== pt.id),
                            );
                          } catch (e) {
                            onError(e instanceof Error ? e.message : "Delete failed");
                          }
                        });
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <AddProjectTypeRow
        industryId={industry.id}
        existingCount={(industry.projectTypes ?? []).length}
        onCreated={(row) => {
          onProjectTypesChange(industry.id, [...(industry.projectTypes ?? []), row]);
        }}
        onError={onError}
      />
    </>
  );
}

function CategorySkillsSection({
  category,
  newSkillName,
  onNewSkillNameChange,
  openConfirm,
  onError,
  onSkillsChange,
  onEditSkill,
  reorderSkills,
}: {
  category: PlatformSkillCategoryAdminRow;
  newSkillName: string;
  onNewSkillNameChange: (value: string) => void;
  openConfirm: (msg: string, action: () => Promise<void> | void) => void;
  onError: (m: string) => void;
  onSkillsChange: (categoryId: string, skills: PlatformSkillAdminRow[]) => void;
  onEditSkill: (skill: PlatformSkillAdminRow) => void;
  reorderSkills: (categoryId: string, reordered: PlatformSkillAdminRow[]) => Promise<void>;
}) {
  const skillsSorted = useMemo(
    () => sortByOrder(category.skills ?? [], (a, b) => a.name.localeCompare(b.name)),
    [category.skills],
  );

  const drag = useCatalogDragReorder(
    skillsSorted,
    (reordered) => reorderSkills(category.id, reordered),
    onError,
  );

  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-gray-100 dark:border-gray-800/80">
        <table className="min-w-full text-left text-theme-xs">
          <thead className="bg-gray-50 dark:bg-white/[0.04]">
            <tr>
              <th className="w-10 px-2 py-2" aria-label="Reorder" />
              <th className="px-2 py-2">Skill</th>
              <th className="px-2 py-2">Active</th>
              <th className="px-2 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {skillsSorted.map((sk) => (
              <tr
                key={sk.id}
                {...drag.rowDragProps(sk.id)}
                className={`border-t border-gray-200 dark:border-gray-800 ${drag.rowClassName(sk.id)}`}
              >
                <td className="p-1 align-middle">
                  <CatalogDragHandle {...drag.dragHandleProps(sk.id, sk.name)} />
                </td>
                <td className="px-2 py-2">{sk.name}</td>
                <td className="px-2 py-2">
                  <input
                    type="checkbox"
                    className={catalogCheckboxClass}
                    checked={sk.isActive}
                    disabled={drag.reordering}
                    onChange={async (e) => {
                      try {
                        const u = await updatePlatformSkillAdmin(sk.id, {
                          isActive: e.target.checked,
                        });
                        onSkillsChange(
                          category.id,
                          (category.skills ?? []).map((s) => (s.id === sk.id ? u : s)),
                        );
                      } catch (err) {
                        onError(err instanceof Error ? err.message : "Update failed");
                      }
                    }}
                  />
                </td>
                <td className="px-2 py-2">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      className="text-theme-xs text-brand-600 dark:text-brand-400"
                      disabled={drag.reordering}
                      onClick={() => onEditSkill(sk)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="text-theme-xs text-error-600 dark:text-error-400"
                      disabled={drag.reordering}
                      onClick={() => {
                        openConfirm("Remove skill?", async () => {
                          try {
                            await deletePlatformSkillAdmin(sk.id);
                            onSkillsChange(
                              category.id,
                              (category.skills ?? []).filter((s) => s.id !== sk.id),
                            );
                          } catch (err) {
                            onError(err instanceof Error ? err.message : "Delete failed");
                          }
                        });
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-2 flex flex-wrap items-end gap-2">
        <input
          className={inputClass + " max-w-md flex-1"}
          placeholder="New skill name"
          value={newSkillName}
          onChange={(e) => onNewSkillNameChange(e.target.value)}
        />
        <button
          type="button"
          className="h-10 rounded-lg border border-gray-200 px-3 text-theme-sm dark:border-gray-700"
          onClick={async () => {
            const name = newSkillName.trim();
            if (!name) return;
            try {
              const row = await createPlatformSkillAdmin(category.id, {
                name,
                sortOrder: nextSortOrder(category.skills ?? []),
              });
              onSkillsChange(category.id, [...(category.skills ?? []), row]);
              onNewSkillNameChange("");
            } catch (e) {
              onError(e instanceof Error ? e.message : "Create failed");
            }
          }}
        >
          Add skill
        </button>
      </div>
    </>
  );
}

function AddProjectTypeRow({
  industryId,
  existingCount,
  onCreated,
  onError,
}: {
  industryId: string;
  existingCount: number;
  onCreated: (row: PlatformIndustryProjectTypeRow) => void;
  onError: (m: string) => void;
}) {
  const [typeLabel, setTypeLabel] = useState("");
  const [placeholder, setPlaceholder] = useState("");
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
      <button
        type="button"
        className="h-10 rounded-lg border border-gray-200 px-3 text-theme-sm dark:border-gray-700"
        onClick={async () => {
          if (!typeLabel.trim() || !placeholder.trim()) return;
          try {
            const row = await createIndustryProjectTypeAdmin(industryId, {
              label: typeLabel.trim(),
              placeholder,
              sortOrder: existingCount,
            });
            onCreated(row);
            setTypeLabel("");
            setPlaceholder("");
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
