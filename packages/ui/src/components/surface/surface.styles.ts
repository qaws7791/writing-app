import type { VariantProps } from "@workspace/ui/utils/tv"

import { tv } from "@workspace/ui/utils/tv"

export const surfaceVariants = tv({
  base: "surface",
  defaultVariants: {
    variant: "default",
  },
  variants: {
    variant: {
      default: "surface--default",
      secondary: "surface--secondary",
      tertiary: "surface--tertiary",
      transparent: "surface--transparent",
    },
  },
})

export type SurfaceVariants = VariantProps<typeof surfaceVariants>
