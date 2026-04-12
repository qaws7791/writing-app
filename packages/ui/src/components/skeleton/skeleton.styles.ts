import type { VariantProps } from "@workspace/ui/utils/tv"

import { tv } from "@workspace/ui/utils/tv"

export const skeletonVariants = tv({
  defaultVariants: {
    animationType: "shimmer",
  },
  slots: {
    base: "skeleton",
  },
  variants: {
    animationType: {
      none: {
        base: "skeleton--none",
      },
      pulse: {
        base: "skeleton--pulse",
      },
      shimmer: {
        base: "skeleton--shimmer",
      },
    },
  },
})

export type SkeletonVariants = VariantProps<typeof skeletonVariants>
