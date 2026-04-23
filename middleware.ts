import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

type UserProfile = {
  es_admin?: boolean;
};

function decodeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  return atob(`${normalized}${padding}`);
}

function getAccessTokenFromValue(rawValue?: string): string | null {
  if (!rawValue) {
    return null;
  }

  const candidates = [rawValue, decodeURIComponent(rawValue)];

  for (const candidate of candidates) {
    if (!candidate) {
      continue;
    }

    if (/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/.test(candidate)) {
      return candidate;
    }

    try {
      const parsed = JSON.parse(candidate) as unknown;

      if (Array.isArray(parsed) && typeof parsed[0] === "string") {
        return parsed[0];
      }

      if (
        typeof parsed === "object" &&
        parsed !== null &&
        "access_token" in parsed &&
        typeof (parsed as Record<string, unknown>).access_token === "string"
      ) {
        return (parsed as { access_token: string }).access_token;
      }
    } catch {
      // noop
    }

    if (candidate.startsWith("base64-")) {
      try {
        const decoded = decodeBase64Url(candidate.slice("base64-".length));
        const parsed = JSON.parse(decoded) as unknown;

        if (Array.isArray(parsed) && typeof parsed[0] === "string") {
          return parsed[0];
        }

        if (
          typeof parsed === "object" &&
          parsed !== null &&
          "access_token" in parsed &&
          typeof (parsed as Record<string, unknown>).access_token === "string"
        ) {
          return (parsed as { access_token: string }).access_token;
        }
      } catch {
        // noop
      }
    }
  }

  return null;
}

function getAccessToken(request: NextRequest): string | null {
  const directTokenCookies = ["access_token", "sb-access-token", "supabase-access-token"];

  for (const cookieName of directTokenCookies) {
    const token = getAccessTokenFromValue(request.cookies.get(cookieName)?.value);
    if (token) {
      return token;
    }
  }

  const cookies = request.cookies.getAll();

  // Standard Supabase cookie: sb-<project-ref>-auth-token
  const supabaseCookie = cookies.find(
    (cookie) => cookie.name.startsWith("sb-") && cookie.name.endsWith("-auth-token"),
  );

  if (supabaseCookie) {
    const token = getAccessTokenFromValue(supabaseCookie.value);
    if (token) {
      return token;
    }
  }

  // Chunked Supabase cookies: sb-<project-ref>-auth-token.0, .1, ...
  const chunkedCookies = cookies
    .filter((cookie) => /^sb-.*-auth-token\.\d+$/.test(cookie.name))
    .sort((a, b) => {
      const aIndex = Number(a.name.split(".").pop() ?? "0");
      const bIndex = Number(b.name.split(".").pop() ?? "0");
      return aIndex - bIndex;
    });

  if (chunkedCookies.length > 0) {
    const chunkedValue = chunkedCookies.map((cookie) => cookie.value).join("");
    const token = getAccessTokenFromValue(chunkedValue);
    if (token) {
      return token;
    }
  }

  return null;
}

function buildLoginRedirect(request: NextRequest): NextResponse {
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(loginUrl);
}

async function isAdmin(token: string): Promise<boolean> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) {
    return false;
  }

  try {
    const response = await fetch(`${apiUrl}/api/users/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return false;
    }

    const profile = (await response.json()) as UserProfile;
    return profile.es_admin === true;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const needsAuth = pathname.startsWith("/cuenta") || pathname.startsWith("/admin") || pathname.startsWith("/mi-perfil");

  if (!needsAuth) {
    return NextResponse.next();
  }

  const token = getAccessToken(request);

  if (!token) {
    return buildLoginRedirect(request);
  }

  if (pathname.startsWith("/admin")) {
    const userIsAdmin = await isAdmin(token);

    if (!userIsAdmin) {
      const forbiddenUrl = new URL("/", request.url);
      return NextResponse.redirect(forbiddenUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/cuenta/:path*", "/admin/:path*", "/mi-perfil/:path*"],
};
