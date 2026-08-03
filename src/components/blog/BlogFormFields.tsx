"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import SimpleImageUpload from "@/src/components/common/SimpleImageUpload";
import RichText from "@/src/components/common/RichText";
import PublishToggle from "@/src/components/blog/PublishToggle";
import type { BlogFormState } from "@/src/components/blog/blogForm.types";

const inputClass =
  "h-10 w-full rounded-lg border border-gray-200 bg-transparent px-3 text-theme-sm text-gray-800 dark:border-gray-700 dark:bg-white/[0.03] dark:text-white/90";
const textareaClass =
  "w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2 text-theme-sm text-gray-800 dark:border-gray-700 dark:bg-white/[0.03] dark:text-white/90";

function CategorySelect({
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

export default function BlogFormFields({
  form,
  setForm,
  categories,
}: {
  form: BlogFormState;
  setForm: React.Dispatch<React.SetStateAction<BlogFormState>>;
  categories: string[];
}) {
  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_320px] md:items-stretch">
        <div className="min-w-0 space-y-3">
          <div>
            <label className="mb-1 block text-theme-xs text-gray-500 dark:text-gray-400">
              Category
            </label>
            <CategorySelect
              value={form.category}
              categories={categories}
              onChange={(category) => setForm((f) => ({ ...f, category }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-theme-xs text-gray-500 dark:text-gray-400">
              Title
            </label>
            <input
              className={inputClass}
              value={form.title}
              placeholder="Blog post title"
              maxLength={300}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-theme-xs text-gray-500 dark:text-gray-400">
              Short description
            </label>
            <textarea
              className={textareaClass}
              rows={3}
              maxLength={500}
              value={form.shortDescription}
              placeholder="Brief summary shown in blog listings"
              onChange={(e) =>
                setForm((f) => ({ ...f, shortDescription: e.target.value }))
              }
            />
          </div>
        </div>
        <div className="flex min-h-0 flex-col gap-3">
          <div className="flex min-h-0 flex-1 flex-col">
            <label className="mb-1 block shrink-0 text-theme-xs text-gray-500 dark:text-gray-400">
              Featured image
            </label>
            <p className="mb-1 text-[10px] text-gray-400 dark:text-gray-500">
              Card thumbnail · 16:9
            </p>
            <div className="aspect-video w-full md:min-h-[120px] md:flex-1">
              <SimpleImageUpload
                value={form.imageUrl}
                onChange={(url) => setForm((f) => ({ ...f, imageUrl: url }))}
                label="Featured image"
                variant="preview"
                gridCols={16}
                gridRows={9}
                hideLabel
                fillContainer
              />
            </div>
          </div>
          <div className="flex min-h-0 flex-col">
            <label className="mb-1 block shrink-0 text-theme-xs text-gray-500 dark:text-gray-400">
              Cover image
            </label>
            <p className="mb-1 text-[10px] text-gray-400 dark:text-gray-500">
              Detail page hero · wide banner
            </p>
            <div className="aspect-[21/9] w-full">
              <SimpleImageUpload
                value={form.coverImageUrl}
                onChange={(url) =>
                  setForm((f) => ({ ...f, coverImageUrl: url }))
                }
                label="Cover image"
                variant="preview"
                gridCols={21}
                gridRows={9}
                unitPx={12}
                hideLabel
                fillContainer
              />
            </div>
          </div>
        </div>
      </div>
      <div className="mt-4">
        <label className="mb-1 block text-theme-xs text-gray-500 dark:text-gray-400">
          Full description
        </label>
        <RichText
          value={form.fullDescription}
          onChange={(fullDescription) =>
            setForm((f) => ({ ...f, fullDescription }))
          }
        />
      </div>
      <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50/60 px-4 py-3 dark:border-gray-800 dark:bg-white/[0.02]">
        <PublishToggle
          checked={form.isActive}
          onChange={(isActive) => setForm((f) => ({ ...f, isActive }))}
        />
        <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
          Published posts appear on the marketing website.
        </p>
      </div>
    </>
  );
}
