import { NextRequest, NextResponse } from "next/server";
import { API_URL } from "@/lib/config";

/**
 * A strict Content-Security-Policy with a fresh nonce on every request.
 *
 * This page shows payers where to send money, so nothing but its own code may
 * run on it: no inline script without the nonce, no third-party script at all,
 * and no framing by another site. Next.js reads the nonce from the request's
 * CSP header and puts it on its own scripts, which is why every page is
 * dynamically rendered (see app/layout.tsx).
 */
export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const isDev = process.env.NODE_ENV === "development";

  // The page talks to the API over HTTP and, for live updates, a WebSocket.
  const api = new URL(API_URL);
  const apiSocket = `${api.protocol === "https:" ? "wss:" : "ws:"}//${api.host}`;

  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    `style-src 'self' 'nonce-${nonce}'`,
    // Business logos are uploaded images served from wherever the business
    // keeps them; QR codes are drawn inline.
    "img-src 'self' data: blob: https:",
    "font-src 'self'",
    `connect-src 'self' ${api.origin} ${apiSocket}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    // Left out in development, where the API is plain http on localhost.
    ...(isDev ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    {
      source: "/((?!_next/static|_next/image|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
