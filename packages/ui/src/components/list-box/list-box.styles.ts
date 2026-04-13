import type { VariantProps } from "@workspace/ui/utils/tv"

import { tv } from "@workspace/ui/utils/tv"

export const listboxVariants = tv({
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

export const listboxItemVariants = tv({
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

export const listboxSectionVariants = tv({
  base: "list-box-section",
})

export type ListBoxVariants = VariantProps<typeof listboxVariants>
export type ListBoxItemVariants = VariantProps<typeof listboxItemVariants>
export type ListBoxSectionVariants = VariantProps<typeof listboxSectionVariants>
