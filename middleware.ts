import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type UserProfile = {
  es_admin?: boolean;
};

function createSupabaseMiddlewareClient(request: NextRequest, response: NextResponse) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase environment variables.");
  }

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        });
      },
    },
  });
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

  const response = NextResponse.next({ request });
  const supabase = createSupabaseMiddlewareClient(request, response);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return buildLoginRedirect(request);
  }

  if (pathname.startsWith("/admin")) {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const token = session?.access_token;

    if (!token) {
      return buildLoginRedirect(request);
    }

    const userIsAdmin = await isAdmin(token);

    if (!userIsAdmin) {
      const forbiddenUrl = new URL("/", request.url);
      return NextResponse.redirect(forbiddenUrl);
    }
  }

  return response;
}

export const config = {
  matcher: ["/cuenta/:path*", "/admin/:path*", "/mi-perfil/:path*"],
};
