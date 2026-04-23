"use client";

import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { FileText, Layers3, Truck } from "lucide-react";

import { Badge } from "@/src/components/shared/Badge";
import { EmptyState } from "@/src/components/shared/EmptyState";
import { LoadingSpinner } from "@/src/components/shared/LoadingSpinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/src/components/ui/table";
import { Button } from "@/src/components/ui/button";
import api from "@/src/lib/api/client";
import { cn } from "@/src/lib/utils";

type AdminProduct = {
  id: string;
  nombre: string;
  activo: boolean;
};

type AdminOrder = {
  id: string;
  codigo_orden: string;
  estado: string;
  total: string;
  creado_en: string;
  cliente: {
    nombre_completo: string;
    empresa: string;
    email: string;
  };
};

type DashboardData = {
  products: AdminProduct[];
  orders: AdminOrder[];
};

async function getDashboardData(): Promise<DashboardData> {
  const [productsResponse, ordersResponse] = await Promise.all([
    api.get<AdminProduct[]>("/api/admin/productos"),
    api.get<AdminOrder[]>("/api/admin/ordenes"),
  ]);

  return {
    products: productsResponse.data,
    orders: ordersResponse.data,
  };
}

function formatPrice(value: string): string {
  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    return "$0";
  }

  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(numeric);
}

function statusVariant(status: string): "default" | "muted" | "outline" {
  const upper = status.toUpperCase();

  if (upper === "CONFIRMADA" || upper === "EN_PREPARACION" || upper === "ENVIADA") {
    return "default";
  }

  if (upper === "CANCELADA") {
    return "outline";
  }

  return "muted";
}

export default function AdminDashboardPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: getDashboardData,
  });

  if (isLoading) {
    return <LoadingSpinner label="Cargando dashboard..." className="justify-center py-14" />;
  }

  if (isError || !data) {
    return (
      <EmptyState
        title="No pudimos cargar el dashboard"
        description="Verifica permisos de admin e intenta nuevamente."
      />
    );
  }

  const totalOrders = data.orders.length;
  const totalProducts = data.products.length;
  const pendingOrders = data.orders.filter((order) => order.estado.toUpperCase() === "PENDIENTE").length;
  const shippedOrders = data.orders.filter((order) => order.estado.toUpperCase() === "ENVIADA").length;
  const totalSales = data.orders.reduce((acc, order) => acc + Number(order.total || 0), 0);

  return (
    <div className="space-y-8 pb-8 animate-rise-in">
      <header className="space-y-1">
        <h1 className="font-display text-4xl leading-tight sm:text-5xl">Panel General</h1>
        <p className="text-muted-foreground">Bienvenido, gestiona la arquitectura de empaque hoy.</p>
      </header>

      <section className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <MetricCard
          title="Cotizaciones Activas"
          value={String(totalOrders)}
          subtitle="+12% vs el mes pasado"
          icon={<FileText className="size-4" />}
          tone="primary"
        />
        <MetricCard
          title="Envios Pendientes"
          value={String(pendingOrders)}
          subtitle={`${Math.max(0, pendingOrders - shippedOrders)} prioritarios para hoy`}
          icon={<Truck className="size-4" />}
          tone="muted"
        />
        <MetricCard
          title="Contenidos Actualizados"
          value={String(totalProducts)}
          subtitle="Sincronizado con CRM"
          icon={<Layers3 className="size-4" />}
          tone="accent"
        />
      </section>

      <section className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <Card className="lg:col-span-2 overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-foreground/10 bg-surface-container-low px-6 py-5">
            <div className="flex items-center gap-3">
              <h2 className="font-display text-2xl">Actividad Reciente</h2>
            </div>
            <Button asChild variant="link" className="px-0">
              <Link href="/admin/ordenes">Ver todo</Link>
            </Button>
          </div>

          {data.orders.length === 0 ? (
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">No hay órdenes registradas aún.</p>
            </CardContent>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.orders.slice(0, 8).map((order) => {
                    const initials = (order.cliente.empresa || order.cliente.nombre_completo || "CL")
                      .trim()
                      .split(/\s+/)
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((part) => part[0]?.toUpperCase())
                      .join("");
                    return (
                      <TableRow key={order.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex size-8 items-center justify-center rounded-md bg-muted/70 text-[10px] font-semibold">
                              {initials || "CL"}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">
                                {order.cliente.empresa || order.cliente.nombre_completo}
                              </p>
                              <p className="truncate text-xs text-muted-foreground">{order.codigo_orden}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">Empaque Personalizado</TableCell>
                        <TableCell className="text-sm font-semibold">{formatPrice(order.total)}</TableCell>
                        <TableCell>
                          <StatusPill status={order.estado} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>

        <div className="space-y-6">
          <Card className="relative overflow-hidden border-0 bg-primary text-primary-foreground">
            <CardHeader>
              <CardTitle className="text-2xl">Diseño de Empaque Personalizado</CardTitle>
              <p className="text-sm text-primary-foreground/80">
                Explora las nuevas plantillas estructurales para cartón corrugado de alta resistencia.
              </p>
            </CardHeader>
            <CardContent className="pt-0">
              <Button asChild variant="outline" className="rounded-full bg-primary-foreground text-primary hover:bg-primary-foreground/90">
                <Link href="/catalogo">Ver Catálogo</Link>
              </Button>
            </CardContent>
            <div className="pointer-events-none absolute -right-10 -bottom-10 size-44 rounded-full border-10 border-primary-foreground/10" />
            <div className="pointer-events-none absolute -right-6 -bottom-6 size-28 rounded-full border-4 border-primary-foreground/15" />
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resumen Financiero</CardTitle>
              <p className="text-sm text-muted-foreground">Producción y facturación mensual</p>
            </CardHeader>
            <CardContent>
              <p className="font-display text-4xl">{formatPrice(String(totalSales))}</p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <QuickAction
          href="/admin/ordenes"
          title="Cotizaciones"
          description="Genera presupuestos detallados y gestiona facturación."
          icon={<FileText className="size-6" />}
        />
        <QuickAction
          href="/admin/productos"
          title="Administrar Contenidos"
          description="Actualiza el catálogo de productos y especificaciones técnicas."
          icon={<Layers3 className="size-6" />}
        />
        <QuickAction
          href="/admin/ordenes"
          title="Envios"
          description="Seguimiento en tiempo real y logística de distribución nacional."
          icon={<Truck className="size-6" />}
        />
      </section>

      <section className="grid grid-cols-1 gap-7 overflow-hidden rounded-4xl border border-foreground/10 bg-surface-light p-5 md:grid-cols-[1.2fr_1fr] md:p-7">
        <div className="relative min-h-60 overflow-hidden rounded-3xl bg-[#ceb083]">
          <div className="absolute inset-0 bg-white/10" />
          <div className="absolute bottom-4 right-4 h-20 w-32 overflow-hidden rounded-xl border border-white/25 shadow-lg">
            <Image
              src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=70"
              alt="Centro logístico"
              fill
              sizes="128px"
              className="h-full w-full object-cover"
            />
          </div>
        </div>

        <div className="flex flex-col justify-center">
          <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">Estandares de Calidad</p>
          <h3 className="mt-3 font-display text-4xl leading-tight">Estructuras que Protegen, Diseños que Venden</h3>
          <p className="mt-4 text-muted-foreground">
            Nuestra metodología de arquitectura de empaque combina resistencia mecánica con estética editorial.
            Cada milímetro está calculado para el viaje del cliente final.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button className="rounded-full">Reporte de Calidad</Button>
            <Button variant="outline" className="rounded-full">
              Manual de Marca
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const upper = status.toUpperCase();

  if (upper === "PENDIENTE") {
    return <span className="rounded-full bg-[#efe468] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#4a4200]">En revisión</span>;
  }

  if (upper === "ENVIADA" || upper === "DESPACHADO") {
    return <span className="rounded-full bg-surface-container-high px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Enviado</span>;
  }

  if (upper === "CANCELADA") {
    return <span className="rounded-full bg-red-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-red-700">Cancelada</span>;
  }

  return <Badge variant={statusVariant(status)}>{status}</Badge>;
}

function MetricCard({
  title,
  value,
  subtitle,
  icon,
  tone,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  tone: "primary" | "muted" | "accent";
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-4 p-6">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-2 font-display text-4xl">{value}</p>
          <p className="mt-2 text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <div
          className={cn(
            "flex size-11 items-center justify-center rounded-full",
            tone === "primary" && "bg-primary/10 text-primary",
            tone === "muted" && "bg-muted/50 text-foreground",
            tone === "accent" && "bg-primary/15 text-accent",
          )}
        >
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}

function QuickAction({
  href,
  title,
  description,
  icon,
}: {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group rounded-[1.6rem] border border-foreground/10 bg-surface-light p-1 transition-colors hover:border-primary/30 hover:bg-surface-container-low"
    >
      <div className="flex h-full flex-col items-center rounded-[1.3rem] bg-surface-light p-6 text-center">
        <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-muted/45 text-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
          {icon}
        </div>
        <p className="font-display text-lg">{title}</p>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      </div>
    </Link>
  );
}
