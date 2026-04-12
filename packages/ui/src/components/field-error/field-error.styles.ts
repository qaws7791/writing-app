import type { VariantProps } from "@workspace/ui/utils/tv"

import { tv } from "@workspace/ui/utils/tv"

export const fieldErrorVariants = tv({
  base: "field-error",
})

export type FieldErrorVariants = VariantProps<typeof fieldErrorVariants>
