import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
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
  variant = "soft",
  tone = "neutral",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant, tone }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
