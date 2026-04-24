"use client";

import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { supabase } from "@/src/lib/supabase/client";
import { useCartStore } from "@/src/stores/cartStore";
import { useAuthStore } from "@/src/stores/authStore";

type ProvidersProps = {
  children: React.ReactNode;
};

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );
  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  const setSession = useAuthStore((state) => state.setSession);
  const fetchProfile = useAuthStore((state) => state.fetchProfile);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const clearCart = useCartStore((state) => state.clearCart);

  useEffect(() => {
    void useCartStore.persist.rehydrate();
  }, []);

  useEffect(() => {
    void initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      void (async () => {
        setSession(session);

        if (session) {
          await fetchProfile();
          await queryClient.invalidateQueries();
          return;
        }

        if (event === "SIGNED_OUT") {
          clearAuth();
          clearCart();
          queryClient.clear();
        }
      })();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [clearAuth, clearCart, fetchProfile, queryClient, setSession]);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
