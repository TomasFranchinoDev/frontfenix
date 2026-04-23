"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";

import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/src/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { supabase } from "@/src/lib/supabase/client";
import { useAuthStore } from "@/src/stores/authStore";

function getSafeNextPath(nextValue: string | null): string {
  if (!nextValue || !nextValue.startsWith("/") || nextValue.startsWith("//")) {
    return "/";
  }

  return nextValue;
}

export function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setSession = useAuthStore((state) => state.setSession);
  const fetchProfile = useAuthStore((state) => state.fetchProfile);

  const nextPath = useMemo(() => getSafeNextPath(searchParams.get("next")), [searchParams]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isRecoveryOpen, setIsRecoveryOpen] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [recoveryStatus, setRecoveryStatus] = useState<null | { type: "success" | "error"; message: string }>(null);
  const [isRecoverySubmitting, setIsRecoverySubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw new Error("Credenciales inválidas. Revisa email y contraseña.");
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      setSession(session);
      if (session) {
        await fetchProfile();
      }

      router.replace(nextPath);
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "No pudimos iniciar sesión.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordRecovery = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRecoveryStatus(null);
    setIsRecoverySubmitting(true);

    try {
      const redirectTo =
        typeof window !== "undefined"
          ? (() => {
              const callbackUrl = new URL("/auth/callback", window.location.origin);
              callbackUrl.searchParams.set("next", "/reset-password");
              callbackUrl.searchParams.set("redirect", nextPath === "/" ? "/login" : nextPath);
              return callbackUrl.toString();
            })()
          : undefined;

      const { error } = await supabase.auth.resetPasswordForEmail(recoveryEmail, {
        redirectTo,
      });

      if (error) {
        throw error;
      }

      setRecoveryStatus({
        type: "success",
        message: "Te enviamos un enlace a tu correo para restablecer la contraseña.",
      });
    } catch (error) {
      setRecoveryStatus({
        type: "error",
        message: error instanceof Error ? error.message : "No pudimos enviar el correo de recuperación.",
      });
    } finally {
      setIsRecoverySubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
        <section className="relative hidden overflow-hidden lg:block">
          <Image
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBnPo-q4-Ks7h3dTVuvzLW8N1Jo6C5J3D33q3yBoabt2jd7thRjGFb2JkvctZFOp_CBWPH-Up6sEs68Ip2f0NHVQ4UX3M1g78cyMWC_I0BOSZ1nsdoMRwhHVbwsQhnB5YIarfoM2H3FToFhq3zWhpIiGC-vPNYrANfvQYUpGPpkVnrRK0QvWb2qSoGq3ZDUGabwwqa0aX39wX2o_PAh3MfbvPLwTEywDD8pvOtYIe1ht09U6UWe2UBm77tKjC5Cfung7P7CfWJk7LdW"
            alt="Caja de empaque minimalista sobre fondo crema"
            fill
            priority
            className="object-cover"
            sizes="50vw"
          />
          <div className="absolute inset-0 bg-black/10" />

          <div className="relative z-10 flex h-full flex-col justify-between p-10 xl:p-14">
            <p className="font-sans text-3xl font-semibold tracking-tight text-[#0F1419]">Fenix Envases</p>
            <h2 className="max-w-sm font-sans text-5xl leading-[1.05] text-[#0F1419]">Arquitectura en Empaque.</h2>
          </div>
        </section>

        <section className="flex items-center justify-center px-6 py-10 sm:px-10 lg:px-14 xl:px-20">
          <div className="w-full max-w-110 space-y-10">
            <div className="space-y-3 lg:hidden">
              <p className="font-sans text-2xl font-semibold tracking-tight text-[#0F1419]">Fenix Envases</p>
              <p className="font-sans text-4xl leading-tight text-[#0F1419]">Arquitectura en Empaque.</p>
            </div>

            <header className="space-y-3">
              <h1 className="font-sans text-5xl leading-tight text-[#111111]">Iniciar Sesión</h1>
              <p className="font-sans text-base leading-relaxed text-[#5E5750]">
                Accede a tu panel de control y gestiona tus proyectos.
              </p>
            </header>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-6">
                <div className="space-y-2.5">
                  <Label htmlFor="email" className="font-sans text-xs font-semibold tracking-[0.22em] uppercase text-[#2A2621]">
                    Correo Electrónico
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="tu@correo.com"
                    className="h-12 rounded-none border-0 border-b border-[#D2C7BC] bg-transparent px-0 text-base text-foreground focus-visible:border-primary focus-visible:ring-0"
                  />
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-4">
                    <Label
                      htmlFor="password"
                      className="font-sans text-xs font-semibold tracking-[0.22em] uppercase text-[#2A2621]"
                    >
                      Contraseña
                    </Label>
                    <button
                      type="button"
                      onClick={() => {
                        setRecoveryEmail(email);
                        setRecoveryStatus(null);
                        setIsRecoveryOpen(true);
                      }}
                      className="font-sans text-sm font-medium text-[#7A6327] transition-colors hover:text-primary"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="••••••••"
                    className="h-12 rounded-none border-0 border-b border-[#D2C7BC] bg-transparent px-0 text-base text-foreground focus-visible:border-primary focus-visible:ring-0"
                  />
                </div>
              </div>

              {errorMessage ? (
                <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{errorMessage}</p>
              ) : null}

              <div className="space-y-5 pt-1">
                <Button
                  type="submit"
                  size="lg"
                  disabled={isSubmitting}
                  className="h-12 w-full rounded-lg bg-[#B9983A] font-sans text-base font-semibold text-foreground transition-colors hover:bg-[#CAA94B]"
                >
                  {isSubmitting ? "Ingresando..." : "Log In"}
                </Button>

                <p className="text-center font-sans text-sm text-[#5E5750]">
                  ¿No tienes una cuenta?{" "}
                  <Link href="/checkout" className="font-semibold text-[#7A6327] transition-colors hover:text-primary">
                    Crear cuenta
                  </Link>
                </p>

                <div className="text-center">
                  <Link href="/" className="font-sans text-sm text-[#3A352F] underline-offset-4 hover:underline">
                    Volver al inicio
                  </Link>
                </div>
              </div>
            </form>

            <Dialog open={isRecoveryOpen} onOpenChange={setIsRecoveryOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Recuperar contraseña</DialogTitle>
                  <DialogDescription>
                    Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handlePasswordRecovery} className="space-y-5">
                  <div className="space-y-2.5">
                    <Label
                      htmlFor="recovery-email"
                      className="font-sans text-xs font-semibold tracking-[0.22em] uppercase text-[#2A2621]"
                    >
                      Correo Electrónico
                    </Label>
                    <Input
                      id="recovery-email"
                      type="email"
                      required
                      autoComplete="email"
                      value={recoveryEmail}
                      onChange={(event) => setRecoveryEmail(event.target.value)}
                      placeholder="tu@correo.com"
                      className="h-12 rounded-none border-0 border-b border-[#D2C7BC] bg-transparent px-0 text-base text-foreground focus-visible:border-primary focus-visible:ring-0"
                    />
                  </div>

                  {recoveryStatus ? (
                    <Alert variant={recoveryStatus.type === "success" ? "success" : "destructive"}>
                      <AlertTitle>{recoveryStatus.type === "success" ? "Listo" : "Error"}</AlertTitle>
                      <AlertDescription>{recoveryStatus.message}</AlertDescription>
                    </Alert>
                  ) : null}

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-12 rounded-lg"
                      onClick={() => setIsRecoveryOpen(false)}
                    >
                      Volver
                    </Button>
                    <Button
                      type="submit"
                      size="lg"
                      disabled={isRecoverySubmitting}
                      className="h-12 rounded-lg bg-primary font-sans text-base font-semibold text-foreground transition-colors hover:bg-[#B9983A]"
                    >
                      {isRecoverySubmitting ? "Enviando..." : "Enviar enlace"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </section>
      </div>
    </main>
  );
}

