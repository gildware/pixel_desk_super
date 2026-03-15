import { apiConfig } from "@/src/config/api.config";

type RequestInitWithBody = Omit<RequestInit, "body"> & { body?: object };

async function request<T>(
  url: string,
  options: RequestInitWithBody = {}
): Promise<T> {
  const { body, headers: customHeaders, ...rest } = options;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(customHeaders as HeadersInit),
  };

  const config: RequestInit = {
    ...rest,
    headers,
    credentials: "include",
    ...(body !== undefined && {
      body: JSON.stringify(body),
    }),
  };

  const res = await fetch(url, config);

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    const message =
      (errBody as { message?: string }).message ||
      errBody.error ||
      res.statusText ||
      `Request failed (${res.status})`;
    throw new Error(message);
  }

  const contentType = res.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    return res.json() as Promise<T>;
  }
  return undefined as T;
}

function toRequestInitWithBody(init?: RequestInit, body?: object): RequestInitWithBody {
  if (!init) return body !== undefined ? { body } : {};
  const { body: _initBody, ...rest } = init;
  return body !== undefined ? { ...rest, body } : rest;
}

export const apiClient = {
  get: <T>(url: string, init?: RequestInit) =>
    request<T>(url, { ...toRequestInitWithBody(init), method: "GET" }),

  post: <T>(url: string, body?: object, init?: RequestInit) =>
    request<T>(url, { ...toRequestInitWithBody(init, body), method: "POST" }),

  put: <T>(url: string, body?: object, init?: RequestInit) =>
    request<T>(url, { ...toRequestInitWithBody(init, body), method: "PUT" }),

  patch: <T>(url: string, body?: object, init?: RequestInit) =>
    request<T>(url, { ...toRequestInitWithBody(init, body), method: "PATCH" }),

  delete: <T>(url: string, init?: RequestInit) =>
    request<T>(url, { ...toRequestInitWithBody(init), method: "DELETE" }),
};

export { apiConfig };
