const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);

function hostnameFromEnvUrl(envValue: string | undefined): string | null {
  if (!envValue?.trim()) return null;
  try {
    return new URL(envValue.trim()).hostname.toLowerCase();
  } catch {
    return null;
  }
}

function isAllowedHostname(hostname: string): boolean {
  const host = hostname.toLowerCase();
  const apiHost = hostnameFromEnvUrl(process.env.NEXT_PUBLIC_API_URL);
  if (apiHost && host === apiHost) return true;
  if (host === "res.cloudinary.com") return true;
  if (host.endsWith(".cloudinary.com")) return true;
  if (host === "localhost" || host === "127.0.0.1") return true;
  return false;
}

/** Returns a safe href for user-controlled URLs, or null if unsafe. */
export function getSafeExternalHref(
  url: string | null | undefined,
): string | null {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
    return trimmed;
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }

  if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) return null;
  if (!isAllowedHostname(parsed.hostname)) return null;

  return trimmed;
}

export function getSafeImageSrc(
  url: string | null | undefined,
): string | null {
  return getSafeExternalHref(url);
}
