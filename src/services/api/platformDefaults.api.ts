import { apiClient } from "./apiClient";
import { apiConfig } from "@/src/config/api.config";
import type {
  PlatformBootstrap,
  PlatformDefaultLeaveTypeRow,
  PlatformDefaultRow,
  PlatformDefaultsOverview,
} from "@/src/types/platformDefaults.types";

function unwrap<T>(res: unknown): T {
  if (res && typeof res === "object" && "data" in res && (res as { data?: T }).data !== undefined) {
    return (res as { data: T }).data;
  }
  return res as T;
}

export async function fetchPlatformDefaultsOverview(): Promise<PlatformDefaultsOverview> {
  const res = await apiClient.get<unknown>(apiConfig.superAdmin.platformDefaultsOverview);
  return unwrap<PlatformDefaultsOverview>(res);
}

export async function fetchPlatformBootstrap(): Promise<PlatformBootstrap> {
  const res = await apiClient.get<unknown>(apiConfig.superAdmin.platformDefaultsBootstrap);
  return unwrap<PlatformBootstrap>(res);
}

export async function patchPlatformBootstrap(
  body: Partial<
    Pick<
      PlatformBootstrap,
      | "autoProjectId"
      | "projectPrefix"
      | "projectIdCounter"
      | "autoEmployeeId"
      | "employeePrefix"
      | "employeeIdCounter"
      | "autoClientId"
      | "clientPrefix"
      | "clientIdCounter"
      | "defaultWeekendDays"
      | "defaultContractModels"
    >
  >,
): Promise<PlatformBootstrap> {
  const res = await apiClient.patch<unknown>(apiConfig.superAdmin.platformDefaultsBootstrap, body);
  return unwrap<PlatformBootstrap>(res);
}

export async function listPlatformDepartments(): Promise<PlatformDefaultRow[]> {
  const res = await apiClient.get<unknown>(apiConfig.superAdmin.platformDefaultDepartments);
  return unwrap<PlatformDefaultRow[]>(res);
}

export async function createPlatformDepartment(body: {
  name: string;
  description?: string;
  isActive?: boolean;
  sortOrder?: number;
}): Promise<PlatformDefaultRow> {
  const res = await apiClient.post<unknown>(apiConfig.superAdmin.platformDefaultDepartments, body);
  return unwrap<PlatformDefaultRow>(res);
}

export async function updatePlatformDepartment(
  id: string,
  body: Partial<Pick<PlatformDefaultRow, "name" | "description" | "isActive" | "sortOrder">>,
): Promise<PlatformDefaultRow> {
  const res = await apiClient.patch<unknown>(
    apiConfig.superAdmin.platformDefaultDepartment(id),
    body,
  );
  return unwrap<PlatformDefaultRow>(res);
}

export async function deletePlatformDepartment(id: string): Promise<void> {
  await apiClient.delete(apiConfig.superAdmin.platformDefaultDepartment(id));
}

export async function listPlatformDesignations(): Promise<PlatformDefaultRow[]> {
  const res = await apiClient.get<unknown>(apiConfig.superAdmin.platformDefaultDesignations);
  return unwrap<PlatformDefaultRow[]>(res);
}

export async function createPlatformDesignation(body: {
  name: string;
  description?: string;
  isActive?: boolean;
  sortOrder?: number;
}): Promise<PlatformDefaultRow> {
  const res = await apiClient.post<unknown>(apiConfig.superAdmin.platformDefaultDesignations, body);
  return unwrap<PlatformDefaultRow>(res);
}

export async function updatePlatformDesignation(
  id: string,
  body: Partial<Pick<PlatformDefaultRow, "name" | "description" | "isActive" | "sortOrder">>,
): Promise<PlatformDefaultRow> {
  const res = await apiClient.patch<unknown>(
    apiConfig.superAdmin.platformDefaultDesignation(id),
    body,
  );
  return unwrap<PlatformDefaultRow>(res);
}

export async function deletePlatformDesignation(id: string): Promise<void> {
  await apiClient.delete(apiConfig.superAdmin.platformDefaultDesignation(id));
}

export async function listPlatformEmployeeCategories(): Promise<PlatformDefaultRow[]> {
  const res = await apiClient.get<unknown>(apiConfig.superAdmin.platformDefaultEmployeeCategories);
  return unwrap<PlatformDefaultRow[]>(res);
}

export async function createPlatformEmployeeCategory(body: {
  name: string;
  description?: string | null;
  isActive?: boolean;
  sortOrder?: number;
}): Promise<PlatformDefaultRow> {
  const res = await apiClient.post<unknown>(
    apiConfig.superAdmin.platformDefaultEmployeeCategories,
    body,
  );
  return unwrap<PlatformDefaultRow>(res);
}

export async function updatePlatformEmployeeCategory(
  id: string,
  body: Partial<Pick<PlatformDefaultRow, "name" | "description" | "isActive" | "sortOrder">>,
): Promise<PlatformDefaultRow> {
  const res = await apiClient.patch<unknown>(
    apiConfig.superAdmin.platformDefaultEmployeeCategory(id),
    body,
  );
  return unwrap<PlatformDefaultRow>(res);
}

export async function deletePlatformEmployeeCategory(id: string): Promise<void> {
  await apiClient.delete(apiConfig.superAdmin.platformDefaultEmployeeCategory(id));
}

export async function listPlatformActivityTypes(): Promise<PlatformDefaultRow[]> {
  const res = await apiClient.get<unknown>(apiConfig.superAdmin.platformDefaultActivityTypes);
  return unwrap<PlatformDefaultRow[]>(res);
}

export async function createPlatformActivityType(body: {
  name: string;
  description?: string | null;
  isActive?: boolean;
  sortOrder?: number;
}): Promise<PlatformDefaultRow> {
  const res = await apiClient.post<unknown>(apiConfig.superAdmin.platformDefaultActivityTypes, body);
  return unwrap<PlatformDefaultRow>(res);
}

export async function updatePlatformActivityType(
  id: string,
  body: Partial<Pick<PlatformDefaultRow, "name" | "description" | "isActive" | "sortOrder">>,
): Promise<PlatformDefaultRow> {
  const res = await apiClient.patch<unknown>(
    apiConfig.superAdmin.platformDefaultActivityType(id),
    body,
  );
  return unwrap<PlatformDefaultRow>(res);
}

export async function deletePlatformActivityType(id: string): Promise<void> {
  await apiClient.delete(apiConfig.superAdmin.platformDefaultActivityType(id));
}

export async function listPlatformLeaveTypes(): Promise<PlatformDefaultLeaveTypeRow[]> {
  const res = await apiClient.get<unknown>(apiConfig.superAdmin.platformDefaultLeaveTypes);
  return unwrap<PlatformDefaultLeaveTypeRow[]>(res);
}

export async function createPlatformLeaveType(body: {
  name: string;
  shortName: string;
  description?: string | null;
  isActive?: boolean;
  sortOrder?: number;
}): Promise<PlatformDefaultLeaveTypeRow> {
  const res = await apiClient.post<unknown>(apiConfig.superAdmin.platformDefaultLeaveTypes, body);
  return unwrap<PlatformDefaultLeaveTypeRow>(res);
}

export async function updatePlatformLeaveType(
  id: string,
  body: Partial<
    Pick<PlatformDefaultLeaveTypeRow, "name" | "shortName" | "description" | "isActive" | "sortOrder">
  >,
): Promise<PlatformDefaultLeaveTypeRow> {
  const res = await apiClient.patch<unknown>(
    apiConfig.superAdmin.platformDefaultLeaveType(id),
    body,
  );
  return unwrap<PlatformDefaultLeaveTypeRow>(res);
}

export async function deletePlatformLeaveType(id: string): Promise<void> {
  await apiClient.delete(apiConfig.superAdmin.platformDefaultLeaveType(id));
}
