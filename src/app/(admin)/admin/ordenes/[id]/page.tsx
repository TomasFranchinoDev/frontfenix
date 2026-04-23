"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react"; // ← sacás useEffect

import { Badge } from "@/src/components/shared/Badge";
import { EmptyState } from "@/src/components/shared/EmptyState";
import { LoadingSpinner } from "@/src/components/shared/LoadingSpinner";
import { Button } from "@/src/components/ui/button";
import api from "@/src/lib/api/client";

type OrderItem = {
  producto_id: string;
  sku: string;
  nombre: string;
  precio_unitario: string | number;
  cantidad: number;
  variantes: Record<string, unknown>; // ← fix any
  subtotal: string | number;
};

type AdminOrderDetail = {
  id: string;
  codigo_orden: string;
  estado: string;
  total: string;
  detalle_carrito: {
    items: OrderItem[];
    [key: string]: unknown; // ← fix any
  };
  notas_cliente: string;
  creado_en: string;
  cliente: {
    id: string;
    email: string;
    nombre_completo: string;
    telefono: string;
    empresa: string;
  };
};

const ORDER_STATES = [
  "PENDIENTE",
  "EN_PREPARACION",
  "LISTO",
  "DESPACHADO",
  "CANCELADA",
] as const;

function formatPrice(value: string | number): string {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "$0";
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(numeric);
}

function formatDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

function stateLabel(state: string): string {
  const stateMap: Record<string, string> = {
    PENDIENTE: "Pendiente",
    EN_PREPARACION: "En preparacion",
    LISTO: "Listo",
    DESPACHADO: "Despachado",
    CANCELADA: "Cancelada",
  };
  return stateMap[state] ?? state;
}

function stateBadgeVariant(state: string): "default" | "muted" | "outline" {
  if (state === "CANCELADA") return "outline";
  if (state === "LISTO" || state === "DESPACHADO") return "default";
  return "muted";
}

async function getAdminOrder(id: string): Promise<AdminOrderDetail> {
  const { data } = await api.get<AdminOrderDetail>(`/api/admin/ordenes/${id}`);
  return data;
}

// ─── Componente editor (recibe la orden ya cargada) ──────────────
function OrderEditor({ order }: { order: AdminOrderDetail }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  // ✅ Estado inicializado directo desde props — sin useEffect
  const [estado, setEstado] = useState<string>(order.estado);
  const [items, setItems] = useState<OrderItem[]>(order.detalle_carrito.items || []);
  const [total, setTotal] = useState<number>(Number(order.total) || 0);

  const handleQuantityChange = (index: number, newQty: number) => {
    const qty = Math.max(1, newQty);
    const newItems = [...items];
    newItems[index].cantidad = qty;
    newItems[index].subtotal = qty * Number(newItems[index].precio_unitario);
    setItems(newItems);
    recalculateTotal(newItems);
  };

  const handlePriceChange = (index: number, newPrice: number) => {
    const price = Math.max(0, newPrice);
    const newItems = [...items];
    newItems[index].precio_unitario = price;
    newItems[index].subtotal = newItems[index].cantidad * price;
    setItems(newItems);
    recalculateTotal(newItems);
  };

  const handleDelete = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
    recalculateTotal(newItems);
  };

  const recalculateTotal = (currentItems: OrderItem[]) => {
    const newTotal = currentItems.reduce((acc, item) => acc + Number(item.subtotal), 0);
    setTotal(newTotal);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        estado,
        detalle_carrito: { ...order.detalle_carrito, items },
        total,
      };
      await api.put(`/api/admin/ordenes/${order.id}`, payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
      await queryClient.invalidateQueries({ queryKey: ["admin", "order", order.id] });
      router.push("/admin/ordenes");
    },
  });

  const clientName = order.cliente.empresa || order.cliente.nombre_completo;

  return (
    <div className="space-y-6 animate-rise-in max-w-4xl">
      <Link
        href="/admin/ordenes"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m15 18-6-6 6-6" />
        </svg>
        Volver a ordenes
      </Link>

      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Detalle de la orden</p>
          <h1 className="mt-2 font-display text-3xl leading-tight text-foreground sm:text-4xl">
            {order.codigo_orden}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Creada el {formatDate(order.creado_en)}</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            Estado
            <select
              className="h-10 rounded-xl border border-foreground/15 bg-surface-light px-3 text-sm text-foreground outline-none focus:border-primary"
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
            >
              {ORDER_STATES.map((s) => (
                <option key={s} value={s}>{stateLabel(s)}</option>
              ))}
            </select>
          </label>
        </div>
      </header>

      <div className="rounded-[1.55rem] border border-foreground/10 bg-surface-light p-6 shadow-[0_8px_22px_rgba(24,22,17,0.05)]">
        <h2 className="font-display text-lg font-semibold text-foreground mb-4">Información del Cliente</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Nombre / Empresa</p>
            <p className="text-sm font-medium text-foreground mt-1">{clientName}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Email</p>
            <p className="text-sm font-medium text-foreground mt-1">{order.cliente.email}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Teléfono</p>
            <p className="text-sm font-medium text-foreground mt-1">
              {order.cliente.telefono || (order.detalle_carrito.telefono_contacto as string) || "-"}
            </p>
          </div>
        </div>
        {order.notas_cliente && (
          <div className="mt-4 pt-4 border-t border-foreground/10">
            <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Notas del cliente</p>
            <p className="text-sm text-foreground mt-1">{order.notas_cliente}</p>
          </div>
        )}
      </div>

      <div className="rounded-[1.55rem] border border-foreground/10 bg-surface-light p-6 shadow-[0_8px_22px_rgba(24,22,17,0.05)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <h2 className="font-display text-lg font-semibold text-foreground">Contenido del Pedido</h2>
          <Badge variant="outline">Editable</Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] border-collapse">
            <thead className="bg-surface-container-low border-y border-foreground/10">
              <tr>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Producto</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Precio Unit. ($)</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Cantidad</th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Subtotal</th>
                <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Acción</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-sm text-muted-foreground">El pedido no tiene productos.</td>
                </tr>
              ) : (
                items.map((item, index) => (
                  <tr key={index} className="border-b border-foreground/8 last:border-b-0 transition-colors hover:bg-muted/20">
                    <td className="px-4 py-3 align-middle">
                      <p className="text-sm font-medium text-foreground">{item.nombre}</p>
                      <p className="text-xs text-muted-foreground">SKU: {item.sku || "-"}</p>
                      {item.variantes && Object.keys(item.variantes).length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {Object.entries(item.variantes).map(([k, v]) => (
                            <span key={k} className="inline-flex items-center rounded-md bg-foreground/5 px-2 py-0.5 text-[10px] text-muted-foreground">
                              {k}: {String(v)}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <input type="number" min="0" step="0.01" value={item.precio_unitario}
                        onChange={(e) => handlePriceChange(index, parseFloat(e.target.value) || 0)}
                        className="h-9 w-24 rounded-lg border border-foreground/15 bg-background px-3 text-sm outline-none focus:border-primary"
                      />
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <input type="number" min="1" step="1" value={item.cantidad}
                        onChange={(e) => handleQuantityChange(index, parseInt(e.target.value) || 1)}
                        className="h-9 w-20 rounded-lg border border-foreground/15 bg-background px-3 text-sm outline-none focus:border-primary"
                      />
                    </td>
                    <td className="px-4 py-3 align-middle text-right">
                      <span className="text-sm font-semibold text-foreground">{formatPrice(item.subtotal)}</span>
                    </td>
                    <td className="px-4 py-3 align-middle text-center">
                      <button type="button" onClick={() => handleDelete(index)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-red-500/10 hover:text-red-600 transition-colors"
                        title="Eliminar producto"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-6 flex flex-col items-end border-t border-foreground/10 pt-6">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-1">Total de la Orden</p>
          <p className="font-display text-3xl font-bold text-foreground">{formatPrice(total)}</p>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button variant="outline" onClick={() => router.push("/admin/ordenes")}>Cancelar</Button>
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
          {saveMutation.isPending ? "Guardando..." : "Guardar Cambios"}
        </Button>
      </div>

      {saveMutation.isError && (
        <p className="text-sm text-red-600 text-right mt-2">Ocurrió un error al guardar. Por favor, intenta de nuevo.</p>
      )}
    </div>
  );
}

// ─── Página principal (solo carga los datos) ─────────────────────
export default function AdminOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const orderId = params.id;

  const { data: order, isLoading, isError } = useQuery({
    queryKey: ["admin", "order", orderId],
    queryFn: () => getAdminOrder(orderId),
  });

  if (isLoading) return <LoadingSpinner className="justify-center py-14" label="Cargando detalle de la orden..." />;
  if (isError || !order) return <EmptyState title="No pudimos cargar la orden" description="Es posible que no exista o haya ocurrido un error." />;

  return <OrderEditor order={order} />;
}