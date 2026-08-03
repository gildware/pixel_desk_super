"use client";

import React from "react";

type Props = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  showLabel?: boolean;
};

export default function PublishToggle({
  checked,
  onChange,
  disabled,
  showLabel = true,
}: Props) {
  return (
    <div className="flex items-center gap-2.5">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={checked ? "Published" : "Draft"}
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
      {showLabel && (
        <span
          className={`text-theme-xs font-medium ${
            checked
              ? "text-emerald-700 dark:text-emerald-400"
              : "text-gray-500 dark:text-gray-400"
          }`}
        >
          {checked ? "Published" : "Draft"}
        </span>
      )}
    </div>
  );
}
