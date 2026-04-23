"use client";

import Image from "next/image";
import { Trash2 } from "lucide-react";

import { Button } from "@/src/components/ui/button";
import type { CartItem as CartItemType } from "@/src/stores/cartStore";

type CartItemProps = {
  item: CartItemType;
  onIncrease: (id: string) => void;
  onDecrease: (id: string) => void;
  onRemove: (id: string) => void;
};

function formatPrice(value: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);
}

export function CartItem({ item, onIncrease, onDecrease, onRemove }: CartItemProps) {
  const total = item.precio_unitario * item.cantidad;

  return (
    <article className="rounded-3xl border border-foreground/10 bg-background p-4 sm:p-5">
      <div className="flex gap-4">
        <div className="relative size-24 shrink-0 overflow-hidden rounded-xl border border-foreground/10 bg-muted/40">
          {item.imagen_url ? (
            <Image
              src={item.imagen_url}
              alt={item.nombre}
              fill
              sizes="96px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
              Sin imagen
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate font-sans text-2xl leading-tight text-foreground">{item.nombre}</h3>
              <p className="text-sm text-muted-foreground">{formatPrice(item.precio_unitario)} c/u</p>
            </div>

            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              aria-label="Eliminar item"
              onClick={() => onRemove(item.id)}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>

          {Object.keys(item.variantes).length > 0 ? (
            <ul className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              {Object.entries(item.variantes).map(([key, value]) => (
                <li key={`${item.id}-${key}`} className="rounded-full border border-foreground/10 bg-muted/50 px-2.5 py-1">
                  <span className="capitalize">{key.replace(/_/g, " ")}</span>: {String(value)}
                </li>
              ))}
            </ul>
          ) : null}

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center rounded-full border border-foreground/15 bg-background">
              <button
                type="button"
                className="px-3 py-1.5 text-base text-foreground"
                onClick={() => onDecrease(item.id)}
                aria-label="Disminuir cantidad"
              >
                -
              </button>
              <span className="min-w-9 text-center text-sm font-medium">{item.cantidad}</span>
              <button
                type="button"
                className="px-3 py-1.5 text-base text-foreground"
                onClick={() => onIncrease(item.id)}
                aria-label="Aumentar cantidad"
              >
                +
              </button>
            </div>

            <p className="font-medium text-foreground">{formatPrice(total)}</p>
          </div>
        </div>
      </div>
    </article>
  );
}
