"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@workspace/ui/lib/utils"

const avatarVariants = cva(
  "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-container text-on-primary-container select-none",
  {
    variants: {
      size: {
        sm: "size-8 text-label-medium",
        md: "size-10 text-label-large",
        lg: "size-14 text-title-medium",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
)

export interface AvatarProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof avatarVariants> {
  src?: string | null
  alt?: string
  fallback?: string
}

function Avatar({
  className,
  size,
  src,
  alt = "",
  fallback,
  ...props
}: AvatarProps) {
  const [hasError, setHasError] = React.useState(false)

  React.useEffect(() => {
    setHasError(false)
  }, [src])

  const initials = React.useMemo(() => {
    if (fallback) return fallback
    if (!alt) return "?"
    return alt
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }, [fallback, alt])

  return (
    <div
      data-slot="avatar"
      className={cn(avatarVariants({ size }), className)}
      {...props}
    >
      {src && !hasError ? (
        <img
          src={src}
          alt={alt}
          className="size-full object-cover"
          onError={() => setHasError(true)}
        />
      ) : (
        <span aria-hidden="true">{initials}</span>
      )}
    </div>
  )
}

export { Avatar, avatarVariants }
