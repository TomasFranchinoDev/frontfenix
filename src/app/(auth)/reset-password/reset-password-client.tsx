"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/src/components/ui/alert";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { supabase } from "@/src/lib/supabase/client";

function getSafeNextPath(nextValue: string | null): string {
  if (!nextValue || !nextValue.startsWith("/") || nextValue.startsWith("//")) {
    return "/login";
  }
  return nextValue;
}

export function ResetPasswordClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const nextPath = useMemo(() => getSafeNextPath(searchParams.get("next")), [searchParams]);
  const code = searchParams.get("code");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isReady, setIsReady] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<null | { type: "success" | "error"; message: string }>(null);

  useEffect(() => {
    let cancelled = false;

    async function ensureRecoverySession() {
      setStatus(null);

      try {
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            throw error;
          }
        } else {
          await supabase.auth.getSession();
        }
      } catch (error) {
        if (!cancelled) {
          setStatus({
            type: "error",
            message:
              error instanceof Error
                ? error.message
                : "No pudimos validar el enlace de recuperación. Solicita uno nuevo.",
          });
        }
      } finally {
        if (!cancelled) {
          setIsReady(true);
        }
      }
    }

    void ensureRecoverySession();

    return () => {
      cancelled = true;
    };
  }, [code]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(null);

    if (password.length < 8) {
      setStatus({ type: "error", message: "La contraseña debe tener al menos 8 caracteres." });
      return;
    }

    if (password !== confirm) {
      setStatus({ type: "error", message: "Las contraseñas no coinciden." });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        throw error;
      }

      setStatus({ type: "success", message: "Contraseña actualizada. Ya puedes iniciar sesión." });
      setTimeout(() => {
        router.replace(nextPath);
        router.refresh();
      }, 900);
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "No pudimos actualizar tu contraseña.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
        <section className="relative hidden overflow-hidden lg:block">
          <Image
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBnPo-q4-Ks7h3dTVuvzLW8N1Jo6C5J3D33q3yBoabt2jd7thRjGFb2JkvctZFOp_CBWPH-Up6sEs68Ip2f0NHVQ4UX3M1g78cyMWC_I0BOSZ1nsdoMRwhHVbwsQhnB5YIarfoM2H3FToFhq3zWhpIiGC-vPNYrANfvQYUpGPpkVnrRK0QvWb2qSoGq3ZDUGabwwqa0aX39wX2o_PAh3MfbvPLwTEywDD8pvOtYIe1ht09U6UWe2UBm77tKjC5Cfung7P7CfWJk7LdW"
            alt="Detalle de empaque premium sobre fondo crema"
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
              <h1 className="font-sans text-5xl leading-tight text-[#111111]">Restablecer contraseña</h1>
              <p className="font-sans text-base leading-relaxed text-[#5E5750]">
                Define una nueva contraseña para tu cuenta.
              </p>
            </header>

            {!isReady ? (
              <p className="font-sans text-sm text-[#5E5750]">Validando enlace…</p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-6">
                  <div className="space-y-2.5">
                    <Label
                      htmlFor="new-password"
                      className="font-sans text-xs font-semibold tracking-[0.22em] uppercase text-[#2A2621]"
                    >
                      Nueva contraseña
                    </Label>
                    <Input
                      id="new-password"
                      type="password"
                      required
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="••••••••"
                      className="h-12 rounded-none border-0 border-b border-[#D2C7BC] bg-transparent px-0 text-base text-foreground focus-visible:border-primary focus-visible:ring-0"
                    />
                  </div>

                  <div className="space-y-2.5">
                    <Label
                      htmlFor="confirm-password"
                      className="font-sans text-xs font-semibold tracking-[0.22em] uppercase text-[#2A2621]"
                    >
                      Confirmar contraseña
                    </Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      required
                      value={confirm}
                      onChange={(event) => setConfirm(event.target.value)}
                      placeholder="••••••••"
                      className="h-12 rounded-none border-0 border-b border-[#D2C7BC] bg-transparent px-0 text-base text-foreground focus-visible:border-primary focus-visible:ring-0"
                    />
                  </div>
                </div>

                {status ? (
                  <Alert variant={status.type === "success" ? "success" : "destructive"}>
                    <AlertTitle>{status.type === "success" ? "Listo" : "Error"}</AlertTitle>
                    <AlertDescription>{status.message}</AlertDescription>
                  </Alert>
                ) : null}

                <div className="space-y-5 pt-1">
                  <Button
                    type="submit"
                    size="lg"
                    disabled={isSubmitting || (status?.type === "error" && Boolean(code) === false)}
                    className="h-12 w-full rounded-lg bg-primary font-sans text-base font-semibold text-foreground transition-colors hover:bg-[#B9983A]"
                  >
                    {isSubmitting ? "Actualizando..." : "Actualizar contraseña"}
                  </Button>

                  <div className="text-center">
                    <Link href="/login" className="font-sans text-sm text-[#3A352F] underline-offset-4 hover:underline">
                      Volver al login
                    </Link>
                  </div>
                </div>
              </form>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

