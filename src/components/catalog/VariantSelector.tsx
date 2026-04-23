"use client";

import { cn } from "@/src/lib/utils";

type RawOptionValue = string | number | boolean;

type RawOptionObject = {
  value?: RawOptionValue;
  valor?: RawOptionValue;
  label?: string;
  nombre?: string;
};

type VariantOption = {
  value: string;
  label: string;
};

type VariantGroup = {
  key: string;
  label: string;
  options: VariantOption[];
};

type VariantSelectorProps = {
  esquemaOpciones: Record<string, unknown>;
  selectedVariants: Record<string, string>;
  onVariantChange: (key: string, value: string) => void;
  className?: string;
};

function toVariantOption(input: unknown): VariantOption | null {
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

    return {
      value,
      label: String(labelSource),
    };
  }

  return null;
}

function normalizeVariantGroups(esquemaOpciones: Record<string, unknown>): VariantGroup[] {
  return Object.entries(esquemaOpciones)
    .map(([key, value]) => {
      if (!Array.isArray(value)) {
        return null;
      }

      const options = value
        .map((option) => toVariantOption(option))
        .filter((option): option is VariantOption => option !== null);

      if (options.length === 0) {
        return null;
      }

      return {
        key,
        label: key.replace(/_/g, " "),
        options,
      };
    })
    .filter((group): group is VariantGroup => group !== null);
}

export function VariantSelector({
  esquemaOpciones,
  selectedVariants,
  onVariantChange,
  className,
}: VariantSelectorProps) {
  const groups = normalizeVariantGroups(esquemaOpciones);

  if (groups.length === 0) {
    return null;
  }

  return (
    <section className={cn("space-y-5", className)}>
      {groups.map((group) => {
        const selectedValue = selectedVariants[group.key];

        return (
          <div key={group.key} className="space-y-2">
            <p className="text-sm font-medium capitalize text-foreground">{group.label}</p>

            <div className="flex flex-wrap gap-2">
              {group.options.map((option) => {
                const isActive = option.value === selectedValue;

                return (
                  <button
                    key={`${group.key}-${option.value}`}
                    type="button"
                    onClick={() => onVariantChange(group.key, option.value)}
                    className={cn(
                      "rounded-full border px-4 py-2 text-sm transition",
                      isActive
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-foreground/15 bg-background text-foreground hover:border-primary/50",
                    )}
                    aria-pressed={isActive}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </section>
  );
}
