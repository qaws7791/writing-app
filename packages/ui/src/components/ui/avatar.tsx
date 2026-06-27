import * as React from "react"
import { Avatar as AvatarPrimitive } from "@base-ui/react/avatar"
import { cn } from "../../lib/utils"

function Avatar({
  className,
  size = "md",
  ...props
}: AvatarPrimitive.Root.Props & {
  size?: "sm" | "md" | "lg"
}) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      data-size={size}
      className={cn(
        "group/avatar relative inline-flex size-10 shrink-0 overflow-hidden rounded-pill bg-bg-surface text-fg-default  data-[size=lg]:size-12 data-[size=sm]:size-8 select-none",
        className
      )}
      {...props}
    />
  )
}

function AvatarImage({ className, ...props }: AvatarPrimitive.Image.Props) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn(
        "aspect-square size-full rounded-full object-cover",
        className
      )}
      {...props}
    />
  )
}

function AvatarFallback({
  className,
  ...props
}: AvatarPrimitive.Fallback.Props) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        "flex size-full items-center justify-center text-sm font-bold group-data-[size=sm]/avatar:text-xs",
        className
      )}
      {...props}
    />
  )
}

export { Avatar, AvatarFallback, AvatarImage }
