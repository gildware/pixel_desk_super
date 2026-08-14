import type { PlatformWhatsNewRow } from "@/src/types/platformWhatsNew.types";

export type WhatsNewFormState = {
  title: string;
  body: string;
  publishedAt: string;
  isActive: boolean;
};

export const emptyWhatsNewForm: WhatsNewFormState = {
  title: "",
  body: "",
  publishedAt: "",
  isActive: true,
};

export function whatsNewFormFromRow(row: PlatformWhatsNewRow): WhatsNewFormState {
  const d = new Date(row.publishedAt);
  const publishedAt = Number.isNaN(d.getTime())
    ? ""
    : d.toISOString().slice(0, 10);

  return {
    title: row.title,
    body: row.body,
    publishedAt,
    isActive: row.isActive,
  };
}

export function validateWhatsNewForm(form: WhatsNewFormState): string | null {
  if (!form.title.trim()) return "Title is required.";
  if (!form.body.trim()) return "Body is required.";
  if (!form.publishedAt.trim()) return "Published date is required.";
  const parsed = new Date(`${form.publishedAt}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) return "Published date is invalid.";
  return null;
}
