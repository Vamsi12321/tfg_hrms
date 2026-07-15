import { NextResponse } from "next/server";

export function middleware(request) {
  // Middleware is deprecated in Next.js 16 but still functional for basic routing
  // Keep it minimal — just pass through. Auth is handled client-side.
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)",
  ],
};
