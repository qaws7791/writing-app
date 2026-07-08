import * as React from "react"

import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"

const surfaceVariants = cva(
  "rounded-4xl text-foreground transition-transform",
  {
    variants: {
      variant: {
        default: "bg-surface",
        elevated: "bg-bg-elevated border border-border",
        panel: "rounded-4xl bg-surface",
      },
      size: {
        none: "",
        sm: "p-4",
        md: "p-6",
        lg: "p-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
)

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
