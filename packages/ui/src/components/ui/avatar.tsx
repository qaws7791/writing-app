import * as React from "react"

import { cn } from "../../lib/utils"

function Avatar({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="avatar"
      className={cn(
        "relative inline-flex size-10 shrink-0 overflow-hidden rounded-pill bg-bg-surface text-fg-default",
        className
      )}
      {...props}
    />
  )
}

function AvatarImage({
  className,
  alt = "",
  ...props
}: React.ComponentProps<"img">) {
  return (
    <img
      alt={alt}
      data-slot="avatar-image"
      className={cn("size-full object-cover", className)}
      {...props}
    />
  )
}

function AvatarFallback({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="avatar-fallback"
      className={cn(
        "flex size-full items-center justify-center text-sm font-bold",
        className
      )}
      {...props}
    />
  )
}

export { Avatar, AvatarFallback, AvatarImage }
