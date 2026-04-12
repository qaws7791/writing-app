import type { VariantProps } from "@workspace/ui/utils/tv"

import { tv } from "@workspace/ui/utils/tv"

export const textFieldVariants = tv({
  base: "textfield",
  defaultVariants: {
    fullWidth: false,
  },
  variants: {
    fullWidth: {
      false: "",
      true: "textfield--full-width",
    },
  },
})

export type TextFieldVariants = VariantProps<typeof textFieldVariants>
