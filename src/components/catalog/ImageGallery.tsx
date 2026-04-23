"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

import type { ProductImage } from "@/src/lib/api/products";
import { cn } from "@/src/lib/utils";

type ImageGalleryProps = {
  images: ProductImage[];
  productName: string;
};

export function ImageGallery({ images, productName }: ImageGalleryProps) {
  const orderedImages = useMemo(
    () => [...images].sort((a, b) => a.orden - b.orden),
    [images],
  );

  const initialSelectedId =
    orderedImages.find((image) => image.es_principal)?.id ?? orderedImages[0]?.id ?? null;

  const [selectedImageId, setSelectedImageId] = useState<string | null>(initialSelectedId);

  const selectedImage =
    orderedImages.find((image) => image.id === selectedImageId) ?? orderedImages[0] ?? null;

  if (!selectedImage) {
    return (
      <div className="flex aspect-4/3 w-full items-center justify-center rounded-3xl border border-foreground/10 bg-muted/40 text-sm text-muted-foreground">
        Sin imagenes disponibles
      </div>
    );
  }

  return (
    <section className="space-y-3">
      <div className="relative aspect-4/3 w-full overflow-hidden rounded-3xl border border-foreground/10 bg-muted/40">
        <Image
          src={selectedImage.url}
          alt={`${productName} imagen principal`}
          fill
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover"
          priority
        />
      </div>

      {orderedImages.length > 1 ? (
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
          {orderedImages.map((image) => {
            const isActive = image.id === selectedImage.id;

            return (
              <button
                key={image.id}
                type="button"
                onClick={() => setSelectedImageId(image.id)}
                className={cn(
                  "relative aspect-square overflow-hidden rounded-xl border transition",
                  isActive
                    ? "border-primary ring-2 ring-primary/30"
                    : "border-foreground/10 hover:border-primary/50",
                )}
                aria-label={`Ver imagen ${image.orden + 1} de ${productName}`}
              >
                <Image
                  src={image.url}
                  alt={`${productName} miniatura ${image.orden + 1}`}
                  fill
                  sizes="120px"
                  className="object-cover"
                />
              </button>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
