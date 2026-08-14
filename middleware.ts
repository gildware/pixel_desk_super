import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SECURITY_HEADERS } from './src/config/securityHeaders';

export function middleware(request: NextRequest) {
  const requestId =
    request.headers.get('x-request-id') ?? crypto.randomUUID();
  const startedAt = Date.now();

  const response = NextResponse.next({
    request: {
      headers: new Headers(request.headers),
    },
  });
  response.headers.set('x-request-id', requestId);
  for (const header of SECURITY_HEADERS) {
    response.headers.set(header.key, header.value);
  }

  console.log(
    JSON.stringify({
      service: 'pixel-desk-super',
      event: 'request_received',
      requestId,
      method: request.method,
      path: request.nextUrl.pathname,
      durationMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    }),
  );

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/proxy|security).*)'],
};
