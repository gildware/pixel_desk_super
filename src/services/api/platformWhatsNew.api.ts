import { apiClient } from "./apiClient";
import { apiConfig } from "@/src/config/api.config";
import type { PlatformWhatsNewRow } from "@/src/types/platformWhatsNew.types";

function unwrap<T>(res: unknown): T {
  if (
    res &&
    typeof res === "object" &&
    "data" in res &&
    (res as { data?: T }).data !== undefined
  ) {
    return (res as { data: T }).data;
  }
  return res as T;
}

export async function listPlatformWhatsNewUpdates(): Promise<PlatformWhatsNewRow[]> {
  const res = await apiClient.get<unknown>(
    apiConfig.superAdmin.platformWhatsNewUpdates,
  );
  return unwrap<PlatformWhatsNewRow[]>(res);
}

export async function createPlatformWhatsNewUpdate(body: {
  title: string;
  body: string;
  publishedAt: string;
  isActive?: boolean;
  sortOrder?: number;
}): Promise<PlatformWhatsNewRow> {
  const res = await apiClient.post<unknown>(
    apiConfig.superAdmin.platformWhatsNewUpdates,
    body,
  );
  return unwrap<PlatformWhatsNewRow>(res);
}

export async function updatePlatformWhatsNewUpdate(
  id: string,
  body: Partial<
    Pick<
      PlatformWhatsNewRow,
      "title" | "body" | "publishedAt" | "isActive" | "sortOrder"
    >
  >,
): Promise<PlatformWhatsNewRow> {
  const res = await apiClient.patch<unknown>(
    apiConfig.superAdmin.platformWhatsNewUpdate(id),
    body,
  );
  return unwrap<PlatformWhatsNewRow>(res);
}

export async function deletePlatformWhatsNewUpdate(id: string): Promise<void> {
  await apiClient.delete(apiConfig.superAdmin.platformWhatsNewUpdate(id));
}
