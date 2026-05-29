"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  listPlatformWidgets,
  updatePlatformWidget,
} from "@/src/services/api/platformDefaults.api";
import type { PlatformDefaultWidgetRow } from "@/src/types/platformDefaults.types";
import SimpleImageUpload from "@/src/components/common/SimpleImageUpload";
import { isWidgetMediaUrl } from "@/src/utils/widgetMediaUrl";

const inputClass =
  "h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-theme-xs text-gray-800 shadow-sm focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-white/[0.03] dark:text-white/90";

const visibilityLabels: Record<PlatformDefaultWidgetRow["visibility"], string> = {
  member: "Member only",
  client: "Client only",
  both: "Both",
};

const visibilityBadgeClass: Record<PlatformDefaultWidgetRow["visibility"], string> = {
  member: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
  client: "bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300",
  both: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
};

type Draft = {
  icon: string;
  previewImage: string;
  visibility: "member" | "client" | "both";
  isActive: boolean;
};

function isDraftDirty(row: PlatformDefaultWidgetRow, draft: Draft): boolean {
  return (
    draft.icon !== row.icon ||
    draft.previewImage !== row.previewImage ||
    draft.visibility !== row.visibility ||
    draft.isActive !== row.isActive
  );
}

const ICON_UNIT_PX = 96;
const PREVIEW_MAX_W = 200;
const PREVIEW_MAX_H = 220;

/** Scale preview so tall widgets (e.g. 2×3) fit inside the card without overflow. */
function previewUnitPx(gridW: number, gridH: number): number {
  const w = Math.max(1, gridW);
  const h = Math.max(1, gridH);
  return Math.floor(Math.min(PREVIEW_MAX_W / w, PREVIEW_MAX_H / h));
}

function WidgetCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.02]">
      <div className="animate-pulse p-5">
        <div className="mb-5 flex justify-between gap-3">
          <div className="space-y-2">
            <div className="h-5 w-16 rounded-md bg-gray-200 dark:bg-gray-800" />
            <div className="h-4 w-36 rounded bg-gray-200 dark:bg-gray-800" />
          </div>
          <div className="h-6 w-16 rounded-full bg-gray-100 dark:bg-gray-800/80" />
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-[220px_1fr]">
          <div className="space-y-4">
            <div className="h-[96px] w-[96px] rounded-xl bg-gray-100 dark:bg-gray-800/80" />
            <div className="space-y-2">
              <div className="h-12 rounded-lg bg-gray-100 dark:bg-gray-800/80" />
              <div className="h-9 rounded-lg bg-gray-100 dark:bg-gray-800/80" />
            </div>
          </div>
          <div className="rounded-xl bg-gray-50 p-4 dark:bg-white/[0.02]">
            <div className="mx-auto h-[160px] w-[120px] rounded-xl bg-gray-200 dark:bg-gray-800" />
          </div>
        </div>
        <div className="mt-5 h-10 rounded-lg bg-gray-200 dark:bg-gray-800" />
      </div>
    </div>
  );
}

function ActiveToggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? "bg-brand-500" : "bg-gray-200 dark:bg-gray-700"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

export default function CompanyDefaultWidgetsTab() {
  const [rows, setRows] = useState<PlatformDefaultWidgetRow[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listPlatformWidgets();
      setRows(data);
      setDrafts(
        Object.fromEntries(
          data.map((r) => [
            r.id,
            {
              icon: r.icon,
              previewImage: r.previewImage,
              visibility: r.visibility,
              isActive: r.isActive,
            },
          ]),
        ),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load widgets");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const patchDraft = (id: string, patch: Partial<Draft>) => {
    setDrafts((prev) => ({
      ...prev,
      [id]: { ...prev[id], ...patch },
    }));
  };

  const handleSave = async (row: PlatformDefaultWidgetRow) => {
    const draft = drafts[row.id];
    if (!draft) return;
    setSavingId(row.id);
    setError(null);
    try {
      const updated = await updatePlatformWidget(row.id, {
        icon: draft.icon,
        previewImage: draft.previewImage,
        visibility: draft.visibility,
        isActive: draft.isActive,
      });
      setRows((prev) => prev.map((r) => (r.id === row.id ? updated : r)));
      setDrafts((prev) => ({
        ...prev,
        [row.id]: {
          icon: updated.icon,
          previewImage: updated.previewImage,
          visibility: updated.visibility,
          isActive: updated.isActive,
        },
      }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSavingId(null);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <WidgetCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h4 className="text-theme-sm font-semibold text-gray-900 dark:text-white/90">
          Widget Management
        </h4>
        <p className="mt-1.5 max-w-2xl text-theme-xs leading-relaxed text-gray-500 dark:text-gray-400">
          Configure icons, preview images, and visibility for each dashboard widget. Hover to
          upload; click <span className="font-medium text-gray-600 dark:text-gray-300">×</span> to
          remove.
        </p>
      </div>

      {error && (
        <div className="mb-5 rounded-xl border border-error-200 bg-error-50 px-4 py-3 text-theme-sm text-error-700 dark:border-error-800 dark:bg-error-950 dark:text-error-400">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {rows.map((row) => {
          const draft = drafts[row.id];
          if (!draft) return null;
          const dirty = isDraftDirty(row, draft);
          const isSaving = savingId === row.id;

          return (
            <article
              key={row.id}
              className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition-all dark:bg-white/[0.02] ${
                dirty
                  ? "border-brand-300 ring-2 ring-brand-500/15 dark:border-brand-700"
                  : "border-gray-200 dark:border-gray-800"
              }`}
            >
              <div className="p-5">
                {/* Header — full width */}
                <header className="mb-5 border-b border-gray-100 pb-4 dark:border-gray-800">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex rounded-md bg-brand-500/10 px-2 py-0.5 font-mono text-[11px] font-bold tracking-wide text-brand-600 dark:text-brand-400">
                          {row.code}
                        </span>
                        <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600 dark:bg-white/10 dark:text-gray-300">
                          {row.gridW} × {row.gridH}
                        </span>
                        {dirty && (
                          <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                            Unsaved changes
                          </span>
                        )}
                      </div>
                      <h5 className="mt-2 text-theme-sm font-semibold text-gray-900 dark:text-white/90">
                        {row.label}
                      </h5>
                    </div>

                    <span
                      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${
                        draft.isActive
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                          : "bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-400"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          draft.isActive ? "bg-emerald-500" : "bg-gray-400"
                        }`}
                      />
                      {draft.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </header>

                {/* Body — left column (icon + settings) | right column (preview) */}
                <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-[minmax(0,220px)_1fr]">
                  <div className="flex flex-col gap-5">
                    <SimpleImageUpload
                      label="Icon"
                      variant="icon"
                      align="left"
                      gridCols={1}
                      gridRows={1}
                      unitPx={ICON_UNIT_PX}
                      hint="Shown in widget picker"
                      value={isWidgetMediaUrl(draft.icon) ? draft.icon : ""}
                      onChange={(url) => patchDraft(row.id, { icon: url })}
                    />

                    <div className="space-y-3 rounded-xl border border-gray-100 bg-gray-50/60 p-3 dark:border-gray-800 dark:bg-white/[0.03]">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-theme-xs font-medium text-gray-700 dark:text-gray-300">
                            Active
                          </p>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400">
                            Show in catalog
                          </p>
                        </div>
                        <ActiveToggle
                          checked={draft.isActive}
                          disabled={isSaving}
                          onChange={(v) => patchDraft(row.id, { isActive: v })}
                        />
                      </div>

                      <label className="block border-t border-gray-200/80 pt-3 dark:border-gray-700">
                        <span className="mb-1.5 block text-theme-xs font-medium text-gray-700 dark:text-gray-300">
                          Visibility
                        </span>
                        <select
                          className={inputClass}
                          value={draft.visibility}
                          disabled={isSaving}
                          onChange={(e) =>
                            patchDraft(row.id, {
                              visibility: e.target.value as "member" | "client" | "both",
                            })
                          }
                        >
                          <option value="member">{visibilityLabels.member}</option>
                          <option value="client">{visibilityLabels.client}</option>
                          <option value="both">{visibilityLabels.both}</option>
                        </select>
                      </label>
                    </div>
                  </div>

                  <div className="min-w-0 rounded-xl border border-gray-100 bg-gray-50/60 p-4 dark:border-gray-800 dark:bg-white/[0.02]">
                    <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-theme-xs font-semibold text-gray-800 dark:text-gray-200">
                          Preview
                          <span className="ml-1 font-normal text-gray-400">
                            ({row.gridW}×{row.gridH})
                          </span>
                        </p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400">
                          Accordion expand view
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-medium ${visibilityBadgeClass[draft.visibility]}`}
                      >
                        {visibilityLabels[draft.visibility]}
                      </span>
                    </div>

                    <div className="overflow-hidden">
                      <SimpleImageUpload
                        label="Preview"
                        variant="preview"
                        align="left"
                        hideLabel
                        gridCols={row.gridW}
                        gridRows={row.gridH}
                        unitPx={previewUnitPx(row.gridW, row.gridH)}
                        hint="Crop to match grid ratio"
                        value={draft.previewImage}
                        onChange={(url) => patchDraft(row.id, { previewImage: url })}
                      />
                    </div>
                  </div>
                </div>

                {/* Footer — full width save */}
                <div className="mt-5 border-t border-gray-100 pt-4 dark:border-gray-800">
                  <button
                    type="button"
                    disabled={isSaving || !dirty}
                    onClick={() => handleSave(row)}
                    className="h-10 w-full rounded-lg bg-brand-500 text-theme-xs font-semibold text-white shadow-sm transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {isSaving ? "Saving…" : dirty ? "Save changes" : "Saved"}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
