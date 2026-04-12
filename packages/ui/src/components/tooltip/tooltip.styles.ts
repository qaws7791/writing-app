import type { VariantProps } from "@workspace/ui/utils/tv"

import { tv } from "@workspace/ui/utils/tv"

export const tooltipVariants = tv({
  slots: {
    base: "tooltip",
    trigger: "tooltip__trigger",
  },
})

export type TooltipVariants = VariantProps<typeof tooltipVariants>
