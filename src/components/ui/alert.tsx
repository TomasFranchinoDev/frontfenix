import * as React from "react"

import { cn } from "@/src/lib/utils"

type AlertVariant = "default" | "success" | "destructive"

function Alert({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"div"> & { variant?: AlertVariant }) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(
        "rounded-2xl border px-4 py-3 text-sm",
        variant === "default" && "border-foreground/10 bg-muted/25 text-foreground",
        variant === "success" && "border-primary/20 bg-primary/10 text-foreground",
        variant === "destructive" && "border-red-200 bg-red-50 text-red-700",
        className,
      )}
      {...props}
    />
  )
}

function AlertTitle({ className, ...props }: React.ComponentProps<"h5">) {
  return <h5 data-slot="alert-title" className={cn("mb-1 font-semibold", className)} {...props} />
}

function AlertDescription({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="alert-description" className={cn("text-sm leading-relaxed", className)} {...props} />
}

export { Alert, AlertTitle, AlertDescription }

