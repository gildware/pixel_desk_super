/** Cloudinary sometimes stores images as `raw`; browsers need `image` delivery for <img>. */
export function widgetMediaUrl(url?: string | null): string {
  if (!url?.trim()) return "";
  const trimmed = url.trim();
  if (
    trimmed.includes("res.cloudinary.com") &&
    trimmed.includes("/raw/upload/")
  ) {
    return trimmed.replace("/raw/upload/", "/image/upload/");
  }
  return trimmed;
}

export function isWidgetMediaUrl(value?: string | null): boolean {
  if (!value?.trim()) return false;
  const v = value.trim();
  return (
    v.startsWith("http://") ||
    v.startsWith("https://") ||
    v.startsWith("/")
  );
}
