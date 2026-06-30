import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// Routes reachable without a session. Everything else requires sign-in.
// Magic-link verification lives under /api/auth/* and is excluded by the matcher.
const PUBLIC_PATHS = new Set(["/"]);

// Public path prefixes (e.g. invite links must work for logged-out recipients).
const PUBLIC_PREFIXES = ["/invite/"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    PUBLIC_PATHS.has(pathname) ||
    PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  ) {
    return NextResponse.next();
  }

  // Optimistic cookie check only — this does NOT validate the session.
  // Real authorization is enforced in each route/server action via auth.api.getSession.
  const sessionCookie = getSessionCookie(request);
  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Run on all routes except API routes, Next internals, and files with an extension.
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
