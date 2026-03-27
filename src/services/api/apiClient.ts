import { apiConfig } from "@/src/config/api.config";

type RequestInitWithBody = Omit<RequestInit, "body"> & { body?: object };

function shouldTryRefreshForUrl(url: string): boolean {
  return (
    !url.includes("/auth/refresh") &&
    !url.includes("/auth/request-otp") &&
    !url.includes("/auth/verify-otp") &&
    !url.includes("/auth/logout")
  );
}

async function postRefresh(): Promise<boolean> {
  const refreshUrl = `${apiConfig.baseUrl}/auth/refresh`;
  const res = await fetch(refreshUrl, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
  return res.ok;
}

async function request<T>(
  url: string,
  options: RequestInitWithBody = {},
  didRefresh = false,
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

  if (
    res.status === 401 &&
    shouldTryRefreshForUrl(url) &&
    !didRefresh
  ) {
    const refreshed = await postRefresh();
    if (refreshed) {
      return request<T>(url, options, true);
    }
  }

  if (!res.ok) {
    const errBody = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    let message = "";
    if (typeof errBody.message === "string") {
      message = errBody.message;
    }
    if (!message && typeof errBody.error === "string") {
      message = errBody.error;
    }
    if (!message && Array.isArray(errBody.errors)) {
      message = (errBody.errors as unknown[])
        .map((e) => {
          if (e && typeof e === "object") {
            if ("msg" in e && (e as { msg: unknown }).msg != null) {
              return String((e as { msg: unknown }).msg);
            }
            if ("message" in e && (e as { message: unknown }).message != null) {
              return String((e as { message: unknown }).message);
            }
          }
          return "";
        })
        .filter(Boolean)
        .join("; ");
    }
    if (!message) {
      message =
        res.statusText ||
        `Request failed (${res.status})`;
    }
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
