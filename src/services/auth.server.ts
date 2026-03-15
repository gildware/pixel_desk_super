import { cookies } from "next/headers";
import { apiConfig } from "@/src/config/api.config";
import type { Session, SessionUser } from "@/src/types/auth.types";

function getCookieHeader(cookieStore: Awaited<ReturnType<typeof cookies>>): string {
  return cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");
}

export async function getServerSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const cookieHeader = getCookieHeader(cookieStore);

  try {
    const res = await fetch(apiConfig.auth.session, {
      method: "GET",
      headers: { Cookie: cookieHeader },
      cache: "no-store",
    });

    if (!res.ok) return null;

    const data = await res.json().catch(() => null) as {
      status?: string;
      data?: { user?: SessionUser };
      user?: SessionUser;
    } | null;
    const user = data?.data?.user ?? data?.user;
    if (user?.id && user?.email) return { user };
    return null;
  } catch {
    return null;
  }
}

/** Call backend logout with current cookies so session is cleared; use when user must not access dashboard (e.g. not global super admin). */
export async function serverLogout(): Promise<void> {
  const cookieStore = await cookies();
  const cookieHeader = getCookieHeader(cookieStore);
  try {
    await fetch(apiConfig.auth.logout, {
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
