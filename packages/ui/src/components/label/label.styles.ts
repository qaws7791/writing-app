import type { VariantProps } from "@workspace/ui/utils/tv"

import { tv } from "@workspace/ui/utils/tv"

export const labelVariants = tv({
  base: "label",
  variants: {
    isDisabled: {
      true: "label--disabled",
    },
    isInvalid: {
      true: "label--invalid",
    },
    isRequired: {
      true: "label--required",
    },
  },
})

export type LabelVariants = VariantProps<typeof labelVariants>
