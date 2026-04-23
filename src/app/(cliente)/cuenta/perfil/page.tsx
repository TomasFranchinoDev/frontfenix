"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { EmptyState } from "@/src/components/shared/EmptyState";
import { Footer } from "@/src/components/shared/Footer";
import { LoadingSpinner } from "@/src/components/shared/LoadingSpinner";
import { Navbar } from "@/src/components/shared/Navbar";
import api from "@/src/lib/api/client";

type Profile = {
  id: string;
  email: string;
  nombre_completo: string;
  telefono: string;
  empresa: string;
  creado_en: string;
  es_admin?: boolean;
};

async function getProfile(): Promise<Profile> {
  const { data } = await api.get<Profile>("/api/users/me");
  return data;
}

function formatDate(value: string): string {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

export default function ProfilePage() {
  const { data: profile, isLoading, isError } = useQuery({
    queryKey: ["profile", "me"],
    queryFn: getProfile,
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            Inicio
          </Link>
          <span>/</span>
          <span className="text-foreground">Mi perfil</span>
        </div>

        <header className="mb-8">
          <h1 className="font-sans text-4xl leading-tight sm:text-5xl">Mi perfil</h1>
          <p className="mt-2 text-muted-foreground">Datos de tu cuenta para gestionar pedidos B2B.</p>
        </header>

        {isLoading ? <LoadingSpinner label="Cargando perfil..." className="justify-center py-10" /> : null}

        {isError ? (
          <EmptyState
            title="No pudimos cargar tu perfil"
            description="Intenta nuevamente en unos segundos."
          />
        ) : null}

        {!isLoading && !isError && profile ? (
          <section className="rounded-3xl border border-foreground/10 bg-background p-5 sm:p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-foreground/10 bg-muted/35 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Nombre completo</p>
                <p className="mt-1 text-base font-medium text-foreground">{profile.nombre_completo || "-"}</p>
              </div>

              <div className="rounded-2xl border border-foreground/10 bg-muted/35 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Email</p>
                <p className="mt-1 text-base font-medium text-foreground">{profile.email || "-"}</p>
              </div>

              <div className="rounded-2xl border border-foreground/10 bg-muted/35 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Empresa</p>
                <p className="mt-1 text-base font-medium text-foreground">{profile.empresa || "-"}</p>
              </div>

              <div className="rounded-2xl border border-foreground/10 bg-muted/35 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Telefono</p>
                <p className="mt-1 text-base font-medium text-foreground">{profile.telefono || "-"}</p>
              </div>

              <div className="rounded-2xl border border-foreground/10 bg-muted/35 p-4 sm:col-span-2">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Cliente desde</p>
                <p className="mt-1 text-base font-medium text-foreground">{formatDate(profile.creado_en)}</p>
              </div>
            </div>
          </section>
        ) : null}
      </main>

      <Footer />
    </div>
  );
}
