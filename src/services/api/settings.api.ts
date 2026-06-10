import { apiClient } from "./apiClient";
import { apiConfig } from "@/src/config/api.config";
import type { InactivitySettings } from "@/src/types/inactivity.types";

export type WebsiteSettings = {
  siteName: string;
  logoUrl: string | null;
  logoDarkUrl: string | null;
  faviconUrl: string | null;
};

function unwrap<T>(res: unknown): T {
  if (res && typeof res === "object" && "data" in res && (res as { data?: unknown }).data != null) {
    return (res as { data: T }).data;
  }
  return res as T;
}

export async function getWebsiteSettings(): Promise<WebsiteSettings> {
  const res = await apiClient.get<{ data?: WebsiteSettings } | WebsiteSettings>(
    apiConfig.superAdmin.websiteSettings,
  );
  return unwrap<WebsiteSettings>(res);
}

export async function updateWebsiteSettings(
  input: Partial<WebsiteSettings>,
): Promise<WebsiteSettings> {
  const res = await apiClient.patch<{ data?: WebsiteSettings } | WebsiteSettings>(
    apiConfig.superAdmin.websiteSettings,
    input,
  );
  return unwrap<WebsiteSettings>(res);
}

/** Public branding (no auth) used to render logo/favicon across the app. */
export async function getPublicBranding(): Promise<WebsiteSettings> {
  const res = await fetch(apiConfig.publicBranding, { credentials: "include" });
  if (!res.ok) {
    throw new Error("Failed to load branding");
  }
  const body = (await res.json().catch(() => ({}))) as
    | { data?: WebsiteSettings }
    | WebsiteSettings;
  return unwrap<WebsiteSettings>(body);
}

export async function getInactivitySettings(): Promise<InactivitySettings> {
  const res = await apiClient.get<{ data?: InactivitySettings } | InactivitySettings>(
    apiConfig.superAdmin.inactivitySettings,
  );
  if (res && typeof res === "object" && "data" in res && res.data) {
    return res.data;
  }
  return res as InactivitySettings;
}

export async function updateInactivitySettings(
  input: Partial<InactivitySettings>,
): Promise<InactivitySettings> {
  const res = await apiClient.patch<{
    data?: InactivitySettings;
  } | InactivitySettings>(apiConfig.superAdmin.inactivitySettings, input);
  if (
    res &&
    typeof res === "object" &&
    "data" in res &&
    (res as any).data != null
  ) {
    return (res as any).data as InactivitySettings;
  }
  return res as InactivitySettings;
}

