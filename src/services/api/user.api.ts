import { apiClient } from "./apiClient";
import { apiConfig } from "@/src/config/api.config";
import type { SessionUser } from "@/src/types/auth.types";

export async function getMe(): Promise<SessionUser> {
  const data = await apiClient.get<{ data?: SessionUser } | SessionUser>(
    apiConfig.user.me
  );
  if (data && typeof data === "object" && "data" in data && data.data) {
    return data.data;
  }
  return data as SessionUser;
}
