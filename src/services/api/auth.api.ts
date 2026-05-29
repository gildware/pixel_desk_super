import { apiClient } from "./apiClient";
import { apiConfig } from "@/src/config/api.config";
import { parseSessionResponse } from "@/src/utils/parseSessionResponse";
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
  otp: string,
  rememberMe: boolean
): Promise<VerifyOtpResponse> {
  return apiClient.post<VerifyOtpResponse>(apiConfig.auth.verifyOtp, {
    email,
    otp,
    rememberMe,
  });
}

export async function logout(): Promise<void> {
  await apiClient.post(apiConfig.auth.logout);
}

export async function getSession(): Promise<Session | null> {
  try {
    const data = await apiClient.get<Parameters<typeof parseSessionResponse>[0]>(
      apiConfig.auth.session,
    );
    return parseSessionResponse(data);
  } catch {
    return null;
  }
}
