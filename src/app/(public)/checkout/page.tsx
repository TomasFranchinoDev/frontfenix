"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { CheckoutForm } from "@/src/components/checkout/CheckoutForm";
import { EmptyState } from "@/src/components/shared/EmptyState";
import { Footer } from "@/src/components/shared/Footer";
import { Navbar } from "@/src/components/shared/Navbar";
import { useCartStore } from "@/src/stores/cartStore";

export default function CheckoutPage() {
  const router = useRouter();
  const items = useCartStore((state) => state.items);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            Inicio
          </Link>
          <span>/</span>
          <Link href="/carrito" className="hover:text-foreground">
            Carrito
          </Link>
          <span>/</span>
          <span className="text-foreground">Checkout</span>
        </div>

        <header className="mb-8">
          <h1 className="font-sans text-4xl leading-tight sm:text-5xl">Checkout</h1>
          <p className="mt-2 text-muted-foreground">Finaliza tu pedido y te redirigimos a WhatsApp para confirmarlo.</p>
        </header>

        {items.length === 0 ? (
          <EmptyState
            title="No hay productos para finalizar"
            description="Agrega items al carrito para continuar con el checkout."
            actionLabel="Ir al carrito"
            onAction={() => {
              router.push("/carrito");
            }}
          />
        ) : (
          <CheckoutForm />
        )}
      </main>

      <Footer />
    </div>
  );
}
