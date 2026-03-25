"use client";

import React, { useEffect, useState } from "react";
import { getInactivitySettings, updateInactivitySettings } from "@/src/services/api/settings.api";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [enabled, setEnabled] = useState(true);
  const [warningDays, setWarningDays] = useState<number>(30);
  const [deletionDays, setDeletionDays] = useState<number>(60);
  const [deletionGraceDays, setDeletionGraceDays] = useState<number>(7);
  const [reminderEmailSubject, setReminderEmailSubject] = useState<string>("");
  const [reminderEmailBody, setReminderEmailBody] = useState<string>("");
  const [deleteWarningEmailSubject, setDeleteWarningEmailSubject] = useState<string>("");
  const [deleteWarningEmailBody, setDeleteWarningEmailBody] = useState<string>("");

  useEffect(() => {
    getInactivitySettings()
      .then((s) => {
        setEnabled(Boolean(s.enabled));
        setWarningDays(Number(s.warningDays ?? 30));
        setDeletionDays(Number(s.deletionDays ?? 60));
        setDeletionGraceDays(Number((s as any).deletionGraceDays ?? 7));
        setReminderEmailSubject(String((s as any).reminderEmailSubject ?? ""));
        setReminderEmailBody(String((s as any).reminderEmailBody ?? ""));
        setDeleteWarningEmailSubject(String((s as any).deleteWarningEmailSubject ?? ""));
        setDeleteWarningEmailBody(String((s as any).deleteWarningEmailBody ?? ""));
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load settings");
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const updated = await updateInactivitySettings({
        enabled,
        warningDays,
        deletionDays,
        deletionGraceDays,
        reminderEmailSubject,
        reminderEmailBody,
        deleteWarningEmailSubject,
        deleteWarningEmailBody,
      });
      setEnabled(Boolean(updated.enabled));
      setWarningDays(Number(updated.warningDays));
      setDeletionDays(Number(updated.deletionDays));
      setDeletionGraceDays(Number(updated.deletionGraceDays));
      setReminderEmailSubject(String(updated.reminderEmailSubject ?? ""));
      setReminderEmailBody(String(updated.reminderEmailBody ?? ""));
      setDeleteWarningEmailSubject(String(updated.deleteWarningEmailSubject ?? ""));
      setDeleteWarningEmailBody(String(updated.deleteWarningEmailBody ?? ""));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
      <div className="mb-5">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Settings
        </h3>
        <p className="text-theme-sm text-gray-500 dark:text-gray-400">
          Inactivity policy for inactivity warning + deletion.
        </p>
      </div>

      {loading ? (
        <p className="text-theme-sm text-gray-500 dark:text-gray-400">Loading…</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            {error && (
              <div className="mb-4 rounded-lg border border-error-200 bg-error-50 px-4 py-2 text-theme-sm text-error-700 dark:border-error-800 dark:bg-error-950 dark:text-error-400">
                {error}
              </div>
            )}
          </div>

          <label className="block">
            <span className="mb-1 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">
              Warning after (days)
            </span>
            <input
              type="number"
              min={1}
              max={365}
              value={warningDays}
              onChange={(e) => setWarningDays(Number(e.target.value))}
              className="h-10 w-full rounded-lg border border-gray-200 bg-transparent px-3 text-theme-sm text-gray-800 dark:border-gray-700 dark:bg-white/[0.03] dark:text-white/90"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">
              Deletion after (days)
            </span>
            <input
              type="number"
              min={1}
              max={365}
              value={deletionDays}
              onChange={(e) => setDeletionDays(Number(e.target.value))}
              className="h-10 w-full rounded-lg border border-gray-200 bg-transparent px-3 text-theme-sm text-gray-800 dark:border-gray-700 dark:bg-white/[0.03] dark:text-white/90"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">
              Deletion grace period (days)
            </span>
            <input
              type="number"
              min={0}
              max={365}
              value={deletionGraceDays}
              onChange={(e) => setDeletionGraceDays(Number(e.target.value))}
              className="h-10 w-full rounded-lg border border-gray-200 bg-transparent px-3 text-theme-sm text-gray-800 dark:border-gray-700 dark:bg-white/[0.03] dark:text-white/90"
            />
          </label>

          <div className="sm:col-span-2 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
            <p className="mb-2 text-theme-sm font-semibold text-gray-800 dark:text-white/90">
              Email templates
            </p>
            <p className="mb-4 text-theme-xs text-gray-500 dark:text-gray-400">
              Available placeholders:{" "}
              <span className="font-mono">{"{{companyName}}"}</span>,{" "}
              <span className="font-mono">{"{{lastActivityDate}}"}</span>,{" "}
              <span className="font-mono">{"{{deleteOnDate}}"}</span>
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">
                  Reminder email subject
                </span>
                <input
                  type="text"
                  value={reminderEmailSubject}
                  onChange={(e) => setReminderEmailSubject(e.target.value)}
                  className="h-10 w-full rounded-lg border border-gray-200 bg-transparent px-3 text-theme-sm text-gray-800 dark:border-gray-700 dark:bg-white/[0.03] dark:text-white/90"
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">
                  Reminder email body
                </span>
                <textarea
                  value={reminderEmailBody}
                  onChange={(e) => setReminderEmailBody(e.target.value)}
                  rows={6}
                  className="w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2 text-theme-sm text-gray-800 dark:border-gray-700 dark:bg-white/[0.03] dark:text-white/90"
                />
              </label>

              <label className="block sm:col-span-2">
                <span className="mb-1 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">
                  Delete-warning email subject
                </span>
                <input
                  type="text"
                  value={deleteWarningEmailSubject}
                  onChange={(e) => setDeleteWarningEmailSubject(e.target.value)}
                  className="h-10 w-full rounded-lg border border-gray-200 bg-transparent px-3 text-theme-sm text-gray-800 dark:border-gray-700 dark:bg-white/[0.03] dark:text-white/90"
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">
                  Delete-warning email body
                </span>
                <textarea
                  value={deleteWarningEmailBody}
                  onChange={(e) => setDeleteWarningEmailBody(e.target.value)}
                  rows={6}
                  className="w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2 text-theme-sm text-gray-800 dark:border-gray-700 dark:bg-white/[0.03] dark:text-white/90"
                />
              </label>
            </div>
          </div>

          <div className="sm:col-span-2 flex items-center justify-between gap-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-white/[0.03]">
            <div>
              <p className="text-theme-sm font-medium text-gray-800 dark:text-white/90">
                Auto automation
              </p>
              <p className="text-theme-xs text-gray-500 dark:text-gray-400">
                When enabled, the system emails inactive users/companies and deletes them if they remain inactive.
              </p>
            </div>
            <label className="inline-flex items-center gap-2 text-theme-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
              />
              Enabled
            </label>
          </div>

          <div className="sm:col-span-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-brand-500 px-4 py-2 text-theme-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save settings"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

