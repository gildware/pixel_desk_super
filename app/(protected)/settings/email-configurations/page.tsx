"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  fetchEmailTemplateBundle,
  patchEmailSettings,
  postEmailTemplatePreview,
  type EmailBranding,
  type EmailTemplateRow,
  type PlatformEmailTemplateKey,
} from "@/src/services/api/emailTemplates.api";

const TAB_ORDER: PlatformEmailTemplateKey[] = [
  "otp",
  "resend_otp",
  "member_invite",
  "client_invite",
];

const TAB_LABEL: Record<PlatformEmailTemplateKey, string> = {
  otp: "OTP",
  resend_otp: "Resend OTP",
  member_invite: "Member invite",
  client_invite: "Client invite",
};

const inputClass =
  "h-10 w-full rounded-lg border border-gray-200 bg-transparent px-3 text-theme-sm text-gray-800 dark:border-gray-700 dark:bg-white/[0.03] dark:text-white/90";
const textareaClass =
  "w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2 text-theme-sm text-gray-800 dark:border-gray-700 dark:bg-white/[0.03] dark:text-white/90";

function isTabId(v: string | null): v is PlatformEmailTemplateKey {
  return v != null && (TAB_ORDER as string[]).includes(v);
}

function isValidHex(v: string): boolean {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(v.trim());
}

export default function EmailConfigurationsPage() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<PlatformEmailTemplateKey>("otp");
  const [rows, setRows] = useState<EmailTemplateRow[]>([]);
  const [branding, setBranding] = useState<EmailBranding | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [savingLayout, setSavingLayout] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (isTabId(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const applyBundle = useCallback((b: { templates: EmailTemplateRow[]; branding: EmailBranding }) => {
    setRows(b.templates);
    setBranding(b.branding);
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchEmailTemplateBundle()
      .then((bundle) => {
        applyBundle(bundle);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load");
      })
      .finally(() => setLoading(false));
  }, [applyBundle]);

  const current = useMemo(
    () => rows.find((r) => r.key === activeTab),
    [rows, activeTab],
  );

  useEffect(() => {
    if (!current) return;
    setSubject(current.subject);
    setBody(current.body);
  }, [current?.key, current?.subject, current?.body]);

  const handleTabChange = (tab: PlatformEmailTemplateKey) => {
    setActiveTab(tab);
    const r = rows.find((x) => x.key === tab);
    if (r) {
      setSubject(r.subject);
      setBody(r.body);
    }
  };

  const runPreview = useCallback(async () => {
    if (!current || !branding) return;
    setPreviewLoading(true);
    setPreviewError(null);
    try {
      const prev = await postEmailTemplatePreview({
        templateKey: activeTab,
        subject,
        body,
        branding,
      });
      setPreviewHtml(prev.html);
    } catch (err) {
      setPreviewError(err instanceof Error ? err.message : "Preview failed");
    } finally {
      setPreviewLoading(false);
    }
  }, [activeTab, subject, body, branding, current]);

  useEffect(() => {
    if (!current || !branding) return;
    const t = window.setTimeout(() => {
      void runPreview();
    }, 450);
    return () => window.clearTimeout(t);
  }, [runPreview, current, branding]);

  const handleSaveTemplate = async () => {
    if (!current) return;
    setSavingTemplate(true);
    setError(null);
    try {
      const bundle = await patchEmailSettings({
        [activeTab]: { subject, body },
      });
      applyBundle(bundle);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleSaveLayout = async () => {
    if (!branding) return;
    setSavingLayout(true);
    setError(null);
    try {
      const bundle = await patchEmailSettings({ branding });
      applyBundle(bundle);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save layout");
    } finally {
      setSavingLayout(false);
    }
  };

  const updateBranding = <K extends keyof EmailBranding>(key: K, value: EmailBranding[K]) => {
    setBranding((b) => (b ? { ...b, [key]: value } : b));
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Email configurations
        </h3>
        <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
          Configure shared layout (logo, header, footer) for all platform emails, then edit each
          template’s subject and body. Placeholders are replaced when messages are sent.
        </p>
      </div>

      {loading || !branding ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-theme-sm text-gray-500 dark:text-gray-400">Loading…</p>
        </div>
      ) : (
        <>
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h4 className="text-base font-semibold text-gray-800 dark:text-white/90">
                  Layout & branding
                </h4>
                <p className="text-theme-xs text-gray-500 dark:text-gray-400">
                  Applied to OTP and invitation emails. Use an HTTPS URL for your logo.
                </p>
              </div>
              <button
                type="button"
                onClick={() => void handleSaveLayout()}
                disabled={savingLayout}
                className="shrink-0 rounded-lg bg-gray-900 px-4 py-2 text-theme-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
              >
                {savingLayout ? "Saving…" : "Save layout"}
              </button>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={branding.useBrandedLayout}
                  onChange={(e) => updateBranding("useBrandedLayout", e.target.checked)}
                />
                <span>
                  <span className="block text-theme-sm font-medium text-gray-800 dark:text-white/90">
                    Use branded layout
                  </span>
                  <span className="text-theme-xs text-gray-500 dark:text-gray-400">
                    Adds header bar, optional logo, card container, and footer to every email.
                  </span>
                </span>
              </label>

              <div>
                <span className="mb-1 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">
                  Logo URL (https)
                </span>
                <input
                  type="url"
                  placeholder="https://cdn.example.com/logo.png"
                  value={branding.logoUrl ?? ""}
                  onChange={(e) =>
                    updateBranding("logoUrl", e.target.value.trim() === "" ? null : e.target.value)
                  }
                  className={inputClass}
                />
              </div>

              <div>
                <span className="mb-1 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">
                  Header title
                </span>
                <input
                  type="text"
                  value={branding.headerTitle}
                  onChange={(e) => updateBranding("headerTitle", e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <span className="mb-1 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">
                  Header subtitle
                </span>
                <input
                  type="text"
                  value={branding.headerSubtitle ?? ""}
                  onChange={(e) =>
                    updateBranding(
                      "headerSubtitle",
                      e.target.value.trim() === "" ? null : e.target.value,
                    )
                  }
                  className={inputClass}
                />
              </div>

              <div className="lg:col-span-2">
                <span className="mb-1 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">
                  Accent color
                </span>
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    type="color"
                    value={isValidHex(branding.accentColor) ? branding.accentColor : "#4F46E5"}
                    onChange={(e) => updateBranding("accentColor", e.target.value)}
                    className="h-10 w-14 cursor-pointer rounded border border-gray-200 bg-transparent p-1 dark:border-gray-700"
                    title="Pick accent color"
                  />
                  <input
                    type="text"
                    value={branding.accentColor}
                    onChange={(e) => updateBranding("accentColor", e.target.value)}
                    className={`min-w-[8rem] flex-1 ${inputClass} font-mono text-theme-xs`}
                    spellCheck={false}
                  />
                </div>
              </div>

              <div className="lg:col-span-2">
                <span className="mb-1 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">
                  Footer text
                </span>
                <textarea
                  value={branding.footerText}
                  onChange={(e) => updateBranding("footerText", e.target.value)}
                  rows={3}
                  className={textareaClass}
                />
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
              <div className="mb-4 flex flex-wrap items-center gap-2 border-b border-gray-200 pb-3 dark:border-gray-800">
                {TAB_ORDER.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => handleTabChange(tab)}
                    className={`rounded-lg px-3 py-1.5 text-theme-sm font-medium transition-colors ${
                      activeTab === tab
                        ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
                    }`}
                  >
                    {TAB_LABEL[tab]}
                  </button>
                ))}
              </div>

              {!current ? (
                <p className="text-theme-sm text-gray-500 dark:text-gray-400">No template data.</p>
              ) : (
                <div className="space-y-4">
                  {error && (
                    <div className="rounded-lg border border-error-200 bg-error-50 px-4 py-2 text-theme-sm text-error-700 dark:border-error-800 dark:bg-error-950 dark:text-error-400">
                      {error}
                    </div>
                  )}

                  <p className="text-theme-sm text-gray-600 dark:text-gray-400">
                    {current.description}
                  </p>

                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-white/[0.03]">
                    <p className="mb-2 text-theme-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">
                      Variables
                    </p>
                    <ul className="flex flex-wrap gap-2">
                      {current.variables.map((v) => (
                        <li
                          key={v}
                          className="rounded-md bg-white px-2 py-1 font-mono text-theme-xs text-gray-800 shadow-sm dark:bg-gray-900 dark:text-gray-200"
                        >
                          {v}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <label className="block">
                    <span className="mb-1 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">
                      Subject
                    </span>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className={inputClass}
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">
                      Body
                    </span>
                    <p className="mb-1 text-theme-xs text-gray-500 dark:text-gray-400">
                      Plain text or HTML. Plain text lines are escaped safely; HTML is sent as you
                      write it.
                    </p>
                    <textarea
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      rows={12}
                      className={`${textareaClass} font-mono text-theme-xs`}
                    />
                  </label>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => void handleSaveTemplate()}
                      disabled={savingTemplate}
                      className="rounded-lg bg-brand-500 px-4 py-2 text-theme-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
                    >
                      {savingTemplate ? "Saving…" : "Save template"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h4 className="text-base font-semibold text-gray-800 dark:text-white/90">
                  Preview
                </h4>
                {previewLoading && (
                  <span className="text-theme-xs text-gray-500 dark:text-gray-400">Updating…</span>
                )}
              </div>
              <p className="mb-3 text-theme-xs text-gray-500 dark:text-gray-400">
                Sample data fills placeholders. Actual emails use real values when sent.
              </p>
              {previewError && (
                <p className="mb-2 text-theme-xs text-error-600 dark:text-error-400">{previewError}</p>
              )}
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-950">
                {previewHtml ? (
                  <iframe
                    title="Email preview"
                    sandbox=""
                    className="h-[min(640px,70vh)] w-full bg-white"
                    srcDoc={previewHtml}
                  />
                ) : (
                  <div className="flex h-[min(320px,40vh)] items-center justify-center text-theme-sm text-gray-500 dark:text-gray-400">
                    {previewLoading ? "Generating preview…" : "Preview will appear here."}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
