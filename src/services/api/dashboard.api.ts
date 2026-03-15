import { apiClient } from "./apiClient";
import { apiConfig } from "@/src/config/api.config";
import type { DashboardStats } from "@/src/types/dashboard.types";

/**
 * Get super-admin dashboard stats
 * GET /super-admin/dashboard/stats
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const res = await apiClient.get<{ data?: DashboardStats } | DashboardStats>(
    apiConfig.superAdmin.dashboardStats
  );
  if (
    res &&
    typeof res === "object" &&
    "data" in res &&
    res.data != null &&
    typeof res.data === "object"
  ) {
    const d = res.data as unknown as Record<string, unknown>;
    return {
      totalCompanies: typeof d.totalCompanies === "number" ? d.totalCompanies : 0,
      totalUsers: typeof d.totalUsers === "number" ? d.totalUsers : 0,
      totalProjects: typeof d.totalProjects === "number" ? d.totalProjects : 0,
    };
  }
  return (res as DashboardStats) ?? {
    totalCompanies: 0,
    totalUsers: 0,
    totalProjects: 0,
  };
}
