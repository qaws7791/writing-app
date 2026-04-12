import type { VariantProps } from "@workspace/ui/utils/tv"

import { tv } from "@workspace/ui/utils/tv"

export const searchFieldVariants = tv({
  defaultVariants: {
    fullWidth: false,
    variant: "primary",
  },
  slots: {
    base: "search-field",
    clearButton: "search-field__clear-button",
    group: "search-field__group",
    input: "search-field__input",
    searchIcon: "search-field__search-icon",
  },
  variants: {
    fullWidth: {
      false: {},
      true: {
        base: "search-field--full-width",
        group: "search-field__group--full-width",
      },
    },
    variant: {
      primary: {
        base: "search-field--primary",
      },
      secondary: {
        base: "search-field--secondary",
      },
    },
  },
})

export type SearchFieldVariants = VariantProps<typeof searchFieldVariants>
