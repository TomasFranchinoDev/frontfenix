import { Loader2 } from "lucide-react"

import { cn } from "@/src/lib/utils"

type LoadingSpinnerProps = {
  className?: string
  label?: string
}

export function LoadingSpinner({ className, label = "Cargando..." }: LoadingSpinnerProps) {
  return (
    <div className={cn("flex items-center gap-2 text-muted-foreground", className)} role="status" aria-live="polite">
      <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      <span className="text-sm">{label}</span>
    </div>
  )
}
