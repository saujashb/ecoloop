import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { applySecurityHeaders } from "@/lib/security-headers";
import { checkRateLimit, clientIpFromForwarded } from "@/lib/rate-limit";

const AUTH_RATE_LIMIT = 5;
const AUTH_WINDOW_MS = 60_000;

const RATE_LIMITED_PATHS = new Set(["/login", "/signup", "/dev/login"]);

function isAuthServerAction(request: NextRequest): boolean {
  return (
    request.method === "POST" &&
    RATE_LIMITED_PATHS.has(request.nextUrl.pathname) &&
    request.headers.has("next-action")
  );
}

export function proxy(request: NextRequest) {
  if (isAuthServerAction(request)) {
    const ip = clientIpFromForwarded(request.headers.get("x-forwarded-for"));
    const path = request.nextUrl.pathname;
    const { ok, retryAfterSec } = checkRateLimit(
      `auth:${path}:${ip}`,
      AUTH_RATE_LIMIT,
      AUTH_WINDOW_MS
    );

    if (!ok) {
      const res = NextResponse.json(
        {
          error: `Too many attempts. Try again in ${retryAfterSec} seconds.`,
        },
        { status: 429 }
      );
      res.headers.set("Retry-After", String(retryAfterSec));
      return applySecurityHeaders(res);
    }
  }

  return applySecurityHeaders(NextResponse.next());
}

export const proxyConfig = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
