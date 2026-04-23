import axios from "axios";
import { supabase } from "@/src/lib/supabase/client";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;

if (!apiBaseUrl) {
  throw new Error("Missing API base URL environment variable.");
}

export const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 20_000,
});

const publicPaths = ["/api/catalog/"];

function shouldSkipAuth(url?: string) {
  if (!url) {
    return false;
  }
  return publicPaths.some((path) => url.startsWith(path));
}

function decodeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));

  if (typeof window !== "undefined" && typeof window.atob === "function") {
    return window.atob(`${normalized}${padding}`);
  }

  throw new Error("Base64 decoder unavailable");
}

function getAccessTokenFromValue(rawValue: string | null): string | null {
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
        typeof parsed === "object"
        && parsed !== null
        && "access_token" in parsed
        && typeof (parsed as Record<string, unknown>).access_token === "string"
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
          typeof parsed === "object"
          && parsed !== null
          && "access_token" in parsed
          && typeof (parsed as Record<string, unknown>).access_token === "string"
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

function getTokenFromLocalStorage(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);

      if (!key || !key.startsWith("sb-") || !key.endsWith("-auth-token")) {
        continue;
      }

      const token = getAccessTokenFromValue(window.localStorage.getItem(key));

      if (token) {
        return token;
      }
    }
  } catch {
    // noop
  }

  return null;
}

async function getAccessTokenSafe(): Promise<string | null> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.access_token) {
      return session.access_token;
    }
  } catch {
    // noop
  }

  return getTokenFromLocalStorage();
}

// Interceptor: adjunta el JWT automáticamente en cada request
api.interceptors.request.use(async (config) => {
  if (shouldSkipAuth(config.url)) {
    return config;
  }

  const token = await getAccessTokenSafe();

  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;