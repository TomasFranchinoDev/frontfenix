"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";

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

  useEffect(() => {
    void useCartStore.persist.rehydrate();
  }, []);

  useEffect(() => {
    void initializeAuth();
  }, [initializeAuth]);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
