import type { VariantProps } from "@workspace/ui/utils/tv"

import { tv } from "@workspace/ui/utils/tv"

export const popoverVariants = tv({
  slots: {
    base: "popover",
    dialog: "popover__dialog",
    heading: "popover__heading",
    trigger: "popover__trigger",
  },
})

export type PopoverVariants = VariantProps<typeof popoverVariants>
