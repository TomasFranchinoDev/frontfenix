import Link from "next/link";
import { CheckCircle2, MessageCircle } from "lucide-react";

import { Footer } from "@/src/components/shared/Footer";
import { Navbar } from "@/src/components/shared/Navbar";
import { Button } from "@/src/components/ui/button";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function CheckoutSuccessPage({ searchParams }: Props) {
  const params = await searchParams;
  const orden = typeof params.orden === "string" ? params.orden : "Reciente";

  const whatsappText = encodeURIComponent(
    `Hola Fenix, quiero avanzar con la orden ${orden}.`
  );
  const whatsappUrl = `https://wa.me/543493417510?text=${whatsappText}`;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />

      <main className="flex-1 flex flex-col items-center justify-center py-20 px-4">
        <div className="w-full text-center space-y-8">
          <div className="flex justify-center">
            <div className="h-24 w-24 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="size-14 text-green-600" />
            </div>
          </div>

          <div className="space-y-3">
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              ¡Pedido Confirmado!
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Tu orden <span className="font-semibold text-foreground">#{orden}</span> ha sido registrada correctamente. Un asesor ya tiene tus datos.
            </p>
          </div>

          <div className="bg-surface-alt rounded-2xl p-6 md:p-8 border border-outline-variant space-y-5 text-left">
            <div className="space-y-2 text-center">
              <h2 className="font-semibold text-foreground">¿Se interrumpió WhatsApp?</h2>
              <p className="text-sm text-muted-foreground">
                Debería haberse abierto una ventana de WhatsApp para enviar el pedido. Si tu navegador bloqueó la ventana o la cerraste, presiona aquí:
              </p>
            </div>
            <div className="flex justify-center">
              <Button asChild size="lg" className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white">
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                  <MessageCircle className="size-5" />
                  Contactar a Fenix por WhatsApp
                </a>
              </Button>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto h-12 px-8 rounded-full border-foreground/20">
              <Link href="/cuenta/mis-ordenes">Ir a Mis Órdenes</Link>
            </Button>
            <Button asChild variant="ghost" size="lg" className="w-full sm:w-auto h-12 px-8 rounded-full hover:bg-foreground/5">
              <Link href="/">Volver al Inicio</Link>
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
