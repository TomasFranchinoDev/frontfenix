"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  ProductForm,
  type ProductPayload,
} from "@/src/components/admin/ProductForm";
import api from "@/src/lib/api/client";

export default function AdminNewProductPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleCreate = async (payload: ProductPayload) => {
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      await api.post("/api/admin/productos", payload);
      router.push("/admin/productos");
      router.refresh();
    } catch {
      setErrorMessage("No se pudo crear el producto. Revisa los datos e intenta nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <header>
        <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Panel Administrativo</p>
        <h1 className="mt-2 font-display text-4xl leading-tight text-foreground sm:text-5xl">Nuevo producto</h1>
        <p className="mt-1 text-sm text-muted-foreground">Define base de catálogo, variantes e imágenes principales.</p>
      </header>

      <ProductForm
        submitLabel="Crear producto"
        onSubmit={handleCreate}
        isSubmitting={isSubmitting}
        errorMessage={errorMessage}
      />
    </div>
  );
}
