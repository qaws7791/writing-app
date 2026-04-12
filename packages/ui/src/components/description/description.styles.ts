import type { VariantProps } from "@workspace/ui/utils/tv"

import { tv } from "@workspace/ui/utils/tv"

export const descriptionVariants = tv({
  base: "description",
})

export type DescriptionVariants = VariantProps<typeof descriptionVariants>
