import { cookies, headers } from "next/headers";
import { apiConfig } from "@/src/config/api.config";
import type { Session } from "@/src/types/auth.types";
import { parseSessionResponse } from "@/src/utils/parseSessionResponse";

function getCookieHeader(cookieStore: Awaited<ReturnType<typeof cookies>>): string {
  return cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");
}

async function resolveApiUrl(relativeOrAbsolute: string): Promise<string> {
  if (relativeOrAbsolute.startsWith("http")) return relativeOrAbsolute;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const proto =
    h.get("x-forwarded-proto") ??
    (h.get("x-forwarded-ssl") === "on" ? "https" : "http");
  if (host) return `${proto}://${host}${relativeOrAbsolute}`;
  const fallback = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "");
  if (fallback) return `${fallback}${relativeOrAbsolute}`;
  return relativeOrAbsolute;
}

export async function getServerSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const cookieHeader = getCookieHeader(cookieStore);
  const sessionUrl = await resolveApiUrl(apiConfig.auth.session);

  try {
    const res = await fetch(sessionUrl, {
      method: "GET",
      headers: { Cookie: cookieHeader },
      cache: "no-store",
    });

    if (!res.ok) return null;

    const data = await res.json().catch(() => null);
    return parseSessionResponse(data);
  } catch {
    return null;
  }
}

/** Call backend logout with current cookies so session is cleared; use when user must not access dashboard (e.g. not global super admin). */
export async function serverLogout(): Promise<void> {
  const cookieStore = await cookies();
  const cookieHeader = getCookieHeader(cookieStore);
  const logoutUrl = await resolveApiUrl(apiConfig.auth.logout);
  try {
    await fetch(logoutUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieHeader,
      },
      cache: "no-store",
    });
  } catch {
    // best effort
  }
}
