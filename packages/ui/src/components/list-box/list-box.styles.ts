import type { VariantProps } from "@workspace/ui/utils/tv"

import { tv } from "@workspace/ui/utils/tv"

export const listBoxVariants = tv({
  base: "list-box",
  defaultVariants: {
    variant: "default",
  },
  variants: {
    variant: {
      danger: "list-box--danger",
      default: "list-box--default",
    },
  },
})

export const listBoxItemVariants = tv({
  slots: {
    item: "list-box-item",
    indicator: "list-box-item__indicator",
  },
  defaultVariants: {
    variant: "default",
  },
  variants: {
    variant: {
      default: { item: "list-box-item--default" },
      danger: { item: "list-box-item--danger" },
    },
  },
})

export type ListBoxVariants = VariantProps<typeof listBoxVariants>
export type ListBoxItemVariants = VariantProps<typeof listBoxItemVariants>
