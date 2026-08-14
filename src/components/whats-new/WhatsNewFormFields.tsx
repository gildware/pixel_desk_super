"use client";

import React from "react";
import PublishToggle from "@/src/components/blog/PublishToggle";
import type { WhatsNewFormState } from "./whatsNewForm.types";

const inputClass =
  "h-10 w-full rounded-lg border border-gray-200 bg-transparent px-3 text-theme-sm text-gray-800 dark:border-gray-700 dark:bg-white/[0.03] dark:text-white/90";
const textareaClass =
  "w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2 text-theme-sm text-gray-800 dark:border-gray-700 dark:bg-white/[0.03] dark:text-white/90";

type Props = {
  form: WhatsNewFormState;
  setForm: React.Dispatch<React.SetStateAction<WhatsNewFormState>>;
};

export default function WhatsNewFormFields({ form, setForm }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-theme-xs text-gray-500 dark:text-gray-400">
          Title
        </label>
        <input
          className={inputClass}
          value={form.title}
          placeholder="Update title"
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
        />
      </div>

      <div>
        <label className="mb-1 block text-theme-xs text-gray-500 dark:text-gray-400">
          Published date
        </label>
        <input
          type="date"
          className={inputClass}
          value={form.publishedAt}
          onChange={(e) =>
            setForm((f) => ({ ...f, publishedAt: e.target.value }))
          }
        />
      </div>

      <div>
        <label className="mb-1 block text-theme-xs text-gray-500 dark:text-gray-400">
          Body
        </label>
        <textarea
          className={textareaClass}
          rows={8}
          value={form.body}
          placeholder="Describe the update shown on the timeline card…"
          onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
        />
      </div>

      <div className="flex items-center gap-3">
        <PublishToggle
          checked={form.isActive}
          onChange={(next) => setForm((f) => ({ ...f, isActive: next }))}
        />
        <span className="text-theme-sm text-gray-600 dark:text-gray-400">
          Published on website
        </span>
      </div>
    </div>
  );
}
