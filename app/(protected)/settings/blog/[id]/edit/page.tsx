"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BlogFormFields from "@/src/components/blog/BlogFormFields";
import {
  blogFormFromRow,
  validateBlogForm,
} from "@/src/components/blog/blogForm.types";
import type { BlogFormState } from "@/src/components/blog/blogForm.types";
import {
  listPlatformBlogPosts,
  updatePlatformBlogPost,
  deletePlatformBlogPost,
} from "@/src/services/api/platformBlog.api";
import type { PlatformBlogPostRow } from "@/src/types/platformBlog.types";

const primaryBtn =
  "rounded-lg bg-brand-500 px-4 py-2 text-theme-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50";

export default function EditBlogPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [blogId, setBlogId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [post, setPost] = useState<PlatformBlogPostRow | null>(null);
  const [form, setForm] = useState<BlogFormState | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    params.then((p) => setBlogId(p.id));
  }, [params]);

  useEffect(() => {
    if (!blogId) return;
    setLoading(true);
    listPlatformBlogPosts()
      .then((posts) => {
        setCategories(
          Array.from(
            new Set(posts.map((p) => p.category.trim()).filter(Boolean)),
          ).sort((a, b) => a.localeCompare(b)),
        );
        const row = posts.find((p) => p.id === blogId) ?? null;
        if (!row) {
          setError("Blog post not found.");
          return;
        }
        setPost(row);
        setForm(blogFormFromRow(row));
      })
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Failed to load blog post"),
      )
      .finally(() => setLoading(false));
  }, [blogId]);

  const handleSave = useCallback(async () => {
    if (!form || !post) return;
    const validationError = validateBlogForm(form);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await updatePlatformBlogPost(post.id, {
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
      setError(e instanceof Error ? e.message : "Failed to save blog post");
    } finally {
      setSaving(false);
    }
  }, [form, post, router]);

  const handleDelete = useCallback(async () => {
    if (!post) return;
    setDeleting(true);
    setError(null);
    try {
      await deletePlatformBlogPost(post.id);
      router.push("/settings/blog");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete blog post");
      setDeleting(false);
      setConfirmDelete(false);
    }
  }, [post, router]);

  return (
    <>
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <div className="mb-6">
          <Link
            href="/settings/blog"
            className="text-theme-xs font-medium text-brand-600 hover:underline dark:text-brand-400"
          >
            ← Back to blogs
          </Link>
          <h3 className="mt-2 text-lg font-semibold text-gray-800 dark:text-white/90">
            Edit blog post
          </h3>
          {post && (
            <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
              {post.title}
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
            {loading ? "Loading blog post…" : "Blog post not found."}
          </p>
        ) : (
          <>
            <BlogFormFields
              form={form}
              setForm={setForm}
              categories={categories}
            />
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 pt-4 dark:border-gray-800">
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                disabled={saving || deleting}
                className="inline-flex h-10 items-center rounded-lg border border-error-200 px-4 text-theme-sm font-medium text-error-600 hover:bg-error-50 disabled:opacity-50 dark:border-error-900 dark:text-error-400 dark:hover:bg-error-950"
              >
                Delete post
              </button>
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href="/settings/blog"
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
              Delete blog post
            </h3>
            <p className="mt-2 text-theme-sm text-gray-600 dark:text-gray-300">
              Delete this blog post permanently? This cannot be undone.
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
                {deleting ? "Deleting…" : "Delete post"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
