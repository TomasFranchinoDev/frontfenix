import { create } from "zustand";

export type CatalogSort =
  | "popularidad"
  | "precio_asc"
  | "precio_desc"
  | "novedades"
  | "nombre_asc"
  | "nombre_desc";

export type CatalogFilters = Record<string, string[]>;

type CatalogState = {
  sort: CatalogSort;
  filters: CatalogFilters;
  searchQuery: string;
  setSort: (sort: CatalogSort) => void;
  setSearchQuery: (query: string) => void;
  toggleFilterValue: (filterKey: string, value: string) => void;
  clearFilter: (filterKey: string) => void;
  clearAll: () => void;
  isSelected: (filterKey: string, value: string) => boolean;
};

function normalizeKey(value: string) {
  return value.trim();
}

function unique(values: string[]) {
  return Array.from(new Set(values));
}

export const useCatalogStore = create<CatalogState>((set, get) => ({
  sort: "popularidad",
  filters: {},
  searchQuery: "",
  setSort: (sort) => {
    set({ sort });
  },
  setSearchQuery: (query) => {
    set({ searchQuery: query });
  },
  toggleFilterValue: (filterKey, rawValue) => {
    const key = normalizeKey(filterKey);
    const value = normalizeKey(rawValue);
    if (!key || !value) {
      return;
    }

    set((state) => {
      const current = state.filters[key] ?? [];
      const hasValue = current.includes(value);
      const nextValues = hasValue ? current.filter((item) => item !== value) : unique([...current, value]);

      const nextFilters = { ...state.filters };
      if (nextValues.length === 0) {
        delete nextFilters[key];
      } else {
        nextFilters[key] = nextValues;
      }

      return { filters: nextFilters };
    });
  },
  clearFilter: (filterKey) => {
    const key = normalizeKey(filterKey);
    if (!key) {
      return;
    }

    set((state) => {
      if (!state.filters[key]) {
        return state;
      }

      const next = { ...state.filters };
      delete next[key];
      return { filters: next };
    });
  },
  clearAll: () => {
    set({ filters: {} });
  },
  isSelected: (filterKey, rawValue) => {
    const key = normalizeKey(filterKey);
    const value = normalizeKey(rawValue);
    if (!key || !value) {
      return false;
    }
    return (get().filters[key] ?? []).includes(value);
  },
}));

