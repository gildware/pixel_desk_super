import type { WidgetVisibility } from "@/src/types/platformDefaults.types";
import type { WidgetLayoutAudience } from "@/src/types/platformDefaults.types";

/** Maps default-layout audience to dashboard top-level role. */
export function audienceToTopLevelRole(
  audience: WidgetLayoutAudience,
): "admin" | "employee" | "client" {
  if (audience === "admin") return "admin";
  if (audience === "member") return "employee";
  return "client";
}

export function isWidgetVisibleForRole(
  visibility: WidgetVisibility,
  topLevelRole?: string | null,
): boolean {
  if (!topLevelRole) return true;
  if (visibility === "both") return true;
  if (visibility === "client") return topLevelRole === "client";
  if (visibility === "admin") return topLevelRole === "admin";
  if (visibility === "member") return topLevelRole === "employee";
  return false;
}

export function isWidgetApplicableForAudience(
  visibility: WidgetVisibility,
  audience: WidgetLayoutAudience,
): boolean {
  return isWidgetVisibleForRole(visibility, audienceToTopLevelRole(audience));
}

export function filterCatalogForAudience<T extends { visibility: WidgetVisibility; isActive: boolean }>(
  catalog: T[],
  audience: WidgetLayoutAudience,
): T[] {
  return catalog.filter(
    (row) => row.isActive && isWidgetApplicableForAudience(row.visibility, audience),
  );
}
