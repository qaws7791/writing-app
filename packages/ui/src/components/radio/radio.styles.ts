import type { VariantProps } from "@workspace/ui/utils/tv"

import { tv } from "@workspace/ui/utils/tv"

export const radioVariants = tv({
  slots: {
    base: "radio",
    content: "radio__content",
    control: "radio__control",
    indicator: "radio__indicator",
  },
})

export type RadioVariants = VariantProps<typeof radioVariants>
