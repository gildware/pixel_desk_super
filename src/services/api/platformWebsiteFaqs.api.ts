import { apiClient } from "./apiClient";
import { apiConfig } from "@/src/config/api.config";
import type { PlatformWebsiteFaqRow } from "@/src/types/platformWebsiteFaqs.types";

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

export async function listPlatformWebsiteFaqs(): Promise<PlatformWebsiteFaqRow[]> {
  const res = await apiClient.get<unknown>(apiConfig.superAdmin.platformWebsiteFaqs);
  return unwrap<PlatformWebsiteFaqRow[]>(res);
}

export async function createPlatformWebsiteFaq(body: {
  category: string;
  question: string;
  answer: string;
  isActive?: boolean;
  sortOrder?: number;
}): Promise<PlatformWebsiteFaqRow> {
  const res = await apiClient.post<unknown>(
    apiConfig.superAdmin.platformWebsiteFaqs,
    body,
  );
  return unwrap<PlatformWebsiteFaqRow>(res);
}

export async function updatePlatformWebsiteFaq(
  id: string,
  body: Partial<
    Pick<
      PlatformWebsiteFaqRow,
      | "category"
      | "question"
      | "answer"
      | "isActive"
      | "sortOrder"
      | "categorySortOrder"
    >
  >,
): Promise<PlatformWebsiteFaqRow> {
  const res = await apiClient.patch<unknown>(
    apiConfig.superAdmin.platformWebsiteFaq(id),
    body,
  );
  return unwrap<PlatformWebsiteFaqRow>(res);
}

export async function deletePlatformWebsiteFaq(id: string): Promise<void> {
  await apiClient.delete(apiConfig.superAdmin.platformWebsiteFaq(id));
}
