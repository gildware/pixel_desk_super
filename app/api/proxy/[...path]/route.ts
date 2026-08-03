import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";

const ALLOWED_ROOT_SEGMENTS = new Set([
  "auth",
  "users",
  "file-upload",
  "super-admin",
  "public",
]);

function isAllowedProxyPath(segments: string[]): boolean {
  if (!segments.length || !API_URL) return false;
  return ALLOWED_ROOT_SEGMENTS.has(segments[0]);
}

async function proxyRequest(
  req: NextRequest,
  pathSegments: string[],
): Promise<NextResponse> {
  if (!isAllowedProxyPath(pathSegments)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const path = pathSegments.join("/");
  const targetUrl = `${API_URL}/${path}${req.nextUrl.search}`;

  const headers = new Headers();
  const cookie = req.headers.get("cookie");
  if (cookie) headers.set("cookie", cookie);

  const contentType = req.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);

  const csrf = req.headers.get("x-csrf-token");
  if (csrf) headers.set("x-csrf-token", csrf);

  const accept = req.headers.get("accept");
  if (accept) headers.set("accept", accept);

  const body =
    req.method !== "GET" && req.method !== "HEAD"
      ? await req.arrayBuffer()
      : undefined;

  let upstream: Response;
  try {
    upstream = await fetch(targetUrl, {
      method: req.method,
      headers,
      body,
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      {
        status: "error",
        message:
          "Cannot reach the API server. Ensure the backend is running and NEXT_PUBLIC_API_URL is correct.",
      },
      { status: 503 },
    );
  }

  const responseHeaders = new Headers();
  upstream.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (lower === "set-cookie") {
      responseHeaders.append("set-cookie", value);
      return;
    }
    if (lower === "transfer-encoding" || lower === "connection") return;
    responseHeaders.set(key, value);
  });

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
}

type RouteContext = { params: Promise<{ path: string[] }> };

async function handle(req: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxyRequest(req, path);
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
