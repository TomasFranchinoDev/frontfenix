"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { FiltersSidebar } from "@/src/components/catalog/FiltersSidebar";
import { ProductCard } from "@/src/components/catalog/ProductCard";
import { SortDropdown } from "@/src/components/catalog/SortDropdown";
import { EmptyState } from "@/src/components/shared/EmptyState";
import { Footer } from "@/src/components/shared/Footer";
import { Navbar } from "@/src/components/shared/Navbar";
import { useCatalogProducts } from "@/src/hooks/useProducts";
import { useCatalogStore } from "@/src/stores/catalogStore";

export default function CatalogoPage() {
  const router = useRouter();
  const { products, facets, isLoading, isError } = useCatalogProducts();
  const activeFilters = useCatalogStore((state) => state.filters);
  const clearAll = useCatalogStore((state) => state.clearAll);
  const toggleFilterValue = useCatalogStore((state) => state.toggleFilterValue);
  const searchQuery = useCatalogStore((state) => state.searchQuery);
  const setSearchQuery = useCatalogStore((state) => state.setSearchQuery);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 9;

  const activeFilterEntries = Object.entries(activeFilters).flatMap(([key, values]) =>
    values.map((value) => ({ key, value })),
  );

  const totalPages = Math.max(1, Math.ceil(products.length / pageSize));
  const safePage = Math.min(page, totalPages);

  const visibleProducts = useMemo(() => {
    return products.slice(0, safePage * pageSize);
  }, [products, safePage]);

  // Observer config for infinite scrolling
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastProductElementRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isLoading || isError) return;
      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && safePage < totalPages) {
          setPage((prev) => prev + 1);
        }
      });

      if (node) observerRef.current.observe(node);
    },
    [isLoading, isError, safePage, totalPages]
  );

  // Reset to page 1 when search or filters change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(1);
  }, [searchQuery, activeFilters]);

  useEffect(() => {
    if (!isMobileFiltersOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMobileFiltersOpen]);

  return (
    <div className="min-h-screen bg-white text-foreground">
      <Navbar />

      <main className="mx-auto w-full max-w-screen-2xl px-4 pb-20 pt-10 sm:px-6 lg:px-8">
        <header className="mb-12">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="font-sans text-5xl leading-none tracking-tight sm:text-6xl">Nuestro Catálogo</h1>
              <p className="mt-4 text-base text-muted-foreground sm:text-lg">
                Explora nuestra selección curada de soluciones de empaque, diseñadas para elevar la experiencia de tu marca.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="lg:hidden">
                <button
                  type="button"
                  onClick={() => setIsMobileFiltersOpen(true)}
                  className="h-10 rounded-full border border-outline-variant bg-white px-5 text-sm font-medium text-foreground transition hover:border-primary hover:text-primary"
                >
                  Filtros
                  {activeFilterEntries.length > 0 ? (
                    <span className="ml-2 text-xs text-muted-foreground">({activeFilterEntries.length})</span>
                  ) : null}
                </button>
              </div>
              <SortDropdown />
            </div>
          </div>
        </header>

        {isMobileFiltersOpen ? (
          <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Filtros">
            <button
              type="button"
              aria-label="Cerrar filtros"
              className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
              onClick={() => setIsMobileFiltersOpen(false)}
            />

            <div className="absolute inset-y-0 left-0 w-[min(92vw,360px)] border-r border-outline-variant bg-white p-4 shadow-xl">
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="font-sans text-xl font-bold">Filtros</p>
                <button
                  type="button"
                  onClick={() => setIsMobileFiltersOpen(false)}
                  className="rounded-full border border-outline-variant px-3 py-1 text-xs font-medium text-foreground transition hover:border-primary"
                >
                  Cerrar
                </button>
              </div>

              <div className="max-h-[calc(100vh-120px)] overflow-auto pr-1">
                <FiltersSidebar facets={facets} isLoading={isLoading} className="border-0 p-0" />
              </div>
            </div>
          </div>
        ) : null}

        <section className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          <FiltersSidebar facets={facets} isLoading={isLoading} className="hidden lg:col-span-3 lg:block" />

          <div className="space-y-10 lg:col-span-9">
            {/* Search results indicator */}
            {searchQuery.trim() && (
              <div className="rounded-xl border border-primary/20 bg-primary-fixed p-4 flex items-center justify-between gap-3">
                <p className="text-sm text-foreground">
                  Resultados para <strong>&ldquo;{searchQuery}&rdquo;</strong>
                  <span className="ml-2 text-muted-foreground">({products.length} {products.length === 1 ? "producto" : "productos"})</span>
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    router.push("/catalogo");
                  }}
                  className="rounded-full border border-outline-variant px-3 py-1 text-xs font-medium text-foreground transition hover:border-primary hover:text-primary shrink-0"
                >
                  Limpiar búsqueda
                </button>
              </div>
            )}

            {activeFilterEntries.length > 0 ? (
              <div className="rounded-xl border border-outline-variant bg-surface-container-low p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-bold text-foreground">Filtros activos</p>
                  <button
                    type="button"
                    onClick={clearAll}
                    className="rounded-full border border-outline-variant px-3 py-1 text-xs font-medium text-foreground transition hover:border-primary hover:text-primary"
                  >
                    Limpiar todo
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {activeFilterEntries.map((entry) => (
                    <button
                      key={`${entry.key}-${entry.value}`}
                      type="button"
                      onClick={() => toggleFilterValue(entry.key, entry.value)}
                      className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-foreground transition hover:bg-primary/20"
                      title="Quitar filtro"
                    >
                      <span className="capitalize">{entry.key.replace(/_/g, " ")}</span>:{" "}
                      <span className="capitalize">{entry.value}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {isLoading ? (
              <div className="rounded-xl border border-outline-variant bg-surface-container-low p-6 text-muted-foreground">
                Cargando productos…
              </div>
            ) : isError ? (
              <div className="rounded-xl border border-outline-variant bg-surface-container-low p-6 text-muted-foreground">
                No se pudieron cargar los productos.
              </div>
            ) : products.length === 0 ? (
              <EmptyState
                title="No encontramos productos con estos filtros"
                description="Prueba limpiando filtros o cambiando el ordenamiento para ver más opciones."
                actionLabel={activeFilterEntries.length > 0 ? "Limpiar filtros" : undefined}
                onAction={activeFilterEntries.length > 0 ? clearAll : undefined}
              />
            ) : (
              <>
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
                  {visibleProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {safePage < totalPages && (
                  <div
                    ref={lastProductElementRef}
                    className="mt-8 flex justify-center py-4 text-sm text-muted-foreground"
                  >
                    <span>Cargando más productos...</span>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}


