import * as React from "react"

import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"

const surfaceVariants = cva("text-fg-default", {
  variants: {
    variant: {
      default: "bg-bg-surface",
      elevated: "bg-bg-elevated",
      panel: "rounded-panel bg-bg-surface",
    },
    size: {
      none: "",
      sm: "p-(--surface-padding-sm)",
      md: "p-(--surface-padding-md)",
      lg: "p-(--surface-padding-lg)",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "md",
  },
})

function Surface({
  className,
  size = "md",
  variant = "default",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof surfaceVariants>) {
  return (
    <div
      data-slot="surface"
      className={cn(surfaceVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Surface, surfaceVariants }
