import type { VariantProps } from "@workspace/ui/utils/tv"

import { tv } from "@workspace/ui/utils/tv"

export const cardVariants = tv({
  defaultVariants: {
    variant: "default",
  },
  slots: {
    base: "card",
    content: "card__content",
    description: "card__description",
    footer: "card__footer",
    header: "card__header",
    title: "card__title",
  },
  variants: {
    variant: {
      default: {
        base: "card--default",
      },
      secondary: {
        base: "card--secondary",
      },
      tertiary: {
        base: "card--tertiary",
      },
      transparent: {
        base: "card--transparent",
      },
    },
  },
})

export type CardVariants = VariantProps<typeof cardVariants>
