"use client";

import Link from "next/link";

import { Badge } from "@/src/components/shared/Badge";
import { Button } from "@/src/components/ui/button";

type CartSummaryProps = {
  itemCount: number;
  subtotal: number;
  checkoutHref?: string;
  onClear?: () => void;
};

function formatPrice(value: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);
}

export function CartSummary({
  itemCount,
  subtotal,
  checkoutHref = "/checkout",
  onClear,
}: CartSummaryProps) {
  return (
    <aside className="rounded-3xl border border-foreground/10 bg-muted/35 p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-sans text-3xl text-foreground">Resumen</h2>
        <Badge variant="muted">{itemCount} items</Badge>
      </div>

      <div className="mt-6 space-y-3 text-sm">
        <div className="flex items-center justify-between text-muted-foreground">
          <span>Subtotal</span>
          <span className="font-medium text-foreground">{formatPrice(subtotal)}</span>
        </div>
        <div className="flex items-center justify-between text-muted-foreground">
          <span>Envio</span>
          <span className="font-medium text-foreground">A definir</span>
        </div>
      </div>

      <div className="my-5 h-px bg-foreground/10" />

      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Total estimado</span>
        <span className="font-sans text-3xl text-foreground">{formatPrice(subtotal)}</span>
      </div>

      <div className="mt-6 space-y-2">
        <Button asChild className="w-full" size="lg" disabled={itemCount === 0}>
          <Link href={checkoutHref}>Continuar al checkout</Link>
        </Button>

        {onClear ? (
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={onClear}
            disabled={itemCount === 0}
          >
            Vaciar carrito
          </Button>
        ) : null}
      </div>
    </aside>
  );
}
