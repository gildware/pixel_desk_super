const CSRF_COOKIE_NAME = "csrf_token";

export function getCsrfTokenFromCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${CSRF_COOKIE_NAME}=([^;]*)`),
  );
  return match ? decodeURIComponent(match[1]) : null;
}

export function csrfHeadersForMethod(
  method?: string,
): Record<string, string> {
  const normalized = (method ?? "GET").toUpperCase();
  if (["GET", "HEAD", "OPTIONS"].includes(normalized)) {
    return {};
  }
  const token = getCsrfTokenFromCookie();
  return token ? { "X-CSRF-Token": token } : {};
}
