"use client";

import { cn } from "@/src/lib/utils";
import { useCatalogStore } from "@/src/stores/catalogStore";
import { Checkbox } from "@/src/components/ui/checkbox";

type FiltersSidebarProps = {
  facets: Record<string, string[]>;
  isLoading?: boolean;
  className?: string;
};

function normalizeKey(value: string) {
  return value.trim().toLowerCase();
}

function pickFacetKey(facets: Record<string, string[]>, candidates: string[]) {
  const candidateSet = new Set(candidates.map(normalizeKey));
  const keys = Object.keys(facets);
  return (
    keys.find((key) => candidateSet.has(normalizeKey(key))) ??
    keys.find((key) => candidates.some((c) => normalizeKey(key).includes(normalizeKey(c))))
  );
}

export function FiltersSidebar({ facets, isLoading, className }: FiltersSidebarProps) {
  const activeFilters = useCatalogStore((state) => state.filters);
  const toggleFilterValue = useCatalogStore((state) => state.toggleFilterValue);
  const clearAll = useCatalogStore((state) => state.clearAll);
  const clearFilter = useCatalogStore((state) => state.clearFilter);
  const isSelected = useCatalogStore((state) => state.isSelected);

  const hasFilters = Object.keys(activeFilters).length > 0;
  
  const categoryFacetKey = pickFacetKey(facets, ["categoria", "categoría", "category", "categorias", "categorías", "tipo"]);
  const materialFacetKey = pickFacetKey(facets, ["material", "materiales"]);

  const otherFacetKeys = Object.keys(facets).filter(
    (key) => key !== categoryFacetKey && key !== materialFacetKey
  );

  return (
    <aside className={cn("space-y-10", className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Filtros</p>
          <p className="mt-2 text-sm text-muted-foreground">Refina por categoría y materiales.</p>
        </div>

        <button
          type="button"
          onClick={clearAll}
          disabled={!hasFilters}
          className={cn(
            "rounded-full border px-3 py-1 text-xs font-semibold transition",
            hasFilters
              ? "border-secondary bg-secondary-container text-on-surface hover:border-[#67615a] hover:bg-[#ddd5cc]"
              : "cursor-not-allowed border-outline-variant bg-surface-container text-muted-foreground",
          )}
        >
          Limpiar
        </button>
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-outline-variant bg-surface-container-low p-4 text-sm text-muted-foreground">
          Cargando filtros…
        </div>
      ) : Object.keys(facets).length === 0 ? (
        <div className="rounded-2xl border border-outline-variant bg-surface-container-low p-4 text-sm text-muted-foreground">
          No hay filtros disponibles.
        </div>
      ) : (
        <>
          {categoryFacetKey && facets[categoryFacetKey].length > 0 ? (
            <section>
              <div className="mb-6 flex items-baseline justify-between gap-3">
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Categoría</h3>
                <button
                  type="button"
                  onClick={() => clearFilter(categoryFacetKey)}
                  disabled={!activeFilters[categoryFacetKey] || activeFilters[categoryFacetKey].length === 0}
                  className={cn(
                    "text-xs font-semibold transition",
                    activeFilters[categoryFacetKey] && activeFilters[categoryFacetKey].length > 0
                      ? "text-muted-foreground hover:text-foreground"
                      : "cursor-not-allowed text-muted-foreground/40",
                  )}
                >
                  limpiar
                </button>
              </div>

              <div className="space-y-3">
                {facets[categoryFacetKey].map((optionLabel) => {
                  const checked = isSelected(categoryFacetKey, optionLabel);
                  return (
                    <Checkbox
                      key={`${categoryFacetKey}-${optionLabel}`}
                      checked={checked}
                      onChange={() => toggleFilterValue(categoryFacetKey, optionLabel)}
                      label={
                        <span className="flex items-center gap-2">
                          <span className="capitalize">{optionLabel}</span>
                        </span>
                      }
                    />
                  );
                })}
              </div>
            </section>
          ) : null}

          {materialFacetKey && facets[materialFacetKey].length > 0 ? (
            <section>
              <div className="mb-6 flex items-baseline justify-between gap-3">
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Material</h3>
                <button
                  type="button"
                  onClick={() => clearFilter(materialFacetKey)}
                  disabled={!activeFilters[materialFacetKey] || activeFilters[materialFacetKey].length === 0}
                  className={cn(
                    "text-xs font-semibold transition",
                    activeFilters[materialFacetKey] && activeFilters[materialFacetKey].length > 0
                      ? "text-muted-foreground hover:text-foreground"
                      : "cursor-not-allowed text-muted-foreground/40",
                  )}
                >
                  limpiar
                </button>
              </div>

              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={() => clearFilter(materialFacetKey)}
                  className={cn(
                    "flex items-center justify-between rounded-2xl px-4 py-3 text-left text-sm transition",
                    !activeFilters[materialFacetKey] || activeFilters[materialFacetKey].length === 0
                      ? "border border-outline-variant bg-surface-container-high font-semibold text-foreground"
                      : "border border-transparent text-muted-foreground hover:bg-surface-container-low",
                  )}
                >
                  <span>Todos</span>
                </button>

                {facets[materialFacetKey].map((optionLabel) => {
                  const active = isSelected(materialFacetKey, optionLabel);
                  return (
                    <button
                      key={`${materialFacetKey}-${optionLabel}`}
                      type="button"
                      onClick={() => toggleFilterValue(materialFacetKey, optionLabel)}
                      className={cn(
                        "flex items-center justify-between rounded-2xl px-4 py-3 text-left text-sm transition",
                        active
                          ? "border border-outline-variant bg-surface-container-high font-semibold text-foreground"
                          : "border border-transparent text-muted-foreground hover:bg-surface-container-low",
                      )}
                    >
                      <span className="capitalize">{optionLabel}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          ) : null}

          {otherFacetKeys.length > 0 ? (
            <section className="space-y-4">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Opciones</h3>
              </div>
              <div className="space-y-6">
                {otherFacetKeys.map((facetKey) => (
                  <div key={facetKey} className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold capitalize">{facetKey.replace(/_/g, " ")}</p>
                      <button
                        type="button"
                        onClick={() => clearFilter(facetKey)}
                        disabled={!activeFilters[facetKey] || activeFilters[facetKey].length === 0}
                        className={cn(
                          "text-xs font-semibold transition",
                          activeFilters[facetKey] && activeFilters[facetKey].length > 0
                            ? "text-muted-foreground hover:text-foreground"
                            : "cursor-not-allowed text-muted-foreground/40",
                        )}
                      >
                        limpiar
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {facets[facetKey].map((optionLabel) => {
                        const active = isSelected(facetKey, optionLabel);
                        return (
                          <button
                            key={`${facetKey}-${optionLabel}`}
                            type="button"
                            onClick={() => toggleFilterValue(facetKey, optionLabel)}
                            className={cn(
                              "rounded-full border px-3 py-2 text-sm transition",
                              active
                                ? "border-primary bg-primary text-on-primary-container"
                                : "border-secondary bg-secondary-container text-on-surface hover:border-[#67615a] hover:bg-[#ddd5cc]",
                            )}
                            aria-pressed={active}
                          >
                            <span className="capitalize">{optionLabel}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <section className="rounded-3xl border border-primary/35 bg-primary/12 p-6">
            <p className="mb-2 text-sm font-semibold text-on-primary-container">Compromiso Eco</p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Todos nuestros productos utilizan materiales de fuentes certificadas y procesos de impresión con tintas de bajo impacto.
            </p>
          </section>
        </>
      )}
    </aside>
  );
}

