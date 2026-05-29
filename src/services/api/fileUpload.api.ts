import { apiConfig } from "@/src/config/api.config";

type UploadFileResponse = {
  data?: {
    url?: string;
  };
  message?: string;
};

export async function uploadFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(apiConfig.fileUpload, {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  const body = (await res.json().catch(() => ({}))) as UploadFileResponse & {
    errors?: { msg?: string }[];
  };
  if (!res.ok) {
    throw new Error(
      body?.message || body?.errors?.[0]?.msg || "Upload failed",
    );
  }

  const uploadedUrl =
    body?.data?.url ??
    (typeof body?.data === "object" &&
    body.data &&
    "url" in body.data &&
    typeof (body.data as { url?: string }).url === "string"
      ? (body.data as { url: string }).url
      : undefined);

  if (!uploadedUrl) {
    throw new Error("Uploaded file URL missing in response");
  }

  return uploadedUrl;
}
