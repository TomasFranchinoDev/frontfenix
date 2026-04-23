"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";

import { Badge } from "@/src/components/shared/Badge";
import { Button } from "@/src/components/ui/button";
import api from "@/src/lib/api/client";
import { supabase } from "@/src/lib/supabase/client";
import { useCartStore } from "@/src/stores/cartStore";

type ProfileResponse = {
  id: string;
  email: string;
  nombre_completo: string;
  telefono: string;
  empresa: string;
  es_admin?: boolean;
};

type OrderResponse = {
  codigo_orden: string;
  total: string;
};

type CheckoutStatus = "idle" | "submitting" | "success" | "error";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Ocurrio un error inesperado. Intenta nuevamente.";
}

export function CheckoutForm() {
  const items = useCartStore((state) => state.items);
  const subtotal = useCartStore((state) => state.getSubtotal());
  const toOrderItems = useCartStore((state) => state.toOrderItems);
  const clearCart = useCartStore((state) => state.clearCart);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombreCompleto, setNombreCompleto] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [telefono, setTelefono] = useState("");
  const [calle, setCalle] = useState("");
  const [numero, setNumero] = useState("");
  const [depto, setDepto] = useState("");
  const [codigoPostal, setCodigoPostal] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [telefonoAlternativo, setTelefonoAlternativo] = useState("");
  const [notasCliente, setNotasCliente] = useState("");

  const [status, setStatus] = useState<CheckoutStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [accountMessage, setAccountMessage] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  const itemCount = useMemo(
    () => items.reduce((total, item) => total + item.cantidad, 0),
    [items],
  );

  useEffect(() => {
    let isMounted = true;

    async function preloadLoggedUser() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!isMounted || !session) {
        return;
      }

      try {
        const { data } = await api.get<ProfileResponse>("/api/users/me");

        if (!isMounted) {
          return;
        }

        setIsLoggedIn(true);
        setEmail(data.email ?? "");
        setNombreCompleto(data.nombre_completo ?? "");
        setEmpresa(data.empresa ?? "");
        setTelefono(data.telefono ?? "");
      } catch {
        if (!isMounted) {
          return;
        }

        await supabase.auth.signOut();
        setIsLoggedIn(false);
        setEmail("");
      }
    }

    preloadLoggedUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      if (!isMounted) {
        return;
      }

      if (event === "SIGNED_OUT") {
        setIsLoggedIn(false);
        setPassword("");
        return;
      }

      if (session) {
        setIsLoggedIn(true);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const ensureProfile = async (accessToken?: string): Promise<ProfileResponse> => {
    const config = accessToken
      ? {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      : undefined;

    try {
      const { data } = await api.get<ProfileResponse>("/api/users/me", config);
      return data;
    } catch {
      const trimmedName = nombreCompleto.trim();

      if (!trimmedName) {
        throw new Error("Completa tu nombre para terminar de crear tu cuenta.");
      }

      const { data } = await api.post<ProfileResponse>(
        "/api/users/registro",
        {
          nombre_completo: trimmedName,
          empresa,
          telefono,
        },
        config,
      );

      return data;
    }
  };

  const authenticateForCheckout = async (): Promise<{ accountCreated: boolean }> => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session && isLoggedIn) {
      setIsLoggedIn(false);
      setPassword("");
      throw new Error("Tu sesion fue cerrada. Ingresa tu contraseña para continuar.");
    }

    if (session) {
      try {
        const profileData = await ensureProfile(session.access_token);
        setIsLoggedIn(true);
        setEmail(profileData.email ?? "");
        setNombreCompleto(profileData.nombre_completo ?? "");
        setEmpresa(profileData.empresa ?? "");
        setTelefono(profileData.telefono ?? "");
        return { accountCreated: false };
      } catch {
        await supabase.auth.signOut();
        setIsLoggedIn(false);
      }
    }

    if (!email) {
      throw new Error("Ingresa tu email para continuar.");
    }

    if (!password.trim()) {
      throw new Error("Ingresa tu contraseña para continuar.");
    }

    const signInResult = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (!signInResult.error && signInResult.data.session) {
      const profileData = await ensureProfile(signInResult.data.session.access_token);
      setIsLoggedIn(true);
      setEmail(profileData.email ?? "");
      setNombreCompleto(profileData.nombre_completo ?? "");
      setEmpresa(profileData.empresa ?? "");
      setTelefono(profileData.telefono ?? "");
      return { accountCreated: false };
    }

    if (!nombreCompleto.trim()) {
      throw new Error("Ingresa tu nombre completo para continuar.");
    }

    const signUpResult = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nombre_completo: nombreCompleto,
          empresa,
          telefono,
        },
      },
    });

    if (signUpResult.error) {
      throw new Error("No pudimos autenticarte con esos datos. Verificalos e intenta nuevamente.");
    }

    const signUpUser = signUpResult.data.user;
    const signUpSession = signUpResult.data.session;

    // Supabase can return a user with no identities when the email already exists.
    if (signUpUser && Array.isArray(signUpUser.identities) && signUpUser.identities.length === 0) {
      throw new Error("No pudimos autenticarte con esos datos. Verificalos e intenta nuevamente.");
    }

    if (!signUpSession) {
      const emailConfirmedAt = signUpUser?.email_confirmed_at;

      if (!emailConfirmedAt) {
        throw new Error(
          "Te enviamos un email de confirmacion. Confirma tu cuenta, inicia sesion y luego vuelve a confirmar el pedido.",
        );
      }
    }

    const signInAfterSignUp = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInAfterSignUp.error) {
      const message = signInAfterSignUp.error.message.toLowerCase();

      if (message.includes("invalid login credentials")) {
        throw new Error(
          "No pudimos iniciar sesion automaticamente. Verifica tu email, confirma tu cuenta y vuelve a intentarlo.",
        );
      }

      throw new Error("No pudimos iniciar sesion automaticamente luego del registro.");
    }

    const profileData = await ensureProfile(signInAfterSignUp.data.session?.access_token);
    setIsLoggedIn(true);
    setEmail(profileData.email ?? "");
    setNombreCompleto(profileData.nombre_completo ?? "");
    setEmpresa(profileData.empresa ?? "");
    setTelefono(profileData.telefono ?? "");
    return { accountCreated: true };
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("submitting");
    setErrorMessage("");
    setSuccessMessage("");
    setAccountMessage("");

    try {
      if (items.length === 0) {
        throw new Error("Tu carrito esta vacio.");
      }

      if (!calle.trim() || !numero.trim() || !codigoPostal.trim() || !ciudad.trim()) {
        throw new Error("Completa los campos obligatorios de la dirección de envío (calle, número, código postal y ciudad).");
      }

      if (!telefono.trim()) {
        throw new Error("Ingresa tu teléfono principal.");
      }

      if (!notasCliente.trim()) {
        throw new Error("Ingresa las notas del pedido.");
      }

      // Concatenate address fields into a single formatted string
      const direccionEnvio = [calle.trim(), numero.trim(), depto.trim(), codigoPostal.trim(), ciudad.trim()]
        .filter(Boolean)
        .join(", ");

      const authResult = await authenticateForCheckout();

      if (authResult.accountCreated) {
        setAccountMessage("Cuenta creada automaticamente y sesión iniciada para tu compra.");
      }


      const payload = {
        items: toOrderItems(),
        notas_cliente: notasCliente,
        direccion_envio: direccionEnvio,
        telefono_alternativo: telefonoAlternativo,
        direccion_entrega: direccionEnvio,
        telefono_contacto: telefonoAlternativo,
      };

      const { data } = await api.post<OrderResponse>("/api/orders/crear", payload);

      clearCart();
      setStatus("success");
      setSuccessMessage(`Orden ${data.codigo_orden} creada correctamente.`);

      const whatsappText = encodeURIComponent(
        `Hola Fenix, quiero avanzar con la orden ${data.codigo_orden}.`,
      );

      window.open(`https://wa.me/543493417510?text=${whatsappText}`, '_blank');

      // Navigate to success page
      router.push(`/checkout/exito?orden=${data.codigo_orden}`);
    } catch (error) {
      setStatus("error");
      setErrorMessage(getErrorMessage(error));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <section className="space-y-5 rounded-3xl border border-foreground/10 bg-background p-5 sm:p-6">
        <div className="space-y-2">
          <h2 className="font-sans text-3xl text-foreground">Datos para tu pedido</h2>
          <p className="text-sm text-muted-foreground">
            Completamos tu checkout en un solo paso y confirmamos por WhatsApp.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="space-y-2 sm:col-span-2">
            <span className="text-sm text-foreground">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-11 w-full rounded-xl border border-foreground/15 bg-background px-3 text-sm outline-none transition focus:border-primary"
              placeholder="tu@email.com"
              disabled={isLoggedIn}
            />
          </label>

          {!isLoggedIn ? (
            <label className="space-y-2 sm:col-span-2">
              <span className="text-sm text-foreground">Contraseña (para acceder o crear tu cuenta)</span>
              <input
                type="password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-11 w-full rounded-xl border border-foreground/15 bg-background px-3 text-sm outline-none transition focus:border-primary"
                placeholder="Tu contraseña"
              />
            </label>
          ) : null}

          <label className="space-y-2">
            <span className="text-sm text-foreground">Nombre completo</span>
            <input
              type="text"
              required
              value={nombreCompleto}
              onChange={(event) => setNombreCompleto(event.target.value)}
              className="h-11 w-full rounded-xl border border-foreground/15 bg-background px-3 text-sm outline-none transition focus:border-primary"
              placeholder="Nombre y apellido"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm text-foreground">Empresa <span className="text-xs text-muted-foreground">(opcional)</span></span>
            <input
              type="text"
              value={empresa}
              onChange={(event) => setEmpresa(event.target.value)}
              className="h-11 w-full rounded-xl border border-foreground/15 bg-background px-3 text-sm outline-none transition focus:border-primary"
              placeholder="Nombre del comercio"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm text-foreground">Telefono principal *</span>
            <input
              type="tel"
              required
              value={telefono}
              onChange={(event) => setTelefono(event.target.value)}
              className="h-11 w-full rounded-xl border border-foreground/15 bg-background px-3 text-sm outline-none transition focus:border-primary"
              placeholder="11 1234 5678"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm text-foreground">Telefono alternativo <span className="text-xs text-muted-foreground">(opcional)</span></span>
            <input
              type="tel"
              value={telefonoAlternativo}
              onChange={(event) => setTelefonoAlternativo(event.target.value)}
              className="h-11 w-full rounded-xl border border-foreground/15 bg-background px-3 text-sm outline-none transition focus:border-primary"
              placeholder="Opcional"
            />
          </label>

          <div className="sm:col-span-2 space-y-3">
            <p className="text-sm font-medium text-foreground">Dirección de envío</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-6">
              <label className="space-y-1.5 sm:col-span-3">
                <span className="text-xs text-muted-foreground">Calle *</span>
                <input
                  type="text"
                  required
                  value={calle}
                  onChange={(event) => setCalle(event.target.value)}
                  className="h-11 w-full rounded-xl border border-foreground/15 bg-background px-3 text-sm outline-none transition focus:border-primary"
                  placeholder="Av. Corrientes"
                />
              </label>
              <label className="space-y-1.5 sm:col-span-1">
                <span className="text-xs text-muted-foreground">Número *</span>
                <input
                  type="text"
                  required
                  value={numero}
                  onChange={(event) => setNumero(event.target.value)}
                  className="h-11 w-full rounded-xl border border-foreground/15 bg-background px-3 text-sm outline-none transition focus:border-primary"
                  placeholder="1234"
                />
              </label>
              <label className="space-y-1.5 sm:col-span-2">
                <span className="text-xs text-muted-foreground">Depto (opcional)</span>
                <input
                  type="text"
                  value={depto}
                  onChange={(event) => setDepto(event.target.value)}
                  className="h-11 w-full rounded-xl border border-foreground/15 bg-background px-3 text-sm outline-none transition focus:border-primary"
                  placeholder="2° B"
                />
              </label>
              <label className="space-y-1.5 sm:col-span-3">
                <span className="text-xs text-muted-foreground">Ciudad *</span>
                <input
                  type="text"
                  required
                  value={ciudad}
                  onChange={(event) => setCiudad(event.target.value)}
                  className="h-11 w-full rounded-xl border border-foreground/15 bg-background px-3 text-sm outline-none transition focus:border-primary"
                  placeholder="Buenos Aires"
                />
              </label>
              <label className="space-y-1.5 sm:col-span-3">
                <span className="text-xs text-muted-foreground">Código Postal *</span>
                <input
                  type="text"
                  required
                  value={codigoPostal}
                  onChange={(event) => setCodigoPostal(event.target.value)}
                  className="h-11 w-full rounded-xl border border-foreground/15 bg-background px-3 text-sm outline-none transition focus:border-primary"
                  placeholder="C1000"
                />
              </label>
            </div>
          </div>

          <label className="space-y-2 sm:col-span-2">
            <span className="text-sm text-foreground">Notas del pedido *</span>
            <textarea
              required
              value={notasCliente}
              onChange={(event) => setNotasCliente(event.target.value)}
              className="min-h-24 w-full rounded-xl border border-foreground/15 bg-background px-3 py-2 text-sm outline-none transition focus:border-primary"
              placeholder="Detalles adicionales para la orden"
            />
          </label>
        </div>
      </section>

      <aside className="h-fit space-y-4 rounded-3xl border border-foreground/10 bg-muted/35 p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-sans text-3xl text-foreground">Resumen</h3>
          <Badge variant="muted">{itemCount} items</Badge>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span className="font-medium text-foreground">
              {new Intl.NumberFormat("es-AR", {
                style: "currency",
                currency: "ARS",
                maximumFractionDigits: 0,
              }).format(subtotal)}
            </span>
          </div>
          <div className="flex items-center justify-between text-muted-foreground">
            <span>Envio</span>
            <span className="font-medium text-foreground">A coordinar</span>
          </div>
        </div>

        <div className="h-px bg-foreground/10" />

        <Button type="submit" className="w-full" size="lg" disabled={status === "submitting" || items.length === 0}>
          {status === "submitting" ? "Procesando..." : "Confirmar pedido"}
        </Button>

        {accountMessage ? <p className="text-sm text-amber-800">{accountMessage}</p> : null}
        {errorMessage ? <p className="text-sm text-red-700">{errorMessage}</p> : null}
        {successMessage ? <p className="text-sm text-green-700">{successMessage}</p> : null}
      </aside>
    </form>
  );
}
