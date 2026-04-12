import type { VariantProps } from "@workspace/ui/utils/tv"

import { tv } from "@workspace/ui/utils/tv"

export const errorMessageVariants = tv({
  base: "error-message",
})

export type ErrorMessageVariants = VariantProps<typeof errorMessageVariants>
