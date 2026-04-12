import type { VariantProps } from "@workspace/ui/utils/tv"

import { tv } from "@workspace/ui/utils/tv"

export const toolbarVariants = tv({
  base: "toolbar",
  defaultVariants: {
    isAttached: false,
    orientation: "horizontal",
  },
  variants: {
    isAttached: {
      true: "toolbar--attached",
    },
    orientation: {
      horizontal: "toolbar--horizontal",
      vertical: "toolbar--vertical",
    },
  },
})

export type ToolbarVariants = VariantProps<typeof toolbarVariants>
