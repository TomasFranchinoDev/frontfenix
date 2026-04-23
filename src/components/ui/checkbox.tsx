import * as React from "react"

import { cn } from "@/src/lib/utils"

type CheckboxProps = Omit<React.ComponentProps<"input">, "type"> & {
  label?: React.ReactNode
}

export function Checkbox({ className, checked, onChange, disabled, label, id, ...props }: CheckboxProps) {
  const generatedId = React.useId()
  const inputId = id ?? generatedId

  return (
    <label
      htmlFor={inputId}
      className={cn(
        "group flex cursor-pointer items-center gap-3 select-none",
        disabled ? "cursor-not-allowed opacity-60" : "",
        className,
      )}
    >
      <span
        className={cn(
          "flex size-5 items-center justify-center rounded border-2 transition-colors",
          checked ? "border-primary" : "border-foreground/20 group-hover:border-primary/60",
        )}
        aria-hidden="true"
      >
        <span className={cn("size-2.5 rounded-sm bg-primary transition-opacity", checked ? "opacity-100" : "opacity-0")} />
      </span>
      <input
        {...props}
        id={inputId}
        type="checkbox"
        className="sr-only"
        checked={Boolean(checked)}
        onChange={onChange}
        disabled={disabled}
      />
      {label ? <span className={cn(checked ? "font-semibold text-foreground" : "font-medium text-foreground")}>{label}</span> : null}
    </label>
  )
}

