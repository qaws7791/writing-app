import type { VariantProps } from "@workspace/ui/utils/tv"

import { tv } from "@workspace/ui/utils/tv"

export const closeButtonVariants = tv({
  base: "close-button",
  defaultVariants: {
    variant: "default",
  },
  variants: {
    variant: {
      default: "close-button--default",
    },
  },
})

export type CloseButtonVariants = VariantProps<typeof closeButtonVariants>
