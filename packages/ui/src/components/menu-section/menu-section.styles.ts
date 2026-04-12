import type { VariantProps } from "@workspace/ui/utils/tv"

import { tv } from "@workspace/ui/utils/tv"

export const menuSectionVariants = tv({
  base: "menu-section",
})

export type MenuSectionVariants = VariantProps<typeof menuSectionVariants>
