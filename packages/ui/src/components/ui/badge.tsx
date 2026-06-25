import * as React from "react"

import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"

const badgeVariants = cva(
  "inline-flex min-h-6 w-fit items-center rounded-pill border px-2.5 text-label-sm font-bold",
  {
    variants: {
      tone: {
        neutral: "border-border-default bg-bg-elevated text-fg-default",
        success: "border-success-fg/20 bg-success-bg text-success-fg",
        danger: "border-danger-fg/20 bg-danger-bg text-danger-fg",
        info: "border-info-fg/20 bg-info-bg text-info-fg",
        selected:
          "border-action-selected-fg/20 bg-action-selected-bg text-action-selected-fg",
      },
      variant: {
        soft: "",
        outline: "bg-transparent",
      },
    },
    defaultVariants: {
      tone: "neutral",
      variant: "soft",
    },
  }
)

function Badge({
  className,
  tone = "neutral",
  variant = "soft",
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span
      data-slot="badge"
      data-tone={tone}
      className={cn(badgeVariants({ tone, variant, className }))}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
