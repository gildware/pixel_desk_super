"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  listPlatformFaqs,
  createPlatformFaq,
  updatePlatformFaq,
  deletePlatformFaq,
} from "@/src/services/api/platformFaqs.api";
import type { PlatformFaqRow } from "@/src/types/platformFaqs.types";

const inputClass =
  "h-10 w-full rounded-lg border border-gray-200 bg-transparent px-3 text-theme-sm text-gray-800 dark:border-gray-700 dark:bg-white/[0.03] dark:text-white/90";
const textareaClass =
  "w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2 text-theme-sm text-gray-800 dark:border-gray-700 dark:bg-white/[0.03] dark:text-white/90";
const primaryBtn =
  "rounded-lg bg-brand-500 px-4 py-2 text-theme-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50";

type FormState = {
  category: string;
  question: string;
  answer: string;
  sortOrder: number;
  isActive: boolean;
};

const emptyForm: FormState = {
  category: "",
  question: "",
  answer: "",
  sortOrder: 0,
  isActive: true,
};

function groupByCategory(
  faqs: PlatformFaqRow[],
): { category: string; items: PlatformFaqRow[] }[] {
  const map = new Map<string, PlatformFaqRow[]>();
  for (const faq of faqs) {
    const key = faq.category.trim() || "Uncategorized";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(faq);
  }
  return Array.from(map.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([category, items]) => ({
      category,
      items: items.sort(
        (a, b) =>
          a.sortOrder - b.sortOrder ||
          a.createdAt.localeCompare(b.createdAt),
      ),
    }));
}

export default function FaqsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [faqs, setFaqs] = useState<PlatformFaqRow[]>([]);

  // Add form
  const [form, setForm] = useState<FormState>(emptyForm);
  const [creating, setCreating] = useState(false);

  // Edit modal
  const [editRow, setEditRow] = useState<PlatformFaqRow | null>(null);
  const [editForm, setEditForm] = useState<FormState>(emptyForm);
  const [savingEdit, setSavingEdit] = useState(false);

  // Confirm delete modal
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const confirmActionRef = useRef<null | (() => Promise<void> | void)>(null);

  const grouped = useMemo(() => groupByCategory(faqs), [faqs]);
  const existingCategories = useMemo(
    () =>
      Array.from(
        new Set(faqs.map((f) => f.category.trim()).filter(Boolean)),
      ).sort((a, b) => a.localeCompare(b)),
    [faqs],
  );

  const load = useCallback(() => {
    setLoading(true);
    listPlatformFaqs()
      .then(setFaqs)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async () => {
    if (!form.category.trim() || !form.question.trim() || !form.answer.trim()) {
      setError("Category, question and answer are required.");
      return;
    }
    setError(null);
    setCreating(true);
    try {
      const row = await createPlatformFaq({
        category: form.category,
        question: form.question,
        answer: form.answer,
        sortOrder: form.sortOrder,
        isActive: form.isActive,
      });
      setFaqs((p) => [...p, row]);
      setForm(emptyForm);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Create failed");
    } finally {
      setCreating(false);
    }
  };

  const openEdit = (row: PlatformFaqRow) => {
    setEditRow(row);
    setEditForm({
      category: row.category,
      question: row.question,
      answer: row.answer,
      sortOrder: row.sortOrder,
      isActive: row.isActive,
    });
  };

  const handleSaveEdit = async () => {
    if (!editRow) return;
    if (
      !editForm.category.trim() ||
      !editForm.question.trim() ||
      !editForm.answer.trim()
    ) {
      setError("Category, question and answer are required.");
      return;
    }
    setSavingEdit(true);
    try {
      const updated = await updatePlatformFaq(editRow.id, {
        category: editForm.category,
        question: editForm.question,
        answer: editForm.answer,
        sortOrder: editForm.sortOrder,
        isActive: editForm.isActive,
      });
      setFaqs((p) => p.map((r) => (r.id === updated.id ? updated : r)));
      setEditRow(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setSavingEdit(false);
    }
  };

  const toggleActive = async (row: PlatformFaqRow, next: boolean) => {
    try {
      const updated = await updatePlatformFaq(row.id, { isActive: next });
      setFaqs((p) => p.map((r) => (r.id === updated.id ? updated : r)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    }
  };

  const openConfirmDelete = (row: PlatformFaqRow) => {
    confirmActionRef.current = async () => {
      await deletePlatformFaq(row.id);
      setFaqs((p) => p.filter((r) => r.id !== row.id));
    };
    setConfirmBusy(false);
    setConfirmOpen(true);
  };

  const closeConfirm = () => {
    confirmActionRef.current = null;
    setConfirmOpen(false);
    setConfirmBusy(false);
  };

  const runConfirm = async () => {
    const fn = confirmActionRef.current;
    if (!fn) return closeConfirm();
    try {
      setConfirmBusy(true);
      await fn();
      closeConfirm();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
      setConfirmBusy(false);
    }
  };

  return (
    <>
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <div className="mb-1 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            HelpDesk FAQs
          </h3>
        </div>
        <p className="mb-5 text-theme-sm text-gray-500 dark:text-gray-400">
          Add, edit and remove the FAQs shown to all users on the dashboard
          Helpdesk page, grouped by category.
        </p>

        {error && (
          <div className="mb-4 rounded-lg border border-error-200 bg-error-50 px-4 py-2 text-theme-sm text-error-700 dark:border-error-800 dark:bg-error-950 dark:text-error-400">
            {error}
          </div>
        )}

        {/* Add form */}
        <div className="mb-6 rounded-xl border border-gray-200 p-4 dark:border-gray-800">
          <p className="mb-3 text-theme-sm font-medium text-gray-800 dark:text-white/90">
            Add a new FAQ
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-theme-xs text-gray-500 dark:text-gray-400">
                Category
              </label>
              <input
                className={inputClass}
                list="faq-categories"
                value={form.category}
                placeholder="e.g. Projects, Billing, Account"
                onChange={(e) =>
                  setForm((f) => ({ ...f, category: e.target.value }))
                }
              />
              <datalist id="faq-categories">
                {existingCategories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="mb-1 block text-theme-xs text-gray-500 dark:text-gray-400">
                Sort order
              </label>
              <input
                type="number"
                className={inputClass}
                value={form.sortOrder}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    sortOrder: Number(e.target.value) || 0,
                  }))
                }
              />
            </div>
          </div>
          <div className="mt-3">
            <label className="mb-1 block text-theme-xs text-gray-500 dark:text-gray-400">
              Question
            </label>
            <input
              className={inputClass}
              value={form.question}
              placeholder="What do users frequently ask?"
              onChange={(e) =>
                setForm((f) => ({ ...f, question: e.target.value }))
              }
            />
          </div>
          <div className="mt-3">
            <label className="mb-1 block text-theme-xs text-gray-500 dark:text-gray-400">
              Answer
            </label>
            <textarea
              className={textareaClass}
              rows={4}
              value={form.answer}
              placeholder="Write the answer users will see..."
              onChange={(e) =>
                setForm((f) => ({ ...f, answer: e.target.value }))
              }
            />
          </div>
          <div className="mt-3 flex items-center justify-between">
            <label className="flex items-center gap-2 text-theme-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) =>
                  setForm((f) => ({ ...f, isActive: e.target.checked }))
                }
              />
              Visible to users
            </label>
            <button
              type="button"
              className={primaryBtn}
              disabled={creating}
              onClick={handleCreate}
            >
              {creating ? "Adding…" : "Add FAQ"}
            </button>
          </div>
        </div>

        {/* List grouped by category */}
        {loading ? (
          <p className="text-theme-sm text-gray-500 dark:text-gray-400">
            Loading…
          </p>
        ) : faqs.length === 0 ? (
          <p className="text-theme-sm text-gray-500 dark:text-gray-400">
            No FAQs yet. Add your first one above.
          </p>
        ) : (
          <div className="space-y-6">
            {grouped.map(({ category, items }) => (
              <div key={category}>
                <p className="mb-2 text-theme-sm font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-400">
                  {category}
                </p>
                <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800">
                  {items.map((row, idx) => (
                    <div
                      key={row.id}
                      className={`flex items-start justify-between gap-4 p-4 ${
                        idx > 0
                          ? "border-t border-gray-200 dark:border-gray-800"
                          : ""
                      } ${!row.isActive ? "opacity-60" : ""}`}
                    >
                      <div className="min-w-0">
                        <p className="text-theme-sm font-medium text-gray-900 dark:text-white">
                          {row.question}
                          {!row.isActive && (
                            <span className="ml-2 rounded bg-gray-100 px-1.5 py-0.5 text-theme-xs font-normal text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                              Hidden
                            </span>
                          )}
                        </p>
                        <p className="mt-1 whitespace-pre-wrap text-theme-sm text-gray-600 dark:text-gray-400">
                          {row.answer}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <label className="flex items-center gap-1 text-theme-xs text-gray-500 dark:text-gray-400">
                          <input
                            type="checkbox"
                            checked={row.isActive}
                            onChange={(e) =>
                              toggleActive(row, e.target.checked)
                            }
                          />
                          Active
                        </label>
                        <button
                          type="button"
                          className="text-theme-sm text-brand-600 hover:underline dark:text-brand-400"
                          onClick={() => openEdit(row)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="text-theme-sm text-error-600 hover:underline dark:text-error-400"
                          onClick={() => openConfirmDelete(row)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit modal */}
      {editRow && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close edit dialog"
            onClick={() => setEditRow(null)}
          />
          <div className="relative w-[min(92vw,560px)] rounded-2xl border border-gray-200 bg-white p-5 shadow-xl dark:border-gray-800 dark:bg-gray-950">
            <h3 className="text-theme-sm font-semibold text-gray-900 dark:text-white">
              Edit FAQ
            </h3>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-theme-xs text-gray-500 dark:text-gray-400">
                  Category
                </label>
                <input
                  className={inputClass}
                  list="faq-categories"
                  value={editForm.category}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, category: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-theme-xs text-gray-500 dark:text-gray-400">
                  Sort order
                </label>
                <input
                  type="number"
                  className={inputClass}
                  value={editForm.sortOrder}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      sortOrder: Number(e.target.value) || 0,
                    }))
                  }
                />
              </div>
            </div>
            <div className="mt-3">
              <label className="mb-1 block text-theme-xs text-gray-500 dark:text-gray-400">
                Question
              </label>
              <input
                className={inputClass}
                value={editForm.question}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, question: e.target.value }))
                }
              />
            </div>
            <div className="mt-3">
              <label className="mb-1 block text-theme-xs text-gray-500 dark:text-gray-400">
                Answer
              </label>
              <textarea
                className={textareaClass}
                rows={5}
                value={editForm.answer}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, answer: e.target.value }))
                }
              />
            </div>
            <label className="mt-3 flex items-center gap-2 text-theme-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={editForm.isActive}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, isActive: e.target.checked }))
                }
              />
              Visible to users
            </label>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditRow(null)}
                disabled={savingEdit}
                className="h-9 rounded-lg border border-gray-200 px-3 text-theme-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60 dark:border-gray-800 dark:text-gray-200 dark:hover:bg-gray-900"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={savingEdit}
                className={primaryBtn}
              >
                {savingEdit ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm delete modal */}
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
              Delete this FAQ? This cannot be undone.
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
