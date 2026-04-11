import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@workspace/ui/lib/utils"

const skeletonVariants = cva("animate-pulse bg-surface-container-highest", {
  variants: {
    variant: {
      text: "rounded",
      rectangular: "rounded-md",
      circular: "rounded-full",
    },
  },
  defaultVariants: {
    variant: "rectangular",
  },
})

export interface SkeletonProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> {
  width?: number | string
  height?: number | string
  size?: number | string
}

function Skeleton({
  className,
  variant,
  width,
  height,
  size,
  style,
  ...props
}: SkeletonProps) {
  const resolvedStyle: React.CSSProperties = {
    width: variant === "circular" ? (size ?? 40) : width,
    height: variant === "circular" ? (size ?? 40) : height,
    ...style,
  }

  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn(skeletonVariants({ variant }), className)}
      style={resolvedStyle}
      {...props}
    />
  )
}

export { Skeleton }
