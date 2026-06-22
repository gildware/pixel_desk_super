function buildContentSecurityPolicy(): string {
  const connectSrc = ["'self'"];
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "";
  if (apiUrl.startsWith("http")) {
    try {
      connectSrc.push(new URL(apiUrl).origin);
    } catch {
      /* ignore invalid env */
    }
  }
  connectSrc.push("https://res.cloudinary.com", "https://*.cloudinary.com");

  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://res.cloudinary.com https://*.cloudinary.com",
    `connect-src ${connectSrc.join(" ")}`,
    "font-src 'self' data:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
}

export const SECURITY_HEADERS = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  { key: "Content-Security-Policy", value: buildContentSecurityPolicy() },
] as const;
