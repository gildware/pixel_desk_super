"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  fetchEmailTemplateBundle,
  patchEmailSettings,
  postEmailTemplatePreview,
  type EmailBranding,
  type EmailTemplateBundle,
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

const BRANDING_HTML_VARIABLES = [
  "{{accentColor}}",
  "{{logoUrl}}",
  "{{logoBlock}}",
  "{{headerTitleBlock}}",
  "{{subtitleRow}}",
  "{{headerTitle}}",
  "{{headerSubtitle}}",
  "{{footerText}}",
  "{{footerTextHtml}}",
  "{{year}}",
] as const;

const inputClass =
  "h-10 w-full rounded-lg border border-gray-200 bg-transparent px-3 text-theme-sm text-gray-800 dark:border-gray-700 dark:bg-white/[0.03] dark:text-white/90";
const textareaClass =
  "w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2 text-theme-sm text-gray-800 dark:border-gray-700 dark:bg-white/[0.03] dark:text-white/90";

function isTabId(v: string | null): v is PlatformEmailTemplateKey {
  return v != null && (TAB_ORDER as string[]).includes(v);
}

type EmailConfigStep = "message" | "appearance" | "advanced";

const STEP_TABS: { id: EmailConfigStep; label: string }[] = [
  { id: "message", label: "Message" },
  { id: "appearance", label: "Appearance" },
  { id: "advanced", label: "Advanced HTML" },
];

function isStepId(v: string | null): v is EmailConfigStep {
  return v === "message" || v === "appearance" || v === "advanced";
}

function isValidHex(v: string): boolean {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(v.trim());
}

export default function EmailConfigurationsPage() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<PlatformEmailTemplateKey>("otp");
  const [activeStep, setActiveStep] = useState<EmailConfigStep>("message");
  const [rows, setRows] = useState<EmailTemplateRow[]>([]);
  const [branding, setBranding] = useState<EmailBranding | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [savingLayout, setSavingLayout] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveFlash, setSaveFlash] = useState<string | null>(null);

  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [defaultBrandingHtml, setDefaultBrandingHtml] = useState<
    EmailTemplateBundle["defaultBrandingHtml"] | null
  >(null);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (isTabId(tab)) {
      setActiveTab(tab);
    }
    const step = searchParams.get("step");
    if (isStepId(step)) {
      setActiveStep(step);
    }
  }, [searchParams]);

  const applyBundle = useCallback((b: EmailTemplateBundle) => {
    setRows(b.templates);
    setBranding(b.branding);
    setDefaultBrandingHtml(b.defaultBrandingHtml);
  }, []);

  const flash = useCallback((msg: string) => {
    setSaveFlash(msg);
    window.setTimeout(() => setSaveFlash(null), 2800);
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

  const replaceQuery = useCallback(
    (mutate: (p: URLSearchParams) => void) => {
      const p = new URLSearchParams(searchParams.toString());
      mutate(p);
      const qs = p.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const handleStepChange = (step: EmailConfigStep) => {
    setActiveStep(step);
    replaceQuery((p) => {
      p.set("step", step);
      p.set("tab", activeTab);
    });
  };

  const handleTabChange = (tab: PlatformEmailTemplateKey) => {
    setActiveTab(tab);
    const r = rows.find((x) => x.key === tab);
    if (r) {
      setSubject(r.subject);
      setBody(r.body);
    }
    replaceQuery((p) => {
      p.set("tab", tab);
      p.set("step", activeStep);
    });
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
    if (!current || !branding || activeStep !== "message") return;
    const t = window.setTimeout(() => {
      void runPreview();
    }, 450);
    return () => window.clearTimeout(t);
  }, [runPreview, current, branding, activeStep]);

  const handleSaveTemplate = async () => {
    if (!current) return;
    setSavingTemplate(true);
    setError(null);
    try {
      const bundle = await patchEmailSettings({
        [activeTab]: { subject, body },
      });
      applyBundle(bundle);
      flash("Message template saved.");
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
      flash("Appearance saved.");
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
      {loading || !branding ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Transactional emails</h3>
          <p className="mt-3 text-theme-sm text-gray-500 dark:text-gray-400">Loading…</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Transactional emails</h3>
          <p className="mt-1 text-theme-sm text-gray-600 dark:text-gray-400">
            Choose a section below: edit message copy and preview, adjust shared branding, or edit raw
            header and footer HTML when you need full control.
          </p>

          {saveFlash && (
            <div
              className="mt-4 rounded-lg border border-success-200 bg-success-50 px-4 py-2 text-theme-sm text-success-800 dark:border-success-800 dark:bg-success-950 dark:text-success-200"
              role="status"
            >
              {saveFlash}
            </div>
          )}

          <div
            className="mt-5 flex flex-wrap gap-2 border-b border-gray-200 pb-3 dark:border-gray-800"
            role="tablist"
            aria-label="Email configuration sections"
          >
            {STEP_TABS.map((s) => (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={activeStep === s.id}
                onClick={() => handleStepChange(s.id)}
                className={`rounded-lg px-3 py-1.5 text-theme-sm font-medium transition-colors ${
                  activeStep === s.id
                    ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {error && (
            <div className="mt-4 rounded-lg border border-error-200 bg-error-50 px-4 py-2 text-theme-sm text-error-700 dark:border-error-800 dark:bg-error-950 dark:text-error-400">
              {error}
            </div>
          )}

          {activeStep === "message" && (
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div>
                <h4 className="text-base font-semibold text-gray-800 dark:text-white/90">Subject & body</h4>
                <p className="mb-4 text-theme-xs text-gray-500 dark:text-gray-400">
                  Pick an email type (OTP, invite, …), edit subject and body, then save. Save applies only
                  to the selected type.
                </p>

                <div className="mb-4 flex flex-wrap gap-2 border-b border-gray-200 pb-3 dark:border-gray-800">
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
                    <p className="text-theme-sm text-gray-600 dark:text-gray-400">{current.description}</p>

                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-white/[0.03]">
                      <p className="mb-2 text-theme-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">
                        Placeholders for this message
                      </p>
                      <p className="mb-2 text-theme-xs text-gray-500 dark:text-gray-400">
                        Copy these exactly into subject or body. They are replaced when the email is sent.
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
                        Subject line
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
                        Plain text is safest; if you use HTML, you are responsible for valid markup. Line breaks
                        in plain text are preserved.
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
                        {savingTemplate ? "Saving…" : "Save this message"}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="lg:sticky lg:top-4 lg:self-start">
                <p className="mb-1 text-theme-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Live preview
                </p>
                <h4 className="text-base font-semibold text-gray-800 dark:text-white/90">How it will look</h4>
                <p className="mb-3 text-theme-xs text-gray-500 dark:text-gray-400">
                  Updates as you type. Sample values stand in for real OTPs and links. Saving is not required to
                  preview.
                </p>
                {previewLoading && (
                  <p className="mb-2 text-theme-xs text-gray-500 dark:text-gray-400">Updating preview…</p>
                )}
                {previewError && (
                  <p className="mb-2 text-theme-xs text-error-600 dark:text-error-400">{previewError}</p>
                )}
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-950">
                  {previewHtml ? (
                    <iframe
                      title="Email preview"
                      sandbox=""
                      className="h-[min(560px,65vh)] w-full bg-white"
                      srcDoc={previewHtml}
                    />
                  ) : (
                    <div className="flex h-[min(240px,35vh)] items-center justify-center text-theme-sm text-gray-500 dark:text-gray-400">
                      {previewLoading ? "Generating…" : "Preview appears after load."}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeStep === "appearance" && (
            <div className="mt-6 space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h4 className="text-base font-semibold text-gray-800 dark:text-white/90">
                    Logo, colors & footer line
                  </h4>
                  <p className="mt-1 max-w-3xl text-theme-xs text-gray-500 dark:text-gray-400">
                    These values drive the branded frame around every transactional email and fill
                    placeholders like{" "}
                    <span className="font-mono text-gray-700 dark:text-gray-300">{"{{headerTitle}}"}</span> in
                    the header and footer HTML. Logo must be an{" "}
                    <strong className="font-medium text-gray-700 dark:text-gray-300">https</strong> URL.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void handleSaveLayout()}
                  disabled={savingLayout}
                  className="shrink-0 rounded-lg bg-gray-900 px-4 py-2 text-theme-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
                >
                  {savingLayout ? "Saving…" : "Save appearance"}
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
                      Wrap emails in the branded frame
                    </span>
                    <span className="text-theme-xs text-gray-500 dark:text-gray-400">
                      When off, only your message body is sent (no card, header bar, or footer block).
                    </span>
                  </span>
                </label>

                <div>
                  <span className="mb-1 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">
                    Logo URL
                  </span>
                  <input
                    type="url"
                    placeholder="https://…"
                    value={branding.logoUrl ?? ""}
                    onChange={(e) =>
                      updateBranding("logoUrl", e.target.value.trim() === "" ? null : e.target.value)
                    }
                    className={inputClass}
                  />
                </div>

                <div>
                  <span className="mb-1 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">
                    Title in header
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
                    Subtitle in header
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
                    Footer line (plain)
                  </span>
                  <textarea
                    value={branding.footerText}
                    onChange={(e) => updateBranding("footerText", e.target.value)}
                    rows={3}
                    className={textareaClass}
                  />
                  <p className="mt-1 text-theme-xs text-gray-500 dark:text-gray-400">
                    Shown in the text-only copy of the email and inside the HTML footer via placeholders.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeStep === "advanced" && (
            <div className="mt-6 space-y-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h4 className="text-base font-semibold text-gray-800 dark:text-white/90">
                    Header & footer HTML
                  </h4>
                  <p className="mt-1 max-w-3xl text-theme-xs text-gray-500 dark:text-gray-400">
                    Optional: change table structure or styles. Defaults match PixelDesk’s standard layout; use
                    restore links to revert. After edits, save so production emails pick up your changes.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void handleSaveLayout()}
                  disabled={savingLayout}
                  className="shrink-0 rounded-lg bg-gray-900 px-4 py-2 text-theme-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
                >
                  {savingLayout ? "Saving…" : "Save appearance"}
                </button>
              </div>

              <details className="rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-white/[0.03]">
                <summary className="cursor-pointer px-3 py-2 text-theme-sm font-medium text-gray-800 dark:text-white/90">
                  Layout placeholder reference
                </summary>
                <div className="border-t border-gray-100 px-3 py-3 dark:border-gray-800">
                  <p className="mb-2 text-theme-xs text-gray-500 dark:text-gray-400">
                    Use in header and footer HTML only. Message-specific placeholders are listed on the
                    Message tab.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {BRANDING_HTML_VARIABLES.map((v) => (
                      <span
                        key={v}
                        className="rounded bg-gray-100 px-2 py-0.5 font-mono text-theme-xs text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                      >
                        {v}
                      </span>
                    ))}
                  </div>
                </div>
              </details>

              <div>
                <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-theme-sm font-medium text-gray-800 dark:text-white/90">
                    Header HTML
                  </span>
                  <button
                    type="button"
                    className="text-left text-theme-xs font-medium text-brand-600 hover:underline dark:text-brand-400 sm:text-right"
                    onClick={() => {
                      if (!defaultBrandingHtml) return;
                      updateBranding("headerHtml", defaultBrandingHtml.headerHtml);
                    }}
                  >
                    Restore PixelDesk default header
                  </button>
                </div>
                <textarea
                  value={branding.headerHtml}
                  onChange={(e) => updateBranding("headerHtml", e.target.value)}
                  rows={9}
                  className={`${textareaClass} font-mono text-theme-xs`}
                  spellCheck={false}
                />
              </div>

              <div>
                <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-theme-sm font-medium text-gray-800 dark:text-white/90">
                    Footer HTML
                  </span>
                  <button
                    type="button"
                    className="text-left text-theme-xs font-medium text-brand-600 hover:underline dark:text-brand-400 sm:text-right"
                    onClick={() => {
                      if (!defaultBrandingHtml) return;
                      updateBranding("footerHtml", defaultBrandingHtml.footerHtml);
                    }}
                  >
                    Restore PixelDesk default footer
                  </button>
                </div>
                <textarea
                  value={branding.footerHtml}
                  onChange={(e) => updateBranding("footerHtml", e.target.value)}
                  rows={7}
                  className={`${textareaClass} font-mono text-theme-xs`}
                  spellCheck={false}
                />
              </div>

              <div className="flex justify-end border-t border-gray-100 pt-4 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => void handleSaveLayout()}
                  disabled={savingLayout}
                  className="rounded-lg bg-gray-900 px-4 py-2 text-theme-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
                >
                  {savingLayout ? "Saving…" : "Save appearance"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
