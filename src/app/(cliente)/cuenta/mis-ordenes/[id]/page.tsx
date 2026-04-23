"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { Badge } from "@/src/components/shared/Badge";
import { EmptyState } from "@/src/components/shared/EmptyState";
import { Footer } from "@/src/components/shared/Footer";
import { LoadingSpinner } from "@/src/components/shared/LoadingSpinner";
import { Navbar } from "@/src/components/shared/Navbar";
import { useOrderDetail } from "@/src/hooks/useOrders";
import type { OrderDetailItem } from "@/src/lib/api/orders";
import { useAuthStore } from "@/src/stores/authStore";

/* ─── Formatters ─── */

function formatPrice(value: string | number): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return "$0";
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(d);
}

function statusLabel(s: string): string {
  const u = s.toUpperCase();
  if (u === "PENDIENTE") return "Pendiente";
  if (u === "CONFIRMADA") return "Confirmada";
  if (u === "EN_PREPARACION") return "En preparación";
  if (u === "ENVIADA") return "Enviada";
  if (u === "DESPACHADO") return "Despachado";
  if (u === "LISTO") return "Listo para envío/retiro";
  if (u === "CANCELADA") return "Cancelada";
  return s;
}

function statusVariant(s: string): "default" | "muted" | "outline" {
  const u = s.toUpperCase();
  if (u === "CONFIRMADA" || u === "EN_PREPARACION" || u === "ENVIADA" || u === "DESPACHADO" || u === "LISTO")
    return "default";
  if (u === "CANCELADA") return "outline";
  return "muted";
}

/* ─── Detail-row helper ─── */

function DetailRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-3">
      <dt className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground whitespace-nowrap">
        {label}
      </dt>
      <dd className="text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}

/* ─── Product item row ─── */

function ItemRow({ item }: { item: OrderDetailItem }) {
  return (
    <div className="flex items-start justify-between gap-4 py-4 border-b border-outline-variant/50 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground truncate">{item.nombre}</p>
        <p className="text-xs text-muted-foreground mt-0.5">SKU: {item.sku}</p>
        {Object.keys(item.variantes).length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {Object.entries(item.variantes).map(([key, val]) => (
              <span
                key={key}
                className="inline-flex items-center rounded-md bg-surface-container px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
              >
                {key}: {String(val)}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm text-muted-foreground">
          {item.cantidad} × {formatPrice(item.precio_unitario)}
        </p>
        <p className="text-sm font-bold text-foreground mt-0.5">
          {formatPrice(item.subtotal)}
        </p>
      </div>
    </div>
  );
}

/* ─── Page ─── */

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const codigoOrden = params.id;

  const session = useAuthStore((state) => state.session);
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const initializeAuth = useAuthStore((state) => state.initializeAuth);

  useEffect(() => {
    if (!isInitialized) {
      void initializeAuth();
    }
  }, [initializeAuth, isInitialized]);

  const canFetchOrder = isInitialized && Boolean(session) && Boolean(codigoOrden);
  const { data: order, isLoading, isError } = useOrderDetail(codigoOrden, { enabled: canFetchOrder });
  const isPageLoading = !canFetchOrder || isLoading;

  return (
    <div className="min-h-screen bg-white text-foreground">
      <Navbar />
      <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="transition-colors hover:text-foreground">
            Inicio
          </Link>
          <span className="text-outline-variant">/</span>
          <Link href="/cuenta/mis-ordenes" className="transition-colors hover:text-foreground">
            Mis ordenes
          </Link>
          <span className="text-outline-variant">/</span>
          <span className="text-foreground font-medium">{codigoOrden}</span>
        </nav>

        {/* Back link */}
        <button
          type="button"
          onClick={() => router.push("/cuenta/mis-ordenes")}
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground group cursor-pointer"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-transform group-hover:-translate-x-0.5"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
          Volver a mis ordenes
        </button>

        {/* Loading */}
        {isPageLoading && (
          <LoadingSpinner
            label="Cargando detalle de la orden..."
            className="justify-center py-20"
          />
        )}

        {/* Error */}
        {canFetchOrder && isError && (
          <EmptyState
            title="No pudimos cargar esta orden"
            description="Es posible que la orden no exista o que no tengas permisos para verla."
            actionLabel="Volver a mis ordenes"
            onAction={() => router.push("/cuenta/mis-ordenes")}
          />
        )}

        {/* Order detail */}
        {canFetchOrder && !isPageLoading && !isError && order && (
          <div className="animate-rise-in space-y-6">
            {/* Header card */}
            <div className="rounded-2xl border border-outline-variant bg-white p-6 sm:p-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    Numero de orden
                  </p>
                  <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground mt-1">
                    {order.codigo_orden}
                  </h1>
                </div>
                <Badge
                  variant={statusVariant(order.estado)}
                  className="text-xs px-4 py-1.5"
                >
                  {statusLabel(order.estado)}
                </Badge>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <DetailRow label="Estado actual" value={statusLabel(order.estado)} />
                <DetailRow label="Fecha de creación" value={formatDate(order.creado_en)} />
                <DetailRow label="Última actualización" value={formatDate(order.actualizado_en)} />
              </div>

              <div className="mt-6 pt-6 border-t border-outline-variant">
                <div className="flex items-baseline justify-between">
                  <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    Precio total
                  </span>
                  <span className="font-display text-3xl font-bold text-foreground">
                    {formatPrice(order.total)}
                  </span>
                </div>
              </div>
            </div>

            {/* Items card */}
            {order.detalle_carrito?.items && order.detalle_carrito.items.length > 0 && (
              <div className="rounded-2xl border border-outline-variant bg-white p-6 sm:p-8">
                <h2 className="font-display text-lg font-bold text-foreground mb-1">
                  Productos del pedido
                </h2>
                <p className="text-xs text-muted-foreground mb-4">
                  {order.detalle_carrito.items.length}{" "}
                  {order.detalle_carrito.items.length === 1 ? "producto" : "productos"}
                </p>
                <div>
                  {order.detalle_carrito.items.map((item) => (
                    <ItemRow key={item.producto_id} item={item} />
                  ))}
                </div>
              </div>
            )}

            {/* Additional info card */}
            {(order.direccion_entrega || order.telefono_contacto || order.notas_cliente) && (
              <div className="rounded-2xl border border-outline-variant bg-white p-6 sm:p-8">
                <h2 className="font-display text-lg font-bold text-foreground mb-4">
                  Información adicional
                </h2>
                <dl className="space-y-3">
                  <DetailRow label="Dirección de entrega" value={order.direccion_entrega} />
                  <DetailRow label="Teléfono de contacto" value={order.telefono_contacto} />
                  <DetailRow label="Notas" value={order.notas_cliente} />
                </dl>
              </div>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
