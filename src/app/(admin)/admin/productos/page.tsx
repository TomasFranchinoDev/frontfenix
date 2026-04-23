"use client";

import Link from "next/link";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Badge } from "@/src/components/shared/Badge";
import { EmptyState } from "@/src/components/shared/EmptyState";
import { LoadingSpinner } from "@/src/components/shared/LoadingSpinner";
import { Button } from "@/src/components/ui/button";
import api from "@/src/lib/api/client";

type AdminProduct = {
  id: string;
  nombre: string;
  descripcion: string;
  precio_base: string;
  sku: string | null;
  activo: boolean;
};

type ProductFilter = "TODOS" | "ACTIVOS" | "INACTIVOS";

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

async function getAdminProducts(): Promise<AdminProduct[]> {
  const { data } = await api.get<AdminProduct[]>("/api/admin/productos");
  return data;
}

async function toggleProductStatus({ productId, isActive }: { productId: string; isActive: boolean }): Promise<void> {
  await api.put(`/api/admin/productos/${productId}`, { activo: isActive });
}

export default function AdminProductsPage() {
  const queryClient = useQueryClient();
  const [productFilter, setProductFilter] = useState<ProductFilter>("TODOS");

  const {
    data: products = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["admin", "products"],
    queryFn: getAdminProducts,
  });

  const toggleMutation = useMutation({
    mutationFn: toggleProductStatus,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      await queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
    },
  });

  const filteredProducts = useMemo(() => {
    if (productFilter === "ACTIVOS") {
      return products.filter((product) => product.activo);
    }

    if (productFilter === "INACTIVOS") {
      return products.filter((product) => !product.activo);
    }

    return products;
  }, [productFilter, products]);

  const columns = useMemo<ColumnDef<AdminProduct>[]>(
    () => [
      {
        accessorKey: "nombre",
        header: "Producto",
        cell: ({ row }) => (
          <div>
            <p className="text-sm font-medium text-foreground">{row.original.nombre}</p>
            <p className="line-clamp-1 text-xs text-muted-foreground">{row.original.descripcion || "-"}</p>
          </div>
        ),
      },
      {
        accessorKey: "sku",
        header: "SKU",
        cell: ({ row }) => (
          <span className="text-sm text-foreground">{row.original.sku || "-"}</span>
        ),
      },
      {
        accessorKey: "precio_base",
        header: "Precio base",
        cell: ({ row }) => (
          <span className="text-sm font-medium text-foreground">{formatPrice(row.original.precio_base)}</span>
        ),
      },
      {
        accessorKey: "activo",
        header: "Estado",
        cell: ({ row }) => (
          <Badge variant={row.original.activo ? "default" : "outline"}>
            {row.original.activo ? "Activo" : "Inactivo"}
          </Badge>
        ),
      },
      {
        id: "acciones",
        header: "Acciones",
        cell: ({ row }) => {
          const isMutating =
            toggleMutation.isPending && toggleMutation.variables?.productId === row.original.id;
          
          const isActivo = row.original.activo;

          return (
            <div className="flex items-center gap-2">
              <Button asChild size="sm" variant="outline">
                <Link href={`/admin/productos/${row.original.id}`}>Editar</Link>
              </Button>

              <Button
                type="button"
                size="sm"
                variant={isActivo ? "ghost" : "default"}
                disabled={isMutating}
                className={isActivo ? "text-red-600 hover:text-red-700 hover:bg-red-50" : ""}
                onClick={() => toggleMutation.mutate({ productId: row.original.id, isActive: !isActivo })}
              >
                {isMutating 
                  ? (isActivo ? "Desactivando..." : "Activando...") 
                  : (isActivo ? "Desactivar" : "Activar")
                }
              </Button>
            </div>
          );
        },
      },
    ],
    [toggleMutation],
  );

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: filteredProducts,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (isLoading) {
    return <LoadingSpinner className="justify-center py-14" label="Cargando productos..." />;
  }

  if (isError) {
    return (
      <EmptyState
        title="No pudimos cargar productos"
        description="Intenta nuevamente en unos segundos."
      />
    );
  }

  return (
    <div className="space-y-6 animate-rise-in">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Panel Administrativo</p>
          <h1 className="mt-2 font-display text-4xl leading-tight text-foreground sm:text-5xl">Productos</h1>
          <p className="mt-1 text-sm text-muted-foreground">Administra catálogo, precios base y estado comercial.</p>
        </div>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            Estado
            <select
              className="h-10 rounded-xl border border-foreground/15 bg-surface-light px-3 text-sm text-foreground outline-none focus:border-primary"
              value={productFilter}
              onChange={(event) => setProductFilter(event.target.value as ProductFilter)}
            >
              <option value="TODOS">Todos</option>
              <option value="ACTIVOS">Activos</option>
              <option value="INACTIVOS">Inactivos</option>
            </select>
          </label>

          <Button asChild size="sm">
            <Link href="/admin/productos/nuevo">Nuevo producto</Link>
          </Button>
        </div>
      </header>

      {filteredProducts.length === 0 ? (
        <EmptyState
          title="No hay productos para mostrar"
          description="No se encontraron productos con el filtro seleccionado."
        />
      ) : (
        <section className="overflow-hidden rounded-[1.55rem] border border-foreground/10 bg-surface-light shadow-[0_8px_22px_rgba(24,22,17,0.05)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-220 border-collapse">
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

      {toggleMutation.isError ? (
        <p className="text-sm text-red-700">No se pudo actualizar el estado del producto. Intenta nuevamente.</p>
      ) : null}
    </div>
  );
}
