import { NextResponse } from "next/server";

// Routes that require authentication
const PROTECTED_PREFIXES = ["/superadmin", "/org/hr"];

// Routes that should redirect away if already authenticated
const AUTH_ROUTES = ["/login"];

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get("access_token")?.value;

  // ── Protected routes: redirect to /login if no token ─────────────────
  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );

  if (isProtected && !accessToken) {
    const loginUrl = new URL("/login", request.url);
    // Preserve the original URL so we can redirect back after login
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── Auth routes: redirect to home (which will resolve to dashboard) if already logged in
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  if (isAuthRoute && accessToken) {
    // Redirect to root which will auto-resolve to role-based dashboard
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Only run middleware on app routes, skip static assets and API routes
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)",
  ],
};
