/** Same bundled assets the public website ships (`pixel-desk-landing/public`). */
export const WEBSITE_BRANDING_ASSETS = {
  logoUrl: "/images/logo.svg",
  logoDarkUrl: "/images/logo-white.svg",
  faviconUrl: "/favicon.svg",
} as const;

export function isRemoteAssetUrl(value: string | null | undefined): boolean {
  if (!value) return false;
  return /^https?:\/\//i.test(value.trim());
}
