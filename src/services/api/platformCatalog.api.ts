import { apiClient } from "./apiClient";
import { apiConfig } from "@/src/config/api.config";
import type {
  PlatformDashboardUseAdminRow,
  PlatformIndustryAdminRow,
  PlatformIndustryProjectTypeRow,
  PlatformSkillAdminRow,
  PlatformSkillCategoryAdminRow,
} from "@/src/types/platformCatalog.types";

function unwrap<T>(res: unknown): T {
  if (res && typeof res === "object" && "data" in res && (res as { data?: T }).data !== undefined) {
    return (res as { data: T }).data;
  }
  return res as T;
}

export async function listPlatformIndustriesAdmin(): Promise<PlatformIndustryAdminRow[]> {
  const res = await apiClient.get<unknown>(apiConfig.superAdmin.platformCatalogIndustries);
  return unwrap<PlatformIndustryAdminRow[]>(res);
}

export async function createPlatformIndustryAdmin(body: {
  label: string;
  value: string;
  sortOrder?: number;
  isActive?: boolean;
}): Promise<PlatformIndustryAdminRow> {
  const res = await apiClient.post<unknown>(apiConfig.superAdmin.platformCatalogIndustries, body);
  return unwrap<PlatformIndustryAdminRow>(res);
}

export async function updatePlatformIndustryAdmin(
  id: string,
  body: Partial<Pick<PlatformIndustryAdminRow, "label" | "value" | "sortOrder" | "isActive">>,
): Promise<PlatformIndustryAdminRow> {
  const res = await apiClient.patch<unknown>(apiConfig.superAdmin.platformCatalogIndustry(id), body);
  return unwrap<PlatformIndustryAdminRow>(res);
}

export async function deletePlatformIndustryAdmin(id: string): Promise<void> {
  await apiClient.delete(apiConfig.superAdmin.platformCatalogIndustry(id));
}

export async function createIndustryProjectTypeAdmin(
  industryId: string,
  body: { label: string; placeholder: string; sortOrder?: number },
): Promise<PlatformIndustryProjectTypeRow> {
  const res = await apiClient.post<unknown>(
    apiConfig.superAdmin.platformCatalogIndustryProjectTypes(industryId),
    body,
  );
  return unwrap<PlatformIndustryProjectTypeRow>(res);
}

export async function updateIndustryProjectTypeAdmin(
  id: string,
  body: Partial<
    Pick<PlatformIndustryProjectTypeRow, "label" | "projectType" | "placeholder" | "sortOrder">
  >,
): Promise<PlatformIndustryProjectTypeRow> {
  const res = await apiClient.patch<unknown>(
    apiConfig.superAdmin.platformCatalogIndustryProjectType(id),
    body,
  );
  return unwrap<PlatformIndustryProjectTypeRow>(res);
}

export async function deleteIndustryProjectTypeAdmin(id: string): Promise<void> {
  await apiClient.delete(apiConfig.superAdmin.platformCatalogIndustryProjectType(id));
}

export async function listPlatformDashboardUsesAdmin(): Promise<PlatformDashboardUseAdminRow[]> {
  const res = await apiClient.get<unknown>(apiConfig.superAdmin.platformCatalogDashboardUses);
  return unwrap<PlatformDashboardUseAdminRow[]>(res);
}

export async function createPlatformDashboardUseAdmin(body: {
  label: string;
  value: string;
  sortOrder?: number;
  isActive?: boolean;
}): Promise<PlatformDashboardUseAdminRow> {
  const res = await apiClient.post<unknown>(apiConfig.superAdmin.platformCatalogDashboardUses, body);
  return unwrap<PlatformDashboardUseAdminRow>(res);
}

export async function updatePlatformDashboardUseAdmin(
  id: string,
  body: Partial<
    Pick<PlatformDashboardUseAdminRow, "label" | "value" | "sortOrder" | "isActive">
  >,
): Promise<PlatformDashboardUseAdminRow> {
  const res = await apiClient.patch<unknown>(
    apiConfig.superAdmin.platformCatalogDashboardUse(id),
    body,
  );
  return unwrap<PlatformDashboardUseAdminRow>(res);
}

export async function deletePlatformDashboardUseAdmin(id: string): Promise<void> {
  await apiClient.delete(apiConfig.superAdmin.platformCatalogDashboardUse(id));
}

export async function listPlatformSkillCategoriesAdmin(): Promise<PlatformSkillCategoryAdminRow[]> {
  const res = await apiClient.get<unknown>(apiConfig.superAdmin.platformCatalogSkillCategories);
  return unwrap<PlatformSkillCategoryAdminRow[]>(res);
}

export async function createPlatformSkillCategoryAdmin(body: {
  name: string;
  sortOrder?: number;
  isActive?: boolean;
}): Promise<PlatformSkillCategoryAdminRow> {
  const res = await apiClient.post<unknown>(apiConfig.superAdmin.platformCatalogSkillCategories, body);
  return unwrap<PlatformSkillCategoryAdminRow>(res);
}

export async function updatePlatformSkillCategoryAdmin(
  id: string,
  body: Partial<Pick<PlatformSkillCategoryAdminRow, "name" | "sortOrder" | "isActive">>,
): Promise<PlatformSkillCategoryAdminRow> {
  const res = await apiClient.patch<unknown>(
    apiConfig.superAdmin.platformCatalogSkillCategory(id),
    body,
  );
  return unwrap<PlatformSkillCategoryAdminRow>(res);
}

export async function deletePlatformSkillCategoryAdmin(id: string): Promise<void> {
  await apiClient.delete(apiConfig.superAdmin.platformCatalogSkillCategory(id));
}

export async function createPlatformSkillAdmin(
  categoryId: string,
  body: { name: string; sortOrder?: number; isActive?: boolean },
): Promise<PlatformSkillAdminRow> {
  const res = await apiClient.post<unknown>(
    apiConfig.superAdmin.platformCatalogCategorySkills(categoryId),
    body,
  );
  return unwrap<PlatformSkillAdminRow>(res);
}

export async function updatePlatformSkillAdmin(
  id: string,
  body: Partial<Pick<PlatformSkillAdminRow, "name" | "sortOrder" | "isActive">>,
): Promise<PlatformSkillAdminRow> {
  const res = await apiClient.patch<unknown>(apiConfig.superAdmin.platformCatalogSkill(id), body);
  return unwrap<PlatformSkillAdminRow>(res);
}

export async function deletePlatformSkillAdmin(id: string): Promise<void> {
  await apiClient.delete(apiConfig.superAdmin.platformCatalogSkill(id));
}
