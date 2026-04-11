import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@workspace/ui/lib/utils"

const dividerVariants = cva("shrink-0 bg-outline/20", {
  variants: {
    orientation: {
      horizontal: "h-px w-full",
      vertical: "h-full w-px",
    },
    variant: {
      "full-width": "",
      inset: "",
      "middle-inset": "",
    },
  },
  compoundVariants: [
    { orientation: "horizontal", variant: "inset", className: "ml-16" },
    { orientation: "horizontal", variant: "middle-inset", className: "mx-4" },
    { orientation: "vertical", variant: "inset", className: "mt-4" },
    { orientation: "vertical", variant: "middle-inset", className: "my-4" },
  ],
  defaultVariants: {
    orientation: "horizontal",
    variant: "full-width",
  },
})

export interface DividerProps
  extends
    React.HTMLAttributes<HTMLHRElement>,
    VariantProps<typeof dividerVariants> {}

function Divider({ className, orientation, variant, ...props }: DividerProps) {
  return (
    <hr
      data-slot="divider"
      role="separator"
      aria-orientation={orientation ?? "horizontal"}
      className={cn(dividerVariants({ orientation, variant }), className)}
      {...props}
    />
  )
}

export { Divider }
