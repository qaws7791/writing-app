import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const chipVariants = cva("inline-flex items-center rounded-full font-medium", {
  variants: {
    variant: {
      primary: "bg-primary text-primary-foreground",
      secondary: "bg-muted text-muted-foreground",
    },
    size: {
      sm: "px-2.5 py-0.5 text-xs",
      md: "px-3 py-1 text-sm",
    },
  },
  defaultVariants: {
    variant: "secondary",
    size: "md",
  },
})

function Chip({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof chipVariants>) {
  return (
    <span
      data-slot="chip"
      className={cn(chipVariants({ variant, size }), className)}
      {...props}
    />
  )
}

export { Chip, chipVariants }
