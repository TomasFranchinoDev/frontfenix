"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

import { Footer } from "@/src/components/shared/Footer";
import { LoadingSpinner } from "@/src/components/shared/LoadingSpinner";
import { Navbar } from "@/src/components/shared/Navbar";
import { ProductCard } from "@/src/components/catalog/ProductCard";
import { Button } from "@/src/components/ui/button";
import { useProducts } from "@/src/hooks/useProducts";

export default function PublicHomePage() {
  const { data: products = [], isLoading } = useProducts();
  const successCasesCarouselRef = useRef<HTMLDivElement | null>(null);

  const scrollSuccessCases = (direction: "left" | "right") => {
    const carousel = successCasesCarouselRef.current;

    if (!carousel) {
      return;
    }

    const firstCard = carousel.querySelector<HTMLElement>("[data-success-case-card]");
    const cardWidth = firstCard?.offsetWidth ?? carousel.clientWidth;
    const gap = 24;

    carousel.scrollBy({
      left: direction === "left" ? -(cardWidth + gap) : cardWidth + gap,
      behavior: "smooth",
    });
  };

  // Casos de éxito - Mock data
  const successCases = [
    {
      id: 1,
      title: "Elegance Kraft Tote",
      client: "Maison X Boutique",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDw9w9XCsvo3Tx1w29UB1fpzKYDKqpdMqCNTFjrFcjzsx8NSCEpGiErNOo7EjvPyGTge8jANm5d9n7rU2KPBwaz7O3umRIobeGK_vyHF9UwysKtmZAJQQ1p_jcbuLd4r3ryOKRZUXQq-eqsljbqIZrUosmRYA4pZdkerJ4h87ZOEFEXXDeIAOdeOcK9rxsSBDLWygtMd2JLh67i5oKnkewnuqy2yhmXhKJ_ckuMZ81XrWOY9mLqcUsVlQEa65EYaNOnaVCBrLnDTUHO",
      tags: ["Bolsa Kraft", "Foil Dorado"],
    },
    {
      id: 2,
      title: "Cilindro Botánico",
      client: "Natura Skincare",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAR1cHik4rAbnBCX51rjO5RFqIzxUm3aNVa-TTlp5GQSAVEXbr4VSEc7EvfFshQrnwaKHW5hBWTrg5Fk0mGBQA_iDDp5t2DNMjklL-svsUelHy_VLOowTeJ6F3pxf2Nz4gB_xU35g_rLk4XNZ7DTauvFLLib5hUIpuxlD669KxCRrrAs95RAr4vj6bJjHuic4qKq5FACqk6wufJuJBM5-7s5M-BE9DzqMRwFk9zVQ6IWqhes3xED199IK3DNGhEfu2IbiHSkU06BcFv",
      tags: ["Cilindro Premium", "Sustentable"],
    },
    {
      id: 3,
      title: "Caja Estructural Tech",
      client: "AudioPro Systems",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCYzF4TmWYimvcMEOhJMKKN3cu05wxz-ZcTlfDBT59g3yg865nzxp5EdD-6RueRySbCgn4CGDmpDDqluqWiU_X6ccSShHGsu0GISvkhA_JsSGTiJjpA6CO7jtKDBoKRl4_nMXOvE0oZBz23uVuokENfFOoQ8yTga3s_aVCLVTWEBBPjkEA1p-EG3PXzAh9hD54prR7u9zxbAUo8f8C9BweI6hG3gRq8BeDky0LU57qLUq7Sgz3lijuLtvgh9J6tK6c17xJND4tsQs49",
      tags: ["Cartón Rígido", "Inserto Suaje"],
    },
    {
      id: 4,
      title: "Estuche Aura de Seda",
      client: "Lumière Perfumes",
      image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=80",
      tags: ["Forro Textil", "Hot Stamping"],
    },
    {
      id: 5,
      title: "Kit Ritual Cacao",
      client: "Cacao Alma",
      image: "https://images.unsplash.com/photo-1599599810906-c4d5b7d7f7ae?auto=format&fit=crop&w=1200&q=80",
      tags: ["Cartón Reciclado", "Troquel Personalizado"],
    },
  ];

  // Mostrar máximo 3 productos en el catálogo preview
  const featuredProducts = products.slice(0, 3);

  return (
    <div className="min-h-screen bg-white text-foreground">
      <Navbar />

      <main className="w-full">
        {/* ============== SECCIÓN HERO / PRESENTACIÓN ============== */}
        <section className="relative overflow-hidden bg-surface-alt pt-24 pb-16 md:pb-24">
          <div className="mx-auto w-full max-w-[1440px] px-6 md:px-12 xl:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Contenido izquierdo */}
              <div className="flex flex-col items-start gap-6">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 rounded-full border border-outline-variant bg-white/80 px-4 py-2">
                  <span className="text-sm">🏗️</span>
                  <span className="text-xs font-bold tracking-[0.15em] uppercase text-muted-foreground">
                    The Architecture of Packaging
                  </span>
                </div>

                {/* Título principal */}
                <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground leading-[1.05]">
                  Estructura.{" "}
                  <br />
                  Material.{" "}
                  <br />
                  <span className="text-primary">Precisión.</span>
                </h1>

                {/* Subtítulo */}
                <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                  Elevamos el empaque de utilidad a experiencia. Soluciones de grado arquitectónico construidas para marcas que exigen una presencia impecable.
                </p>

                {/* Botones */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center mt-2">
                  <Button asChild size="lg" className="rounded-full px-8 text-sm font-bold">
                    <Link href="/catalogo" className="flex items-center justify-center gap-2">
                      Explorar Catálogo
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="outline" size="lg" className="rounded-full px-8 text-sm font-bold border-foreground/20 text-foreground hover:bg-foreground/5">
                    Solicitar Muestra
                  </Button>
                </div>
              </div>

              {/* Imagen derecha */}
              <div className="relative w-full aspect-square overflow-hidden rounded-xl bg-surface-container lg:aspect-[4/5]">
                <Image
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDEkL0YcanFy008_IbDYIsbfSAwZX_r1uwROZLTLiyu551KjXAJbPPcPH1re6F-LksdSsQ_P7FBleaqaE_tROYnS4DMFJci9GnrP8XrP6nziihcBW5-ajWw4nQb_29JyRk4YQ48tXpV66KgkO3pfxjf8Xmp_EI3wnkuyiukaZr6nSfKyaXEQSF8JUbk0C2UMoC6gahZIv3IuqJaIMGSBhQm3x4Qq_Cws9gWgbk5C4kU_jKRXsCPFg7xpKh00bo6JHDiNIJTOHF1R3Ou"
                  alt="Premium cardboard packaging box"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                  className="object-cover"
                />

                {/* Floating Material Spec Card */}
                <div className="absolute bottom-6 right-6 w-56 rounded-lg border border-outline-variant bg-white p-5 shadow-xl">
                  <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-muted-foreground mb-4 border-b border-outline-variant pb-2">
                    Material Spec
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Calibre</span>
                      <span className="text-xs font-bold text-foreground">350g Kraft</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Acabado</span>
                      <span className="text-xs font-bold text-foreground">Mate Natural</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Tensión</span>
                      <span className="text-xs font-bold text-foreground">Alta</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============== SECCIÓN CASOS DE ÉXITO ============== */}
        <section id="casos-exito" className="bg-white py-20 md:py-28">
          <div className="mx-auto w-full max-w-[1440px] px-6 md:px-12 xl:px-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
              <div className="w-full md:flex-1">
                <span className="text-xs font-bold tracking-[0.2em] uppercase text-muted-foreground mb-3 block">
                  Casos de Éxito
                </span>
                <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
                  Empaques con Propósito.
                </h2>
                <p className="text-base text-muted-foreground mt-3">
                  Proyectos donde la materialidad y el diseño se encuentran para crear identidades tangibles.
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  className="shrink-0 border-b-2 border-foreground pb-1 text-sm font-medium text-foreground transition-colors hover:text-primary hover:border-primary"
                >
                  Ver todos los proyectos
                </button>
                <button
                  type="button"
                  aria-label="Ver casos anteriores"
                  onClick={() => scrollSuccessCases("left")}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-outline-variant text-foreground transition-colors hover:border-primary hover:text-primary lg:hidden"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label="Ver más casos"
                  onClick={() => scrollSuccessCases("right")}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-outline-variant text-foreground transition-colors hover:border-primary hover:text-primary lg:hidden"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Carousel para mobile/tablet */}
            <div
              ref={successCasesCarouselRef}
              className="flex snap-x snap-mandatory gap-6 overflow-x-auto pb-4 scroll-smooth lg:hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            >
              {successCases.map((item) => (
                <article
                  key={item.id}
                  data-success-case-card
                  className="group basis-[85%] sm:basis-[45%] lg:basis-[31%] shrink-0 snap-start cursor-pointer"
                >
                  <div className="relative mb-5 aspect-[4/3] overflow-hidden rounded-lg bg-surface-container">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">Para: {item.client}</p>
                  <div className="flex gap-2 flex-wrap">
                    {item.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-outline-variant bg-surface-container-low px-3 py-1 text-[11px] font-medium text-muted-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </article>
              ))}
            </div>

            <div className="hidden gap-6 lg:grid lg:grid-cols-3 xl:gap-8">
              {successCases.map((item) => (
                <article key={item.id} className="group cursor-pointer">
                  <div className="relative mb-5 aspect-[4/3] overflow-hidden rounded-lg bg-surface-container">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      sizes="(max-width: 1280px) 33vw, 420px"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <h3 className="mb-1 text-lg font-bold text-foreground">{item.title}</h3>
                  <p className="mb-3 text-sm text-muted-foreground">Para: {item.client}</p>
                  <div className="flex flex-wrap gap-2">
                    {item.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-outline-variant bg-surface-container-low px-3 py-1 text-[11px] font-medium text-muted-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ============== SECCIÓN CATÁLOGO DE ESPECIALIDAD ============== */}
        <section id="catalogo" className="bg-surface-alt py-20 md:py-28">
          <div className="mx-auto w-full max-w-[1440px] px-6 md:px-12 xl:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="text-xs font-bold tracking-[0.2em] uppercase text-muted-foreground mb-3 block">
                Nuestro Inventario
              </span>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-4">
                Catálogo de Especialidad.
              </h2>
              <p className="text-base text-muted-foreground">
                Materiales seleccionados por su resistencia, textura y huella ecológica.
              </p>
            </div>

            {/* Grid de productos */}
            {isLoading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner label="Cargando productos..." />
              </div>
            ) : featuredProducts.length > 0 ? (
              <>
                <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 mb-12">
                  {featuredProducts.map((product, index) => (
                    <ProductCard key={product.id} product={product} showBestseller={index === 0} />
                  ))}
                </div>

                {/* Botón para ver catálogo completo */}
                <div className="flex justify-center">
                  <Button asChild variant="outline" size="lg" className="rounded-full px-10 text-sm font-bold border-foreground/20 text-foreground hover:bg-foreground/5">
                    <Link href="/catalogo" className="inline-flex items-center gap-2">
                      Explorar Catálogo Completo
                    </Link>
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No hay productos disponibles en este momento</p>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
