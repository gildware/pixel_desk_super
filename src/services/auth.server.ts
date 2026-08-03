import { cookies } from "next/headers";
import { apiConfig } from "@/src/config/api.config";
import type { Session } from "@/src/types/auth.types";
import { parseSessionResponse } from "@/src/utils/parseSessionResponse";

function getCookieHeader(cookieStore: Awaited<ReturnType<typeof cookies>>): string {
  return cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");
}

/**
 * Resolve server-side fetch URL without trusting request Host headers
 * (prevents SSRF / session cookie forwarding to attacker-controlled hosts).
 */
async function resolveApiUrl(relativeOrAbsolute: string): Promise<string> {
  if (relativeOrAbsolute.startsWith("http")) return relativeOrAbsolute;

  if (relativeOrAbsolute.startsWith("/api/proxy")) {
    // Server-side: call the backend directly with forwarded request cookies.
    // Avoids a self-fetch through NEXT_PUBLIC_BASE_URL (fragile when dev port
    // differs from BASE_URL) and works in local dev where localhost cookies are
    // not port-scoped.
    const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
    if (apiUrl) {
      const backendPath = relativeOrAbsolute.replace(/^\/api\/proxy/, "");
      return `${apiUrl}${backendPath}`;
    }

    const base = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "");
    if (base) {
      return `${base}${relativeOrAbsolute}`;
    }

    throw new Error(
      "Set NEXT_PUBLIC_API_URL for server-side session checks, or NEXT_PUBLIC_BASE_URL for self-proxy fallback.",
    );
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  if (apiUrl) {
    return `${apiUrl}${relativeOrAbsolute}`;
  }

  return relativeOrAbsolute;
}

export async function getServerSession(): Promise<Session | null> {
  try {
    const cookieStore = await cookies();
    const cookieHeader = getCookieHeader(cookieStore);
    const sessionUrl = await resolveApiUrl(apiConfig.auth.session);

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
  try {
    const cookieStore = await cookies();
    const cookieHeader = getCookieHeader(cookieStore);
    const logoutUrl = await resolveApiUrl(apiConfig.auth.logout);
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
