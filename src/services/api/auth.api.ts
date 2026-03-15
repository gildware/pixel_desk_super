import { apiClient } from "./apiClient";
import { apiConfig } from "@/src/config/api.config";
import type {
  RequestOtpResponse,
  VerifyOtpResponse,
  Session,
} from "@/src/types/auth.types";

export async function requestOtp(email: string): Promise<RequestOtpResponse> {
  return apiClient.post<RequestOtpResponse>(apiConfig.auth.requestOtp, {
    email,
  });
}

export async function verifyOtp(
  email: string,
  otp: string
): Promise<VerifyOtpResponse> {
  return apiClient.post<VerifyOtpResponse>(apiConfig.auth.verifyOtp, {
    email,
    otp,
  });
}

export async function logout(): Promise<void> {
  await apiClient.post(apiConfig.auth.logout);
}

/** API session response: { status, message, data: { user, ... } } or 401 when not logged in */
export async function getSession(): Promise<Session | null> {
  try {
    const data = await apiClient.get<{
      status?: string;
      data?: { user?: Session["user"]; isGlobalSuperAdmin?: boolean };
      user?: Session["user"];
    }>(apiConfig.auth.session);
    const rawUser = data?.data?.user ?? data?.user;
    if (!rawUser?.id || !rawUser?.email) return null;
    const user: Session["user"] = {
      ...rawUser,
      isGlobalSuperAdmin: rawUser.isGlobalSuperAdmin ?? data?.data?.isGlobalSuperAdmin ?? false,
    };
    return { user };
  } catch {
    return null;
  }
}
