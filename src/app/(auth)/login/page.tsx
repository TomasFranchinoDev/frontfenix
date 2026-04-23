import { Suspense } from "react";

import { LoginClient } from "@/src/app/(auth)/login/LoginClient";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="grid min-h-screen grid-cols-1 bg-background text-foreground lg:grid-cols-2">
          <section className="hidden animate-pulse bg-[#EDE3D6] lg:block" />
          <section className="flex items-center justify-center px-6 py-10 sm:px-10 lg:px-14 xl:px-20">
            <div className="w-full max-w-110 space-y-4">
              <h1 className="font-sans text-5xl leading-tight">Iniciar Sesión</h1>
              <p className="font-sans text-sm text-[#5E5750]">Cargando...</p>
            </div>
          </section>
        </main>
      }
    >
      <LoginClient />
    </Suspense>
  );
}
