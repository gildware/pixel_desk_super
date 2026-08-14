import { apiClient } from "./apiClient";
import { apiConfig } from "@/src/config/api.config";
import type {
  PlatformVideoTutorialCategoryRow,
  PlatformVideoTutorialLessonRow,
} from "@/src/types/platformVideoTutorials.types";

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

export async function listPlatformVideoTutorials(): Promise<
  PlatformVideoTutorialCategoryRow[]
> {
  const res = await apiClient.get<unknown>(apiConfig.superAdmin.platformVideoTutorials);
  return unwrap<PlatformVideoTutorialCategoryRow[]>(res);
}

export async function createPlatformVideoTutorialCategory(body: {
  title: string;
  durationLabel?: string | null;
  defaultOpen?: boolean;
  sortOrder?: number;
  isActive?: boolean;
}): Promise<PlatformVideoTutorialCategoryRow> {
  const res = await apiClient.post<unknown>(
    apiConfig.superAdmin.platformVideoTutorialCategories,
    body,
  );
  return unwrap<PlatformVideoTutorialCategoryRow>(res);
}

export async function updatePlatformVideoTutorialCategory(
  id: string,
  body: Partial<
    Pick<
      PlatformVideoTutorialCategoryRow,
      "title" | "durationLabel" | "defaultOpen" | "sortOrder" | "isActive"
    >
  >,
): Promise<PlatformVideoTutorialCategoryRow> {
  const res = await apiClient.patch<unknown>(
    apiConfig.superAdmin.platformVideoTutorialCategory(id),
    body,
  );
  return unwrap<PlatformVideoTutorialCategoryRow>(res);
}

export async function deletePlatformVideoTutorialCategory(id: string): Promise<void> {
  await apiClient.delete(apiConfig.superAdmin.platformVideoTutorialCategory(id));
}

export async function createPlatformVideoTutorialLesson(
  categoryId: string,
  body: {
    title: string;
    duration?: string;
    description?: string[];
    videoUrl?: string | null;
    isDefault?: boolean;
    sortOrder?: number;
    isActive?: boolean;
  },
): Promise<PlatformVideoTutorialLessonRow> {
  const res = await apiClient.post<unknown>(
    apiConfig.superAdmin.platformVideoTutorialCategoryLessons(categoryId),
    body,
  );
  return unwrap<PlatformVideoTutorialLessonRow>(res);
}

export async function updatePlatformVideoTutorialLesson(
  id: string,
  body: Partial<
    Pick<
      PlatformVideoTutorialLessonRow,
      | "categoryId"
      | "title"
      | "duration"
      | "description"
      | "videoUrl"
      | "isDefault"
      | "sortOrder"
      | "isActive"
    >
  >,
): Promise<PlatformVideoTutorialLessonRow> {
  const res = await apiClient.patch<unknown>(
    apiConfig.superAdmin.platformVideoTutorialLesson(id),
    body,
  );
  return unwrap<PlatformVideoTutorialLessonRow>(res);
}

export async function deletePlatformVideoTutorialLesson(id: string): Promise<void> {
  await apiClient.delete(apiConfig.superAdmin.platformVideoTutorialLesson(id));
}
