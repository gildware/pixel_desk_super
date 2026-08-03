"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BlogFormFields from "@/src/components/blog/BlogFormFields";
import {
  emptyBlogForm,
  validateBlogForm,
} from "@/src/components/blog/blogForm.types";
import {
  listPlatformBlogPosts,
  createPlatformBlogPost,
} from "@/src/services/api/platformBlog.api";

const primaryBtn =
  "rounded-lg bg-brand-500 px-4 py-2 text-theme-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50";

export default function NewBlogPage() {
  const router = useRouter();
  const [form, setForm] = useState(emptyBlogForm);
  const [categories, setCategories] = useState<string[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listPlatformBlogPosts()
      .then((posts) => {
        setCategories(
          Array.from(
            new Set(posts.map((p) => p.category.trim()).filter(Boolean)),
          ).sort((a, b) => a.localeCompare(b)),
        );
      })
      .catch(() => setCategories([]))
      .finally(() => setLoadingCategories(false));
  }, []);

  const handleSave = useCallback(async () => {
    const validationError = validateBlogForm(form);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await createPlatformBlogPost({
        category: form.category.trim(),
        title: form.title.trim(),
        shortDescription: form.shortDescription.trim(),
        fullDescription: form.fullDescription,
        imageUrl: form.imageUrl.trim() || null,
        coverImageUrl: form.coverImageUrl.trim() || null,
        isActive: form.isActive,
      });
      router.push("/settings/blog");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create blog post");
    } finally {
      setSaving(false);
    }
  }, [form, router]);

  const pageReady = useMemo(() => !loadingCategories, [loadingCategories]);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/settings/blog"
            className="text-theme-xs font-medium text-brand-600 hover:underline dark:text-brand-400"
          >
            ← Back to blogs
          </Link>
          <h3 className="mt-2 text-lg font-semibold text-gray-800 dark:text-white/90">
            Add blog post
          </h3>
          <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
            Create a new article for the marketing website.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-error-200 bg-error-50 px-4 py-2 text-theme-sm text-error-700 dark:border-error-800 dark:bg-error-950 dark:text-error-400">
          {error}
        </div>
      )}

      {!pageReady ? (
        <p className="text-theme-sm text-gray-500 dark:text-gray-400">
          Loading…
        </p>
      ) : (
        <>
          <BlogFormFields form={form} setForm={setForm} categories={categories} />
          <div className="mt-6 flex flex-wrap items-center justify-end gap-2 border-t border-gray-200 pt-4 dark:border-gray-800">
            <Link
              href="/settings/blog"
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
              {saving ? "Creating…" : "Create blog post"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
