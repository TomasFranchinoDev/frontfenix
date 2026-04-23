"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

import { Badge } from "@/src/components/shared/Badge";
import type { Product } from "@/src/lib/api/products";
import { cn } from "@/src/lib/utils";

type ProductCardProps = {
  product: Product;
  showBestseller?: boolean;
};

function formatPrice(value: string): string {
  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue)) {
    return "$0";
  }

  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(parsedValue);
}

function pickTextFromOptions(esquema: Record<string, unknown> | undefined, keys: string[]) {
  if (!esquema) {
    return null;
  }

  const normalizedKeys = keys.map((k) => k.toLowerCase());

  for (const [key, raw] of Object.entries(esquema)) {
    const normalizedKey = key.toLowerCase();
    if (!normalizedKeys.some((candidate) => normalizedKey === candidate || normalizedKey.includes(candidate))) {
      continue;
    }

    if (Array.isArray(raw) && raw.length > 0) {
      const first = raw[0] as unknown;
      if (typeof first === "string" || typeof first === "number" || typeof first === "boolean") {
        return String(first);
      }
      if (typeof first === "object" && first !== null) {
        const obj = first as Record<string, unknown>;
        const value = obj.label ?? obj.nombre ?? obj.value ?? obj.valor;
        if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
          return String(value);
        }
      }
    }
  }

  return null;
}

function pickBadge(esquema: Record<string, unknown> | undefined) {
  if (!esquema) {
    return null;
  }

  const raw = (esquema as Record<string, unknown>)["badge"] ?? (esquema as Record<string, unknown>)["etiqueta"];
  if (typeof raw === "string") {
    return raw;
  }
  if (Array.isArray(raw) && raw.length > 0 && typeof raw[0] === "string") {
    return raw[0];
  }

  const flags = [
    { key: "best_seller", label: "Best Seller", tone: "primary" as const },
    { key: "nuevo", label: "New Arrival", tone: "dark" as const },
    { key: "new_arrival", label: "New Arrival", tone: "dark" as const },
  ];

  for (const flag of flags) {
    const value = (esquema as Record<string, unknown>)[flag.key];
    if (value === true) {
      return { label: flag.label, tone: flag.tone };
    }
  }

  return null;
}

export function ProductCard({ product, showBestseller = false }: ProductCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const sortedImages = [...product.imagenes].sort((a, b) => {
    if (a.es_principal && !b.es_principal) return -1;
    if (!a.es_principal && b.es_principal) return 1;
    return a.orden - b.orden;
  });

  const currentImage = sortedImages[currentImageIndex];
  const productHref = product.slug ? `/producto/${product.slug}` : null;
  const material = pickTextFromOptions(product.esquema_opciones, ["material", "materiales"]);
  const badge = pickBadge(product.esquema_opciones);

  // Determine if we should show a badge
  const badgeLabel = showBestseller
    ? "Mas vendido"
    : badge
      ? typeof badge === "string"
        ? badge
        : badge.label
      : null;

  const handleNextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % sortedImages.length);
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + sortedImages.length) % sortedImages.length);
  };

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-xl bg-white border border-outline-variant/50 transition-all duration-300 hover:shadow-lg hover:shadow-black/5">
      {productHref ? (
        <Link href={productHref} className="absolute inset-0 z-10" aria-label={`Ver detalle de ${product.nombre}`} />
      ) : null}

      {/* Image area */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-container">
        {currentImage ? (
          <Image
            src={currentImage.url}
            alt={product.nombre}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Sin imagen
          </div>
        )}

        {sortedImages.length > 1 && (
          <>
            <button
              onClick={handlePrevImage}
              className="absolute left-2 top-1/2 z-20 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-foreground opacity-0 shadow-md backdrop-blur-sm transition-opacity group-hover:opacity-100 hover:bg-white"
              aria-label="Imagen anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={handleNextImage}
              className="absolute right-2 top-1/2 z-20 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-foreground opacity-0 shadow-md backdrop-blur-sm transition-opacity group-hover:opacity-100 hover:bg-white"
              aria-label="Siguiente imagen"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}

        {badgeLabel ? (
          <div className="absolute left-3 top-3 z-20 pointer-events-none">
            <span className="rounded-md bg-primary px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
              {badgeLabel}
            </span>
          </div>
        ) : null}
        
        {/* Pagination indicators */}
        {sortedImages.length > 1 && (
          <div className="absolute bottom-3 left-1/2 z-20 -translate-x-1/2 flex gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
            {sortedImages.map((_, idx) => (
              <div 
                key={idx} 
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  idx === currentImageIndex ? "w-4 bg-white" : "w-1.5 bg-white/50"
                )} 
              />
            ))}
          </div>
        )}
      </div>

      {/* Content area */}
      <div className="flex flex-col flex-1 p-5">
        <h3 className="mb-1.5 text-lg font-bold leading-snug text-foreground line-clamp-2 relative z-20">
          {productHref ? (
             <Link href={productHref} className="hover:text-primary transition-colors">{product.nombre}</Link>
          ) : product.nombre}
        </h3>
        <p className="mb-5 text-sm text-muted-foreground line-clamp-2 flex-1">
          {material ?? product.descripcion}
        </p>

        {/* Price */}
        <p className="mb-4 text-base font-bold text-foreground">
          Desde {formatPrice(product.precio_base)}
        </p>

        {/* CTA Button */}
        {productHref ? (
          <span className="pointer-events-none relative z-20 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#c49314] px-5 py-2.5 text-xs font-bold text-white transition-colors group-hover:bg-[#a87c10]">
            Ver detalles
            <ArrowRight className="h-3.5 w-3.5" />
          </span>
        ) : (
          <span className="inline-flex w-full items-center justify-center rounded-full border border-outline-variant px-5 py-2.5 text-xs font-medium text-muted-foreground">
            No disponible
          </span>
        )}
      </div>
    </article>
  );
}
