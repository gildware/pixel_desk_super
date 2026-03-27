import { apiClient } from "./apiClient";
import { apiConfig } from "@/src/config/api.config";
import type {
  CompanyDefaultRole,
  RolePermissions,
  PermissionGroup,
} from "@/src/types/companyDefaultRoles.types";

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

export async function listCompanyDefaultRoles(): Promise<
  CompanyDefaultRole[]
> {
  const res = await apiClient.get<unknown>(apiConfig.superAdmin.companyDefaultRoles);
  return unwrap<CompanyDefaultRole[]>(res);
}

export async function getCompanyDefaultRolePermissions(
  roleId: number,
): Promise<RolePermissions> {
  const res = await apiClient.get<unknown>(
    apiConfig.superAdmin.companyDefaultRolePermissions(roleId),
  );
  return unwrap<RolePermissions>(res);
}

export async function updateCompanyDefaultRolePermissions(input: {
  id: number;
  permissions: PermissionGroup[];
}): Promise<RolePermissions> {
  const res = await apiClient.post<unknown>(
    apiConfig.superAdmin.updateCompanyDefaultRolePermissions,
    input,
  );
  return unwrap<RolePermissions>(res);
}

