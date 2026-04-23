"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Badge } from "@/src/components/shared/Badge";
import { EmptyState } from "@/src/components/shared/EmptyState";
import { Footer } from "@/src/components/shared/Footer";
import { LoadingSpinner } from "@/src/components/shared/LoadingSpinner";
import { Navbar } from "@/src/components/shared/Navbar";
import { useMyOrders } from "@/src/hooks/useOrders";
import { useAuthStore } from "@/src/stores/authStore";

function formatPrice(value: string): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return "$0";
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);
}

function formatDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat("es-AR", { dateStyle: "medium", timeStyle: "short" }).format(d);
}

function statusLabel(s: string): string {
  const u = s.toUpperCase();
  if (u === "PENDIENTE") return "Pendiente";
  if (u === "CONFIRMADA") return "Confirmada";
  if (u === "EN_PREPARACION") return "En preparacion";
  if (u === "ENVIADA") return "Enviada";
  if (u === "CANCELADA") return "Cancelada";
  return s;
}

function statusVariant(s: string): "default" | "muted" | "outline" {
  const u = s.toUpperCase();
  if (u === "CONFIRMADA" || u === "EN_PREPARACION" || u === "ENVIADA") return "default";
  if (u === "CANCELADA") return "outline";
  return "muted";
}

export default function MyOrdersPage() {
  const router = useRouter();
  const session = useAuthStore((state) => state.session);
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const initializeAuth = useAuthStore((state) => state.initializeAuth);

  useEffect(() => {
    if (!isInitialized) {
      void initializeAuth();
    }
  }, [initializeAuth, isInitialized]);

  const canFetchOrders = isInitialized && Boolean(session);
  const { data: orders = [], isLoading, isError } = useMyOrders({ enabled: canFetchOrders });
  const isPageLoading = !canFetchOrders || isLoading;

  return (
    <div className="min-h-screen bg-white text-foreground">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="transition-colors hover:text-foreground">Inicio</Link>
          <span className="text-outline-variant">/</span>
          <span className="text-foreground font-medium">Mis ordenes</span>
        </div>
        <header className="mb-8">
          <h1 className="font-sans text-4xl leading-tight sm:text-5xl">Mis ordenes</h1>
          <p className="mt-2 text-muted-foreground">Consulta el estado de tus pedidos realizados.</p>
        </header>

        {isPageLoading ? <LoadingSpinner label="Cargando ordenes..." className="justify-center py-10" /> : null}

        {canFetchOrders && isError ? (
          <EmptyState title="No pudimos cargar tus ordenes" description="Intenta nuevamente en unos segundos." />
        ) : null}

        {canFetchOrders && !isPageLoading && !isError && orders.length === 0 ? (
          <EmptyState
            title="Aun no tienes ordenes"
            description="Cuando completes un checkout, veras aqui el historial de pedidos."
            actionLabel="Ir al catalogo"
            onAction={() => router.push("/")}
          />
        ) : null}

        {canFetchOrders && !isPageLoading && !isError && orders.length > 0 ? (
          <section className="space-y-4">
            {orders.map((order) => (
              <Link
                key={order.codigo_orden}
                href={`/cuenta/mis-ordenes/${order.codigo_orden}`}
                className="block"
              >
                <article
                  className="group rounded-xl border border-outline-variant bg-white p-5 sm:p-6 transition-all hover:bg-surface-container-low hover:border-primary/30 hover:shadow-sm cursor-pointer"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Codigo de orden</p>
                      <h2 className="font-sans text-2xl font-bold text-foreground">{order.codigo_orden}</h2>
                      <p className="text-sm text-muted-foreground">{formatDate(order.creado_en)}</p>
                    </div>
                    <div className="flex flex-col items-start gap-2 sm:items-end">
                      <Badge variant={statusVariant(order.estado)}>{statusLabel(order.estado)}</Badge>
                      <p className="font-bold text-foreground">Total: {formatPrice(order.total)}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-end gap-1 text-xs text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                    <span>Ver detalle</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                  </div>
                </article>
              </Link>
            ))}
          </section>
        ) : null}
      </main>
      <Footer />
    </div>
  );
}
