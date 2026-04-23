import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables.");
}

declare global {
  var __fenixSupabaseClient: ReturnType<typeof createBrowserClient> | undefined;
}

export const supabase =
  globalThis.__fenixSupabaseClient ?? createBrowserClient(supabaseUrl, supabaseAnonKey);

if (process.env.NODE_ENV !== "production") {
  globalThis.__fenixSupabaseClient = supabase;
}