"use client";

import React, { useEffect, useState } from "react";
import SimpleImageUpload from "@/src/components/common/SimpleImageUpload";
import {
  getWebsiteSettings,
  updateWebsiteSettings,
} from "@/src/services/api/settings.api";
import { useBranding } from "@/src/context/BrandingContext";

type TabId = "appearance";

export default function WebsiteSettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("appearance");
  const { refetch: refetchBranding } = useBranding();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [siteName, setSiteName] = useState<string>("PixelDesk");
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [logoDarkUrl, setLogoDarkUrl] = useState<string>("");
  const [faviconUrl, setFaviconUrl] = useState<string>("");

  useEffect(() => {
    getWebsiteSettings()
      .then((s) => {
        setSiteName(s.siteName || "PixelDesk");
        setLogoUrl(s.logoUrl ?? "");
        setLogoDarkUrl(s.logoDarkUrl ?? "");
        setFaviconUrl(s.faviconUrl ?? "");
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load website settings");
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const updated = await updateWebsiteSettings({
        siteName,
        logoUrl: logoUrl || null,
        logoDarkUrl: logoDarkUrl || null,
        faviconUrl: faviconUrl || null,
      });
      setSiteName(updated.siteName || "PixelDesk");
      setLogoUrl(updated.logoUrl ?? "");
      setLogoDarkUrl(updated.logoDarkUrl ?? "");
      setFaviconUrl(updated.faviconUrl ?? "");
      setSuccess("Website settings saved.");
      await refetchBranding();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update website settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
      <div className="mb-5">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Website settings
        </h3>
        <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
          Branding used across the website, admin panel and super admin.
        </p>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-2 border-b border-gray-200 pb-3 dark:border-gray-800">
        <button
          type="button"
          onClick={() => setActiveTab("appearance")}
          className={`rounded-lg px-3 py-1.5 text-theme-sm font-medium transition-colors ${
            activeTab === "appearance"
              ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
          }`}
        >
          Appearance &amp; Logos
        </button>
      </div>

      {loading ? (
        <p className="text-theme-sm text-gray-500 dark:text-gray-400">Loading…</p>
      ) : (
        <div className="space-y-6">
          {error && (
            <div className="rounded-lg border border-error-200 bg-error-50 px-4 py-2 text-theme-sm text-error-700 dark:border-error-800 dark:bg-error-950 dark:text-error-400">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-lg border border-success-200 bg-success-50 px-4 py-2 text-theme-sm text-success-700 dark:border-success-800 dark:bg-success-950 dark:text-success-400">
              {success}
            </div>
          )}

          <label className="block max-w-md">
            <span className="mb-1 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">
              Site name
            </span>
            <input
              type="text"
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              maxLength={255}
              className="h-10 w-full rounded-lg border border-gray-200 bg-transparent px-3 text-theme-sm text-gray-800 dark:border-gray-700 dark:bg-white/[0.03] dark:text-white/90"
            />
            <span className="mt-1 block text-[11px] text-gray-500 dark:text-gray-400">
              Shown when no logo is available.
            </span>
          </label>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
              <p className="mb-3 text-theme-sm font-semibold text-gray-800 dark:text-white/90">
                Logo
              </p>
              <SimpleImageUpload
                label="Logo"
                hideLabel
                value={logoUrl}
                onChange={setLogoUrl}
                variant="preview"
                gridCols={3}
                gridRows={1}
                unitPx={80}
                hint="Used on light backgrounds. PNG or SVG recommended."
              />
            </div>

            <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
              <p className="mb-3 text-theme-sm font-semibold text-gray-800 dark:text-white/90">
                Logo (dark mode)
              </p>
              <SimpleImageUpload
                label="Logo dark"
                hideLabel
                value={logoDarkUrl}
                onChange={setLogoDarkUrl}
                variant="preview"
                gridCols={3}
                gridRows={1}
                unitPx={80}
                hint="Optional. Falls back to the main logo if empty."
              />
            </div>

            <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
              <p className="mb-3 text-theme-sm font-semibold text-gray-800 dark:text-white/90">
                Favicon
              </p>
              <SimpleImageUpload
                label="Favicon"
                hideLabel
                value={faviconUrl}
                onChange={setFaviconUrl}
                variant="icon"
                accept="image/png,image/svg+xml,image/x-icon,image/webp"
                gridCols={1}
                gridRows={1}
                unitPx={120}
                hint="Square. PNG or SVG, at least 64×64px."
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
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
