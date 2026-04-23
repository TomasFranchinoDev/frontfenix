import type { ReactNode } from "react"

import { Button } from "@/src/components/ui/button"

type EmptyStateProps = {
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  icon?: ReactNode
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon,
}: EmptyStateProps) {
  return (
    <div className="rounded-2xl border border-foreground/10 bg-muted/40 p-8 text-center">
      {icon ? <div className="mb-3 flex justify-center text-accent">{icon}</div> : null}
      <h3 className="font-sans text-2xl text-foreground">{title}</h3>
      {description ? <p className="mx-auto mt-2 text-sm text-muted-foreground">{description}</p> : null}
      {actionLabel && onAction ? (
        <Button onClick={onAction} className="mt-5">
          {actionLabel}
        </Button>
      ) : null}
    </div>
  )
}
