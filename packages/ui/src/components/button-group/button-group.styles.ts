import type { VariantProps } from "@workspace/ui/utils/tv"

import { tv } from "@workspace/ui/utils/tv"

export const buttonGroupVariants = tv({
  defaultVariants: {
    fullWidth: false,
    orientation: "horizontal",
  },
  slots: {
    base: "button-group",
    separator: "button-group__separator",
  },
  variants: {
    fullWidth: {
      false: {},
      true: {
        base: "button-group--full-width",
      },
    },
    orientation: {
      horizontal: {
        base: "button-group--horizontal",
      },
      vertical: {
        base: "button-group--vertical",
      },
    },
  },
})

export type ButtonGroupVariants = VariantProps<typeof buttonGroupVariants>
