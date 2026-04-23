import * as React from "react"

import { cn } from "@/src/lib/utils"
import Image, { type ImageProps } from "next/image"

type AvatarImageProps = Omit<ImageProps, "fill"> & {
  className?: string
  alt: string // obligatorio
}
function Avatar({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="avatar"
      className={cn("relative flex size-10 shrink-0 overflow-hidden rounded-full bg-muted/40", className)}
      {...props}
    />
  )
}

function AvatarImage({ className, alt, sizes = "40px", ...props }: AvatarImageProps) {
  return (
    <Image
      data-slot="avatar-image"
      className={cn("aspect-square h-full w-full object-cover", className)}
      alt={alt}
      sizes={sizes}
      {...props}
    />
  )
}

function AvatarFallback({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="avatar-fallback"
      className={cn("flex h-full w-full items-center justify-center text-sm font-semibold text-foreground", className)}
      {...props}
    />
  )
}

export { Avatar, AvatarImage, AvatarFallback }

