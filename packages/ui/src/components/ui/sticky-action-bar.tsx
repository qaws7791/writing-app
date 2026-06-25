import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"

const stickyActionBarVariants = cva(
  "w-full border-t px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-5",
  {
    variants: {
      tone: {
        default: "border-border-subtle bg-bg-canvas text-fg-default",
        danger: "border-danger-fg/20 bg-danger-bg text-danger-fg",
        success: "border-success-fg/20 bg-success-bg text-success-fg",
      },
    },
    defaultVariants: {
      tone: "default",
    },
  }
)

function StickyActionBar({
  className,
  tone = "default",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof stickyActionBarVariants>) {
  return (
    <div
      data-slot="sticky-action-bar"
      data-tone={tone}
      className={cn(stickyActionBarVariants({ tone, className }))}
      {...props}
    />
  )
}

export { StickyActionBar, stickyActionBarVariants }
