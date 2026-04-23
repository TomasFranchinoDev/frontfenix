"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { Footer } from "@/src/components/shared/Footer";
import { LoadingSpinner } from "@/src/components/shared/LoadingSpinner";
import { Navbar } from "@/src/components/shared/Navbar";
import { Toast } from "@/src/components/shared/Toast";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { useAuthStore } from "@/src/stores/authStore";

type ProfileFormState = {
  nombre_completo: string;
  telefono: string;
  empresa: string;
};

const EMPTY_FORM: ProfileFormState = {
  nombre_completo: "",
  telefono: "",
  empresa: "",
};

export default function MiPerfilPage() {
  const session = useAuthStore((state) => state.session);
  const profile = useAuthStore((state) => state.profile);
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  const fetchProfile = useAuthStore((state) => state.fetchProfile);
  const updateProfile = useAuthStore((state) => state.updateProfile);

  const [formData, setFormData] = useState<ProfileFormState | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingProfile, setIsFetchingProfile] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [isToastVisible, setIsToastVisible] = useState(false);

  useEffect(() => {
    if (!isInitialized) {
      void initializeAuth();
    }
  }, [initializeAuth, isInitialized]);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      if (!(isInitialized && session && !profile)) {
        return;
      }

      setIsFetchingProfile(true);
      try {
        await fetchProfile();
      } finally {
        if (isMounted) {
          setIsFetchingProfile(false);
        }
      }
    };

    void loadProfile();

    return () => {
      isMounted = false;
    };
  }, [fetchProfile, isInitialized, profile, session]);

  const isBusy = !isInitialized || isFetchingProfile;

  const resolvedFormData = useMemo<ProfileFormState>(() => {
    if (formData) {
      return formData;
    }

    if (!profile) {
      return EMPTY_FORM;
    }

    return {
      nombre_completo: profile.nombre_completo ?? "",
      telefono: profile.telefono ?? "",
      empresa: profile.empresa ?? "",
    };
  }, [formData, profile]);

  const isDirty = useMemo(() => {
    if (!profile) {
      return false;
    }

    return (
      (profile.nombre_completo ?? "") !== resolvedFormData.nombre_completo
      || (profile.telefono ?? "") !== resolvedFormData.telefono
      || (profile.empresa ?? "") !== resolvedFormData.empresa
    );
  }, [profile, resolvedFormData]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...(previous ?? resolvedFormData), [name]: value }));
  };

  const openToast = (message: string) => {
    setToastMessage(message);
    setIsToastVisible(true);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload: ProfileFormState = {
      nombre_completo: resolvedFormData.nombre_completo.trim(),
      telefono: resolvedFormData.telefono.trim(),
      empresa: resolvedFormData.empresa.trim(),
    };

    if (!payload.nombre_completo) {
      openToast("El nombre completo es obligatorio.");
      return;
    }

    setIsSubmitting(true);
    setIsToastVisible(false);

    try {
      await updateProfile(payload);
      setFormData(null);
      openToast("Perfil actualizado correctamente.");
    } catch {
      openToast("No se pudo actualizar tu perfil. Intenta nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetryProfile = async () => {
    if (!session) {
      return;
    }

    setIsFetchingProfile(true);
    try {
      await fetchProfile();
    } finally {
      setIsFetchingProfile(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-foreground">
      <Navbar />

      <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="transition-colors hover:text-foreground">Inicio</Link>
          <span className="text-outline-variant">/</span>
          <span className="font-medium text-foreground">Mi perfil</span>
        </div>

        <header className="mb-8">
          <h1 className="font-sans text-4xl leading-tight sm:text-5xl">Mi perfil</h1>
          <p className="mt-2 text-muted-foreground">Visualiza y actualiza tus datos personales.</p>
        </header>

        {isBusy ? (
          <Card className="max-w-3xl">
            <CardContent className="py-10">
              <LoadingSpinner label="Cargando perfil..." className="justify-center" />
            </CardContent>
          </Card>
        ) : null}

        {!isBusy && !profile ? (
          <Card className="max-w-3xl">
            <CardHeader>
              <CardTitle>No pudimos cargar tu perfil</CardTitle>
              <CardDescription>Intenta nuevamente en unos segundos.</CardDescription>
            </CardHeader>
            <CardFooter>
              <Button type="button" variant="outline" onClick={() => void handleRetryProfile()}>
                Reintentar
              </Button>
            </CardFooter>
          </Card>
        ) : null}

        {!isBusy && profile ? (
          <Card className="max-w-3xl">
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-5 pt-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Correo electronico</Label>
                  <Input id="email" type="email" value={profile.email} readOnly disabled className="bg-surface-container-low" />
                  <p className="text-xs text-muted-foreground">El correo se administra desde tu cuenta de autenticacion.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nombre_completo">Nombre completo</Label>
                  <Input
                    id="nombre_completo"
                    name="nombre_completo"
                    value={resolvedFormData.nombre_completo}
                    onChange={handleChange}
                    maxLength={200}
                    required
                    placeholder="Ej. Ana Blanco"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefono">Telefono / WhatsApp</Label>
                  <Input
                    id="telefono"
                    name="telefono"
                    value={resolvedFormData.telefono}
                    onChange={handleChange}
                    maxLength={50}
                    placeholder="Ej. +54 9 11 1234-5678"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="empresa">Empresa o negocio</Label>
                  <Input
                    id="empresa"
                    name="empresa"
                    value={resolvedFormData.empresa}
                    onChange={handleChange}
                    maxLength={200}
                    placeholder="Nombre de tu empresa"
                  />
                </div>
              </CardContent>

              <CardFooter className="justify-end gap-3 border-t border-outline-variant/45 pt-6">
                <Button
                  type="submit"
                  disabled={isSubmitting || !isDirty}
                >
                  {isSubmitting ? "Guardando..." : "Guardar cambios"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        ) : null}
      </main>

      <Footer />

      <Toast
        message={toastMessage}
        visible={isToastVisible}
        onClose={() => setIsToastVisible(false)}
      />
    </div>
  );
}
