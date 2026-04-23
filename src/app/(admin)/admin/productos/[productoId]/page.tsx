"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import {
  ProductForm,
  type ProductInitialValues,
  type ProductPayload,
} from "@/src/components/admin/ProductForm";
import { EmptyState } from "@/src/components/shared/EmptyState";
import { LoadingSpinner } from "@/src/components/shared/LoadingSpinner";
import api from "@/src/lib/api/client";

type AdminProductDetail = {
  id: string;
  nombre: string;
  descripcion: string;
  precio_base: string;
  sku: string | null;
  esquema_opciones: Record<string, unknown>;
  activo: boolean;
  imagenes: Array<{
    id: string;
    url: string;
    es_principal: boolean;
    orden: number;
  }>;
};

async function getProductById(productoId: string): Promise<AdminProductDetail> {
  const { data } = await api.get<AdminProductDetail>(`/api/admin/productos/${productoId}`);
  return data;
}

export default function AdminEditProductPage() {
  const params = useParams<{ productoId?: string | string[] }>();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const rawId = params?.productoId;
  const productoId = Array.isArray(rawId) ? rawId[0] : rawId ?? "";

  const {
    data: product,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["admin", "product", productoId],
    queryFn: () => getProductById(productoId),
    enabled: Boolean(productoId),
  });

  const handleUpdate = async (payload: ProductPayload) => {
    if (!productoId) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      await api.put(`/api/admin/productos/${productoId}`, payload);
      router.push("/admin/productos");
      router.refresh();
    } catch {
      setSubmitError("No se pudo actualizar el producto. Intenta nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner className="justify-center py-14" label="Cargando producto..." />;
  }

  if (isError || !product) {
    return (
      <EmptyState
        title="No encontramos el producto"
        description="Verifica el identificador e intenta nuevamente."
      />
    );
  }

  const initialValues: ProductInitialValues = {
    nombre: product.nombre,
    descripcion: product.descripcion,
    precio_base: product.precio_base,
    sku: product.sku ?? "",
    esquema_opciones: product.esquema_opciones,
    activo: product.activo,
    imagenes: product.imagenes,
  };

  return (
    <div className="space-y-5">
      <header>
        <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Panel Administrativo</p>
        <h1 className="mt-2 font-display text-4xl leading-tight text-foreground sm:text-5xl">Editar producto</h1>
        <p className="mt-1 text-sm text-muted-foreground">Actualiza atributos comerciales y contenido visual del producto.</p>
      </header>

      <ProductForm
        initialValues={initialValues}
        submitLabel="Guardar cambios"
        onSubmit={handleUpdate}
        isSubmitting={isSubmitting}
        errorMessage={submitError}
      />
    </div>
  );
}
