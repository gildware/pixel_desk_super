import { cookies, headers } from "next/headers";
import { apiConfig } from "@/src/config/api.config";
import type { Session, SessionUser } from "@/src/types/auth.types";

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
  const proto = h.get("x-forwarded-proto") ?? (h.get("x-forwarded-ssl") === "on" ? "https" : "http");
  const origin = host ? `${proto}://${host}` : "";
  return origin ? `${origin}${relativeOrAbsolute}` : relativeOrAbsolute;
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

    const data = await res.json().catch(() => null) as {
      status?: string;
      data?: { user?: SessionUser; isGlobalSuperAdmin?: boolean };
      user?: SessionUser;
    } | null;
    const rawUser = data?.data?.user ?? data?.user;
    if (!rawUser?.id || !rawUser?.email) return null;
    const user: SessionUser = {
      ...rawUser,
      isGlobalSuperAdmin: rawUser.isGlobalSuperAdmin ?? data?.data?.isGlobalSuperAdmin ?? false,
    };
    return { user };
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
