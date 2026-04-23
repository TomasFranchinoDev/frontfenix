import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/src/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding whitespace-nowrap transition-all duration-200 outline-none select-none focus-visible:border-outline focus-visible:ring-2 focus-visible:ring-primary/25 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "h-11 gap-2 rounded-full border border-primary bg-primary px-6 font-semibold tracking-wide text-white shadow-[0_9px_24px_rgba(212,165,32,0.34)] hover:-translate-y-[1px] hover:border-[#c49314] hover:bg-[#c49314] hover:text-[#2f2200] hover:shadow-[0_12px_28px_rgba(196,147,20,0.4)] active:border-[#b58510] active:bg-[#b58510]",
        secondary:
          "h-11 gap-2 rounded-full border border-secondary bg-secondary-container px-5 font-semibold text-[#3f3a34] shadow-[0_3px_10px_rgba(72,66,58,0.08)] hover:-translate-y-[1px] hover:border-[#67615a] hover:bg-[#ddd5cc] hover:text-[#2f2b26]",
        outline:
          "h-11 gap-2 rounded-full border border-outline bg-surface-light px-5 font-semibold text-[#38342f] hover:-translate-y-[1px] hover:border-primary hover:bg-primary/12 hover:text-[#2d2924]",
        ghost:
          "h-10 gap-2 rounded-full px-4 text-sm font-semibold text-[#45413b] transition-colors hover:bg-primary/15 hover:text-[#2d2d2a]",
        destructive:
          "h-11 gap-2 rounded-full bg-destructive px-6 font-semibold text-destructive-foreground shadow-[0_8px_18px_rgba(197,57,45,0.22)] transition-colors hover:bg-destructive/90",
        link: "px-0 py-0 text-sm font-semibold tracking-normal text-on-primary-container underline-offset-4 transition-colors hover:text-[#3f2e00] hover:underline",
      },
      size: {
        default: "min-h-10",
        xs: "min-h-7 px-2.5 text-xs [&_svg:not([class*='size-'])]:size-3",
        sm: "min-h-9 px-4 text-sm",
        lg: "min-h-12 px-7 text-base",
        icon: "size-10",
        "icon-xs": "size-7 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-9",
        "icon-lg": "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
