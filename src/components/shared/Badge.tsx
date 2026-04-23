import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/src/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.09em] transition-colors",
  {
    variants: {
      variant: {
        default: "border-primary/25 bg-primary-container text-on-primary-container",
        muted: "border-secondary/20 bg-secondary-container text-on-surface",
        outline: "border-outline bg-transparent text-on-surface",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)

type BadgeProps = React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}
