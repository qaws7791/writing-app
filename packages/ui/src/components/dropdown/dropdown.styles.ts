import type { VariantProps } from "@workspace/ui/utils/tv"

import { tv } from "@workspace/ui/utils/tv"

export const dropdownVariants = tv({
  slots: {
    menu: "dropdown__menu",
    popover: "dropdown__popover",
    root: "dropdown",
    trigger: "dropdown__trigger",
  },
})

export type DropdownVariants = VariantProps<typeof dropdownVariants>
