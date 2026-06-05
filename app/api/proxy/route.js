import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND_URL = process.env.BACKEND_API_URL;

// ── Cookie helpers ──────────────────────────────────────────────────────────────

const COOKIE_OPTIONS_ACCESS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge: 30 * 60, // 30 minutes
};

const COOKIE_OPTIONS_REFRESH = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge: 7 * 24 * 60 * 60, // 7 days
};

// ── Main proxy handler ──────────────────────────────────────────────────────────

async function handleProxy(request) {
  try {
    if (!BACKEND_URL) {
      return NextResponse.json(
        { error: "BACKEND_API_URL environment variable is not configured" },
        { status: 500 }
      );
    }

    const method = request.method;
    const targetPath = request.headers.get("x-target-path");

    if (!targetPath) {
      return NextResponse.json(
        { error: "Missing x-target-path header" },
        { status: 400 }
      );
    }

    // Parse incoming request URL to get search parameters
    const incomingUrl = new URL(request.url);
    const searchParams = incomingUrl.searchParams.toString();

    // Construct target backend URL
    let targetUrlString = `${BACKEND_URL}${targetPath}`;
    if (searchParams) {
      targetUrlString += `?${searchParams}`;
    }

    // ── Build headers to send to backend ──────────────────────────────────
    const headersToSend = new Headers();

    // Copy incoming headers, skipping hop-by-hop and internal ones
    request.headers.forEach((value, key) => {
      const lowerKey = key.toLowerCase();
      if (
        lowerKey !== "host" &&
        lowerKey !== "connection" &&
        lowerKey !== "content-length" &&
        lowerKey !== "x-target-path" &&
        lowerKey !== "cookie" // We'll handle cookies ourselves
      ) {
        headersToSend.set(key, value);
      }
    });

    // Skip ngrok's browser warning interstitial page
    headersToSend.set("ngrok-skip-browser-warning", "true");

    // ── Forward auth cookies from the browser to the backend ──────────────
    // Read cookies stored on the Next.js domain and forward them to the backend
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("access_token")?.value;
    const refreshToken = cookieStore.get("refresh_token")?.value;

    const cookieParts = [];
    if (accessToken) cookieParts.push(`access_token=${accessToken}`);
    if (refreshToken) cookieParts.push(`refresh_token=${refreshToken}`);
    if (cookieParts.length > 0) {
      headersToSend.set("Cookie", cookieParts.join("; "));
    }

    // ── Build request body ────────────────────────────────────────────────
    let body = null;
    if (method !== "GET" && method !== "HEAD") {
      body = await request.text();
    }

    // ── Make the backend request ──────────────────────────────────────────
    const response = await fetch(targetUrlString, {
      method,
      headers: headersToSend,
      body,
      cache: "no-store",
    });

    // ── Read and parse the response ───────────────────────────────────────
    const responseText = await response.text();
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }

    // ── Build response headers (skip backend set-cookie, we handle those) ─
    const clientHeaders = new Headers();
    response.headers.forEach((value, key) => {
      const lowerKey = key.toLowerCase();
      if (
        lowerKey !== "transfer-encoding" &&
        lowerKey !== "content-encoding" &&
        lowerKey !== "set-cookie" // Strip backend cookies — we set our own
      ) {
        clientHeaders.set(key, value);
      }
    });

    // Always return JSON content-type for our proxy responses
    clientHeaders.set("Content-Type", "application/json");

    // ── Handle auth-specific cookie management ────────────────────────────

    const isLogin = targetPath === "/hrms/auth/login" && method === "POST";
    const isRefresh = targetPath === "/hrms/auth/refresh" && method === "POST";
    const isLogout = targetPath === "/hrms/auth/logout" && method === "POST";

    const nextResponse = new Response(
      typeof responseData === "string" ? responseData : JSON.stringify(responseData),
      {
        status: response.status,
        headers: clientHeaders,
      }
    );

    // On successful login: set local cookies from the response body tokens
    if (isLogin && response.ok && typeof responseData === "object") {
      const at = responseData.access_token;
      const rt = responseData.refresh_token;

      if (at) {
        nextResponse.headers.append(
          "Set-Cookie",
          `access_token=${at}; HttpOnly; Path=/; Max-Age=${COOKIE_OPTIONS_ACCESS.maxAge}; SameSite=Lax${COOKIE_OPTIONS_ACCESS.secure ? "; Secure" : ""}`
        );
      }
      if (rt) {
        nextResponse.headers.append(
          "Set-Cookie",
          `refresh_token=${rt}; HttpOnly; Path=/; Max-Age=${COOKIE_OPTIONS_REFRESH.maxAge}; SameSite=Lax${COOKIE_OPTIONS_REFRESH.secure ? "; Secure" : ""}`
        );
      }
    }

    // On successful token refresh: update the access_token cookie
    if (isRefresh && response.ok && typeof responseData === "object") {
      const at = responseData.access_token;
      if (at) {
        nextResponse.headers.append(
          "Set-Cookie",
          `access_token=${at}; HttpOnly; Path=/; Max-Age=${COOKIE_OPTIONS_ACCESS.maxAge}; SameSite=Lax${COOKIE_OPTIONS_ACCESS.secure ? "; Secure" : ""}`
        );
      }
    }

    // On logout: clear both cookies
    if (isLogout) {
      nextResponse.headers.append(
        "Set-Cookie",
        "access_token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax"
      );
      nextResponse.headers.append(
        "Set-Cookie",
        "refresh_token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax"
      );
    }

    return nextResponse;
  } catch (error) {
    console.error("Proxy error:", error);
    return NextResponse.json(
      { error: "Proxy request failed", details: error.message },
      { status: 502 }
    );
  }
}

export async function GET(request) {
  return handleProxy(request);
}

export async function POST(request) {
  return handleProxy(request);
}

export async function PUT(request) {
  return handleProxy(request);
}

export async function DELETE(request) {
  return handleProxy(request);
}

export async function PATCH(request) {
  return handleProxy(request);
}
