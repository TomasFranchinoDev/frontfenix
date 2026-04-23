import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function getSafePath(path: string | null, fallback: string): string {
  if (!path || !path.startsWith("/") || path.startsWith("//")) {
    return fallback;
  }

  return path;
}

export async function GET(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase environment variables.");
  }

  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextPath = getSafePath(requestUrl.searchParams.get("next"), "/");
  const redirectPath = getSafePath(requestUrl.searchParams.get("redirect"), "/login");

  const response = NextResponse.redirect(new URL(nextPath, request.url));
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
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

  if (!code) {
    const errorUrl = new URL(nextPath, request.url);
    errorUrl.searchParams.set("error", "No pudimos validar el enlace de recuperación. Solicita uno nuevo.");
    errorUrl.searchParams.set("next", redirectPath);
    return NextResponse.redirect(errorUrl);
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const errorUrl = new URL(nextPath, request.url);
    errorUrl.searchParams.set("error", error.message);
    errorUrl.searchParams.set("next", redirectPath);
    const errorResponse = NextResponse.redirect(errorUrl);
    response.cookies.getAll().forEach((cookie) => {
      errorResponse.cookies.set(cookie);
    });
    return errorResponse;
  }

  const destinationUrl = new URL(nextPath, request.url);
  destinationUrl.searchParams.set("next", redirectPath);
  const destinationResponse = NextResponse.redirect(destinationUrl);
  response.cookies.getAll().forEach((cookie) => {
    destinationResponse.cookies.set(cookie);
  });
  return destinationResponse;
}
