import type { VariantProps } from "@workspace/ui/utils/tv"

import { tv } from "@workspace/ui/utils/tv"

export const switchGroupVariants = tv({
  defaultVariants: {
    orientation: "vertical",
  },
  slots: {
    base: "switch-group",
    items: "switch-group__items",
  },
  variants: {
    orientation: {
      horizontal: {
        base: "switch-group--horizontal",
      },
      vertical: {
        base: "switch-group--vertical",
      },
    },
  },
})

export type SwitchGroupVariants = VariantProps<typeof switchGroupVariants>
