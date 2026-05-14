import { apiClient } from "./apiClient";
import { apiConfig } from "@/src/config/api.config";

export type PlatformEmailTemplateKey =
  | "otp"
  | "resend_otp"
  | "member_invite"
  | "client_invite";

export type EmailTemplateRow = {
  key: PlatformEmailTemplateKey;
  title: string;
  description: string;
  variables: string[];
  subject: string;
  body: string;
};

export type EmailBranding = {
  useBrandedLayout: boolean;
  logoUrl: string | null;
  headerTitle: string;
  headerSubtitle: string | null;
  accentColor: string;
  footerText: string;
};

export type EmailTemplateBundle = {
  templates: EmailTemplateRow[];
  branding: EmailBranding;
};

type ApiEnvelope<T> = {
  status?: string;
  message?: string;
  data?: T;
};

function unwrapBundle(res: unknown): EmailTemplateBundle | null {
  if (!res || typeof res !== "object") return null;
  const r = res as ApiEnvelope<EmailTemplateBundle>;
  if (r.data?.templates && r.data.branding) {
    return { templates: r.data.templates, branding: r.data.branding };
  }
  const flat = res as Partial<EmailTemplateBundle>;
  if (flat.templates && flat.branding) {
    return { templates: flat.templates, branding: flat.branding };
  }
  return null;
}

export async function fetchEmailTemplateBundle(): Promise<EmailTemplateBundle> {
  const res = await apiClient.get<unknown>(apiConfig.superAdmin.emailTemplates);
  const bundle = unwrapBundle(res);
  if (!bundle?.templates?.length) {
    throw new Error("Invalid email templates response");
  }
  return bundle;
}

export type PatchEmailSettingsBody = Partial<
  Record<PlatformEmailTemplateKey, { subject: string; body: string }>
> & { branding?: Partial<EmailBranding> };

export async function patchEmailSettings(
  body: PatchEmailSettingsBody,
): Promise<EmailTemplateBundle> {
  const res = await apiClient.patch<unknown>(
    apiConfig.superAdmin.emailTemplates,
    body,
  );
  const bundle = unwrapBundle(res);
  if (!bundle?.templates?.length) {
    throw new Error("Invalid email templates response");
  }
  return bundle;
}

export async function postEmailTemplatePreview(input: {
  templateKey: PlatformEmailTemplateKey;
  subject: string;
  body: string;
  branding: EmailBranding;
}): Promise<{ html: string; subject: string; text: string }> {
  const res = await apiClient.post<unknown>(
    apiConfig.superAdmin.emailTemplatesPreview,
    input,
  );
  if (!res || typeof res !== "object") {
    throw new Error("Invalid preview response");
  }
  const r = res as ApiEnvelope<{ html: string; subject: string; text: string }>;
  if (r.data?.html) {
    return r.data;
  }
  const d = res as { html?: string; subject?: string; text?: string };
  if (d.html) {
    return {
      html: d.html,
      subject: String(d.subject ?? ""),
      text: String(d.text ?? ""),
    };
  }
  throw new Error("Invalid preview response");
}
