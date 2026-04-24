"use client";

import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/src/lib/supabase/client";
import { useAuthStore } from "@/src/stores/authStore";
import { useCartStore } from "@/src/stores/cartStore";

type UseLogoutOptions = {
  redirectTo?: string;
};

export function useLogout(options: UseLogoutOptions = {}) {
  const { redirectTo = "/login" } = options;
  const router = useRouter();
  const queryClient = useQueryClient();
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const clearCart = useCartStore((state) => state.clearCart);

  return async function logout() {
    await supabase.auth.signOut();
    clearAuth();
    clearCart();
    queryClient.clear();
    router.push(redirectTo);
    router.refresh();
  };
}
