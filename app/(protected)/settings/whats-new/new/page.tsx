"use client";

import React, { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import WhatsNewFormFields from "@/src/components/whats-new/WhatsNewFormFields";
import {
  emptyWhatsNewForm,
  validateWhatsNewForm,
} from "@/src/components/whats-new/whatsNewForm.types";
import { createPlatformWhatsNewUpdate } from "@/src/services/api/platformWhatsNew.api";

const primaryBtn =
  "rounded-lg bg-brand-500 px-4 py-2 text-theme-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50";

export default function NewWhatsNewPage() {
  const router = useRouter();
  const [form, setForm] = useState(emptyWhatsNewForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = useCallback(async () => {
    const validationError = validateWhatsNewForm(form);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await createPlatformWhatsNewUpdate({
        title: form.title.trim(),
        body: form.body.trim(),
        publishedAt: `${form.publishedAt}T00:00:00.000Z`,
        isActive: form.isActive,
      });
      router.push("/settings/whats-new");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create update");
    } finally {
      setSaving(false);
    }
  }, [form, router]);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
      <div className="mb-6">
        <Link
          href="/settings/whats-new"
          className="text-theme-xs font-medium text-brand-600 hover:underline dark:text-brand-400"
        >
          ← Back to What&apos;s new
        </Link>
        <h3 className="mt-2 text-lg font-semibold text-gray-800 dark:text-white/90">
          Add update
        </h3>
        <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
          Create a new timeline entry for the marketing website.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-error-200 bg-error-50 px-4 py-2 text-theme-sm text-error-700 dark:border-error-800 dark:bg-error-950 dark:text-error-400">
          {error}
        </div>
      )}

      <WhatsNewFormFields form={form} setForm={setForm} />

      <div className="mt-6 flex flex-wrap items-center justify-end gap-2 border-t border-gray-200 pt-4 dark:border-gray-800">
        <Link
          href="/settings/whats-new"
          className="inline-flex h-10 items-center rounded-lg border border-gray-200 px-4 text-theme-sm text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-200 dark:hover:bg-gray-900"
        >
          Cancel
        </Link>
        <button
          type="button"
          className={primaryBtn}
          disabled={saving}
          onClick={handleSave}
        >
          {saving ? "Creating…" : "Create update"}
        </button>
      </div>
    </div>
  );
}
