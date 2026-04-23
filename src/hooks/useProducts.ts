"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { getProductBySlug, getProducts } from "@/src/lib/api/products";
import type { Product } from "@/src/lib/api/products";
import type { CatalogFilters, CatalogSort } from "@/src/stores/catalogStore";
import { useCatalogStore } from "@/src/stores/catalogStore";

export const productsQueryKeys = {
  all: ["products"] as const,
  bySlug: (slug: string) => ["products", slug] as const,
};

export function useProducts() {
  return useQuery({
    queryKey: productsQueryKeys.all,
    queryFn: getProducts,
    staleTime: 0,
    gcTime: 5 * 60_000,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: productsQueryKeys.bySlug(slug),
    queryFn: () => getProductBySlug(slug),
    enabled: Boolean(slug),
  });
}

type RawOptionValue = string | number | boolean;
type RawOptionObject = {
  value?: RawOptionValue;
  valor?: RawOptionValue;
  label?: string;
  nombre?: string;
};

export type CatalogFacetOption = {
  value: string;
  label: string;
  count: number;
};

export type CatalogFacetGroup = {
  key: string;
  label: string;
  options: CatalogFacetOption[];
};

function toOptionValue(input: unknown): { value: string; label: string } | null {
  if (typeof input === "string" || typeof input === "number" || typeof input === "boolean") {
    const value = String(input);
    return { value, label: value };
  }

  if (typeof input === "object" && input !== null) {
    const raw = input as RawOptionObject;
    const valueSource = raw.value ?? raw.valor ?? raw.label ?? raw.nombre;
    if (
      valueSource === undefined ||
      (typeof valueSource !== "string" && typeof valueSource !== "number" && typeof valueSource !== "boolean")
    ) {
      return null;
    }

    const value = String(valueSource);
    const labelSource = raw.label ?? raw.nombre ?? value;
    return { value, label: String(labelSource) };
  }

  return null;
}

function getUniqueFilters(products: Product[]): Record<string, string[]> {
  const filtersAcc: Record<string, Set<string>> = {};

  products.forEach((product) => {
    if (!product.esquema_opciones) return;

    Object.entries(product.esquema_opciones).forEach(([variantKey, optionsArray]) => {
      if (!filtersAcc[variantKey]) {
        filtersAcc[variantKey] = new Set();
      }

      if (Array.isArray(optionsArray)) {
        optionsArray.forEach((option: any) => {
          const normalized = toOptionValue(option);
          if (normalized && normalized.label) {
            filtersAcc[variantKey].add(normalized.label.trim());
          }
        });
      }
    });
  });

  const deduplicatedFilters: Record<string, string[]> = {};
  Object.keys(filtersAcc).forEach((key) => {
    deduplicatedFilters[key] = Array.from(filtersAcc[key]).sort((a, b) => 
      a.localeCompare(b, "es", { sensitivity: "base" })
    );
  });

  return deduplicatedFilters;
}

function matchesFilters(product: Product, filters: CatalogFilters): boolean {
  const activeKeys = Object.keys(filters);
  if (activeKeys.length === 0) {
    return true;
  }

  return activeKeys.every((activeKey) => {
    const selectedValues = filters[activeKey];
    if (!selectedValues || selectedValues.length === 0) {
      return true;
    }

    const productOptions = product.esquema_opciones?.[activeKey];

    // CRÍTICO: Si el producto no tiene la variante, queda excluido
    if (!Array.isArray(productOptions) || productOptions.length === 0) {
      return false;
    }

    // CRÍTICO: Debe tener al menos un objeto cuyo label coincida con los valores seleccionados (OR dentro de la variante)
    return selectedValues.some((selectedValue) =>
      productOptions.some((opt: any) => {
        const normalized = toOptionValue(opt);
        return normalized && normalized.label.trim() === selectedValue;
      })
    );
  });
}

function parsePrice(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function sortProducts(products: Product[], sort: CatalogSort): Product[] {
  if (sort === "popularidad") {
    return products;
  }

  const list = [...products];
  list.sort((a, b) => {
    if (sort === "precio_asc") {
      return parsePrice(a.precio_base) - parsePrice(b.precio_base);
    }
    if (sort === "precio_desc") {
      return parsePrice(b.precio_base) - parsePrice(a.precio_base);
    }
    if (sort === "novedades") {
      // Fallback sin timestamp: orden por id desc como proxy estable.
      return String(b.id).localeCompare(String(a.id), "es", { sensitivity: "base" });
    }
    if (sort === "nombre_desc") {
      return b.nombre.localeCompare(a.nombre, "es", { sensitivity: "base" });
    }
    return a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" });
  });
  return list;
}

// buildFacets is removed in favor of getUniqueFilters

export function useCatalogProducts() {
  const query = useProducts();
  const sort = useCatalogStore((state) => state.sort);
  const filters = useCatalogStore((state) => state.filters);
  const searchQuery = useCatalogStore((state) => state.searchQuery);

  const facets = useMemo(() => getUniqueFilters(query.data ?? []), [query.data]);

  const filteredProducts = useMemo(() => {
    let base = query.data ?? [];

    // Text search
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      base = base.filter((product) => {
        const name = product.nombre?.toLowerCase() ?? "";
        const desc = product.descripcion?.toLowerCase() ?? "";
        const sku = product.sku?.toLowerCase() ?? "";
        return name.includes(q) || desc.includes(q) || sku.includes(q);
      });
    }

    const filtered = base.filter((product) => matchesFilters(product, filters));
    return sortProducts(filtered, sort);
  }, [filters, query.data, sort, searchQuery]);

  return {
    ...query,
    facets,
    products: filteredProducts,
  };
}
