"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import WhatsNewFormFields from "@/src/components/whats-new/WhatsNewFormFields";
import {
  validateWhatsNewForm,
  whatsNewFormFromRow,
} from "@/src/components/whats-new/whatsNewForm.types";
import type { WhatsNewFormState } from "@/src/components/whats-new/whatsNewForm.types";
import {
  listPlatformWhatsNewUpdates,
  updatePlatformWhatsNewUpdate,
  deletePlatformWhatsNewUpdate,
} from "@/src/services/api/platformWhatsNew.api";
import type { PlatformWhatsNewRow } from "@/src/types/platformWhatsNew.types";

const primaryBtn =
  "rounded-lg bg-brand-500 px-4 py-2 text-theme-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50";

export default function EditWhatsNewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [updateId, setUpdateId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [row, setRow] = useState<PlatformWhatsNewRow | null>(null);
  const [form, setForm] = useState<WhatsNewFormState | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    params.then((p) => setUpdateId(p.id));
  }, [params]);

  useEffect(() => {
    if (!updateId) return;
    setLoading(true);
    listPlatformWhatsNewUpdates()
      .then((items) => {
        const match = items.find((item) => item.id === updateId) ?? null;
        if (!match) {
          setError("Update not found.");
          return;
        }
        setRow(match);
        setForm(whatsNewFormFromRow(match));
      })
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Failed to load update"),
      )
      .finally(() => setLoading(false));
  }, [updateId]);

  const handleSave = useCallback(async () => {
    if (!form || !row) return;
    const validationError = validateWhatsNewForm(form);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await updatePlatformWhatsNewUpdate(row.id, {
        title: form.title.trim(),
        body: form.body.trim(),
        publishedAt: `${form.publishedAt}T00:00:00.000Z`,
        isActive: form.isActive,
      });
      router.push("/settings/whats-new");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save update");
    } finally {
      setSaving(false);
    }
  }, [form, row, router]);

  const updateForm = useCallback(
    (value: React.SetStateAction<WhatsNewFormState>) => {
      setForm((prev) => {
        if (!prev) return prev;
        return typeof value === "function" ? value(prev) : value;
      });
    },
    [],
  );

  const handleDelete = useCallback(async () => {
    if (!row) return;
    setDeleting(true);
    setError(null);
    try {
      await deletePlatformWhatsNewUpdate(row.id);
      router.push("/settings/whats-new");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete update");
      setDeleting(false);
      setConfirmDelete(false);
    }
  }, [row, router]);

  return (
    <>
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <div className="mb-6">
          <Link
            href="/settings/whats-new"
            className="text-theme-xs font-medium text-brand-600 hover:underline dark:text-brand-400"
          >
            ← Back to What&apos;s new
          </Link>
          <h3 className="mt-2 text-lg font-semibold text-gray-800 dark:text-white/90">
            Edit update
          </h3>
          {row && (
            <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
              {row.title}
            </p>
          )}
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-error-200 bg-error-50 px-4 py-2 text-theme-sm text-error-700 dark:border-error-800 dark:bg-error-950 dark:text-error-400">
            {error}
          </div>
        )}

        {loading || !form ? (
          <p className="text-theme-sm text-gray-500 dark:text-gray-400">
            {loading ? "Loading update…" : "Update not found."}
          </p>
        ) : (
          <>
            <WhatsNewFormFields form={form} setForm={updateForm} />
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 pt-4 dark:border-gray-800">
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                disabled={saving || deleting}
                className="inline-flex h-10 items-center rounded-lg border border-error-200 px-4 text-theme-sm font-medium text-error-600 hover:bg-error-50 disabled:opacity-50 dark:border-error-900 dark:text-error-400 dark:hover:bg-error-950"
              >
                Delete update
              </button>
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href="/settings/whats-new"
                  className="inline-flex h-10 items-center rounded-lg border border-gray-200 px-4 text-theme-sm text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-200 dark:hover:bg-gray-900"
                >
                  Cancel
                </Link>
                <button
                  type="button"
                  className={primaryBtn}
                  disabled={saving || deleting}
                  onClick={handleSave}
                >
                  {saving ? "Saving…" : "Save changes"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close confirmation dialog"
            onClick={() => !deleting && setConfirmDelete(false)}
          />
          <div className="relative w-[min(92vw,520px)] rounded-2xl border border-gray-200 bg-white p-5 shadow-xl dark:border-gray-800 dark:bg-gray-950">
            <h3 className="text-theme-sm font-semibold text-gray-900 dark:text-white">
              Delete update
            </h3>
            <p className="mt-2 text-theme-sm text-gray-600 dark:text-gray-300">
              Delete this timeline entry permanently? This cannot be undone.
            </p>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                disabled={deleting}
                className="h-9 rounded-lg border border-gray-200 px-3 text-theme-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60 dark:border-gray-800 dark:text-gray-200 dark:hover:bg-gray-900"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="h-9 rounded-lg bg-error-600 px-3 text-theme-sm font-medium text-white hover:bg-error-700 disabled:opacity-60"
              >
                {deleting ? "Deleting…" : "Delete update"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
