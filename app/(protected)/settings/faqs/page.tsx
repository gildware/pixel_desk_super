"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  listPlatformFaqs,
  createPlatformFaq,
  updatePlatformFaq,
  deletePlatformFaq,
} from "@/src/services/api/platformFaqs.api";
import type { PlatformFaqRow } from "@/src/types/platformFaqs.types";
import {
  CatalogDragHandle,
  useCatalogDragReorder,
} from "@/src/components/platform-catalog/CatalogDragHandle";

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
  isActive: boolean;
};

const emptyForm: FormState = {
  category: "",
  question: "",
  answer: "",
  isActive: true,
};

type CategoryGroup = {
  id: string;
  key: string;
  categorySortOrder: number;
  items: PlatformFaqRow[];
};

function faqCategoryKey(row: PlatformFaqRow): string {
  return row.category.trim() || "Uncategorized";
}

function groupByCategory(faqs: PlatformFaqRow[]): CategoryGroup[] {
  const map = new Map<string, PlatformFaqRow[]>();
  for (const faq of faqs) {
    const key = faqCategoryKey(faq);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(faq);
  }
  return Array.from(map.entries())
    .map(([key, items]) => ({
      id: key,
      key,
      categorySortOrder: items[0]?.categorySortOrder ?? 0,
      items: [...items].sort(
        (a, b) =>
          a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt),
      ),
    }))
    .sort(
      (a, b) =>
        a.categorySortOrder - b.categorySortOrder ||
        a.key.localeCompare(b.key),
    );
}

function FaqCategorySelect({
  value,
  categories,
  onChange,
}: {
  value: string;
  categories: string[];
  onChange: (value: string) => void;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  const trimmedQuery = query.trim();
  const filtered = useMemo(() => {
    if (!trimmedQuery) return categories;
    const q = trimmedQuery.toLowerCase();
    return categories.filter((c) => c.toLowerCase().includes(q));
  }, [categories, trimmedQuery]);

  const hasExactMatch = useMemo(
    () =>
      trimmedQuery.length > 0 &&
      categories.some((c) => c.toLowerCase() === trimmedQuery.toLowerCase()),
    [categories, trimmedQuery],
  );

  const commit = useCallback(
    (next: string) => {
      const trimmed = next.trim();
      onChange(trimmed);
      setQuery(trimmed);
      setOpen(false);
    },
    [onChange],
  );

  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        if (open) commit(query);
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [commit, open, query]);

  const showDropdown =
    open &&
    (filtered.length > 0 || (trimmedQuery.length > 0 && !hasExactMatch));

  return (
    <div ref={wrapperRef} className="relative">
      <input
        className={inputClass}
        value={query}
        placeholder="Search or type a category"
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          onChange(e.target.value);
          setOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit(query);
          }
          if (e.key === "Escape") {
            setOpen(false);
            setQuery(value);
          }
        }}
      />
      {showDropdown && (
        <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-950">
          {filtered.map((category) => (
            <li key={category}>
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-theme-sm text-gray-800 hover:bg-gray-50 dark:text-white/90 dark:hover:bg-white/10"
                onMouseDown={(e) => {
                  e.preventDefault();
                  commit(category);
                }}
              >
                {category}
              </button>
            </li>
          ))}
          {trimmedQuery.length > 0 && !hasExactMatch && (
            <li>
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-theme-sm text-brand-600 hover:bg-gray-50 dark:text-brand-400 dark:hover:bg-white/10"
                onMouseDown={(e) => {
                  e.preventDefault();
                  commit(trimmedQuery);
                }}
              >
                {filtered.length > 0 ? `Use "${trimmedQuery}"` : trimmedQuery}
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

function FaqQuestionRow({
  row,
  idx,
  reordering,
  dragHandleProps,
  rowClassName,
  rowDragProps,
  onToggleActive,
  onEdit,
  onDelete,
}: {
  row: PlatformFaqRow;
  idx: number;
  reordering: boolean;
  dragHandleProps: ReturnType<
    ReturnType<typeof useCatalogDragReorder>["dragHandleProps"]
  >;
  rowClassName: string;
  rowDragProps: ReturnType<
    ReturnType<typeof useCatalogDragReorder>["rowDragProps"]
  >;
  onToggleActive: (row: PlatformFaqRow, next: boolean) => void;
  onEdit: (row: PlatformFaqRow) => void;
  onDelete: (row: PlatformFaqRow) => void;
}) {
  return (
    <div
      className={`flex items-start gap-3 p-4 ${idx > 0 ? "border-t border-gray-200 dark:border-gray-800" : ""} ${!row.isActive ? "opacity-60" : ""} ${rowClassName}`}
      {...rowDragProps(row.id)}
    >
      <CatalogDragHandle {...dragHandleProps(row.id, row.question)} />
      <div className="min-w-0 flex-1">
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
            disabled={reordering}
            onChange={(e) => onToggleActive(row, e.target.checked)}
          />
          Active
        </label>
        <button
          type="button"
          disabled={reordering}
          className="text-theme-sm text-brand-600 hover:underline disabled:opacity-50 dark:text-brand-400"
          onClick={() => onEdit(row)}
        >
          Edit
        </button>
        <button
          type="button"
          disabled={reordering}
          className="text-theme-sm text-error-600 hover:underline disabled:opacity-50 dark:text-error-400"
          onClick={() => onDelete(row)}
        >
          Delete
        </button>
      </div>
    </div>
  );
}

function FaqCategorySection({
  group,
  categoryDrag,
  onError,
  onToggleActive,
  onEdit,
  onDelete,
  onQuestionsReordered,
}: {
  group: CategoryGroup;
  categoryDrag: ReturnType<typeof useCatalogDragReorder<CategoryGroup>>;
  onError: (message: string) => void;
  onToggleActive: (row: PlatformFaqRow, next: boolean) => void;
  onEdit: (row: PlatformFaqRow) => void;
  onDelete: (row: PlatformFaqRow) => void;
  onQuestionsReordered: (categoryKey: string, rows: PlatformFaqRow[]) => void;
}) {
  const reorderQuestions = useCallback(
    async (reordered: PlatformFaqRow[]) => {
      const previous = group.items;
      const withNewOrder = reordered.map((row, index) => ({
        ...row,
        sortOrder: index,
      }));
      onQuestionsReordered(group.key, withNewOrder);
      try {
        const updated = await Promise.all(
          withNewOrder.map((row) =>
            updatePlatformFaq(row.id, { sortOrder: row.sortOrder }),
          ),
        );
        onQuestionsReordered(group.key, updated);
      } catch (e) {
        onQuestionsReordered(group.key, previous);
        throw e;
      }
    },
    [group.items, group.key, onQuestionsReordered],
  );

  const questionDrag = useCatalogDragReorder(
    group.items,
    reorderQuestions,
    onError,
  );

  return (
    <div
      className={`rounded-lg border border-gray-200 dark:border-gray-800 ${categoryDrag.rowClassName(group.id)}`}
      {...categoryDrag.rowDragProps(group.id)}
    >
      <div className="flex items-center gap-2 border-b border-gray-200 bg-gray-50/80 px-4 py-2 dark:border-gray-800 dark:bg-white/[0.02]">
        <CatalogDragHandle
          {...categoryDrag.dragHandleProps(group.id, group.key)}
        />
        <p className="text-theme-sm font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-400">
          {group.key}
        </p>
      </div>
      {group.items.map((row, idx) => (
        <FaqQuestionRow
          key={row.id}
          row={row}
          idx={idx}
          reordering={questionDrag.reordering || categoryDrag.reordering}
          dragHandleProps={questionDrag.dragHandleProps}
          rowClassName={questionDrag.rowClassName(row.id)}
          rowDragProps={questionDrag.rowDragProps}
          onToggleActive={onToggleActive}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

export default function FaqsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [faqs, setFaqs] = useState<PlatformFaqRow[]>([]);

  const [form, setForm] = useState<FormState>(emptyForm);
  const [creating, setCreating] = useState(false);

  const [editRow, setEditRow] = useState<PlatformFaqRow | null>(null);
  const [editForm, setEditForm] = useState<FormState>(emptyForm);
  const [savingEdit, setSavingEdit] = useState(false);

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

  const handleQuestionsReordered = useCallback(
    (categoryKey: string, rows: PlatformFaqRow[]) => {
      setFaqs((prev) => {
        const others = prev.filter((f) => faqCategoryKey(f) !== categoryKey);
        return [...others, ...rows];
      });
    },
    [],
  );

  const reorderCategories = useCallback(
    async (reordered: CategoryGroup[]) => {
      const previous = faqs;
      const orderByKey = new Map(
        reordered.map((group, index) => [group.id, index]),
      );
      setFaqs((prev) =>
        prev.map((faq) => {
          const key = faqCategoryKey(faq);
          const nextOrder = orderByKey.get(key);
          return nextOrder !== undefined
            ? { ...faq, categorySortOrder: nextOrder }
            : faq;
        }),
      );
      try {
        await Promise.all(
          reordered.flatMap((group, index) =>
            group.items.map((item) =>
              updatePlatformFaq(item.id, { categorySortOrder: index }),
            ),
          ),
        );
      } catch (e) {
        setFaqs(previous);
        throw e;
      }
    },
    [faqs],
  );

  const categoryDrag = useCatalogDragReorder(
    grouped,
    reorderCategories,
    setError,
  );

  const handleCreate = async () => {
    if (!form.category.trim() || !form.question.trim() || !form.answer.trim()) {
      setError("Category, question and answer are required.");
      return;
    }
    setError(null);
    setCreating(true);
    try {
      const row = await createPlatformFaq({
        category: form.category.trim(),
        question: form.question,
        answer: form.answer,
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
        category: editForm.category.trim(),
        question: editForm.question,
        answer: editForm.answer,
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
          Helpdesk page. Drag categories and questions to change their order.
        </p>

        {error && (
          <div className="mb-4 rounded-lg border border-error-200 bg-error-50 px-4 py-2 text-theme-sm text-error-700 dark:border-error-800 dark:bg-error-950 dark:text-error-400">
            {error}
          </div>
        )}

        <div className="mb-6 rounded-xl border border-gray-200 p-4 dark:border-gray-800">
          <p className="mb-3 text-theme-sm font-medium text-gray-800 dark:text-white/90">
            Add a new FAQ
          </p>
          <div>
            <label className="mb-1 block text-theme-xs text-gray-500 dark:text-gray-400">
              Category
            </label>
            <FaqCategorySelect
              value={form.category}
              categories={existingCategories}
              onChange={(category) => setForm((f) => ({ ...f, category }))}
            />
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

        {loading ? (
          <p className="text-theme-sm text-gray-500 dark:text-gray-400">
            Loading…
          </p>
        ) : faqs.length === 0 ? (
          <p className="text-theme-sm text-gray-500 dark:text-gray-400">
            No FAQs yet. Add your first one above.
          </p>
        ) : (
          <div className="space-y-4">
            {grouped.map((group) => (
              <FaqCategorySection
                key={group.key}
                group={group}
                categoryDrag={categoryDrag}
                onError={setError}
                onToggleActive={toggleActive}
                onEdit={openEdit}
                onDelete={openConfirmDelete}
                onQuestionsReordered={handleQuestionsReordered}
              />
            ))}
          </div>
        )}
      </div>

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
            <div className="mt-4">
              <label className="mb-1 block text-theme-xs text-gray-500 dark:text-gray-400">
                Category
              </label>
              <FaqCategorySelect
                key={editRow.id}
                value={editForm.category}
                categories={existingCategories}
                onChange={(category) =>
                  setEditForm((f) => ({ ...f, category }))
                }
              />
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
