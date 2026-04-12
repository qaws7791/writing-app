import type { VariantProps } from "@workspace/ui/utils/tv"

import { tv } from "@workspace/ui/utils/tv"

export const inputVariants = tv({
  base: "input",
  defaultVariants: {
    fullWidth: false,
    variant: "primary",
  },
  variants: {
    fullWidth: {
      false: "",
      true: "input--full-width",
    },
    variant: {
      primary: "input--primary",
      secondary: "input--secondary",
    },
  },
})

export type InputVariants = VariantProps<typeof inputVariants>
