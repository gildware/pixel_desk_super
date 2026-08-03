import { apiClient } from "./apiClient";
import { apiConfig } from "@/src/config/api.config";
import type { PlatformBlogPostRow } from "@/src/types/platformBlog.types";

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

export async function listPlatformBlogPosts(): Promise<PlatformBlogPostRow[]> {
  const res = await apiClient.get<unknown>(
    apiConfig.superAdmin.platformBlogPosts,
  );
  return unwrap<PlatformBlogPostRow[]>(res);
}

export async function createPlatformBlogPost(body: {
  category: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
  imageUrl?: string | null;
  coverImageUrl?: string | null;
  slug?: string;
  isActive?: boolean;
  sortOrder?: number;
}): Promise<PlatformBlogPostRow> {
  const res = await apiClient.post<unknown>(
    apiConfig.superAdmin.platformBlogPosts,
    body,
  );
  return unwrap<PlatformBlogPostRow>(res);
}

export async function updatePlatformBlogPost(
  id: string,
  body: Partial<
    Pick<
      PlatformBlogPostRow,
      | "category"
      | "title"
      | "slug"
      | "shortDescription"
      | "fullDescription"
      | "imageUrl"
      | "coverImageUrl"
      | "isActive"
      | "sortOrder"
    >
  >,
): Promise<PlatformBlogPostRow> {
  const res = await apiClient.patch<unknown>(
    apiConfig.superAdmin.platformBlogPost(id),
    body,
  );
  return unwrap<PlatformBlogPostRow>(res);
}

export async function deletePlatformBlogPost(id: string): Promise<void> {
  await apiClient.delete(apiConfig.superAdmin.platformBlogPost(id));
}
