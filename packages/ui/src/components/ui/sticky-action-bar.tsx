import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"

const stickyActionBarVariants = cva(
  "w-full px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]",
  {
    variants: {
      tone: {
        default:
          "bg-gradient-to-t from-bg-canvas via-bg-canvas to-transparent pt-10 text-foreground",
        danger: "pt-0 text-danger-foreground",
        success: "pt-0 text-success-foreground",
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
