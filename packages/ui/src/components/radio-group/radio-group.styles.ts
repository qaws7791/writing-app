import type { VariantProps } from "@workspace/ui/utils/tv"

import { tv } from "@workspace/ui/utils/tv"

export const radioGroupVariants = tv({
  base: "radio-group",
  defaultVariants: {
    variant: "primary",
  },
  variants: {
    variant: {
      primary: "radio-group--primary",
      secondary: "radio-group--secondary",
    },
  },
})

export type RadioGroupVariants = VariantProps<typeof radioGroupVariants>
