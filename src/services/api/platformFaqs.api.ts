import { apiClient } from "./apiClient";
import { apiConfig } from "@/src/config/api.config";
import type { PlatformFaqRow } from "@/src/types/platformFaqs.types";

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

export async function listPlatformFaqs(): Promise<PlatformFaqRow[]> {
  const res = await apiClient.get<unknown>(apiConfig.superAdmin.platformFaqs);
  return unwrap<PlatformFaqRow[]>(res);
}

export async function createPlatformFaq(body: {
  category: string;
  question: string;
  answer: string;
  isActive?: boolean;
  sortOrder?: number;
}): Promise<PlatformFaqRow> {
  const res = await apiClient.post<unknown>(
    apiConfig.superAdmin.platformFaqs,
    body,
  );
  return unwrap<PlatformFaqRow>(res);
}

export async function updatePlatformFaq(
  id: string,
  body: Partial<
    Pick<
      PlatformFaqRow,
      "category" | "question" | "answer" | "isActive" | "sortOrder"
    >
  >,
): Promise<PlatformFaqRow> {
  const res = await apiClient.patch<unknown>(
    apiConfig.superAdmin.platformFaq(id),
    body,
  );
  return unwrap<PlatformFaqRow>(res);
}

export async function deletePlatformFaq(id: string): Promise<void> {
  await apiClient.delete(apiConfig.superAdmin.platformFaq(id));
}
