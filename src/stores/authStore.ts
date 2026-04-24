import { create } from "zustand";
import type { Session } from "@supabase/supabase-js";

import api from "@/src/lib/api/client";
import { supabase } from "@/src/lib/supabase/client";

export type AuthProfile = {
  id: string;
  email: string;
  nombre_completo: string;
  telefono: string;
  empresa: string;
  es_admin?: boolean;
};

type AuthState = {
  session: Session | null;
  profile: AuthProfile | null;
  isLoading: boolean;
  isInitialized: boolean;
  isAdmin: boolean;
  setSession: (session: Session | null) => void;
  setProfile: (profile: AuthProfile | null) => void;
  fetchProfile: () => Promise<AuthProfile | null>;
  updateProfile: (updates: Partial<AuthProfile>) => Promise<AuthProfile | null>;
  initializeAuth: () => Promise<void>;
  clearAuth: () => void;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  profile: null,
  isLoading: false,
  isInitialized: false,
  isAdmin: false,
  setSession: (session) => {
    set({ session, isAdmin: get().profile?.es_admin === true });
  },
  setProfile: (profile) => {
    set({ profile, isAdmin: profile?.es_admin === true });
  },
  fetchProfile: async () => {
    if (!get().session) {
      set({ profile: null, isAdmin: false });
      return null;
    }

    try {
      const { data } = await api.get<AuthProfile>("/api/users/me");
      set({ profile: data, isAdmin: data.es_admin === true });
      return data;
    } catch (error) {
      console.error("Failed to fetch profile", error);
      set({ profile: null, isAdmin: false });
      return null;
    }
  },
  updateProfile: async (updates) => {
    try {
      const { data } = await api.put<AuthProfile>("/api/users/me", updates);
      set({ profile: data, isAdmin: data.es_admin === true });
      return data;
    } catch (error) {
      console.error("Failed to update profile", error);
      throw error;
    }
  },
  initializeAuth: async () => {
    set({ isLoading: true });

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        set({
          session: null,
          profile: null,
          isAdmin: false,
          isInitialized: true,
          isLoading: false,
        });
        return;
      }

      set({ session });
      await get().fetchProfile();
      set({ isInitialized: true, isLoading: false });
    } catch {
      set({
        session: null,
        profile: null,
        isAdmin: false,
        isInitialized: true,
        isLoading: false,
      });
    }
  },
  clearAuth: () => {
    set({
      session: null,
      profile: null,
      isAdmin: false,
      isInitialized: true,
      isLoading: false,
    });
  },
}));
