import type { VariantProps } from "@workspace/ui/utils/tv"

import { tv } from "@workspace/ui/utils/tv"

export const menuVariants = tv({
  base: "menu",
})

export type MenuVariants = VariantProps<typeof menuVariants>
