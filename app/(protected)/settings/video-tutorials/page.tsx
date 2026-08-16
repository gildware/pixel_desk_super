"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PublishToggle from "@/src/components/blog/PublishToggle";
import { PencilIcon, PlusIcon, TrashBinIcon } from "@/src/icons";
import {
  createPlatformVideoTutorialCategory,
  createPlatformVideoTutorialLesson,
  deletePlatformVideoTutorialCategory,
  deletePlatformVideoTutorialLesson,
  listPlatformVideoTutorials,
  updatePlatformVideoTutorialCategory,
  updatePlatformVideoTutorialLesson,
} from "@/src/services/api/platformVideoTutorials.api";
import type {
  PlatformVideoTutorialCategoryRow,
  PlatformVideoTutorialLessonRow,
} from "@/src/types/platformVideoTutorials.types";

const inputClass =
  "h-10 w-full rounded-lg border border-gray-200 bg-transparent px-3 text-theme-sm text-gray-800 dark:border-gray-700 dark:bg-white/[0.03] dark:text-white/90";
const textareaClass =
  "w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2 text-theme-sm text-gray-800 dark:border-gray-700 dark:bg-white/[0.03] dark:text-white/90";
const primaryBtn =
  "rounded-lg bg-brand-500 px-4 py-2 text-theme-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50";
const secondaryBtn =
  "rounded-lg border border-gray-200 px-4 py-2 text-theme-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-white/80 dark:hover:bg-white/[0.03]";

type CategoryForm = {
  title: string;
  durationLabel: string;
  defaultOpen: boolean;
  isActive: boolean;
};

type LessonForm = {
  title: string;
  duration: string;
  description: string;
  videoUrl: string;
  isDefault: boolean;
  isActive: boolean;
};

const emptyCategoryForm: CategoryForm = {
  title: "",
  durationLabel: "",
  defaultOpen: false,
  isActive: true,
};

const emptyLessonForm: LessonForm = {
  title: "",
  duration: "3.30 minute",
  description: "",
  videoUrl: "",
  isDefault: false,
  isActive: true,
};

export default function VideoTutorialsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<PlatformVideoTutorialCategoryRow[]>([]);
  const [search, setSearch] = useState("");
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [categoryEditing, setCategoryEditing] = useState<PlatformVideoTutorialCategoryRow | null>(
    null,
  );
  const [categoryForm, setCategoryForm] = useState<CategoryForm>(emptyCategoryForm);
  const [categoryBusy, setCategoryBusy] = useState(false);

  const [lessonModalOpen, setLessonModalOpen] = useState(false);
  const [lessonCategoryId, setLessonCategoryId] = useState<string | null>(null);
  const [lessonEditing, setLessonEditing] = useState<PlatformVideoTutorialLessonRow | null>(null);
  const [lessonForm, setLessonForm] = useState<LessonForm>(emptyLessonForm);
  const [lessonBusy, setLessonBusy] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const confirmActionRef = useRef<null | (() => Promise<void> | void)>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return categories;
    return categories
      .map((category) => {
        const categoryMatch =
          category.title.toLowerCase().includes(q) ||
          (category.durationLabel ?? "").toLowerCase().includes(q);
        const lessons = category.lessons.filter(
          (lesson) =>
            categoryMatch ||
            lesson.title.toLowerCase().includes(q) ||
            lesson.duration.toLowerCase().includes(q),
        );
        if (categoryMatch || lessons.length) {
          return { ...category, lessons: categoryMatch ? category.lessons : lessons };
        }
        return null;
      })
      .filter(Boolean) as PlatformVideoTutorialCategoryRow[];
  }, [categories, search]);

  const load = useCallback(() => {
    setLoading(true);
    listPlatformVideoTutorials()
      .then(setCategories)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openConfirm = (action: () => Promise<void> | void) => {
    confirmActionRef.current = action;
    setConfirmOpen(true);
  };

  const runConfirm = async () => {
    if (!confirmActionRef.current) return;
    setConfirmBusy(true);
    try {
      await confirmActionRef.current();
      setConfirmOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed");
    } finally {
      setConfirmBusy(false);
    }
  };

  const openNewCategory = () => {
    setCategoryEditing(null);
    setCategoryForm(emptyCategoryForm);
    setCategoryModalOpen(true);
  };

  const openEditCategory = (row: PlatformVideoTutorialCategoryRow) => {
    setCategoryEditing(row);
    setCategoryForm({
      title: row.title,
      durationLabel: row.durationLabel ?? "",
      defaultOpen: row.defaultOpen,
      isActive: row.isActive,
    });
    setCategoryModalOpen(true);
  };

  const saveCategory = async () => {
    setCategoryBusy(true);
    setError(null);
    try {
      const payload = {
        title: categoryForm.title.trim(),
        durationLabel: categoryForm.durationLabel.trim() || null,
        defaultOpen: categoryForm.defaultOpen,
        isActive: categoryForm.isActive,
      };
      if (categoryEditing) {
        await updatePlatformVideoTutorialCategory(categoryEditing.id, payload);
      } else {
        await createPlatformVideoTutorialCategory(payload);
      }
      setCategoryModalOpen(false);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save category");
    } finally {
      setCategoryBusy(false);
    }
  };

  const openNewLesson = (categoryId: string) => {
    setLessonCategoryId(categoryId);
    setLessonEditing(null);
    setLessonForm(emptyLessonForm);
    setLessonModalOpen(true);
  };

  const openEditLesson = (lesson: PlatformVideoTutorialLessonRow) => {
    setLessonCategoryId(lesson.categoryId);
    setLessonEditing(lesson);
    setLessonForm({
      title: lesson.title,
      duration: lesson.duration,
      description: lesson.description.join("\n\n"),
      videoUrl: lesson.videoUrl ?? "",
      isDefault: lesson.isDefault,
      isActive: lesson.isActive,
    });
    setLessonModalOpen(true);
  };

  const saveLesson = async () => {
    if (!lessonCategoryId) return;
    setLessonBusy(true);
    setError(null);
    try {
      const paragraphs = lessonForm.description
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter(Boolean);
      const payload = {
        title: lessonForm.title.trim(),
        duration: lessonForm.duration.trim() || "3.30 minute",
        description: paragraphs,
        videoUrl: lessonForm.videoUrl.trim() || null,
        isDefault: lessonForm.isDefault,
        isActive: lessonForm.isActive,
      };
      if (lessonEditing) {
        await updatePlatformVideoTutorialLesson(lessonEditing.id, payload);
      } else {
        await createPlatformVideoTutorialLesson(lessonCategoryId, payload);
      }
      setLessonModalOpen(false);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save lesson");
    } finally {
      setLessonBusy(false);
    }
  };

  const toggleCategoryPublished = async (
    row: PlatformVideoTutorialCategoryRow,
    next: boolean,
  ) => {
    setTogglingId(row.id);
    setError(null);
    try {
      await updatePlatformVideoTutorialCategory(row.id, { isActive: next });
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update category");
    } finally {
      setTogglingId(null);
    }
  };

  const toggleLessonPublished = async (
    row: PlatformVideoTutorialLessonRow,
    next: boolean,
  ) => {
    setTogglingId(row.id);
    setError(null);
    try {
      await updatePlatformVideoTutorialLesson(row.id, { isActive: next });
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update lesson");
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white/90">
            Video tutorials
          </h3>
          <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
            Manage sidebar categories and lessons for the marketing video tutorials page.
          </p>
        </div>
        <button type="button" className={primaryBtn} onClick={openNewCategory}>
          <span className="inline-flex items-center gap-2">
            <PlusIcon />
            Add category
          </span>
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-theme-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-300">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <input
          type="search"
          className={`${inputClass} max-w-md`}
          placeholder="Search categories or lessons…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <p className="text-theme-sm text-gray-500 dark:text-gray-400">Loading tutorials…</p>
      ) : filtered.length === 0 ? (
        <p className="text-theme-sm text-gray-500 dark:text-gray-400">No categories found.</p>
      ) : (
        <div className="space-y-6">
          {filtered.map((category) => (
            <section
              key={category.id}
              className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                    {category.title}
                  </h4>
                  <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
                    {category.durationLabel
                      ? `Flat row · ${category.durationLabel}`
                      : category.lessons.length
                        ? `Accordion · ${category.lessons.length} lesson(s)`
                        : "Flat row · no duration label"}
                    {category.defaultOpen ? " · expanded by default" : ""}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <PublishToggle
                    checked={category.isActive}
                    disabled={togglingId === category.id}
                    onChange={(next) => toggleCategoryPublished(category, next)}
                  />
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-theme-sm text-gray-600 hover:text-brand-500 dark:text-gray-300"
                    onClick={() => openEditCategory(category)}
                  >
                    <PencilIcon />
                    Edit
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-theme-sm text-error-600 hover:text-error-700"
                    onClick={() =>
                      openConfirm(async () => {
                        await deletePlatformVideoTutorialCategory(category.id);
                        load();
                      })
                    }
                  >
                    <TrashBinIcon />
                    Delete
                  </button>
                  <button
                    type="button"
                    className={secondaryBtn}
                    onClick={() => openNewLesson(category.id)}
                  >
                    Add lesson
                  </button>
                </div>
              </div>

              {category.lessons.length > 0 && (
                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full text-left text-theme-sm">
                    <thead className="border-b border-gray-200 text-gray-500 dark:border-gray-700 dark:text-gray-400">
                      <tr>
                        <th className="px-3 py-2 font-medium">Lesson</th>
                        <th className="px-3 py-2 font-medium">Duration</th>
                        <th className="px-3 py-2 font-medium">Default</th>
                        <th className="px-3 py-2 font-medium">Published</th>
                        <th className="px-3 py-2 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {category.lessons.map((lesson) => (
                        <tr
                          key={lesson.id}
                          className="border-b border-gray-100 dark:border-gray-800"
                        >
                          <td className="px-3 py-3 font-medium text-gray-800 dark:text-white/90">
                            {lesson.title}
                          </td>
                          <td className="px-3 py-3 text-gray-600 dark:text-gray-300">
                            {lesson.duration}
                          </td>
                          <td className="px-3 py-3 text-gray-600 dark:text-gray-300">
                            {lesson.isDefault ? "Yes" : "—"}
                          </td>
                          <td className="px-3 py-3">
                            <PublishToggle
                              checked={lesson.isActive}
                              disabled={togglingId === lesson.id}
                              onChange={(next) => toggleLessonPublished(lesson, next)}
                            />
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                className="inline-flex items-center gap-1 text-gray-600 hover:text-brand-500 dark:text-gray-300"
                                onClick={() => openEditLesson(lesson)}
                              >
                                <PencilIcon />
                                Edit
                              </button>
                              <button
                                type="button"
                                className="inline-flex items-center gap-1 text-error-600 hover:text-error-700"
                                onClick={() =>
                                  openConfirm(async () => {
                                    await deletePlatformVideoTutorialLesson(lesson.id);
                                    load();
                                  })
                                }
                              >
                                <TrashBinIcon />
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          ))}
        </div>
      )}

      {categoryModalOpen && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900">
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              {categoryEditing ? "Edit category" : "Add category"}
            </h4>
            <div className="mt-4 space-y-4">
              <label className="block space-y-1">
                <span className="text-theme-sm text-gray-600 dark:text-gray-300">Title</span>
                <input
                  className={inputClass}
                  value={categoryForm.title}
                  onChange={(e) =>
                    setCategoryForm((f) => ({ ...f, title: e.target.value }))
                  }
                />
              </label>
              <label className="block space-y-1">
                <span className="text-theme-sm text-gray-600 dark:text-gray-300">
                  Duration label (optional — flat rows only)
                </span>
                <input
                  className={inputClass}
                  placeholder="3.30 minute"
                  value={categoryForm.durationLabel}
                  onChange={(e) =>
                    setCategoryForm((f) => ({ ...f, durationLabel: e.target.value }))
                  }
                />
              </label>
              <label className="flex items-center gap-2 text-theme-sm text-gray-700 dark:text-gray-200">
                <input
                  type="checkbox"
                  checked={categoryForm.defaultOpen}
                  onChange={(e) =>
                    setCategoryForm((f) => ({ ...f, defaultOpen: e.target.checked }))
                  }
                />
                Expanded by default (when it has lessons)
              </label>
              <PublishToggle
                checked={categoryForm.isActive}
                onChange={(next) => setCategoryForm((f) => ({ ...f, isActive: next }))}
              />
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                className={secondaryBtn}
                onClick={() => setCategoryModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={primaryBtn}
                disabled={categoryBusy || !categoryForm.title.trim()}
                onClick={saveCategory}
              >
                {categoryBusy ? "Saving…" : categoryEditing ? "Save changes" : "Create category"}
              </button>
            </div>
          </div>
        </div>
      )}

      {lessonModalOpen && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900">
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              {lessonEditing ? "Edit lesson" : "Add lesson"}
            </h4>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="block space-y-1 md:col-span-2">
                <span className="text-theme-sm text-gray-600 dark:text-gray-300">Title</span>
                <input
                  className={inputClass}
                  value={lessonForm.title}
                  onChange={(e) => setLessonForm((f) => ({ ...f, title: e.target.value }))}
                />
              </label>
              <label className="block space-y-1">
                <span className="text-theme-sm text-gray-600 dark:text-gray-300">Duration</span>
                <input
                  className={inputClass}
                  value={lessonForm.duration}
                  onChange={(e) => setLessonForm((f) => ({ ...f, duration: e.target.value }))}
                />
              </label>
              <label className="block space-y-1">
                <span className="text-theme-sm text-gray-600 dark:text-gray-300">
                  Video URL (optional)
                </span>
                <input
                  className={inputClass}
                  placeholder="https://…"
                  value={lessonForm.videoUrl}
                  onChange={(e) => setLessonForm((f) => ({ ...f, videoUrl: e.target.value }))}
                />
              </label>
              <label className="block space-y-1 md:col-span-2">
                <span className="text-theme-sm text-gray-600 dark:text-gray-300">
                  Description (blank line between paragraphs)
                </span>
                <textarea
                  className={`${textareaClass} min-h-[160px]`}
                  value={lessonForm.description}
                  onChange={(e) =>
                    setLessonForm((f) => ({ ...f, description: e.target.value }))
                  }
                />
              </label>
              <label className="flex items-center gap-2 text-theme-sm text-gray-700 dark:text-gray-200">
                <input
                  type="checkbox"
                  checked={lessonForm.isDefault}
                  onChange={(e) =>
                    setLessonForm((f) => ({ ...f, isDefault: e.target.checked }))
                  }
                />
                Default lesson on page load
              </label>
              <PublishToggle
                checked={lessonForm.isActive}
                onChange={(next) => setLessonForm((f) => ({ ...f, isActive: next }))}
              />
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                className={secondaryBtn}
                onClick={() => setLessonModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={primaryBtn}
                disabled={lessonBusy || !lessonForm.title.trim()}
                onClick={saveLesson}
              >
                {lessonBusy ? "Saving…" : lessonEditing ? "Save changes" : "Create lesson"}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmOpen && (
        <div className="fixed inset-0 z-[100001] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900">
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Confirm delete
            </h4>
            <p className="mt-2 text-theme-sm text-gray-600 dark:text-gray-300">
              This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                className={secondaryBtn}
                onClick={() => setConfirmOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-lg bg-error-500 px-4 py-2 text-theme-sm font-medium text-white hover:bg-error-600 disabled:opacity-50"
                disabled={confirmBusy}
                onClick={runConfirm}
              >
                {confirmBusy ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
