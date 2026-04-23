"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { CartItem } from "@/src/components/cart/CartItem";
import { CartSummary } from "@/src/components/cart/CartSummary";
import { EmptyState } from "@/src/components/shared/EmptyState";
import { Footer } from "@/src/components/shared/Footer";
import { Navbar } from "@/src/components/shared/Navbar";
import { useCartStore } from "@/src/stores/cartStore";

export default function CartPage() {
  const router = useRouter();
  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const clearCart = useCartStore((state) => state.clearCart);
  const itemCount = useCartStore((state) => state.getItemCount());
  const subtotal = useCartStore((state) => state.getSubtotal());

  return (
    <div className="min-h-screen bg-white text-foreground">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="transition-colors hover:text-foreground">Inicio</Link>
          <span className="text-outline-variant">/</span>
          <span className="text-foreground font-medium">Carrito</span>
        </div>
        <header className="mb-8">
          <h1 className="font-sans text-4xl leading-tight sm:text-5xl">Tu carrito</h1>
          <p className="mt-2 text-muted-foreground">Revisa los productos antes de avanzar al checkout.</p>
        </header>
        {items.length === 0 ? (
          <EmptyState
            title="Tu carrito esta vacio"
            description="Explora el catalogo y agrega productos personalizados para comenzar tu pedido."
            actionLabel="Ver catalogo"
            onAction={() => router.push("/")}
          />
        ) : (
          <section className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
            <div className="space-y-4">
              {items.map((item) => (
                <CartItem
                  key={item.id}
                  item={item}
                  onIncrease={(id) => {
                    const current = items.find((ci) => ci.id === id);
                    if (current) updateQuantity(id, current.cantidad + 1);
                  }}
                  onDecrease={(id) => {
                    const current = items.find((ci) => ci.id === id);
                    if (current) updateQuantity(id, current.cantidad - 1);
                  }}
                  onRemove={removeItem}
                />
              ))}
            </div>
            <div>
              <CartSummary itemCount={itemCount} subtotal={subtotal} onClear={clearCart} />
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
