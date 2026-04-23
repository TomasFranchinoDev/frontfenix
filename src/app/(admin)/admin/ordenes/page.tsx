"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Badge } from "@/src/components/shared/Badge";
import { EmptyState } from "@/src/components/shared/EmptyState";
import { LoadingSpinner } from "@/src/components/shared/LoadingSpinner";
import api from "@/src/lib/api/client";

type AdminOrder = {
  id: string;
  codigo_orden: string;
  estado: string;
  total: string;
  creado_en: string;
  cliente: {
    id: string;
    email: string;
    nombre_completo: string;
    telefono: string;
    empresa: string;
  };
};

type UpdateOrderStatusPayload = {
  orderId: string;
  estado: string;
};

const ORDER_STATES = [
  "PENDIENTE",
  "EN_PREPARACION",
  "LISTO",
  "DESPACHADO",
  "CANCELADA",
] as const;

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
  if (state === "CANCELADA") {
    return "outline";
  }

  if (state === "LISTO" || state === "DESPACHADO") {
    return "default";
  }

  return "muted";
}

async function getAdminOrders(): Promise<AdminOrder[]> {
  const { data } = await api.get<AdminOrder[]>("/api/admin/ordenes");
  return data;
}

async function updateOrderStatus(payload: UpdateOrderStatusPayload): Promise<void> {
  await api.patch(`/api/admin/ordenes/${payload.orderId}/estado`, {
    estado: payload.estado,
  });
}

function AdminOrdersContent() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("TODOS");
  const [searchQuery, setSearchQuery] = useState("");

  const {
    data: orders = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["admin", "orders"],
    queryFn: getAdminOrders,
  });

  const statusMutation = useMutation({
    mutationFn: updateOrderStatus,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
      await queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
    },
  });

  const filteredOrders = useMemo(() => {
    let result = orders;

    // Status filter
    if (statusFilter !== "TODOS") {
      result = result.filter((order) => order.estado === statusFilter);
    }

    // Search filter (by order code or client name/empresa)
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter((order) => {
        const code = order.codigo_orden?.toLowerCase() ?? "";
        const empresa = order.cliente?.empresa?.toLowerCase() ?? "";
        const nombre = order.cliente?.nombre_completo?.toLowerCase() ?? "";
        return code.includes(q) || empresa.includes(q) || nombre.includes(q);
      });
    }

    return result;
  }, [orders, statusFilter, searchQuery]);

  const columns = useMemo<ColumnDef<AdminOrder>[]>(
    () => [
      {
        accessorKey: "codigo_orden",
        header: "Codigo",
        cell: ({ row }) => (
          <div>
            <Link 
              href={`/admin/ordenes/${row.original.id}`}
              className="text-sm font-medium text-primary hover:underline"
            >
              {row.original.codigo_orden}
            </Link>
            <p className="text-xs text-muted-foreground">{formatDate(row.original.creado_en)}</p>
          </div>
        ),
      },
      {
        id: "cliente",
        header: "Cliente",
        cell: ({ row }) => {
          const clientName = row.original.cliente.empresa || row.original.cliente.nombre_completo;

          return (
            <div>
              <p className="text-sm font-medium text-foreground">{clientName}</p>
              <p className="text-xs text-muted-foreground">{row.original.cliente.email}</p>
            </div>
          );
        },
      },
      {
        accessorKey: "total",
        header: "Total",
        cell: ({ row }) => (
          <span className="text-sm font-medium text-foreground">{formatPrice(row.original.total)}</span>
        ),
      },
      {
        accessorKey: "estado",
        header: "Estado",
        cell: ({ row }) => (
          <Badge variant={stateBadgeVariant(row.original.estado)}>
            {stateLabel(row.original.estado)}
          </Badge>
        ),
      },
      {
        id: "acciones",
        header: "Cambiar estado",
        cell: ({ row }) => {
          const isUpdating =
            statusMutation.isPending && statusMutation.variables?.orderId === row.original.id;

          return (
            <select
              className="h-9 rounded-xl border border-foreground/15 bg-background px-3 text-sm outline-none focus:border-primary"
              value={row.original.estado}
              disabled={isUpdating}
              onChange={(event) => {
                const nextState = event.target.value;

                statusMutation.mutate({
                  orderId: row.original.id,
                  estado: nextState,
                });
              }}
            >
              {ORDER_STATES.map((state) => (
                <option key={state} value={state}>
                  {stateLabel(state)}
                </option>
              ))}
            </select>
          );
        },
      },
    ],
    [statusMutation],
  );

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: filteredOrders,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (isLoading) {
    return <LoadingSpinner className="justify-center py-14" label="Cargando ordenes..." />;
  }

  if (isError) {
    return (
      <EmptyState
        title="No pudimos cargar las ordenes"
        description="Intenta nuevamente en unos segundos."
      />
    );
  }

  return (
    <div className="space-y-6 animate-rise-in">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Panel Administrativo</p>
          <h1 className="mt-2 font-display text-4xl leading-tight text-foreground sm:text-5xl">
            Cotizaciones
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Administra estados de órdenes y avance de producción.
            </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
  <input
    type="text"
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    placeholder="Buscar por ID o cliente..."
    className="h-10 w-56 rounded-xl border border-foreground/15 bg-surface-light px-3 text-sm text-foreground outline-none transition focus:border-primary placeholder:text-muted-foreground"
  />
  <label className="flex items-center gap-2 text-sm text-muted-foreground">
    Estado
    <select
      className="h-10 rounded-xl border border-foreground/15 bg-surface-light px-3 text-sm text-foreground outline-none focus:border-primary"
      value={statusFilter}
      onChange={(event) => setStatusFilter(event.target.value)}
    >
      <option value="TODOS">Todos</option>
      {ORDER_STATES.map((state) => (
        <option key={state} value={state}>
          {stateLabel(state)}
        </option>
      ))}
    </select>
  </label>
</div>
      </header>

      {filteredOrders.length === 0 ? (
        <EmptyState
          title="No hay ordenes para mostrar"
          description="No se encontraron ordenes con el filtro seleccionado."
        />
      ) : (
        <section className="overflow-hidden rounded-[1.55rem] border border-foreground/10 bg-surface-light shadow-[0_8px_22px_rgba(24,22,17,0.05)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-230 border-collapse">
              <thead className="bg-surface-container-low">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="border-b border-foreground/10 px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground"
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>

              <tbody>
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="border-b border-foreground/8 transition-colors hover:bg-muted/20 last:border-b-0">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3 align-middle">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {statusMutation.isError ? (
        <p className="text-sm text-red-700">No se pudo actualizar el estado. Intenta nuevamente.</p>
      ) : null}
    </div>
  );
}
export default function AdminOrdersPage() {
  return (
    <Suspense fallback={<LoadingSpinner className="justify-center py-14" label="Cargando ordenes..." />}>
      <AdminOrdersContent />
    </Suspense>
  );
}