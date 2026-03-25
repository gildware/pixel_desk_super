import { apiClient } from "./apiClient";
import { apiConfig } from "@/src/config/api.config";
import type { InactivitySettings } from "@/src/types/inactivity.types";

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

