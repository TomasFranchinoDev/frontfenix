"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { ImageGallery } from "@/src/components/catalog/ImageGallery";
import { VariantSelector } from "@/src/components/catalog/VariantSelector";
import { Footer } from "@/src/components/shared/Footer";
import { LoadingSpinner } from "@/src/components/shared/LoadingSpinner";
import { Navbar } from "@/src/components/shared/Navbar";
import { EmptyState } from "@/src/components/shared/EmptyState";
import { Badge } from "@/src/components/shared/Badge";
import { Button } from "@/src/components/ui/button";
import { useProduct } from "@/src/hooks/useProducts";
import { useCartStore } from "@/src/stores/cartStore";

type VariantOptionValue = string | number | boolean;

type VariantOptionObject = {
  value?: VariantOptionValue;
  valor?: VariantOptionValue;
  label?: string;
  nombre?: string;
  extra?: number | string;
  precio_extra?: number | string;
  recargo?: number | string;
};

type VariantSelection = {
  value: string;
  label: string;
  extra: number;
};

function formatPrice(value: string): string {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return "$0";
  }

  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(numericValue);
}

function parseExtraValue(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^0-9,.-]/g, "").replace(/,/g, "."));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function getOptionValue(option: unknown): string | null {
  if (typeof option === "string" || typeof option === "number" || typeof option === "boolean") {
    return String(option);
  }

  if (typeof option === "object" && option !== null) {
    const candidate = option as VariantOptionObject;
    const valueSource = candidate.value ?? candidate.valor ?? candidate.label ?? candidate.nombre;

    if (
      valueSource === undefined ||
      (typeof valueSource !== "string" && typeof valueSource !== "number" && typeof valueSource !== "boolean")
    ) {
      return null;
    }

    return String(valueSource);
  }

  return null;
}

function getVariantSelection(option: unknown): VariantSelection | null {
  const value = getOptionValue(option);

  if (!value) {
    return null;
  }

  if (typeof option === "string" || typeof option === "number" || typeof option === "boolean") {
    return { value, label: value, extra: 0 };
  }

  if (typeof option === "object" && option !== null) {
    const candidate = option as VariantOptionObject;

    return {
      value,
      label: String(candidate.label ?? candidate.nombre ?? value),
      extra: parseExtraValue(candidate.extra ?? candidate.precio_extra ?? candidate.recargo),
    };
  }

  return null;
}

function getSelectedVariantExtra(
  esquemaOpciones: Record<string, unknown>,
  groupKey: string,
  selectedValue: string | undefined,
): number {
  if (!selectedValue) {
    return 0;
  }

  const group = esquemaOpciones[groupKey];
  if (!Array.isArray(group)) {
    return 0;
  }

  for (const option of group) {
    const selection = getVariantSelection(option);
    if (selection?.value === selectedValue) {
      return selection.extra;
    }
  }

  return 0;
}

function getSelectedVariantExtrasTotal(
  esquemaOpciones: Record<string, unknown>,
  selectedVariants: Record<string, string>,
): number {
  return Object.entries(selectedVariants).reduce((total, [groupKey, selectedValue]) => {
    return total + getSelectedVariantExtra(esquemaOpciones, groupKey, selectedValue);
  }, 0);
}

function getDefaultVariants(esquemaOpciones: Record<string, unknown>): Record<string, string> {
  const defaults: Record<string, string> = {};

  for (const [key, value] of Object.entries(esquemaOpciones)) {
    if (!Array.isArray(value) || value.length === 0) {
      continue;
    }

    const firstOption = value[0];

    if (typeof firstOption === "string" || typeof firstOption === "number" || typeof firstOption === "boolean") {
      defaults[key] = String(firstOption);
      continue;
    }

    if (typeof firstOption === "object" && firstOption !== null) {
      const candidate = firstOption as {
        value?: string | number | boolean;
        valor?: string | number | boolean;
        label?: string;
        nombre?: string;
      };

      const optionValue = candidate.value ?? candidate.valor ?? candidate.label ?? candidate.nombre;

      if (optionValue !== undefined) {
        defaults[key] = String(optionValue);
      }
    }
  }

  return defaults;
}

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams<{ slug?: string | string[] }>();
  const rawSlug = params?.slug;
  const slug = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug ?? "";

  const { data: product, isLoading, isError } = useProduct(slug);
  const addItem = useCartStore((state) => state.addItem);

  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);

  const defaultVariants = useMemo(
    () => (product ? getDefaultVariants(product.esquema_opciones) : {}),
    [product],
  );
  const effectiveVariants = useMemo(
    () => ({ ...defaultVariants, ...selectedVariants }),
    [defaultVariants, selectedVariants],
  );
  const variantExtrasTotal = useMemo(
    () => (product ? getSelectedVariantExtrasTotal(product.esquema_opciones, effectiveVariants) : 0),
    [effectiveVariants, product],
  );
  const basePrice = Number(product?.precio_base ?? 0);
  const totalPrice = Number.isFinite(basePrice) ? basePrice + variantExtrasTotal : variantExtrasTotal;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white text-foreground">
        <Navbar />
        <main className="mx-auto flex w-full max-w-7xl justify-center px-4 py-20 sm:px-6 lg:px-8">
          <LoadingSpinner label="Cargando producto..." />
        </main>
        <Footer />
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="min-h-screen bg-white text-foreground">
        <Navbar />
        <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <EmptyState
            title="No encontramos este producto"
            description="Puede que haya sido removido o el enlace sea incorrecto."
            actionLabel="Volver al catalogo"
            onAction={() => {
              router.push("/");
            }}
          />
        </main>
        <Footer />
      </div>
    );
  }

  const mainImage = product.imagenes.find((image) => image.es_principal) ?? product.imagenes[0];

  const handleAddToCart = () => {
    addItem({
      producto_id: product.id,
      nombre: product.nombre,
      precio_unitario: totalPrice,
      cantidad: quantity,
      variantes: effectiveVariants,
      imagen_url: mainImage?.url,
    });
  };

  return (
    <div className="min-h-screen bg-white text-foreground">
      <Navbar />

      <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        <div className="mb-8 flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="transition-colors hover:text-foreground">
            Inicio
          </Link>
          <span className="text-outline-variant">/</span>
          <Link href="/catalogo" className="transition-colors hover:text-foreground">
            Catálogo
          </Link>
          <span className="text-outline-variant">/</span>
          <span className="text-foreground font-medium">{product.nombre}</span>
        </div>

        <section className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
          <ImageGallery images={product.imagenes} productName={product.nombre} />

          <div className="space-y-6">
            <div className="space-y-3">
              <Badge variant="muted">Producto personalizado</Badge>
              <h1 className="font-sans text-4xl leading-tight sm:text-5xl">{product.nombre}</h1>
              <p className="text-base text-foreground/90 leading-relaxed">{product.descripcion}</p>
            </div>

            {/* Price card */}
            <div className="rounded-xl border border-outline-variant bg-surface-alt p-6">
              <p className="text-sm font-medium text-foreground">Precio total</p>
              <p className="mt-1 font-sans text-4xl font-bold text-foreground">{formatPrice(String(totalPrice))}</p>
              <p className="mt-2 text-sm text-foreground/80">
                Base {formatPrice(product.precio_base)} + extras {formatPrice(String(variantExtrasTotal))}
              </p>
            </div>

            <VariantSelector
              esquemaOpciones={product.esquema_opciones}
              selectedVariants={effectiveVariants}
              onVariantChange={(key, value) => {
                setSelectedVariants((prev) => ({ ...prev, [key]: value }));
              }}
            />

            <div className="flex items-center gap-3">
              <div className="flex items-center rounded-full border border-outline-variant bg-white">
                <button
                  type="button"
                  className="px-4 py-2.5 text-lg text-foreground transition-colors hover:text-primary"
                  onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                  aria-label="Disminuir cantidad"
                >
                  −
                </button>
                <span className="min-w-10 text-center text-sm font-bold">{quantity}</span>
                <button
                  type="button"
                  className="px-4 py-2.5 text-lg text-foreground transition-colors hover:text-primary"
                  onClick={() => setQuantity((prev) => prev + 1)}
                  aria-label="Aumentar cantidad"
                >
                  +
                </button>
              </div>

              <Button size="lg" onClick={handleAddToCart} className="flex-1 rounded-full">
                Agregar al carrito
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
