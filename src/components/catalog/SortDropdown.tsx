"use client";

import { useId } from "react";

import type { CatalogSort } from "@/src/stores/catalogStore";
import { useCatalogStore } from "@/src/stores/catalogStore";

const SORT_OPTIONS: Array<{ value: CatalogSort; label: string }> = [
  { value: "popularidad", label: "Popularidad" },
  { value: "nombre_asc", label: "Nombre: A a Z" },
  { value: "nombre_desc", label: "Nombre: Z a A" },
  { value: "precio_asc", label: "Precio: Bajo a Alto" },
  { value: "precio_desc", label: "Precio: Alto a Bajo" },
  { value: "novedades", label: "Novedades" },
];

type SortDropdownProps = {
  className?: string;
};

export function SortDropdown({ className }: SortDropdownProps) {
  const id = useId();
  const sort = useCatalogStore((state) => state.sort);
  const setSort = useCatalogStore((state) => state.setSort);

  return (
    <div className={className}>
      <div className="flex items-center gap-3 rounded-full border border-outline-variant bg-surface-container-low p-2">
        <label
          htmlFor={id}
          className="pl-3 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground"
        >
          Ordenar:
        </label>
        <select
          id={id}
          value={sort}
          onChange={(event) => {
            setSort(event.target.value as CatalogSort);
          }}
          className="h-9 w-full cursor-pointer appearance-none rounded-full border border-secondary bg-secondary-container px-4 pr-9 text-sm font-semibold text-on-surface outline-none transition-colors hover:border-[#67615a] hover:bg-[#ddd5cc] sm:w-[220px]"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

